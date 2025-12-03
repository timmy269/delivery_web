// backend/routes/driverwalletRoutes.js
import express from "express";
import authMiddleware from "../middleware/auth.js";
import { getWalletFromOrders, getWalletFromOrdersPublic } from "../controllers/driverWalletController.js";

const router = express.Router();

router.get("/wallet", authMiddleware, getWalletFromOrders);

router.get("/wallet/public/:driverId", getWalletFromOrdersPublic);

export default router;
