import mongoose from "mongoose";

const promoSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    // allow percent, fixed amount, or freeship
    type: { type: String, enum: ["percent", "fixed", "freeship"], required: true },
    value: { type: Number, required: true },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
    usageLimit: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 }
});

const Promo = mongoose.models.Promo || mongoose.model("Promo", promoSchema);

export default Promo;