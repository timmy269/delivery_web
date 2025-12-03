import mongoose from "mongoose";

const DriverTransactionSchema = new mongoose.Schema({
  driverId: { type: mongoose.Schema.Types.ObjectId, ref: "driver", required: true },
  type: { type: String, enum: ["income", "withdraw", "refund"], required: true },
  amount: { type: Number, required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", default: null },
  status: { type: String, enum: ["pending", "completed", "failed"], default: "completed" },
  note: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  metadata: { type: Object, default: {} }
});

DriverTransactionSchema.index({ driverId: 1, createdAt: -1 });
DriverTransactionSchema.index({ orderId: 1 });

export default mongoose.models.DriverTransaction || mongoose.model("DriverTransaction", DriverTransactionSchema);
