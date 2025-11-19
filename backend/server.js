import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import cartRouter from "./routes/cartRouter.js"
import orderRouter from "./routes/orderRoute.js"
import "dotenv/config.js"

// app config
const app = express();
const port = 4000;

// middleware
app.use(express.json());
app.use(cors());

// const { VNPay, ignoreLogger, ProductCode, VnpLocale, dateFormat } = require('vnpay');

//db connect
connectDB();

//api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static('uploads'))
app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)

// // VNPay endpoint - moved here and corrected
// app.post('/api/create-qr', async (req, res) => {
//   const vnpay = new VNPay({
//     vnp_TmnCode: '5F23HWUZ',
//     secureSecret: 'C687VOH00AWYRJADADE584D22QL5INYS',
//     vnpayHost: 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
//     testMode: true,
//     hashAlgorithm: "SHA512",
//     loggerFn: ignoreLogger,
//   });

//   const vnpayRespone = await vnpay.buildPaymentUrl({
//     vnp_Amount: findCart.totalPrice,
//     vnp_IpAddr: req.ip || '127.0.0.1',
//     vnp_TxnRef: '123456',
//     vnp_OrderInfo: '123456',
//     vnp_OrderType: ProductCode.Other,
//     vnp_ReturnUrl: 'http://localhost:4000/api/check-payment-vnpay', 
//     vnp_Locale: VnpLocale.VN,
//     vnp_CreateDate: dateFormat(new Date()),
//     vnp_ExpireDate: dateFormat(tomorrow),
//   });

//   return res.json.status(201).json(vnpayRespone) 
// });

app.get("/", (req, res) => {
  res.send("API working");
})

app.listen(port, () => {
  console.log(`server chay tai http://localhost:${port}`);
})