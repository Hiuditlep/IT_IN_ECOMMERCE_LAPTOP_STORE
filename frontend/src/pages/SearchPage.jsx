import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";

export default function SearchPage({ addToCart }) {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const [result, setResult] = useState({ products: [], mode: null, intent: {} });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!query.trim()) return;
    const controller = new AbortController();
    setLoading(true);
    setError("");
    fetch("http://localhost:5000/api/ai/search", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }), signal: controller.signal,
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Không tìm kiếm được lúc này");
      return data;
    }).then(setResult).catch((cause) => {
      if (cause.name !== "AbortError") setError(cause.message);
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [query]);

  const { products, mode, intent } = result;
  return <div className="w-full pb-12">
    <div className="bg-white rounded-xl border p-5 mb-5">
      <h1 className="text-xl font-bold text-gray-800">Kết quả cho “{query}”</h1>
      {mode && <p className="text-sm text-gray-500 mt-2">
        {mode === "semantic" ? "Tìm kiếm ngữ nghĩa bằng AI" : "Đang dùng tìm kiếm từ khóa"}
      </p>}
      {Object.entries(intent || {}).filter(([key]) => key !== "keywords").length > 0 &&
        <div className="flex flex-wrap gap-2 mt-3">
          {Object.entries(intent).filter(([key]) => key !== "keywords").map(([key, value]) =>
            <span key={key} className="px-2 py-1 rounded-full bg-red-50 text-red-700 text-xs">{key}: {String(value)}</span>)}
        </div>}
    </div>
    {loading && <p className="text-center py-16">Đang tìm laptop phù hợp...</p>}
    {error && <p role="alert" className="text-center py-16 text-red-600">{error}</p>}
    {!loading && !error && products.length === 0 &&
      <p className="text-center py-16 bg-white rounded-xl border text-gray-600">Chưa có laptop đáp ứng. Hãy thử nới ngân sách hoặc thông số.</p>}
    {!loading && !error && products.length > 0 &&
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
        {products.map((item) => <div key={item.id} className="bg-white rounded-lg shadow-sm border flex flex-col overflow-hidden">
          <Link to={`/product/${item.id}`} className="p-3 flex-1 block">
            <div className="h-40 flex items-center justify-center mb-3"><img src={item.image || "/Logo.png"} alt={item.name} className="max-h-full object-contain" /></div>
            <h2 className="font-semibold text-sm text-gray-800 line-clamp-2">{item.name}</h2>
            <p className="text-xs text-gray-600 mt-2">RAM {item.ram_gb ?? "?"}GB · SSD {item.ssd_gb ?? "?"}GB</p>
            <p className="font-bold text-red-600 mt-2">{Number(item.price_vnd || 0).toLocaleString("vi-VN")} ₫</p>
          </Link>
          <div className="p-3 pt-0"><button onClick={() => addToCart(item)} disabled={Number(item.stock_quantity) <= 0}
            className="w-full border border-red-600 text-red-600 rounded py-1.5 text-sm hover:bg-red-600 hover:text-white disabled:opacity-50">
            {Number(item.stock_quantity) > 0 ? "Thêm vào giỏ" : "Hết hàng"}
          </button></div>
        </div>)}
      </div>}
  </div>;
}
