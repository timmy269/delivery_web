import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import crypto from "crypto";
import { Buffer } from 'buffer';
import https from 'https';


// Lấy đơn hàng của người dùng hiện tại
const userOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({ userId: req.userId });
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy đơn hàng của người dùng" });
    }
};

// Lấy tất cả đơn hàng 
const listOrders = async (_req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Lỗi khi lấy tất cả đơn hàng" });
    }
};

// Cập nhật trạng thái đơn hàng 
const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Trạng thái đã được cập nhật" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Lỗi khi cập nhật trạng thái" });
    }
};

const placeOrderMomo = async (req, expressRes) => {
    try {
        // 1. Tạo đơn hàng mới trong DB
        const newOrder = new orderModel({
            userId: req.userId,
            items: req.body.items,
            amount: req.body.amount,
            address: req.body.address,
            status: "Chờ thanh toán",
        });
        await newOrder.save();

        // Xóa giỏ hàng của người dùng
        await userModel.findByIdAndUpdate(req.userId, { cartData: {} });

        // 2. Chuẩn bị dữ liệu để gửi đến MoMo
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;

        // ********** SỬ DỤNG DỮ LIỆU ĐƠN HÀNG THỰC TẾ **********
        const amount = newOrder.amount.toString(); 
        const orderId = newOrder._id.toString();
        const requestId = orderId + new Date().getTime(); 
        const orderInfo = `Thanh toán đơn hàng: ${orderId}`;

        const redirectUrl = "http://localhost:5173/verify";
        const ipnUrl = "http://localhost:4000/api/order/momo-ipn";
        const extraData = '';
        const requestType = "payWithMethod";
        const lang = 'vi';

        // 3. Tạo chữ ký
        var rawSignature = "accessKey=" + accessKey + "&amount=" + amount + "&extraData=" + extraData + "&ipnUrl=" + ipnUrl + "&orderId=" + orderId + "&orderInfo=" + orderInfo + "&partnerCode=" + partnerCode + "&redirectUrl=" + redirectUrl + "&requestId=" + requestId + "&requestType=" + requestType;

        console.log("--------------------RAW SIGNATURE----------------")
        console.log(rawSignature)

        var signature = crypto.createHmac('sha256', secretKey)
            .update(rawSignature)
            .digest('hex');
        console.log("--------------------SIGNATURE----------------")
        console.log(signature)

        // 4. Tạo Request Body
        const requestBody = JSON.stringify({
            partnerCode: partnerCode,
            partnerName: "Test",
            storeId: "MomoTestStore",
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: redirectUrl,
            ipnUrl: ipnUrl,
            lang: lang,
            requestType: requestType,
            extraData: extraData,
            signature: signature
        });
        // 5. Cấu hình HTTPS
        const options = {
            hostname: 'test-payment.momo.vn', 
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        }
        // 6. Gửi Request và Xử lý Phản hồi MoMo
        const apiReq = https.request(options, apiRes => { 
            let responseBody = '';

            apiRes.setEncoding('utf8');
            apiRes.on('data', (chunk) => {
                responseBody += chunk;
            });

            apiRes.on('end', () => {
                try {
                    const jsonBody = JSON.parse(responseBody);
                    console.log('MoMo Response Body:', jsonBody);

                    if (jsonBody.resultCode === 0) {
                        // <<<<< GỬI URL THANH TOÁN VỀ CLIENT (Frontend) >>>>>
                        expressRes.json({ success: true, payUrl: jsonBody.payUrl });
                    } else {
                        console.error(`MoMo API Error: ${jsonBody.message}`);
                        expressRes.status(500).json({ success: false, message: `Lỗi MoMo: ${jsonBody.message}` });
                    }
                } catch (e) {
                    console.error("Lỗi xử lý phản hồi từ MoMo:", e);
                    expressRes.status(500).json({ success: false, message: "Lỗi xử lý phản hồi từ MoMo" });
                }
            });
        });

        apiReq.on('error', (e) => {
            console.error(`Sự cố với yêu cầu MoMo: ${e.message}`);
            // Gửi lỗi về client
            expressRes.status(500).json({ success: false, message: "Lỗi kết nối với cổng thanh toán MoMo" });
        });

        console.log("Sending....")
        apiReq.write(requestBody);
        apiReq.end();

    } catch (error) {
        console.error("LỖI 500 TRONG placeOrderMomo:", error);
        expressRes.status(500).json({ success: false, message: "Lỗi nội bộ server khi tạo đơn hàng." });
    }
}

const momoIPN = async (req, res) => {
    const { orderId, resultCode } = req.body;
    try {
        if (resultCode === 0) { 
            await orderModel.findByIdAndUpdate(orderId, { status: "Đang xử lý", payment: true });
        } else { 
            await orderModel.findByIdAndUpdate(orderId, { status: "Thanh toán thất bại" });
        }
        res.status(204).send();
    } catch (error) {
        console.log("Lỗi xử lý MoMo IPN:", error);
        res.status(500).send();
    }
}

const verifyOrder = async (req, res) => {
    const { resultCode, orderId } = req.body;

    try {
        if (resultCode === '0') { 
            await orderModel.findByIdAndUpdate(orderId, { status: "Đang xử lý", payment: true });
            res.json({ success: true, message: "Thanh toán thành công" });
        } else { 
            await orderModel.findByIdAndUpdate(orderId, { status: "Thanh toán thất bại" });
            res.json({
                success: false, message: "Thanh toán thất bại"
            });
        }
    } catch (error) {
        console.error("Lỗi xác minh thanh toán:", error);
        res.status(500).json({ success: false, message: "Lỗi máy chủ nội bộ trong quá trình xác minh" });
    }
}

export { userOrders, listOrders, updateStatus, placeOrderMomo, momoIPN, verifyOrder };