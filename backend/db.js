const { Pool } = require("pg");
const path = require("path");

// Tự động tìm .env.local ở cả thư mục gốc lẫn thư mục backend
require("dotenv").config({ path: path.resolve(__dirname, "../.env.local") });
require("dotenv").config({ path: path.resolve(__dirname, ".env.local") });
require("dotenv").config();

const connectionString = process.env.DATABASE_URL;

const pool = new Pool({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
});

pool.connect((err, client, release) => {
  if (err) {
    console.error("Lỗi kết nối Neon Database:", err.message);
  } else {
    console.log("Đã kết nối thành công tới Neon PostgreSQL!");
    release();
  }
});

module.exports = pool;
