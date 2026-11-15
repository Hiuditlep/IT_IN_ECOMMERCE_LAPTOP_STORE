const express = require("express");
const router = express.Router();
const pool = require("../db");
const { CartError, normalizeItems, priceItems } = require("../services/cart");

router.post("/calculate", async (req, res) => {
  try {
    res.json(await priceItems(pool, normalizeItems(req.body?.items)));
  } catch (error) {
    res.status(error instanceof CartError ? 400 : 500).json({ message: error instanceof CartError ? error.message : "Lỗi tính giỏ hàng" });
  }
});

module.exports = router;
