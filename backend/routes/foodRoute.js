import express from "express";
import multer from "multer";
import { addFood } from "../controllers/foodController.js";

const foodRouter = express.Router();

// Cấu hình Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // thư mục uploads trong backend
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage: storage });

// Route
foodRouter.post("/add", upload.single("image"), addFood);

export default foodRouter;
