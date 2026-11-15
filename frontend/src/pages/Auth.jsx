import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Auth({ setUser }) {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // Dữ liệu đăng nhập / đăng ký
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Dữ liệu bước 2 khi đăng ký
  const [registerStep, setRegisterStep] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const navigate = useNavigate();

  // Chuyển sang Bước 2 khi điền xong Bước 1
  const handleGoToStep2 = (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      alert("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu!");
      return;
    }
    setRegisterStep(2);
  };

  // Gửi API Đăng nhập
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert("Đăng nhập thành công!");
        const role =
          data.user?.role ||
          (username.toLowerCase() === "admin" ? "admin" : "user");
        const userData = { ...data.user, role };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate(-1);
      } else {
        alert(data.message || "Sai tên đăng nhập hoặc mật khẩu!");
      }
    } catch (err) {
      alert("Lỗi kết nối Server Backend!");
    }
  };

  // Gửi API Đăng ký (Gom toàn bộ dữ liệu ở Bước 1 + Bước 2)
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch("http://localhost:5000/api/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          password,
          full_name: fullName,
          phone,
          address,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        alert("Đăng ký thành công!");
        const role =
          data.user?.role ||
          (username.toLowerCase() === "admin" ? "admin" : "user");
        const userData = { ...data.user, role };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        navigate(-1);
      } else {
        alert(data.message || "Đăng ký thất bại!");
      }
    } catch (err) {
      alert("Lỗi kết nối Server Backend!");
    }
  };

  return (
    <div className="min-h-[75vh] flex flex-col justify-center items-center px-4 py-8">
      <div className="bg-white p-8 md:p-10 rounded-xl shadow-lg w-full max-w-[450px] border border-gray-100">
        {/* Tiêu đề */}
        <div className="mb-8">
          <p className="text-red-600 font-bold text-xs tracking-[0.15em] uppercase mb-2">
            Mừng bạn trở lại
          </p>
          <h2 className="text-3xl font-extrabold text-gray-900 mb-2">
            {isLogin
              ? "Đăng nhập"
              : registerStep === 1
                ? "Đăng ký"
                : "Thông tin cá nhân"}
          </h2>
          <p className="text-gray-500 text-sm">
            {isLogin
              ? "Đăng nhập để tiếp tục với tài khoản của bạn."
              : registerStep === 1
                ? "Tạo tài khoản mới để mua sắm dễ dàng hơn."
                : "Hoàn thiện thông tin để phục vụ việc giao hàng."}
          </p>
        </div>

        {/* ================= FORM ĐĂNG NHẬP ================= */}
        {isLogin && (
          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Tên đăng nhập (Hoặc Email)
              </label>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập của bạn"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Mật khẩu
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nhập mật khẩu"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-password-login"
                className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label
                htmlFor="show-password-login"
                className="ml-2 text-sm text-gray-600 cursor-pointer select-none"
              >
                Hiện mật khẩu
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition text-sm uppercase tracking-wide"
            >
              Đăng nhập
            </button>
          </form>
        )}

        {/* ================= FORM ĐĂNG KÝ: BƯỚC 1 ================= */}
        {!isLogin && registerStep === 1 && (
          <form onSubmit={handleGoToStep2} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Tên đăng nhập (Hoặc Email)
              </label>
              <input
                type="text"
                placeholder="Nhập tên đăng nhập mới"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Mật khẩu
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Tạo mật khẩu"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="show-password-reg"
                className="w-4 h-4 text-red-600 accent-red-600 cursor-pointer"
                checked={showPassword}
                onChange={(e) => setShowPassword(e.target.checked)}
              />
              <label
                htmlFor="show-password-reg"
                className="ml-2 text-sm text-gray-600 cursor-pointer select-none"
              >
                Hiện mật khẩu
              </label>
            </div>

            <button
              type="submit"
              className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition text-sm uppercase tracking-wide"
            >
              Tiếp tục
            </button>
          </form>
        )}

        {/* ================= FORM ĐĂNG KÝ: BƯỚC 2 ================= */}
        {!isLogin && registerStep === 2 && (
          <form onSubmit={handleRegisterSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Họ và Tên
              </label>
              <input
                type="text"
                placeholder="Nguyễn Minh Hiếu"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Số điện thoại
              </label>
              <input
                type="tel"
                placeholder="0912 345 678"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-gray-900 mb-1.5">
                Địa chỉ giao hàng
              </label>
              <input
                type="text"
                placeholder="VD: 22/4c Đường ABC, TP.HCM"
                required
                className="w-full px-4 py-3 rounded border border-gray-300 focus:border-red-500 outline-none text-sm"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>

            <div className="pt-2 space-y-3">
              <button
                type="submit"
                className="w-full bg-red-600 text-white font-bold py-3 rounded hover:bg-red-700 transition text-sm uppercase tracking-wide"
              >
                Hoàn tất đăng ký
              </button>
              <button
                type="button"
                onClick={() => setRegisterStep(1)}
                className="w-full bg-gray-200 text-gray-700 font-bold py-3 rounded hover:bg-gray-300 transition text-sm uppercase tracking-wide"
              >
                Quay lại
              </button>
            </div>
          </form>
        )}

        {/* Chuyển đổi giữa Đăng nhập / Đăng ký */}
        {!(!isLogin && registerStep === 2) && (
          <div className="mt-8 text-center text-sm text-gray-600">
            {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setRegisterStep(1);
              }}
              className="font-bold text-red-600 hover:text-red-800 underline transition-colors"
            >
              {isLogin ? "Đăng ký" : "Đăng nhập"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
