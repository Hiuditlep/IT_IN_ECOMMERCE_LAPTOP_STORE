const express = require("express");
const cors = require("cors");

// Import các modules Router
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// ==========================================
// ĐỊNH TUYẾN (ROUTES)
// ==========================================
app.use("/api/products", productRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);

// Kiểm tra nhanh backend còn sống (dùng sau khi deploy)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
// Chạy trực tiếp (npm run dev / npm start) → mở cổng như bình thường.
// Trên Vercel, file api/index.js import app này và chạy dạng serverless.
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Backend đang chạy tại: http://localhost:${PORT}`);
  });
}

module.exports = app;
