const express = require("express");
const router = express.Router();
const pool = require("../db");

// Câu truy vấn chuẩn JOIN bảng products với brands và categories theo ERD
const BASE_PRODUCT_SELECT = `
  SELECT 
    p.*,
    p.product_id AS id,
    p.price_vnd AS price,
    p.image_url AS image,
    b.brand_name AS brand,
    c.category_name AS category
  FROM products p
  LEFT JOIN brands b ON p.brand_id = b.brand_id
  LEFT JOIN categories c ON p.category_id = c.category_id
`;

// 1. Lấy danh sách sản phẩm (hỗ trợ tìm kiếm)
router.get("/", async (req, res) => {
  const searchQuery = req.query.search;
  try {
    let query = `${BASE_PRODUCT_SELECT} ORDER BY p.product_id ASC`;
    let params = [];

    if (searchQuery) {
      query = `${BASE_PRODUCT_SELECT} WHERE LOWER(p.name) LIKE $1 OR LOWER(p.search_text) LIKE $1 ORDER BY p.product_id ASC`;
      params = [`%${searchQuery.toLowerCase()}%`];
    }

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error("Lỗi lấy danh sách sản phẩm:", error);
    res.status(500).json({ message: "Lỗi Server" });
  }
});

// 2. Lấy chi tiết 1 sản phẩm theo ID
router.get("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `${BASE_PRODUCT_SELECT} WHERE p.product_id = $1`,
      [req.params.id],
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ message: "Không tìm thấy sản phẩm" });
    }
  } catch (error) {
    res.status(500).json({ message: "Lỗi Server" });
  }
});

// 3. Admin: Thêm sản phẩm mới (Tự động tìm hoặc tạo brand_id, category_id)
router.post("/", async (req, res) => {
  const p = req.body;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // Xử lý Brand
    const brandName = (p.brand || "Khác").trim();
    const brandRes = await client.query(
      `INSERT INTO brands (brand_name) VALUES ($1)
       ON CONFLICT (brand_name) DO UPDATE SET brand_name = EXCLUDED.brand_name
       RETURNING brand_id`,
      [brandName],
    );
    const brandId = brandRes.rows[0].brand_id;

    // Xử lý Category
    const categoryName = (p.category || "General").trim();
    const catRes = await client.query(
      `INSERT INTO categories (category_name) VALUES ($1)
       ON CONFLICT (category_name) DO UPDATE SET category_name = EXCLUDED.category_name
       RETURNING category_id`,
      [categoryName],
    );
    const categoryId = catRes.rows[0].category_id;

    const priceVnd = Number(p.price_vnd || p.price || 0);

    const insertQuery = `
      INSERT INTO products (
        name, model, brand_id, category_id, price_vnd, price_egp, stock_quantity, image_url,
        cpu, gpu, gpu_vram_gb, ram_gb, ssd_gb, hdd_gb,
        screen_size_in, panel_type, resolution, refresh_rate_hz,
        weight_kg, battery_wh, operating_system, description
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13, $14,
        $15, $16, $17, $18, $19, $20, $21, $22
      ) RETURNING *;
    `;

    const values = [
      p.name,
      p.model || p.name,
      brandId,
      categoryId,
      priceVnd,
      Math.round(priceVnd / 500),
      Number(p.stock_quantity ?? 10),
      p.image_url || p.image || "https://placehold.co/400x300?text=Laptop",
      p.cpu || "",
      p.gpu || "",
      parseFloat(p.gpu_vram_gb) || 0,
      parseInt(p.ram_gb || p.ram) || 8,
      parseInt(p.ssd_gb || p.ssd) || 512,
      parseInt(p.hdd_gb) || 0,
      parseFloat(p.screen_size_in) || 15.6,
      p.panel_type || "IPS",
      p.resolution || "1920x1080",
      parseInt(p.refresh_rate_hz) || 60,
      parseFloat(p.weight_kg) || 1.8,
      parseFloat(p.battery_wh) || 50,
      p.operating_system || "Windows 11",
      p.description || "",
    ];

    const { rows } = await client.query(insertQuery, values);
    await client.query("COMMIT");

    res.json({
      success: true,
      product: {
        ...rows[0],
        id: rows[0].product_id,
        price: rows[0].price_vnd,
        brand: brandName,
        category: categoryName,
      },
    });
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("Lỗi thêm sản phẩm:", error);
    res.status(500).json({ success: false, message: error.message });
  } finally {
    client.release();
  }
});

// 4. Admin: Xóa sản phẩm
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM products WHERE product_id = $1", [
      req.params.id,
    ]);
    res.json({ success: true, message: "Đã xóa sản phẩm thành công" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
