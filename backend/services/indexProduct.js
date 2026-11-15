const crypto = require("node:crypto");
const pool = require("../db");
const { embedText, EMBEDDING_MODEL, isConfigured } = require("./gemini");

function productText(product) {
  return [
    `Product: ${product.name}`,
    `Brand: ${product.brand || ""}`,
    `Category: ${product.category || ""}`,
    `CPU: ${product.cpu || ""}`,
    `GPU: ${product.gpu || ""}`,
    `RAM: ${product.ram_gb || ""} GB`,
    `SSD: ${product.ssd_gb || ""} GB`,
    `Display: ${product.screen_size_in || ""} inch, ${product.resolution || ""}, ${product.refresh_rate_hz || ""} Hz`,
    `Weight: ${product.weight_kg || ""} kg`,
    `Battery: ${product.battery_wh || ""} Wh`,
    product.search_text || product.description || "",
  ].join(". ").slice(0, 6000);
}

async function indexProduct(product, db = pool) {
  if (!isConfigured()) return false;
  const text = productText(product);
  const hash = crypto.createHash("sha256").update(text).digest("hex");
  const existing = await db.query("SELECT source_hash, model FROM product_embeddings WHERE product_id = $1", [product.product_id]);
  if (existing.rows[0]?.source_hash === hash && existing.rows[0]?.model === EMBEDDING_MODEL) return false;
  const embedding = await embedText(text, "RETRIEVAL_DOCUMENT", product.name);
  await db.query(`INSERT INTO product_embeddings (product_id, embedding, model, source_hash)
    VALUES ($1, $2::vector, $3, $4)
    ON CONFLICT (product_id) DO UPDATE SET embedding = EXCLUDED.embedding,
      model = EXCLUDED.model, source_hash = EXCLUDED.source_hash,
      updated_at = CURRENT_TIMESTAMP`,
  [product.product_id, `[${embedding.join(",")}]`, EMBEDDING_MODEL, hash]);
  return true;
}

async function indexOneById(productId) {
  const { rows } = await pool.query(`SELECT p.*, b.brand_name AS brand, c.category_name AS category
    FROM products p LEFT JOIN brands b ON b.brand_id = p.brand_id
    LEFT JOIN categories c ON c.category_id = p.category_id WHERE p.product_id = $1`, [productId]);
  if (rows[0]) return indexProduct(rows[0]);
  return false;
}

module.exports = { productText, indexProduct, indexOneById };
