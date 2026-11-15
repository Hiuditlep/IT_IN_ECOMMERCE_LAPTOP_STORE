import { useState, useEffect } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useNavigate,
} from "react-router-dom";

// COMPONENTS BÊN TRONG
import MegaMenu from "./components/MegaMenu";

// PAGES
import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Cart from "./pages/Cart";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import SearchPage from "./pages/SearchPage";

function AppContent() {
  const [cart, setCart] = useState([]);
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

  const [user, setUser] = useState(
    () => JSON.parse(localStorage.getItem("user")) || null,
  );

  // === STATE CHO TÍNH NĂNG GỢI Ý ===
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  useEffect(() => {
    if (searchInput.trim().length > 0) {
      fetch(`http://localhost:5000/api/products?search=${searchInput.trim()}`)
        .then((res) => res.json())
        .then((data) => {
          setSearchSuggestions(data.slice(0, 4));
        });
    } else {
      setSearchSuggestions([]);
    }
  }, [searchInput]);

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const addToCart = (product) => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng!");
      navigate("/auth");
      return;
    }
    if (product.stock_quantity <= 0) {
      alert("Sản phẩm này đã tạm hết hàng!");
      return;
    }

    const existingItem = cart.find((item) => item.id === product.id);
    if (existingItem && existingItem.qty >= product.stock_quantity) {
      alert(`Rất tiếc, kho chỉ còn tối đa ${product.stock_quantity} sản phẩm!`);
      return;
    }

    setCart((prevCart) => {
      const itemInCart = prevCart.find((item) => item.id === product.id);
      if (itemInCart) {
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item,
        );
      }
      return [...prevCart, { ...product, qty: 1 }];
    });
    alert("Đã thêm vào giỏ hàng!");
  };

  const updateQuantity = (id, amount) => {
    const itemToUpdate = cart.find((item) => item.id === id);
    if (itemToUpdate) {
      const newQty = itemToUpdate.qty + amount;
      if (newQty < 1) return;
      if (newQty > itemToUpdate.stock_quantity) {
        alert(`Kho chỉ còn ${itemToUpdate.stock_quantity} sản phẩm!`);
        return;
      }
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.id === id ? { ...item, qty: newQty } : item,
        ),
      );
    }
  };

  const removeFromCart = (id) =>
    setCart((prevCart) => prevCart.filter((item) => item.id !== id));
  const clearCart = () => setCart([]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchInput.trim() !== "") {
      setShowSuggestions(false);
      navigate(`/search?q=${searchInput.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans w-full">
      <header className="bg-red-600 text-white p-3 shadow-md sticky top-0 z-50 w-full">
        <div className="w-full px-4 md:px-8 mx-auto flex justify-between items-center gap-6 h-full">
          {/* CỤM 1: LOGO & DANH MỤC */}
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="flex items-center justify-center hover:opacity-80 transition-opacity h-full"
            >
              <img
                src="/Logo.png"
                alt="Logo"
                className="h-10 w-auto object-contain"
              />
            </Link>

            {/* Gọi Component MegaMenu đã tách ra */}
            <MegaMenu />
          </div>

          {/* CỤM 2: THANH TÌM KIẾM ĐƯỢC KÉO TO RA */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex-1 w-full max-w-3xl relative flex flex-col"
          >
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Nhập tên laptop cần tìm..."
                className="w-full text-black px-4 py-2.5 rounded-full focus:outline-none shadow-inner pr-12 text-sm border focus:border-red-400 transition"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <button
                type="submit"
                className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-gray-500 hover:text-red-600 transition"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  ></path>
                </svg>
              </button>
            </div>

            {/* BẢNG SẢN PHẨM ĐỀ XUẤT */}
            {showSuggestions && searchInput.trim() !== "" && (
              <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-lg mt-2 border border-gray-200 overflow-hidden text-black z-50">
                <div className="p-3 text-sm font-semibold text-gray-600 bg-gray-50 border-b">
                  Sản phẩm đề xuất
                </div>
                {searchSuggestions.length > 0 ? (
                  <ul className="max-h-80 overflow-y-auto">
                    {searchSuggestions.map((p) => (
                      <li
                        key={p.id}
                        className="hover:bg-gray-50 border-b last:border-b-0 transition"
                      >
                        <div
                          onClick={() => {
                            navigate(`/product/${p.id}`);
                            setSearchInput("");
                            setShowSuggestions(false);
                          }}
                          className="flex gap-4 p-3 cursor-pointer items-center"
                        >
                          <img
                            src={p.image_url || p.image}
                            alt={p.name}
                            className="w-12 h-12 object-contain rounded"
                          />
                          <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-800 line-clamp-1">
                              {p.name}
                            </p>
                            <p className="text-red-600 font-bold text-sm mt-0.5">
                              {(p.price_vnd || p.price || 0).toLocaleString(
                                "vi-VN",
                              )}{" "}
                              đ
                            </p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="p-4 text-sm text-gray-500 text-center">
                    Không tìm thấy sản phẩm phù hợp.
                  </div>
                )}
              </div>
            )}
          </form>

          {/* CỤM 3: TÀI KHOẢN & GIỎ HÀNG */}
          <nav className="shrink-0">
            <ul className="flex items-center gap-4">
              {user ? (
                <li className="relative group py-2 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm">
                      👤
                    </div>
                    <span className="font-medium hover:text-gray-200">
                      {user.username}
                    </span>
                  </div>
                  <div className="absolute right-0 top-full mt-0 w-48 bg-white text-black shadow-lg rounded-sm overflow-hidden hidden group-hover:block z-50 border">
                    <Link
                      to="/profile"
                      className="block px-4 py-3 text-sm hover:bg-gray-100 transition"
                    >
                      Tài Khoản Của Tôi
                    </Link>
                    <Link
                      to="/my-orders"
                      className="block px-4 py-3 text-sm hover:bg-gray-100 transition"
                    >
                      Đơn Mua
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-3 text-sm hover:bg-gray-100 transition text-red-600"
                    >
                      Đăng Xuất
                    </button>
                  </div>
                </li>
              ) : (
                <li>
                  <Link to="/auth" className="hover:underline font-medium">
                    Đăng nhập
                  </Link>
                </li>
              )}

              {user?.role === "admin" && (
                <li>
                  <Link
                    to="/admin"
                    className="font-bold text-yellow-300 hover:text-white transition bg-red-800 px-3 py-1.5 rounded text-sm"
                  >
                    Admin Panel
                  </Link>
                </li>
              )}

              <li>
                <Link
                  to="/cart"
                  className="flex items-center gap-2 bg-black/20 px-4 py-2 rounded-lg hover:bg-black/30 transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                    ></path>
                  </svg>
                  <span className="hidden sm:inline">Giỏ hàng</span>
                  <span className="bg-yellow-400 text-black px-2 py-0.5 rounded-full text-xs font-bold">
                    {cart.reduce((sum, item) => sum + item.qty, 0)}
                  </span>
                </Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      <main className="w-full px-4 md:px-8 mt-6">
        <Routes>
          <Route
            path="/"
            element={<Home addToCart={addToCart} searchTerm="" />}
          />
          <Route
            path="/search"
            element={<SearchPage addToCart={addToCart} />}
          />
          <Route
            path="/product/:id"
            element={<Detail addToCart={addToCart} />}
          />
          <Route
            path="/cart"
            element={
              <Cart
                cart={cart}
                updateQuantity={updateQuantity}
                removeFromCart={removeFromCart}
              />
            }
          />
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route
            path="/checkout"
            element={<Checkout cart={cart} user={user} clearCart={clearCart} />}
          />
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/profile"
            element={<Profile user={user} setUser={setUser} />}
          />
          <Route path="/my-orders" element={<MyOrders user={user} />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
