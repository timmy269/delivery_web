import express from "express"
import authMiddleware from "../middleware/auth.js"
import { createPaymentUrl, vnpayReturn, userOrders, listOrders, updateStatus, vnpayIPN } from "../controllers/orderController.js"

const orderRouter = express.Router();

orderRouter.post("/create_payment_url", authMiddleware, createPaymentUrl);
orderRouter.get("/vnpay_return", vnpayReturn);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", listOrders);
orderRouter.post("/status", updateStatus);
orderRouter.get("/vnpay_ipn", vnpayIPN);



export default orderRouter;