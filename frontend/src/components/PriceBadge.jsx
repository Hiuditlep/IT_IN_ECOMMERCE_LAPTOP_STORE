// Hiển thị kết quả mô hình XGBoost dự đoán "giá hợp lý" (bảng price_predictions).
// Nếu sản phẩm chưa có dự đoán (chưa chạy ml/train_price_model.py) thì không hiện gì.

const STYLES = {
  good: { text: "Giá tốt", cls: "bg-green-100 text-green-700 border-green-200" },
  fair: { text: "Giá hợp lý", cls: "bg-gray-100 text-gray-600 border-gray-200" },
  high: { text: "Giá cao hơn TT", cls: "bg-orange-100 text-orange-700 border-orange-200" },
};

function diffPct(product) {
  const ratio = Number(product.price_ratio);
  return Number.isFinite(ratio) && ratio > 0 ? Math.round((ratio - 1) * 100) : null;
}

/** Nhãn nhỏ trên thẻ sản phẩm */
export function PriceBadge({ product }) {
  const style = STYLES[product?.price_label];
  if (!style) return null;
  const pct = diffPct(product);
  return (
    <span
      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded border ${style.cls}`}
      title="Dự đoán bởi mô hình XGBoost dựa trên thông số kỹ thuật"
    >
      {style.text}
      {pct !== null && product.price_label !== "fair" ? ` ${pct > 0 ? "+" : ""}${pct}%` : ""}
    </span>
  );
}

/** Khối giải thích trên trang chi tiết */
export function PriceInsight({ product }) {
  const style = STYLES[product?.price_label];
  const predicted = Number(product?.predicted_price_vnd);
  if (!style || !predicted) return null;
  const pct = diffPct(product);
  const message =
    product.price_label === "good"
      ? `Rẻ hơn khoảng ${Math.abs(pct)}% so với mức giá các máy cùng cấu hình.`
      : product.price_label === "high"
        ? `Cao hơn khoảng ${pct}% so với mức giá các máy cùng cấu hình.`
        : "Giá tương đương các máy có cấu hình tương tự.";

  return (
    <div className={`rounded-lg border p-4 mb-6 ${style.cls}`}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <span className="font-bold">🤖 Định giá AI: {style.text}</span>
        <span className="text-sm">
          Giá hợp lý dự đoán: <b>{Math.round(predicted).toLocaleString("vi-VN")} ₫</b>
        </span>
      </div>
      <p className="text-sm mt-1">{message}</p>
      <p className="text-[11px] mt-2 opacity-75">
        Mô hình XGBoost học từ ~1.000 laptop (CPU, GPU, RAM, SSD, màn hình, hãng…). Mang tính tham khảo.
      </p>
    </div>
  );
}
