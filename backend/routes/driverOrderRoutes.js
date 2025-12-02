import express from "express";
import authMiddleware from "../middleware/auth.js";
import {
  getDriverOrders,
  getOrderDetail,
  updateOrderStatus,
  assignOrderToDriver,
  getUnassignedOrders,
  getDriverRevenue
} from "../controllers/driverOrderController.js";

const router = express.Router();

router.get("/orders", authMiddleware, getDriverOrders);
router.get("/order/:id", authMiddleware, getOrderDetail);
router.put("/order/:id/status", authMiddleware, updateOrderStatus);
router.put("/order/:id/assign", authMiddleware, assignOrderToDriver);
router.get("/orders/unassigned", authMiddleware, getUnassignedOrders);
router.get("/revenue", authMiddleware, getDriverRevenue);


export default router;
