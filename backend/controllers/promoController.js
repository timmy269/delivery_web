import Promo from "../models/promoModel.js";

// create sample promos if none exist
const ensureSamplePromos = async() => {
    // Upsert a set of desired promo codes so changes apply even if collection already exists
    const desired = [
        { code: "WELCOME10", type: "percent", value: 10, active: true, usageLimit: 0, minOrderValue: 500000 },
        { code: "FLAT50", type: "fixed", value: 50000, active: true, usageLimit: 0, minOrderValue: 0 },
        { code: "SUMMER25", type: "percent", value: 25, active: true, usageLimit: 100, minOrderValue: 1000000 },
        { code: "SAVE20K", type: "fixed", value: 20000, active: true, usageLimit: 0, minOrderValue: 0 },
        { code: "SAVE100K", type: "fixed", value: 100000, active: true, usageLimit: 0, minOrderValue: 500000 },
        { code: "FREESHIP", type: "freeship", value: 0, active: true, usageLimit: 0, minOrderValue: 0 }
    ];

    for (const p of desired) {
        try {
            await Promo.updateOne({ code: p.code }, { $set: { code: p.code, type: p.type, value: p.value, active: p.active, expiresAt: p.expiresAt || null, usageLimit: p.usageLimit || 0, minOrderValue: p.minOrderValue || 0 }, $setOnInsert: { usedCount: 0 } }, { upsert: true });
        } catch (err) {
            console.error('ensureSamplePromos upsert error for', p.code, err);
        }
    }
};

// Ensure promos exist when this module is loaded (best-effort, non-blocking)
ensureSamplePromos().catch((err) => console.error('ensureSamplePromos init error', err));

const listPromos = async(req, res) => {
    try {
        await ensureSamplePromos();
        const promos = await Promo.find({}).lean();
        res.json({ success: true, data: promos });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error listing promos' });
    }
};

// validate code: body { code, total }
const validatePromo = async(req, res) => {
    try {
        const { code, total } = req.body;
        if (!code) return res.status(400).json({ success: false, message: 'Code required' });
        const promo = await Promo.findOne({ code: code.toUpperCase() });
        if (!promo || !promo.active) return res.status(404).json({ success: false, message: 'Invalid or inactive code' });
        if (promo.expiresAt && promo.expiresAt < new Date()) return res.status(400).json({ success: false, message: 'Code expired' });
        if (promo.usageLimit && promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) return res.status(400).json({ success: false, message: 'Code usage limit reached' });
        if (promo.minOrderValue && Number(total || 0) < promo.minOrderValue) return res.status(400).json({ success: false, message: `Minimum order ${promo.minOrderValue} required` });

        let discount = 0;
        const subtotal = Number(total || 0);
        if (promo.type === 'percent') {
            discount = Math.round(subtotal * (promo.value / 100));
        } else if (promo.type === 'fixed') {
            discount = Number(promo.value || 0);
        } else if (promo.type === 'freeship') {
            // freeship does not reduce subtotal here; frontend should interpret this as free shipping
            discount = 0;
        }

        const newTotal = Math.max(0, subtotal - discount);

        // increment usedCount (for freeship also count usage)
        promo.usedCount = (promo.usedCount || 0) + 1;
        await promo.save();

        // respond with an explicit flag for freeship so frontend can combine it with other promos
        const responseData = { code: promo.code, discount, newTotal, promo };
        if (promo.type === 'freeship') responseData.freeship = true;

        res.json({ success: true, data: responseData });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error validating promo' });
    }
};

// add promo (for testing)
const addPromo = async(req, res) => {
    try {
        const body = req.body || {};
        const promo = new Promo({
            code: (body.code || '').toUpperCase(),
            type: body.type || 'fixed',
            value: body.value || 0,
            active: body.active !== false,
            expiresAt: body.expiresAt || null,
            usageLimit: body.usageLimit || 0,
            minOrderValue: body.minOrderValue || 0
        });
        await promo.save();
        res.json({ success: true, data: promo });
    } catch (error) {
        console.log(error);
        res.status(500).json({ success: false, message: 'Error adding promo' });
    }
};

export { listPromos, validatePromo, addPromo };