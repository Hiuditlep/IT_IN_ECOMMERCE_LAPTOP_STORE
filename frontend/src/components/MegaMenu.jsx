import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function MegaMenu() {
  const [hoveredBrand, setHoveredBrand] = useState("");
  const [menuData, setMenuData] = useState([]);

  // GỌI API ĐỂ LẤY DỮ LIỆU MENU ĐỘNG TỪ DATABASE
  useEffect(() => {
    fetch("http://localhost:5000/api/products")
      .then((res) => res.json())
      .then((data) => {
        // Gom nhóm sản phẩm theo Brand và Category
        const grouped = {};
        data.forEach((product) => {
          const brandName = product.brand || "Khác";
          const categoryName = product.category || "Chung";

          if (!grouped[brandName]) {
            grouped[brandName] = {
              id: brandName,
              name: brandName,
              categories: {},
            };
          }

          if (!grouped[brandName].categories[categoryName]) {
            grouped[brandName].categories[categoryName] = {
              title: categoryName,
              items: [],
            };
          }

          // Lấy tối đa 5 sản phẩm đưa vào menu cho mỗi phân khúc để menu không bị quá dài
          if (grouped[brandName].categories[categoryName].items.length < 5) {
            grouped[brandName].categories[categoryName].items.push({
              name: product.name,
              link: `/product/${product.id || product.product_id}`,
            });
          }
        });

        // Chuyển object thành mảng
        const finalMenuData = Object.values(grouped).map((b) => ({
          ...b,
          categories: Object.values(b.categories),
        }));

        setMenuData(finalMenuData);
        if (finalMenuData.length > 0) {
          setHoveredBrand(finalMenuData[0].id); // Mặc định hover vào hãng đầu tiên
        }
      })
      .catch((err) => console.error("Lỗi tải menu:", err));
  }, []);

  const activeBrandData = menuData.find((b) => b.id === hoveredBrand);

  return (
    <div className="relative group flex items-center h-full">
      <button className="flex items-center gap-2 bg-black/20 hover:bg-black/30 px-4 py-2.5 rounded-lg font-medium transition whitespace-nowrap cursor-pointer">
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
            d="M4 6h16M4 12h16M4 18h16"
          ></path>
        </svg>
        Danh mục
      </button>

      {/* Cầu nối vô hình */}
      <div className="absolute top-full left-0 w-full h-4 bg-transparent"></div>

      {/* Box Mega Menu */}
      <div className="absolute top-[calc(100%+8px)] left-0 w-[800px] min-h-[400px] bg-white text-black shadow-2xl rounded-lg hidden group-hover:flex border border-gray-100 z-50 overflow-hidden cursor-default transition-all duration-300">
        {/* Cột trái: Tên các Thương hiệu */}
        <div className="w-1/4 bg-gray-50 border-r flex flex-col py-4">
          <h3 className="px-5 pb-3 font-bold text-gray-800 border-b border-gray-200">
            Thương hiệu
          </h3>
          <ul className="flex-1 mt-2">
            {menuData.map((brand) => (
              <li
                key={brand.id}
                onMouseEnter={() => setHoveredBrand(brand.id)}
                className={`px-5 py-3 font-medium cursor-pointer transition-colors border-l-4 ${
                  hoveredBrand === brand.id
                    ? "bg-white text-red-600 border-red-600 shadow-sm"
                    : "border-transparent hover:text-red-600"
                }`}
              >
                {brand.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Cột phải: Content máy & Dòng máy */}
        <div className="w-3/4 bg-white p-6 overflow-y-auto max-h-[600px]">
          {activeBrandData && (
            <div className="grid grid-cols-2 gap-8">
              {activeBrandData.categories.map((cat, index) => (
                <div key={index}>
                  <h4 className="font-bold text-red-600 mb-3 border-b border-red-100 pb-2 uppercase text-sm tracking-wide">
                    {cat.title}
                  </h4>
                  <ul className="space-y-3">
                    {cat.items.map((item, idx) => (
                      <li key={idx}>
                        <Link
                          to={item.link}
                          className="text-sm font-semibold text-gray-700 hover:text-red-600 transition line-clamp-1"
                          title={item.name}
                        >
                          {item.name}
                        </Link>
                      </li>
                    ))}
                    {/* Nút Xem tất cả */}
                    <li className="pt-1">
                      <Link
                        to={`/search?q=${encodeURIComponent(activeBrandData.name)}`}
                        className="text-xs text-blue-600 hover:underline italic font-medium"
                      >
                        Xem tất cả {cat.title}...
                      </Link>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
