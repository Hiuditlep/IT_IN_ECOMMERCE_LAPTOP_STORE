const express = require("express");
const cors = require("cors");

// Import các modules Router
const productRoutes = require("./routes/productRoutes");
const userRoutes = require("./routes/userRoutes");
const orderRoutes = require("./routes/orderRoutes");
const aiRoutes = require("./routes/aiRoutes");
const cartRoutes = require("./routes/cartRoutes");

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
app.use("/api/ai", aiRoutes);
app.use("/api/cart", cartRoutes);

// ==========================================
// KHỞI ĐỘNG SERVER
// ==========================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend đang chạy tại: http://localhost:${PORT}`);
});
