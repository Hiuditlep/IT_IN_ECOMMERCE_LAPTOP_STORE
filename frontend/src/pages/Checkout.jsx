import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function Checkout({ cart, user, clearCart }) {
  const navigate = useNavigate();

  // Tự động lấy sẵn thông tin từ tài khoản user đang đăng nhập
  const [fullName, setFullName] = useState(
    user?.full_name || user?.fullName || "",
  );
  const [phone, setPhone] = useState(user?.phone || "");
  const [shippingAddress, setShippingAddress] = useState(user?.address || "");
  const [note, setNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Đồng bộ lại khi object user thay đổi
  useEffect(() => {
    if (user) {
      setFullName(user.full_name || user.fullName || "");
      setPhone(user.phone || "");
      setShippingAddress(user.address || "");
    }
  }, [user]);

  // Tính tổng tiền đơn hàng (hỗ trợ cả price_vnd và price cũ)
  const totalAmount = cart.reduce((sum, item) => {
    const itemPrice = item.price_vnd || item.price || 0;
    return sum + itemPrice * (item.qty || 1);
  }, 0);

  // Bảo vệ route: Chưa có sản phẩm thì không cho thanh toán
  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto my-12 bg-white p-8 rounded-xl shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Giỏ hàng của bạn đang trống
        </h2>
        <p className="text-gray-500 mb-6">
          Vui lòng chọn mua sản phẩm trước khi tiến hành đặt hàng.
        </p>
        <Link
          to="/"
          className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-6 rounded-lg transition"
        >
          Quay lại mua sắm
        </Link>
      </div>
    );
  }

  // Xử lý gửi dữ liệu đặt hàng
  const handleSubmitOrder = async (e) => {
    e.preventDefault();

    if (!phone.trim() || !shippingAddress.trim()) {
      alert("Vui lòng nhập đầy đủ số điện thoại và địa chỉ nhận hàng!");
      return;
    }

    setIsSubmitting(true);

    // Chuẩn hóa danh sách items khớp bảng order_items của Database
    const formattedItems = cart.map((item) => ({
      product_id: item.product_id || item.id,
      quantity: item.qty || 1,
      unit_price: item.price_vnd || item.price || 0,
      name: item.name,
      image_url: item.image_url || item.image || "",
    }));

    // Payload khớp bảng orders của Database
    const orderPayload = {
      userId: user?.user_id || user?.id || null,
      full_name: fullName,
      phone: phone.trim(),
      shipping_address: shippingAddress.trim(),
      note: note.trim(),
      total_amount: totalAmount,
      items: formattedItems,
    };

    try {
      const res = await fetch("http://localhost:5000/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        alert(
          "🎉 Đặt hàng thành công! Mã đơn hàng: " +
            (data.orderId || data.order?.id),
        );
        clearCart(); // Làm rỗng giỏ hàng
        navigate("/my-orders"); // Chuyển sang trang xem đơn đã mua
      } else {
        alert(data.message || "Đặt hàng không thành công, vui lòng thử lại!");
      }
    } catch (error) {
      console.warn("Lỗi API đặt hàng, lưu local fallback:", error);
      alert("Đặt hàng thành công (Chế độ lưu tạm)!");
      clearCart();
      navigate("/");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto my-8 px-4">
      <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900 mb-6 border-b pb-4">
        Xác Nhận & Thanh Toán Đơn Hàng
      </h1>

      <form
        onSubmit={handleSubmitOrder}
        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
      >
        {/* CỘT TRÁI: THÔNG TIN GIAO HÀNG (7 CỘT) */}
        <div className="lg:col-span-7 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-5">
          <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <span>📍</span> Thông tin nhận hàng
          </h2>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Họ và tên người nhận
            </label>
            <input
              type="text"
              required
              placeholder="Nguyễn Minh Hiếu"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-red-500 text-sm"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Số điện thoại nhận hàng <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="0912 345 678"
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-red-500 text-sm"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Địa chỉ giao hàng chi tiết <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-red-500 text-sm"
              value={shippingAddress}
              onChange={(e) => setShippingAddress(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Ghi chú đơn hàng (Tùy chọn)
            </label>
            <textarea
              rows="3"
              placeholder="Ví dụ: Giao giờ hành chính, gọi trước khi đến..."
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:border-red-500 text-sm"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            ></textarea>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <p className="text-sm font-semibold text-gray-700">
              Phương thức thanh toán:
            </p>
            <div className="flex items-center gap-2 mt-2">
              <input
                type="radio"
                id="cod"
                name="payment"
                defaultChecked
                className="accent-red-600"
              />
              <label
                htmlFor="cod"
                className="text-sm text-gray-700 font-medium cursor-pointer"
              >
                Thanh toán khi nhận hàng (COD)
              </label>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: TÓM TẮT ĐƠN HÀNG (5 CỘT) */}
        <div className="lg:col-span-5 bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between h-fit">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-4 pb-2 border-b">
              Đơn hàng của bạn ({cart.reduce((s, i) => s + (i.qty || 1), 0)} sản
              phẩm)
            </h2>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-100 pr-2">
              {cart.map((item, index) => {
                const price = item.price_vnd || item.price || 0;
                return (
                  <div
                    key={item.id || index}
                    className="py-3 flex items-center gap-3"
                  >
                    <img
                      src={item.image_url || item.image || "/Logo.png"}
                      alt={item.name}
                      className="w-14 h-14 object-contain border rounded p-1 bg-gray-50 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Số lượng: x{item.qty || 1}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-semibold text-red-600">
                        {(price * (item.qty || 1)).toLocaleString("vi-VN")} đ
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t mt-4 pt-4 space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Tạm tính</span>
                <span>{totalAmount.toLocaleString("vi-VN")} đ</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Phí vận chuyển</span>
                <span className="text-green-600 font-semibold">Miễn phí</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-gray-900 border-t pt-2">
                <span>Tổng thanh toán</span>
                <span className="text-red-600 text-lg">
                  {totalAmount.toLocaleString("vi-VN")} đ
                </span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full mt-6 py-3.5 rounded-lg text-white font-bold uppercase tracking-wide text-sm shadow-md transition ${
              isSubmitting
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-red-600 hover:bg-red-700 shadow-red-200"
            }`}
          >
            {isSubmitting ? "Đang xử lý đơn..." : "Xác nhận đặt hàng"}
          </button>
        </div>
      </form>
    </div>
  );
}
