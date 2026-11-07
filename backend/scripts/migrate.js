const fs = require("node:fs");
const path = require("node:path");
const pool = require("../db");

async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, "../migrations/001_product_embeddings.sql"), "utf8");
  await pool.query(sql);
  console.log("Applied product embeddings migration");
}

if (require.main === module) {
  migrate().catch((error) => { console.error(error.message); process.exitCode = 1; }).finally(() => pool.end());
}

module.exports = migrate;
