const express = require("express");
const router = express.Router();
const pool = require("../db");
const { CartError, normalizeItems, priceItems } = require("../services/cart");

// Lấy danh sách đơn hàng (Admin)
router.get("/", async (req, res) => {
  try {
    const ordersResult = await pool.query(`
      SELECT o.*, u.full_name 
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.user_id
      ORDER BY o.created_at DESC
    `);

    const itemsResult = await pool.query(`
      SELECT oi.*, p.name, p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.product_id
    `);

    const orders = ordersResult.rows.map((order) => ({
      ...order,
      id: order.order_id,
      userId: order.user_id,
      total: Number(order.total_amount),
      customerInfo: {
        name: order.full_name || "Khách hàng",
        phone: order.phone,
        address: order.shipping_address,
      },
      items: itemsResult.rows
        .filter((it) => it.order_id === order.order_id)
        .map((it) => ({
          ...it,
          subtotal: Number(it.quantity) * Number(it.unit_price),
        })),
    }));

    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Lấy đơn hàng của 1 user
router.get("/user/:userId", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "SELECT *, order_id AS id, total_amount AS total FROM orders WHERE user_id = $1 ORDER BY created_at DESC",
      [req.params.userId],
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Đặt hàng mới (Checkout)
router.post("/", async (req, res) => {
  const {
    userId,
    user_id,
    customerInfo,
    phone,
    shipping_address,
    address,
    items,
  } = req.body;

  const finalPhone = phone || customerInfo?.phone || "";
  const finalAddress =
    shipping_address || address || customerInfo?.address || "";
  const rawUserId = userId || user_id;
  const validUserId = isNaN(parseInt(rawUserId)) ? null : parseInt(rawUserId);

  let normalized;
  try { normalized = normalizeItems(items); }
  catch (error) { return res.status(400).json({ success: false, message: error.message }); }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const pricedCart = await priceItems(client, normalized);

    // 1. Lưu vào bảng orders (order_id tự tăng theo SERIAL)
    const orderRes = await client.query(
      `INSERT INTO orders (user_id, total_amount, status, shipping_address, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [validUserId, pricedCart.total_amount, "Chờ duyệt", finalAddress, finalPhone],
    );
    const newOrder = orderRes.rows[0];

    // 2. Lưu từng sản phẩm vào bảng order_items
    for (const item of pricedCart.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)`,
        [newOrder.order_id, item.product_id, item.quantity, item.unit_price],
      );
    }

    await client.query("COMMIT");
    res.json({
      success: true,
      orderId: newOrder.order_id,
      order: { ...newOrder, id: newOrder.order_id },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lỗi tạo đơn hàng:", error);
    res.status(error instanceof CartError ? 400 : 500).json({
      success: false, message: error instanceof CartError ? error.message : "Lỗi tạo đơn hàng",
    });
  } finally {
    client.release();
  }
});

// Cập nhật trạng thái đơn hàng (Admin)
router.put("/:id/status", async (req, res) => {
  try {
    const { rows } = await pool.query(
      "UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE order_id = $2 RETURNING *",
      [req.body.status, req.params.id],
    );
    res.json({ success: true, order: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Xóa đơn hàng (Admin)
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM orders WHERE order_id = $1", [req.params.id]);
    res.json({ success: true, message: "Đã xóa đơn hàng" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
