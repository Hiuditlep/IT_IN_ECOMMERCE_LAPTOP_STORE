import { useState, useEffect } from "react";

export default function MyOrders({ user }) {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    if (user) {
      fetch(`http://localhost:5000/api/orders/user/${user.id}`)
        .then((res) => res.json())
        .then((data) => {
          // BẢO VỆ 1: Ép kiểu để orders luôn luôn là một mảng, không bao giờ bị sập
          setOrders(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error("Lỗi tải đơn hàng:", err));
    }
  }, [user]);

  if (!user) {
    return (
      <div className="text-center mt-20 text-xl text-gray-500">
        Vui lòng đăng nhập để xem đơn hàng
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-800">
        Đơn Mua Của Tôi
      </h2>

      {/* Dùng dấu ?. để tránh lỗi khi biến bị undefined */}
      {orders?.length === 0 ? (
        <div className="bg-white p-10 text-center rounded-lg shadow-sm text-gray-500 border">
          Bạn chưa có đơn hàng nào.
        </div>
      ) : (
        <div className="space-y-6">
          {orders?.map((o) => (
            <div
              key={o.id || Math.random()}
              className="bg-white p-0 rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div className="flex justify-between items-center border-b p-4 bg-gray-50">
                <span className="font-semibold text-gray-800">
                  Mã đơn: <span className="text-blue-600">{o.id}</span>
                </span>
                <span className="text-red-500 font-bold uppercase text-sm tracking-wide">
                  {o.status || "Chờ duyệt"}
                </span>
              </div>

              <div className="p-4 space-y-4">
                {/* BẢO VỆ 2: Thêm dấu ?. sau items đề phòng backend quên trả về mảng sản phẩm */}
                {o.items?.length > 0 ? (
                  o.items.map((item) => (
                    <div
                      key={item.id || Math.random()}
                      className="flex justify-between items-center"
                    >
                      <div className="flex gap-4 items-center w-3/4">
                        <img
                          src={
                            item.image_url ||
                            item.image ||
                            "https://placehold.co/80"
                          }
                          alt={item.name || "Sản phẩm"}
                          className="w-20 h-20 object-contain border rounded p-1"
                        />
                        <div>
                          <p className="font-medium text-gray-800 line-clamp-2">
                            {item.name}
                          </p>
                          <p className="text-sm text-gray-500 font-semibold mt-1">
                            {/* Dự phòng trường hợp DB tên là quantity hoặc qty */}
                            Số lượng: x{item.quantity || item.qty || 1}
                          </p>
                        </div>
                      </div>
                      <span className="text-red-600 font-medium whitespace-nowrap">
                        {/* Dự phòng trường hợp DB tên là price_vnd */}
                        {(
                          (item.price || item.price_vnd || 0) *
                          (item.quantity || item.qty || 1)
                        ).toLocaleString("vi-VN")}{" "}
                        đ
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500 italic">
                    Chi tiết sản phẩm đang được cập nhật từ hệ thống...
                  </p>
                )}
              </div>

              <div className="border-t p-4 flex justify-end items-center gap-4 bg-red-50/50">
                <span className="text-gray-600 font-medium">Thành tiền:</span>
                <span className="text-2xl font-bold text-red-600">
                  {/* BẢO VỆ 3: Dự phòng DB dùng cột total_price, total_amount hoặc biến bị rỗng */}
                  {(
                    o.total_price ||
                    o.total_amount ||
                    o.total ||
                    0
                  ).toLocaleString("vi-VN")}{" "}
                  đ
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
