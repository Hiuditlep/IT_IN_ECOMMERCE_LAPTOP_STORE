import { Link } from "react-router-dom";

export default function Cart({ cart, updateQuantity, removeFromCart }) {
  // ==========================================
  // 1. TÍNH TOÁN DỮ LIỆU (LOGIC)
  // ==========================================

  // Tính tổng tiền của toàn bộ giỏ hàng
  const total = cart.reduce((sum, item) => sum + item.price * item.qty, 0);

  // ==========================================
  // 2. HIỂN THỊ GIAO DIỆN (RENDER)
  // ==========================================

  // Trường hợp 1: Giỏ hàng không có sản phẩm nào
  if (cart.length === 0) {
    return (
      <div className="text-center text-xl mt-10 font-medium">
        Giỏ hàng của bạn đang trống!
      </div>
    );
  }

  // Trường hợp 2: Giỏ hàng có sản phẩm
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2">
        Giỏ hàng của bạn
      </h2>

      {/* DANH SÁCH SẢN PHẨM TRONG GIỎ */}
      <div className="space-y-4">
        {cart.map((item) => (
          <div
            key={item.id}
            className="flex flex-col md:flex-row items-center justify-between border-b pb-4 gap-4"
          >
            {/* Cột 1: Ảnh và tên sản phẩm */}
            <div className="flex items-center gap-4 w-full md:w-1/2">
              <img
                src={item.image}
                alt={item.name}
                className="w-20 h-20 object-cover rounded border"
              />
              <h3 className="font-semibold text-gray-800 line-clamp-2">
                {item.name}
              </h3>
            </div>

            {/* Cột 2: Nút Tăng/Giảm số lượng */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, -1)}
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 font-bold text-black"
              >
                -
              </button>

              <span className="w-8 text-center font-bold">{item.qty}</span>

              <button
                onClick={() => updateQuantity(item.id, 1)}
                disabled={item.qty >= item.stock_quantity}
                className={`px-3 py-1 rounded font-bold transition ${
                  item.qty >= item.stock_quantity
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-gray-200 hover:bg-gray-300 text-black"
                }`}
              >
                +
              </button>
            </div>

            {/* Cột 3: Thành tiền của 1 sản phẩm */}
            <div className="font-bold text-red-600 w-full md:w-32 text-right">
              {(item.price * item.qty).toLocaleString("vi-VN")} đ
            </div>

            {/* Cột 4: Nút Xóa */}
            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 hover:text-red-700 font-bold px-4"
            >
              Xóa
            </button>
          </div>
        ))}
      </div>

      {/* TỔNG TIỀN VÀ NÚT THANH TOÁN */}
      <div className="mt-8 flex justify-between items-center border-t pt-6">
        <h3 className="text-xl font-bold">Tổng tiền:</h3>
        <p className="text-3xl font-bold text-red-600">
          {total.toLocaleString("vi-VN")} đ
        </p>
      </div>

      <Link
        to="/checkout"
        className="w-full mt-6 bg-green-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-green-700 block text-center transition-colors"
      >
        TIẾN HÀNH THANH TOÁN
      </Link>
    </div>
  );
}
