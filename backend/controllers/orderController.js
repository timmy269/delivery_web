import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import config from 'config';
import moment from 'moment';
import crypto from "crypto";
import querystring from 'qs';
import { Buffer } from 'buffer';


const vnp_TmnCode = config.get('vnp_TmnCode');
const vnp_HashSecret = config.get('vnp_HashSecret');
const vnp_Url = config.get('vnp_Url');
const vnp_ReturnUrl = config.get('vnp_ReturnUrl');


function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
}

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



// 1. Tạo URL Thanh toán VNPAY
const createPaymentUrl = async (req, res) => {
    try {
        const { address, items, amount } = req.body;

        // --- BƯỚC QUAN TRỌNG: LƯU ĐƠN HÀNG VÀ LẤY orderId ---
        const newOrder = new orderModel({
            userId: req.userId,
            items: items,
            address: address,
            amount: amount,
            status: "Pending Payment", // Trạng thái chờ thanh toán
            date: new Date(Date.now())
        });
        await newOrder.save();
        const orderId = newOrder._id.toString();
        // ---------------------------------------------------

        process.env.TZ = 'Asia/Ho_Chi_Minh';
        let date = new Date();
        let createDate = moment(date).format('YYYYMMDDHHmmss');

        let ipAddr = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.connection.socket.remoteAddress;

        let bankCode = req.body.bankCode || ''; // Tùy chọn
        let locale = req.body.language || 'vn';
        let currCode = 'VND';

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = vnp_TmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan don hang:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount * 100;
        vnp_Params['vnp_ReturnUrl'] = vnp_ReturnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        if (bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        let signData = querystring.stringify(vnp_Params,);

        console.log("-----------------------------------------");
        console.log("VNPAY Creation Debug - Raw Data:");
        console.log("Sorted Params (vnp_Params):", vnp_Params);
        console.log("Raw Sign Data (signData):", signData);
        console.log("Hash Secret:", vnp_HashSecret);
        console.log("-----------------------------------------");

        let hmac = crypto.createHmac("sha512", vnp_HashSecret);
        let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        let vnpUrl = vnp_Url + '?' + querystring.stringify(vnp_Params, { encode: false });

        // Trả về URL để frontend redirect
        res.json({ success: true, url: vnpUrl, orderId: orderId });
    } catch (error) {
        console.error("Error creating payment URL:", error);
        res.status(500).json({ success: false, message: "Error creating payment URL" });
    }
};

// 2. Xử lý VNPAY Return (Redirect từ cổng thanh toán)
const vnpayReturn = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);

    let signData = querystring.stringify(vnp_Params,);
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

    console.log("-----------------------------------------");
    console.log("VNPAY Validation Debug - Raw Data:");
    console.log("Raw Sign Data (signData):", signData);
    console.log("Hash Secret:", vnp_HashSecret);
    console.log("Generated Signed Hash (signed):", signed);
    console.log("Received Secure Hash (secureHash):", secureHash);
    console.log("-----------------------------------------");

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];

    // Chuyển hướng về Frontend
    if (secureHash === signed) {
        if (rspCode === '00') {
            // Thanh toán thành công (Kết quả sơ bộ)
            res.redirect(`http://localhost:5173/verify?success=true&orderId=${orderId}`);
        } else {
            // Thanh toán thất bại
            res.redirect(`http://localhost:5173/verify?success=false&orderId=${orderId}&code=${rspCode}`);
        }
    } else {
        // Checksum failed
        res.redirect(`http://localhost:5173/verify?success=false&orderId=${orderId}&code=97`);
    }
};

// 3. Xử lý VNPAY IPN (Thông báo kết quả chính thức từ VNPAY)
const vnpayIPN = async (req, res) => {
    let vnp_Params = req.query;
    let secureHash = vnp_Params['vnp_SecureHash'];

    let orderId = vnp_Params['vnp_TxnRef'];
    let rspCode = vnp_Params['vnp_ResponseCode'];
    let amount = vnp_Params['vnp_Amount'] / 100;

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = sortObject(vnp_Params);
    let signData = querystring.stringify(vnp_Params,);
    let hmac = crypto.createHmac("sha512", vnp_HashSecret);
    let signed = hmac.update(new Buffer(signData, 'utf-8')).digest("hex");

    console.log("-----------------------------------------");
    console.log("VNPAY Validation Debug - Raw Data:");
    console.log("Raw Sign Data (signData):", signData);
    console.log("Hash Secret:", vnp_HashSecret);
    console.log("Generated Signed Hash (signed):", signed);
    console.log("Received Secure Hash (secureHash):", secureHash);
    console.log("-----------------------------------------");

    try {
        const order = await orderModel.findById(orderId);

        let checkOrderId = !!order;
        let checkAmount = order && order.amount == amount;
        let paymentStatus = order ? order.status : '0';

        if (secureHash === signed) {
            if (checkOrderId) {
                if (checkAmount) {
                    // Kiểm tra trạng thái: chỉ cập nhật nếu chưa được thanh toán (Pending Payment)
                    if (paymentStatus === 'Pending Payment') {
                        if (rspCode === '00') {
                            // Cập nhật trạng thái thành 'Paid' (Đã thanh toán)
                            await orderModel.findByIdAndUpdate(orderId, {
                                status: 'Paid',
                                paymentDetails: vnp_Params
                            });
                            res.status(200).json({ RspCode: '00', Message: 'Success' });
                        } else {
                            // Cập nhật trạng thái thành 'Payment Failed' (Thất bại)
                            await orderModel.findByIdAndUpdate(orderId, {
                                status: 'Payment Failed',
                                paymentDetails: vnp_Params
                            });
                            res.status(200).json({ RspCode: '00', Message: 'Success' });
                        }
                    } else {
                        // Trạng thái đã được cập nhật trước đó
                        res.status(200).json({ RspCode: '02', Message: 'Order already updated' });
                    }
                } else {
                    // Sai số tiền
                    res.status(200).json({ RspCode: '04', Message: 'Amount invalid' });
                }
            } else {
                // Không tìm thấy đơn hàng
                res.status(200).json({ RspCode: '01', Message: 'Order not found' });
            }
        } else {
            // Checksum không hợp lệ
            res.status(200).json({ RspCode: '97', Message: 'Checksum failed' });
        }
    } catch (error) {
        console.error("Error processing VNPAY IPN:", error);
        res.status(200).json({ RspCode: '99', Message: 'Unknown error' });
    }
};


export { userOrders, listOrders, updateStatus, createPaymentUrl, vnpayReturn, vnpayIPN };