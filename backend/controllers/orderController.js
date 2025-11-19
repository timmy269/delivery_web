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
        res.status(500).json({ success: false, message: "Error fetching user orders" });
    }
};

// Lấy tất cả đơn hàng 
const listOrders = async (req, res) => {
    try {
        const orders = await orderModel.find({});
        res.json({ success: true, data: orders });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error fetching all orders" });
    }
};

// Cập nhật trạng thái đơn hàng 
const updateStatus = async (req, res) => {
    try {
        await orderModel.findByIdAndUpdate(req.body.orderId, { status: req.body.status });
        res.json({ success: true, message: "Status Updated" });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: "Error updating status" });
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
            status: "Pending Payment",
        });
        await newOrder.save();

        // Xóa giỏ hàng của người dùng
        await userModel.findByIdAndUpdate(req.userId, { cartData: {} });

        // 2. Chuẩn bị dữ liệu để gửi đến MoMo
        const partnerCode = process.env.MOMO_PARTNER_CODE;
        const accessKey = process.env.MOMO_ACCESS_KEY;
        const secretKey = process.env.MOMO_SECRET_KEY;

        // ********** SỬ DỤNG DỮ LIỆU ĐƠN HÀNG THỰC TẾ **********
        const amount = newOrder.amount.toString(); // Phải là số tiền thực tế và là chuỗi
        const orderId = newOrder._id.toString(); // ID của đơn hàng trong DB
        const requestId = orderId + new Date().getTime(); // Dùng ID đơn hàng + timestamp để đảm bảo tính duy nhất cho MoMo
        const orderInfo = `Thanh toán đơn hàng: ${orderId}`;
        // ********************************************************

        const redirectUrl = "http://localhost:3000/verify";
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
            hostname: 'test-payment.momo.vn', // Hoặc 'payment.momo.vn' cho Production
            port: 443,
            path: '/v2/gateway/api/create',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody)
            }
        }
        // 6. Gửi Request và Xử lý Phản hồi MoMo
        const apiReq = https.request(options, apiRes => { // << Đã sửa thành apiReq, apiRes
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
                        // Xử lý lỗi từ MoMo
                        console.error(`MoMo API Error: ${jsonBody.message}`);
                        expressRes.status(500).json({ success: false, message: `MoMo error: ${jsonBody.message}` });
                    }
                } catch (e) {
                    console.error("Error parsing MoMo response:", e);
                    expressRes.status(500).json({ success: false, message: "Error processing MoMo response" });
                }
            });
        });

        apiReq.on('error', (e) => {
            console.error(`Problem with MoMo request: ${e.message}`);
            // Gửi lỗi về client
            expressRes.status(500).json({ success: false, message: "Error connecting to MoMo payment gateway" });
        });

        console.log("Sending....")
        apiReq.write(requestBody);
        apiReq.end();

    } catch (error) {
        // Bắt các lỗi trước khi kết nối MoMo (DB, định nghĩa biến,...)
        console.error("LỖI 500 TRONG placeOrderMomo:", error);
        expressRes.status(500).json({ success: false, message: "Lỗi nội bộ server khi tạo đơn hàng." });
    }
}

const momoIPN = async (req, res) => {
    const { orderId, resultCode } = req.body;
    // TODO: Thêm bước xác thực chữ ký từ MoMo để bảo mật
    try {
        if (resultCode === 0) { // Thanh toán thành công
            await orderModel.findByIdAndUpdate(orderId, { status: "Food Processing", payment: true });
        } else { // Thanh toán thất bại
            await orderModel.findByIdAndUpdate(orderId, { status: "Payment Failed" });
        }
        // Phản hồi 204 cho MoMo để xác nhận đã nhận IPN
        res.status(204).send();
    } catch (error) {
        console.log("Error processing MoMo IPN:", error);
        res.status(500).send();
    }
}

const verifyOrder = async (req, res) => {
    const { resultCode, orderId } = req.body;

    // Lưu ý: MoMo trả về resultCode là chuỗi ('0', '9000', v.v.)
    try {
        if (resultCode === '0') { // Thanh toán thành công
            // Cập nhật trạng thái đơn hàng: Đã thanh toán và đang xử lý
            await orderModel.findByIdAndUpdate(orderId, { status: "Food Processing", payment: true });
            res.json({ success: true, message: "Payment Successful" });
        } else { // Thanh toán thất bại hoặc bị hủy
            // Cập nhật trạng thái đơn hàng: Thanh toán thất bại
            await orderModel.findByIdAndUpdate(orderId, { status: "Payment Failed" });
            res.json({
                success: false, message: "Payment Failed"
            });
        }
    } catch (error) {
        console.error("Error verifying payment:", error);
        res.status(500).json({ success: false, message: "Internal server error during verification" });
    }
}

export { userOrders, listOrders, updateStatus, placeOrderMomo, momoIPN, verifyOrder };