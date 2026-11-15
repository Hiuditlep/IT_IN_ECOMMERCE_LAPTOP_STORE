import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function SearchPage({ addToCart }) {
  // Lấy từ khóa "q" từ trên thanh URL (vd: /search?q=asus)
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [products, setProducts] = useState([]);

  useEffect(() => {
    // Gọi API lọc sản phẩm theo từ khóa
    fetch(`http://localhost:5000/api/products?search=${query}`)
      .then((res) => res.json())
      .then((data) => setProducts(data));
  }, [query]);

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-2">
        Kết quả tìm kiếm cho: <span className="text-red-600">"{query}"</span>
      </h2>

      {products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-lg shadow-sm border text-gray-500">
          Không tìm thấy laptop nào phù hợp với từ khóa "{query}"
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
          {products.map((item) => (
            <div
              key={item.id}
              className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border border-gray-100"
            >
              <Link to={`/product/${item.id}`} className="p-3 flex-1 block">
                <div className="bg-white flex justify-center items-center h-40 mb-3">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="max-h-full object-contain transition-transform hover:scale-105"
                  />
                </div>
                <div className="text-left">
                  <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 hover:text-red-600">
                    {item.name}
                  </h3>
                  <div className="mt-2 text-[11px] md:text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block mb-2">
                    RAM {item.ram} | SSD {item.ssd}
                  </div>
                  <p className="text-red-600 font-bold text-base md:text-lg">
                    {item.price.toLocaleString("vi-VN")} ₫
                  </p>
                </div>
              </Link>

              <div className="p-3 pt-0 mt-auto">
                <button
                  onClick={() => addToCart(item)}
                  disabled={item.stock_quantity <= 0}
                  className={`w-full font-medium py-1.5 rounded transition-colors text-sm uppercase ${
                    item.stock_quantity > 0
                      ? "border border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                      : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {item.stock_quantity > 0 ? "Thêm vào giỏ" : "Hết hàng"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
