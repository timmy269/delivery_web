import mongoose from "mongoose";

const driverSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  orders: [{ type: mongoose.Schema.Types.ObjectId, ref: "order" }],
  totalEarnings: { type: Number, default: 0 }
});

const DriverModel = mongoose.models.driver || mongoose.model("driver", driverSchema);
export default DriverModel;
