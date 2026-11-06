import { useState, useEffect } from "react";

export default function Admin() {
  // ==========================================
  // 1. STATE & HOOKS
  // ==========================================
  const [activeTab, setActiveTab] = useState("orders"); // Quản lý Tab đang mở
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);

  // State cho Form thêm sản phẩm
  const initialProductState = {
    name: "",
    brand: "",
    category: "",
    price: "",
    price_vnd: "",
    image: "",
    image_url: "",
    stock_quantity: "",
    cpu: "",
    gpu: "",
    gpu_vram_gb: 0,
    ram: "8GB",
    ram_gb: 8,
    ssd: "512GB",
    ssd_gb: 512,
    hdd_gb: 0,
    screen_size_in: 15.6,
    panel_type: "IPS",
    resolution: "1920x1080",
    refresh_rate_hz: 60,
    weight_kg: 1.8,
    battery_wh: 50,
    operating_system: "Windows 11",
  };

  const [newProduct, setNewProduct] = useState(initialProductState);

  // ==========================================
  // 2. GỌI API LẤY DỮ LIỆU
  // ==========================================
  const fetchData = () => {
    fetch("http://localhost:5000/api/users")
      .then((res) => res.json())
      .then((data) => setUsers(data));
    fetch("http://localhost:5000/api/orders")
      .then((res) => res.json())
      .then((data) => setOrders(data));
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ==========================================
  // 3. CÁC HÀM XỬ LÝ SẢN PHẨM (CRUD)
  // ==========================================
  const handleAddProduct = async (e) => {
    e.preventDefault();
    await fetch("http://localhost:5000/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newProduct,
        price: Number(newProduct.price),
        stock_quantity: Number(newProduct.stock_quantity),
        image: "https://placehold.co/400x300?text=New+Laptop", // Ảnh mặc định
      }),
    });
    alert("Thêm sản phẩm thành công!");
    setNewProduct({
      name: "",
      brand: "",
      price: "",
      stock_quantity: "",
      category: "",
    }); // Reset form
    fetchData(); // Tải lại danh sách
  };

  const handleDeleteProduct = async (id) => {
    if (window.confirm("Xóa vĩnh viễn sản phẩm này?")) {
      await fetch(`http://localhost:5000/api/products/${id}`, {
        method: "DELETE",
      });
      fetchData();
    }
  };

  // Các hàm cũ (Xóa User, Sửa Status Order...)
  const handleDeleteUser = async (id) => {
    if (window.confirm("Xóa người dùng này?")) {
      await fetch(`http://localhost:5000/api/users/${id}`, {
        method: "DELETE",
      });
      fetchData();
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    await fetch(`http://localhost:5000/api/orders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  // ==========================================
  // 4. CÁC HÀM XỬ LÝ ĐƠN HÀNG
  // ==========================================
  const handleDeleteOrder = async (id) => {
    if (
      window.confirm("Bạn có chắc chắn muốn xóa vĩnh viễn đơn hàng này không?")
    ) {
      await fetch(`http://localhost:5000/api/orders/${id}`, {
        method: "DELETE",
      });
      fetchData(); // Tải lại danh sách
    }
  };
  // ==========================================
  // 5. HIỂN THỊ GIAO DIỆN
  // ==========================================
  return (
    <div className="bg-white p-6 rounded-lg shadow-md min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-center text-red-600 uppercase border-b pb-4">
        Bảng Điều Khiển Admin
      </h2>

      {/* THANH CHUYỂN TAB */}
      <div className="flex gap-4 mb-6 border-b pb-2">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 font-bold rounded ${activeTab === "orders" ? "bg-red-600 text-white" : "bg-gray-200"}`}
        >
          📦 Quản lý Đơn hàng ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("products")}
          className={`px-4 py-2 font-bold rounded ${activeTab === "products" ? "bg-red-600 text-white" : "bg-gray-200"}`}
        >
          💻 Quản lý Sản phẩm ({products.length})
        </button>
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-2 font-bold rounded ${activeTab === "users" ? "bg-red-600 text-white" : "bg-gray-200"}`}
        >
          👤 Quản lý Khách hàng ({users.length})
        </button>
      </div>

      {/* NỘI DUNG TAB ĐƠN HÀNG */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          {orders.map((o) => (
            <div
              key={o.id}
              className="bg-gray-50 border p-4 rounded-lg flex justify-between items-center"
            >
              <div>
                <p className="font-bold text-blue-600">{o.id}</p>
                <p>
                  Khách: {o.customerInfo.name} | Tổng:{" "}
                  {o.total.toLocaleString("vi-VN")} đ
                </p>
              </div>
              {/* NỘI DUNG TAB ĐƠN HÀNG */}
              {activeTab === "orders" && (
                <div className="space-y-4">
                  {orders.map((o) => (
                    <div
                      key={o.id}
                      className="bg-gray-50 border p-4 rounded-lg flex justify-between items-center hover:shadow-md transition"
                    >
                      <div>
                        <p className="font-bold text-blue-600">{o.id}</p>
                        <p className="text-sm">
                          Khách hàng:{" "}
                          <span className="font-semibold">
                            {o.customerInfo?.name || "Không rõ"}
                          </span>
                        </p>
                        <p className="text-red-600 font-bold">
                          Tổng tiền: {o.total?.toLocaleString("vi-VN")} đ
                        </p>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Dropdown trạng thái đã thêm "Đã hủy" */}
                        <select
                          value={o.status || "Chờ duyệt"}
                          onChange={(e) =>
                            handleUpdateStatus(o.id, e.target.value)
                          }
                          className={`border p-2 rounded font-medium outline-none ${
                            o.status === "Đã giao"
                              ? "bg-green-100 text-green-700"
                              : o.status === "Đã hủy"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          <option value="Chờ duyệt">Chờ duyệt</option>
                          <option value="Đang giao">Đang giao</option>
                          <option value="Đã giao">Đã giao</option>
                          <option value="Đã hủy">Đã hủy</option>
                        </select>

                        {/* Nút Xóa đơn hàng */}
                        <button
                          onClick={() => handleDeleteOrder(o.id)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-2 rounded font-bold transition"
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* NỘI DUNG TAB SẢN PHẨM */}
      {activeTab === "products" && (
        <div className="grid md:grid-cols-3 gap-8">
          {/* Form thêm sản phẩm đầy đủ thông số kỹ thuật */}
          <form
            onSubmit={handleAddProduct}
            className="md:col-span-1 bg-gray-50 p-4 rounded border h-fit max-h-[85vh] overflow-y-auto space-y-3"
          >
            <h3 className="font-bold text-gray-800 border-b pb-2">
              Thêm Laptop Mới
            </h3>

            {/* THÔNG TIN CƠ BẢN */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Tên Laptop *
              </label>
              <input
                type="text"
                placeholder="VD: MacBook Air M1"
                required
                className="w-full p-2 border rounded text-sm bg-white"
                value={newProduct.name || ""}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Thương hiệu *
                </label>
                <input
                  type="text"
                  placeholder="Asus, Dell, Apple..."
                  required
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.brand || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, brand: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Phân khúc *
                </label>
                <input
                  type="text"
                  placeholder="Gaming, Office..."
                  required
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.category || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, category: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Giá tiền (VNĐ) *
                </label>
                <input
                  type="number"
                  placeholder="18990000"
                  required
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.price || newProduct.price_vnd || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      price: Number(e.target.value),
                      price_vnd: Number(e.target.value),
                    })
                  }
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">
                  Số lượng kho *
                </label>
                <input
                  type="number"
                  placeholder="10"
                  required
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.stock_quantity ?? ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock_quantity: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Link Ảnh sản phẩm
              </label>
              <input
                type="text"
                placeholder="https://..."
                className="w-full p-2 border rounded text-sm bg-white"
                value={newProduct.image || newProduct.image_url || ""}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    image: e.target.value,
                    image_url: e.target.value,
                  })
                }
              />
            </div>

            {/* CẤU HÌNH PHẦN CỨNG */}
            <div className="pt-2 border-t">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Cấu hình CPU & GPU
              </p>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="CPU (VD: Apple M1, Intel Core i5...)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.cpu || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, cpu: e.target.value })
                  }
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="GPU (VD: RTX 4050, Apple M1 GPU...)"
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={newProduct.gpu || ""}
                    onChange={(e) =>
                      setNewProduct({ ...newProduct, gpu: e.target.value })
                    }
                  />
                  <input
                    type="number"
                    placeholder="VRAM (GB, VD: 4)"
                    className="w-full p-2 border rounded text-sm bg-white"
                    value={newProduct.gpu_vram_gb ?? ""}
                    onChange={(e) =>
                      setNewProduct({
                        ...newProduct,
                        gpu_vram_gb: Number(e.target.value),
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* BỘ NHỚ & LƯU TRỮ */}
            <div className="pt-2 border-t">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                RAM & Ổ Cứng
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="text"
                  placeholder="RAM (VD: 8GB, 16GB)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.ram || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      ram: e.target.value,
                      ram_gb: parseInt(e.target.value) || 8,
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="SSD (VD: 256GB, 512GB)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.ssd || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      ssd: e.target.value,
                      ssd_gb: parseInt(e.target.value) || 512,
                    })
                  }
                />
              </div>
              <input
                type="number"
                placeholder="HDD (GB, nếu có, VD: 1000)"
                className="w-full p-2 border rounded text-sm bg-white"
                value={newProduct.hdd_gb ?? ""}
                onChange={(e) =>
                  setNewProduct({
                    ...newProduct,
                    hdd_gb: Number(e.target.value),
                  })
                }
              />
            </div>

            {/* MÀN HÌNH */}
            <div className="pt-2 border-t">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Màn hình
              </p>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <input
                  type="number"
                  step="0.1"
                  placeholder="Kích thước (in, VD: 13.3)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.screen_size_in ?? ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      screen_size_in: parseFloat(e.target.value),
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="Tấm nền (VD: IPS Retina, OLED)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.panel_type || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, panel_type: e.target.value })
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="Độ phân giải (VD: 2560x1600)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.resolution || ""}
                  onChange={(e) =>
                    setNewProduct({ ...newProduct, resolution: e.target.value })
                  }
                />
                <input
                  type="number"
                  placeholder="Tần số quét (Hz, VD: 60, 144)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.refresh_rate_hz ?? ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      refresh_rate_hz: Number(e.target.value),
                    })
                  }
                />
              </div>
            </div>

            {/* TRỌNG LƯỢNG, PIN & HỆ ĐIỀU HÀNH */}
            <div className="pt-2 border-t">
              <p className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                Khác
              </p>
              <div className="grid grid-cols-3 gap-2 mb-2">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Trọng lượng (kg)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.weight_kg ?? ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      weight_kg: parseFloat(e.target.value),
                    })
                  }
                />
                <input
                  type="number"
                  step="0.1"
                  placeholder="Pin (Wh)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.battery_wh ?? ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      battery_wh: parseFloat(e.target.value),
                    })
                  }
                />
                <input
                  type="text"
                  placeholder="HĐH (VD: macOS, Win 11)"
                  className="w-full p-2 border rounded text-sm bg-white"
                  value={newProduct.operating_system || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      operating_system: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded transition shadow-sm uppercase tracking-wider text-sm mt-3"
            >
              THÊM SẢN PHẨM
            </button>
          </form>

          {/* Danh sách sản phẩm */}
          <div className="md:col-span-2 space-y-3 max-h-[600px] overflow-y-auto">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex justify-between items-center bg-white p-3 border rounded"
              >
                <div className="flex gap-4 items-center">
                  <img
                    src={p.image}
                    className="w-16 h-16 object-contain"
                    alt=""
                  />
                  <div>
                    <p className="font-bold">{p.name}</p>
                    <p className="text-sm text-gray-500">
                      Giá: {p.price.toLocaleString("vi-VN")} đ | Kho:{" "}
                      {p.stock_quantity}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteProduct(p.id)}
                  className="bg-red-100 text-red-600 px-3 py-1 rounded font-bold"
                >
                  Xóa
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NỘI DUNG TAB KHÁCH HÀNG */}
      {activeTab === "users" && (
        <ul className="space-y-3">
          {users.map((u) => (
            <li
              key={u.id}
              className="bg-gray-50 border p-3 rounded flex justify-between items-center"
            >
              <span className="font-bold">
                {u.username} (ID: {u.id})
              </span>
              <button
                onClick={() => handleDeleteUser(u.id)}
                className="text-red-500 bg-red-100 px-3 py-1 rounded"
              >
                Xóa
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
