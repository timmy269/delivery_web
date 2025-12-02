import mongoose from "mongoose";

const driverOrderSchema = new mongoose.Schema({
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "order", // liên kết với đơn hàng gốc
    required: true
  },
  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "driver", // liên kết với tài xế
    required: true
  },
  status: {
    type: String,
    enum: ["assigned", "delivering", "delivered", "failed"],
    default: "assigned"
  },
  receivedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date
  },
  payoutRecorded: {
    type: Boolean,
    default: false
  }
});

const driverOrderModel = mongoose.models.driverOrder || mongoose.model("driverOrder", driverOrderSchema);
export default driverOrderModel;
