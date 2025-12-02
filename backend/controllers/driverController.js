import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import DriverModel from "../models/driverModel.js";

// Đăng ký tài xế
export const registerDriver = async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const existingDriver = await DriverModel.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ success: false, message: "Email đã tồn tại." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newDriver = await DriverModel.create({ name, email, password: hashedPassword });

    // tạo token bằng cùng JWT_SECRET
    const token = jwt.sign({ id: newDriver._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.status(201).json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Đăng ký thất bại." });
  }
};

// Đăng nhập tài xế
export const loginDriver = async (req, res) => {
  const { email, password } = req.body;
  try {
    const driver = await DriverModel.findOne({ email });
    if (!driver) {
      return res.status(404).json({ success: false, message: "Email không tồn tại." });
    }

    const isMatch = await bcrypt.compare(password, driver.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Mật khẩu không đúng." });
    }

    // tạo token bằng cùng JWT_SECRET
    const token = jwt.sign({ id: driver._id }, process.env.JWT_SECRET, { expiresIn: "1d" });
    res.json({ success: true, token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Đăng nhập thất bại." });
  }
};
