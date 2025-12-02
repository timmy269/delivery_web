import express from "express";
import { registerDriver, loginDriver } from "../controllers/driverController.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.post("/register", registerDriver);
router.post("/login", loginDriver);
router.get("/profile", authMiddleware, (req, res) => {
  res.json({ success: true, driverId: req.userId });
});

export default router;
