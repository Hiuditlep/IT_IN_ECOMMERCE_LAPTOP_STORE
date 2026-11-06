import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";

export default function Home({ addToCart, searchTerm }) {
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [brands, setBrands] = useState([]);

  // CÁC STATE LƯU TRỮ LỰA CHỌN LỌC CỦA NGƯỜI DÙNG
  const [activeBrand, setActiveBrand] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [filterRam, setFilterRam] = useState([]);
  const [filterStorage, setFilterStorage] = useState([]);
  const [filterScreen, setFilterScreen] = useState([]);
  const [filterRefresh, setFilterRefresh] = useState([]);
  const [filterCpu, setFilterCpu] = useState([]);
  const [filterGpu, setFilterGpu] = useState([]);

  const brandSliderRef = useRef(null);

const categories = [
    {
      id: "gaming",
      name: "Gaming",
      img: "/Use_Demand/GamingLaptop.jpg",
      keyword: "gaming",
    },
    {
      id: "creator",
      name: "Đồ họa - Creator",
      img: "/Use_Demand/CreatorLaptop.jpg",
      keyword: "creator",
    },
    {
      id: "business",
      name: "Doanh nhân",
      img: "/Use_Demand/BusinessLaptop.jpg",
      keyword: "business",
    },
    {
      id: "ultrabook",
      name: "Mỏng nhẹ - Ultrabook",
      img: "/Use_Demand/UltrabookLaptop.jpg",
      keyword: "ultrabook",
    },
    {
      id: "general",
      name: "Phổ thông - Văn phòng",
      img: "/Use_Demand/GeneralLaptop.jpg",
      keyword: "general",
    },
  ];

  useEffect(() => {
    fetch(`http://localhost:5000/api/products?search=${searchTerm || ""}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setAllProducts(data);
          setFilteredProducts(data);
          const uniqueBrands = [...new Set(data.map((p) => p.brand))].filter(
            Boolean,
          );
          setBrands(uniqueBrands);
        } else {
          setAllProducts([]);
          setFilteredProducts([]);
        }
      })
      .catch((err) => {
        console.error("Lỗi tải sản phẩm:", err);
      });
  }, [searchTerm]);

  // LOGIC BỘ LỌC ĐA ĐIỀU KIỆN
  useEffect(() => {
    let result = [...allProducts];

    if (activeBrand) {
      result = result.filter(
        (p) => p.brand?.toLowerCase() === activeBrand.toLowerCase(),
      );
    }

    if (activeCategory) {
      result = result.filter(
        (p) =>
          p.name?.toLowerCase().includes(activeCategory) ||
          p.category?.toLowerCase().includes(activeCategory),
      );
    }

    if (filterRam.length > 0) {
      result = result.filter((p) =>
        filterRam.includes(String(p.ram_gb || p.ram)),
      );
    }

    if (filterStorage.length > 0) {
      result = result.filter((p) =>
        filterStorage.includes(String(p.ssd_gb || p.ssd)),
      );
    }

    if (filterScreen.length > 0) {
      result = result.filter((p) => {
        const size = Number(p.screen_size_in);
        if (!size) return false;
        return filterScreen.some((cond) => {
          if (cond === "<14") return size < 14;
          if (cond === "14-15") return size >= 14 && size < 15.5;
          if (cond === "15-17") return size >= 15.5 && size <= 17.3;
          if (cond === ">17") return size > 17.3;
          return false;
        });
      });
    }

    if (filterRefresh.length > 0) {
      result = result.filter((p) => {
        const hz = Number(p.refresh_rate_hz);
        if (!hz) return false;
        return filterRefresh.some((cond) => {
          if (cond === "60") return hz <= 60;
          if (cond === "120") return hz === 120;
          if (cond === "144") return hz === 144;
          if (cond === "165") return hz === 165;
          if (cond === "240+") return hz >= 240;
          return false;
        });
      });
    }

    if (filterCpu.length > 0) {
      result = result.filter((p) => {
        const cpuStr = (p.cpu || "").toLowerCase();
        return filterCpu.some((k) => cpuStr.includes(k.toLowerCase()));
      });
    }

    if (filterGpu.length > 0) {
      result = result.filter((p) => {
        const gpuStr = (p.gpu || "").toLowerCase();
        return filterGpu.some((k) => gpuStr.includes(k.toLowerCase()));
      });
    }

    setFilteredProducts(result);
  }, [
    allProducts,
    activeBrand,
    activeCategory,
    filterRam,
    filterStorage,
    filterScreen,
    filterRefresh,
    filterCpu,
    filterGpu,
  ]);

  const toggleFilter = (state, setState, value) => {
    setState(
      state.includes(value)
        ? state.filter((v) => v !== value)
        : [...state, value],
    );
  };

  const scrollBrands = (direction) => {
    if (brandSliderRef.current) {
      brandSliderRef.current.scrollBy({
        left: direction === "left" ? -300 : 300,
        behavior: "smooth",
      });
    }
  };

  // Helper để vẽ nút Checkbox
  const CheckboxItem = ({ label, state, setState, val }) => (
    <label className="flex items-center gap-3 cursor-pointer group mb-3 last:mb-0">
      <input
        type="checkbox"
        checked={state.includes(val)}
        onChange={() => toggleFilter(state, setState, val)}
        className="w-4 h-4 text-red-600 rounded border-gray-300 focus:ring-red-500 cursor-pointer"
      />
      <span className="group-hover:text-red-600 transition text-sm text-gray-700">
        {label}
      </span>
    </label>
  );

  return (
    <div className="w-full pb-10">
      {/* THƯƠNG HIỆU & NHU CẦU */}
      <section className="bg-white rounded-xl shadow-sm p-6 mb-6 mt-4">
        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Thương hiệu nổi bật
        </h2>
        <div className="relative group mb-10">
          <button
            onClick={() => scrollBrands("left")}
            className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 z-10 bg-white shadow-md border w-10 h-10 rounded-full flex items-center justify-center hidden group-hover:flex hover:bg-gray-50 text-gray-600"
          >
            ❮
          </button>

          <div
            ref={brandSliderRef}
            className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth snap-x pb-2"
            style={{ msOverflowStyle: "none", scrollbarWidth: "none" }}
          >
            <div
              onClick={() => setActiveBrand("")}
              className={`snap-start shrink-0 w-[140px] h-16 border rounded-lg flex items-center justify-center cursor-pointer transition ${activeBrand === "" ? "border-red-600 text-red-600 font-bold bg-red-50" : "border-gray-200 text-gray-700 hover:border-red-500"}`}
            >
              TẤT CẢ
            </div>
            {brands.map((brand, idx) => (
            <div 
              key={idx} 
              onClick={() => setActiveBrand(brand)} 
              className={`snap-start shrink-0 w-[140px] h-16 border rounded-lg flex items-center justify-center cursor-pointer transition ${activeBrand === brand ? "border-red-600 bg-red-50" : "border-gray-200 hover:border-red-500"}`}
            >
              <img 
                src={`/Laptop_Logo/${brand}.png`} 
                alt={brand}
                className="max-h-8 max-w-[100px] object-contain transition-transform hover:scale-110"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <span className="hidden font-bold uppercase tracking-wider text-gray-700">{brand}</span>
            </div>
          ))}
          </div>

          <button
            onClick={() => scrollBrands("right")}
            className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 z-10 bg-white shadow-md border w-10 h-10 rounded-full flex items-center justify-center hidden group-hover:flex hover:bg-gray-50 text-gray-600"
          >
            ❯
          </button>
        </div>

        <h2 className="text-xl font-bold text-gray-800 mb-4">
          Nhu cầu sử dụng
        </h2>
        <div className="flex flex-wrap justify-center gap-8 md:gap-12">
          <div
            onClick={() => setActiveCategory("")}
            className="flex flex-col items-center gap-3 cursor-pointer group"
          >
            <div
              className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center p-2 transition transform duration-300 ${activeCategory === "" ? "bg-red-100 ring-2 ring-red-500" : "bg-gray-50 group-hover:-translate-y-1"}`}
            >
              <span className="font-bold text-gray-600">Tất cả</span>
            </div>
            <span
              className={`text-sm font-medium ${activeCategory === "" ? "text-red-600" : "text-gray-700"}`}
            >
              Bỏ lọc
            </span>
          </div>
          {categories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => setActiveCategory(cat.keyword)}
              className="flex flex-col items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl flex items-center justify-center p-2 transition transform duration-300 ${activeCategory === cat.keyword ? "bg-red-100 ring-2 ring-red-500" : "bg-gray-50 group-hover:-translate-y-1"}`}
              >
                <img
                  src={cat.img}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-xl opacity-90 group-hover:opacity-100"
                />
              </div>
              <span
                className={`text-sm font-medium ${activeCategory === cat.keyword ? "text-red-600" : "text-gray-700"}`}
              >
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="flex flex-col md:flex-row gap-6 items-start">
        {/* ========================================== */}
        {/* CỘT BỘ LỌC ĐẦY ĐỦ */}
        {/* ========================================== */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 sticky top-24 bg-white rounded-xl shadow-sm border border-gray-100 h-[calc(100vh-120px)] overflow-hidden">
          <div className="flex items-center gap-2 p-4 border-b bg-gray-50 z-10 shrink-0">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              ></path>
            </svg>
            <h2 className="text-lg font-bold text-gray-800">Bộ lọc tìm kiếm</h2>
          </div>

          <div className="p-5 overflow-y-auto scrollbar-thin flex-1">
            {/* Lọc CPU */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">
                Công nghệ CPU
              </h3>
              <CheckboxItem
                label="Intel Core Ultra"
                state={filterCpu}
                setState={setFilterCpu}
                val="Ultra"
              />
              <CheckboxItem
                label="Intel Core i9"
                state={filterCpu}
                setState={setFilterCpu}
                val="i9"
              />
              <CheckboxItem
                label="Intel Core i7"
                state={filterCpu}
                setState={setFilterCpu}
                val="i7"
              />
              <CheckboxItem
                label="Intel Core i5"
                state={filterCpu}
                setState={setFilterCpu}
                val="i5"
              />
              <CheckboxItem
                label="AMD Ryzen"
                state={filterCpu}
                setState={setFilterCpu}
                val="Ryzen"
              />
            </div>

            {/* Lọc VGA */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">
                Card đồ họa rời (GPU)
              </h3>
              <CheckboxItem
                label="RTX 50 Series (Mới)"
                state={filterGpu}
                setState={setFilterGpu}
                val="RTX 50"
              />
              <CheckboxItem
                label="RTX 40 Series"
                state={filterGpu}
                setState={setFilterGpu}
                val="RTX 40"
              />
              <CheckboxItem
                label="RTX 30 Series"
                state={filterGpu}
                setState={setFilterGpu}
                val="RTX 30"
              />
              <CheckboxItem
                label="RTX 20 Series"
                state={filterGpu}
                setState={setFilterGpu}
                val="RTX 20"
              />
            </div>

            {/* Lọc RAM (Dạng nút bấm) */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1 flex items-center gap-1">
                RAM{" "}
                <span className="text-gray-400 text-xs border rounded-full w-4 h-4 flex items-center justify-center">
                  ?
                </span>
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {["8", "12", "16", "24", "32", "64"].map((ram) => (
                  <button
                    key={ram}
                    onClick={() => toggleFilter(filterRam, setFilterRam, ram)}
                    className={`border py-1.5 px-2 rounded transition ${filterRam.includes(ram) ? "border-red-600 bg-red-50 text-red-600 font-bold" : "border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500"}`}
                  >
                    {ram}GB
                  </button>
                ))}
              </div>
            </div>

            {/* Lọc Ổ cứng */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">
                Ổ cứng SSD
              </h3>
              <CheckboxItem
                label="SSD 2 TB"
                state={filterStorage}
                setState={setFilterStorage}
                val="2048"
              />
              <CheckboxItem
                label="SSD 1 TB"
                state={filterStorage}
                setState={setFilterStorage}
                val="1024"
              />
              <CheckboxItem
                label="SSD 512 GB"
                state={filterStorage}
                setState={setFilterStorage}
                val="512"
              />
              <CheckboxItem
                label="SSD 256 GB"
                state={filterStorage}
                setState={setFilterStorage}
                val="256"
              />
            </div>

            {/* Lọc Màn hình */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1">
                Kích thước màn hình
              </h3>
              <CheckboxItem
                label="Dưới 14 inch"
                state={filterScreen}
                setState={setFilterScreen}
                val="<14"
              />
              <CheckboxItem
                label="Từ 14 - 15 inch"
                state={filterScreen}
                setState={setFilterScreen}
                val="14-15"
              />
              <CheckboxItem
                label="Từ 15 - 17 inch"
                state={filterScreen}
                setState={setFilterScreen}
                val="15-17"
              />
              <CheckboxItem
                label="Trên 17 inch"
                state={filterScreen}
                setState={setFilterScreen}
                val=">17"
              />
            </div>

            {/* Lọc Tần số quét (Dạng nút bấm) */}
            <div className="mb-6">
              <h3 className="font-semibold text-gray-800 mb-3 border-b pb-1 flex items-center gap-1">
                Tần số quét{" "}
                <span className="text-gray-400 text-xs border rounded-full w-4 h-4 flex items-center justify-center">
                  ?
                </span>
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                {[
                  { label: "≤ 60Hz", val: "60" },
                  { label: "120Hz", val: "120" },
                  { label: "144Hz", val: "144" },
                  { label: "165Hz", val: "165" },
                  { label: "240Hz+", val: "240+" },
                ].map((hz) => (
                  <button
                    key={hz.val}
                    onClick={() =>
                      toggleFilter(filterRefresh, setFilterRefresh, hz.val)
                    }
                    className={`border py-1 px-3 rounded transition ${filterRefresh.includes(hz.val) ? "border-red-600 bg-red-50 text-red-600 font-bold" : "border-gray-200 text-gray-600 hover:border-red-500 hover:text-red-500"}`}
                  >
                    {hz.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* ========================================== */}
        {/* LƯỚI SẢN PHẨM BÊN PHẢI */}
        {/* ========================================== */}
        <div className="flex-1 w-full">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold uppercase text-gray-800 border-b-2 border-red-600 inline-block pb-1 mb-[-9px]">
              LAPTOP NỔI BẬT
            </h2>
            <div className="hidden sm:flex gap-4 text-sm font-medium">
              <span className="text-gray-500">
                Tìm thấy{" "}
                <strong className="text-red-600 text-lg">
                  {filteredProducts.length}
                </strong>{" "}
                kết quả
              </span>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="text-center text-gray-500 py-16 bg-white rounded-lg shadow-sm border flex flex-col items-center">
              <p className="text-lg font-medium">
                Rất tiếc, không tìm thấy laptop nào phù hợp với bộ lọc!
              </p>
              <button
                onClick={() => {
                  setActiveBrand("");
                  setActiveCategory("");
                  setFilterStorage([]);
                  setFilterRam([]);
                  setFilterScreen([]);
                  setFilterRefresh([]);
                  setFilterCpu([]);
                  setFilterGpu([]);
                }}
                className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-md font-semibold hover:bg-red-100 transition"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {filteredProducts.map((item) => {
                const productId = item.product_id || item.id;
                const productImage =
                  item.image_url || item.image || "/placeholder-laptop.png";
                const productPrice = Number(item.price_vnd || item.price || 0);
                const ramText = item.ram_gb
                  ? `${item.ram_gb}GB`
                  : item.ram
                    ? `${item.ram}`
                    : "8GB";
                const storageText = item.ssd_gb
                  ? `SSD ${item.ssd_gb}GB`
                  : item.hdd_gb
                    ? `HDD ${item.hdd_gb}GB`
                    : item.ssd
                      ? `SSD ${item.ssd}`
                      : "SSD 512GB";
                const stock =
                  item.stock_quantity !== undefined ? item.stock_quantity : 10;
                const inStock = stock > 0;

                return (
                  <div
                    key={productId}
                    className="bg-white rounded-lg shadow-sm hover:shadow-xl transition-shadow duration-300 flex flex-col overflow-hidden border border-gray-100 group relative"
                  >
                    <Link
                      to={`/product/${productId}`}
                      className="p-3 flex-1 block"
                    >
                      <div className="bg-white flex justify-center items-center h-40 mb-3 relative">
                        <img
                          src={productImage}
                          alt={item.name}
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src =
                              "https://via.placeholder.com/300x200?text=Laptop";
                          }}
                          className="max-h-full object-contain transition-transform group-hover:scale-105 absolute inset-0 w-full h-full"
                        />
                      </div>
                      <div className="text-left">
                        <h3 className="text-sm md:text-base font-semibold text-gray-800 line-clamp-2 hover:text-red-600 h-[40px] md:h-[48px]">
                          {item.name}
                        </h3>
                        <div className="mt-2 text-[11px] md:text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded inline-block mb-2">
                          RAM {ramText} | {storageText}
                        </div>
                        <p className="text-red-600 font-bold text-base md:text-lg">
                          {productPrice.toLocaleString("vi-VN")} ₫
                        </p>
                      </div>
                    </Link>
                    <div className="p-3 pt-0 mt-auto">
                      <button
                        onClick={() => addToCart(item)}
                        disabled={!inStock}
                        className={`w-full font-medium py-1.5 rounded transition-colors text-sm uppercase ${inStock ? "border border-red-600 text-red-600 hover:bg-red-600 hover:text-white" : "bg-gray-200 text-gray-500 cursor-not-allowed"}`}
                      >
                        {inStock ? "Thêm vào giỏ" : "Hết hàng"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
