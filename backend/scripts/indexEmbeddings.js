const pool = require("../db");
const { isConfigured } = require("../services/gemini");
const { indexProduct } = require("../services/indexProduct");
const migrate = require("./migrate");

async function main() {
  if (!isConfigured()) throw new Error("Cần đặt GEMINI_API_KEY trong backend/.env.local");
  await migrate();
  const limit = process.env.INDEX_LIMIT ? Number(process.env.INDEX_LIMIT) : null;
  if (limit !== null && (!Number.isInteger(limit) || limit < 1)) throw new Error("INDEX_LIMIT phải là số nguyên dương");
  const delayMs = process.env.INDEX_DELAY_MS === undefined ? 350 : Number(process.env.INDEX_DELAY_MS);
  if (!Number.isInteger(delayMs) || delayMs < 0 || delayMs > 60000) throw new Error("INDEX_DELAY_MS phải từ 0 đến 60000");
  const { rows } = await pool.query(`SELECT p.*, b.brand_name AS brand, c.category_name AS category
    FROM products p LEFT JOIN brands b ON b.brand_id = p.brand_id
    LEFT JOIN categories c ON c.category_id = p.category_id
    ORDER BY p.product_id ASC`);
  let updated = 0;
  let failed = 0;
  let attempted = 0;
  for (const product of rows.slice(0, limit || rows.length)) {
    attempted++;
    try {
      if (await indexProduct(product)) {
        updated++;
        if (updated % 100 === 0) console.log(`Đã tạo/cập nhật ${updated} embedding trong lượt này`);
        if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      failed++;
      console.error(`Không index được sản phẩm ${product.product_id}: ${error.message}`);
      if (/HTTP 429/.test(error.message)) break;
    }
  }
  console.log(`Đã xét ${attempted}/${rows.length} sản phẩm; embedding mới/cập nhật: ${updated}; lỗi: ${failed}. Chạy lại để tiếp tục các sản phẩm chưa index.`);
  if (failed) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
