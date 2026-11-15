import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";

export default function Detail({ addToCart }) {
  // ==========================================
  // 1. KHỞI TẠO HOOKS & PARAMS
  // ==========================================
  const { id } = useParams(); // Lấy ID sản phẩm từ thanh URL (vd: /product/123)
  const navigate = useNavigate(); // Hook dùng để điều hướng trang
  const [product, setProduct] = useState(null); // State lưu thông tin chi tiết sản phẩm

  // ==========================================
  // 2. GỌI API LẤY DỮ LIỆU SẢN PHẨM
  // ==========================================
  useEffect(() => {
    // Gửi request lên Backend để xin thông tin của đúng cái ID trên URL
    fetch(`http://localhost:5000/api/products/${id}`)
      .then((res) => res.json())
      .then((data) => setProduct(data));
  }, [id]); // Mỗi khi ID thay đổi thì sẽ tự động gọi lại API

  // ==========================================
  // 3. HIỂN THỊ MÀN HÌNH CHỜ (LOADING)
  // ==========================================
  // Quá trình gọi API tốn một chút thời gian, nên nếu chưa có product thì báo đang tải
  if (!product)
    return <div className="text-center mt-20 text-xl">Đang tải dữ liệu...</div>;

  // ==========================================
  // 4. HIỂN THỊ GIAO DIỆN CHÍNH (RENDER)
  // ==========================================
  return (
    <div className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-8 mt-6">
      {/* CỘT TRÁI: ẢNH SẢN PHẨM */}
      <div className="md:w-1/2 flex items-center justify-center">
        <img
          src={product.image || product.image_url}
          alt={product.name}
          className="w-full rounded-lg border object-cover"
        />
      </div>

      {/* CỘT PHẢI: THÔNG TIN VÀ NÚT MUA */}
      <div className="md:w-1/2">
        <h2 className="text-3xl font-bold mb-4">{product.name}</h2>

        <p className="text-gray-500 mb-2">
          Thương hiệu:{" "}
          <span className="font-bold text-gray-800">{product.brand}</span>
        </p>

        {/* TÌNH TRẠNG KHO */}
        <p className="text-gray-500 mb-2">
          Tình trạng:{" "}
          {(product.stock_quantity ?? 10) > 0 ? (
            <span className="font-bold text-green-600">
              Còn hàng ({product.stock_quantity ?? 10})
            </span>
          ) : (
            <span className="font-bold text-red-600">Tạm hết hàng</span>
          )}
        </p>

        <p className="text-red-600 text-3xl font-bold mb-6">
          {(product.price_vnd || product.price || 0).toLocaleString("vi-VN")} đ
        </p>

        {/* Bảng cấu hình chi tiết (Đã map chuẩn xác theo Database PostgreSQL / CSV) */}
        <div className="bg-gray-50 p-5 rounded-lg mb-6 border">
          <h3 className="font-bold mb-3 text-lg border-b border-gray-200 pb-2 uppercase">
            Cấu hình chi tiết
          </h3>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">Vi xử lý (CPU):</span>
              <span className="font-semibold text-right">{product.cpu}</span>
            </li>

            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">Card đồ họa (GPU):</span>
              <span className="font-semibold text-right">
                {product.gpu}{" "}
                {product.gpu_vram_gb ? `(${product.gpu_vram_gb}GB)` : ""}
              </span>
            </li>

            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">RAM:</span>
              <span className="font-semibold text-right">
                {product.ram_gb ? `${product.ram_gb} GB` : "Đang cập nhật"}
              </span>
            </li>

            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">Ổ cứng:</span>
              <span className="font-semibold text-right">
                {product.ssd_gb ? `${product.ssd_gb} GB SSD` : ""}
                {product.hdd_gb && Number(product.hdd_gb) > 0
                  ? ` + ${product.hdd_gb}GB HDD`
                  : ""}
                {!product.ssd_gb &&
                (!product.hdd_gb || Number(product.hdd_gb) <= 0)
                  ? "Đang cập nhật"
                  : ""}
              </span>
            </li>

            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">Màn hình:</span>
              <span className="font-semibold text-right">
                {product.screen_size_in ? `${product.screen_size_in}"` : ""}{" "}
                {product.panel_type || ""}{" "}
                {product.resolution ? `(${product.resolution})` : ""}{" "}
                {product.refresh_rate_hz
                  ? `- ${product.refresh_rate_hz}Hz`
                  : ""}
              </span>
            </li>

            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">Trọng lượng:</span>
              <span className="font-semibold text-right">
                {product.weight_kg
                  ? `${product.weight_kg} kg`
                  : "Đang cập nhật"}
              </span>
            </li>

            <li className="flex justify-between border-b border-dashed border-gray-300 pb-1">
              <span className="text-gray-500">Pin & Hệ điều hành:</span>
              <span className="font-semibold text-right">
                {product.battery_wh ? `${product.battery_wh}Wh` : "N/A"} |{" "}
                {product.operating_system || "Windows 11"}
              </span>
            </li>

            <li className="flex justify-between pb-1 mt-2 pt-1">
              <span className="text-gray-500">Phân khúc:</span>
              <span className="font-semibold text-right uppercase text-blue-600">
                {product.category}
              </span>
            </li>
          </ul>
        </div>

        {/* Cụm nút bấm */}
        <div className="flex gap-4 mt-8">
          <button
            onClick={() => addToCart(product)}
            disabled={(product.stock_quantity ?? 10) <= 0}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              (product.stock_quantity ?? 10) > 0
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            {(product.stock_quantity ?? 10) > 0
              ? "THÊM VÀO GIỎ HÀNG"
              : "ĐÃ HẾT HÀNG"}
          </button>
          <button
            onClick={() => navigate(-1)}
            className="px-6 border-2 border-gray-300 rounded-lg font-medium hover:bg-gray-100 transition"
          >
            Quay lại
          </button>
        </div>
      </div>
    </div>
  );
}
