import express from "express";
import { listPromos, validatePromo, addPromo } from "../controllers/promoController.js";

const router = express.Router();

router.get('/list', listPromos);
router.post('/validate', validatePromo);
router.post('/add', addPromo);

export default router;