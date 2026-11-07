import { useState } from "react";
import { Link } from "react-router-dom";

export default function ShoppingAssistant({ addToCart }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [busy, setBusy] = useState(false);

  async function send(event) {
    event.preventDefault();
    const message = input.trim();
    if (busy || message.length < 2) return;
    const history = messages.map(({ role, content }) => ({ role, content })).slice(-6);
    setMessages((previous) => [...previous, { role: "user", content: message }]);
    setInput("");
    setBusy(true);
    try {
      const response = await fetch("http://localhost:5000/api/ai/assistant", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Trợ lý chưa trả lời được");
      setMessages((previous) => [...previous, { role: "assistant", content: data.intro,
        recommendations: data.recommendations, followUp: data.followUp, mode: data.mode }]);
    } catch (error) {
      setMessages((previous) => [...previous, { role: "assistant", content: error.message }]);
    } finally { setBusy(false); }
  }

  return <div className="fixed bottom-4 right-4 z-50">
    {open && <section aria-label="Trợ lý mua laptop" className="w-[min(92vw,390px)] h-[min(75vh,600px)] bg-white rounded-xl shadow-2xl border flex flex-col mb-3 overflow-hidden">
      <header className="bg-red-600 text-white px-4 py-3 flex justify-between items-center">
        <div><h2 className="font-bold">Trợ lý chọn laptop</h2><p className="text-xs opacity-90">Gợi ý từ sản phẩm trong cửa hàng</p></div>
        <button aria-label="Đóng trợ lý" onClick={() => setOpen(false)} className="text-xl px-2">×</button>
      </header>
      <div className="flex-1 overflow-y-auto p-3 space-y-3 text-sm" aria-live="polite">
        {messages.length === 0 && <p className="text-gray-600 bg-gray-50 rounded p-3">Bạn cần laptop để học, chơi game hay làm đồ họa? Hãy cho mình biết ngân sách nhé.</p>}
        {messages.map((entry, index) => <div key={index} className={entry.role === "user" ? "ml-10 bg-red-50 rounded p-3" : "mr-5 bg-gray-50 rounded p-3"}>
          <p className="whitespace-pre-wrap">{entry.content}</p>
          {entry.recommendations?.map(({ product, reason }) => <div key={product.id} className="bg-white border rounded p-2 mt-2">
            <Link to={`/product/${product.id}`} onClick={() => setOpen(false)} className="font-semibold text-red-700 hover:underline">{product.name}</Link>
            <p className="text-red-600 font-bold">{Number(product.price_vnd || 0).toLocaleString("vi-VN")} ₫</p>
            <p className="text-gray-600 mt-1">{reason}</p>
            <button onClick={() => addToCart(product)} disabled={Number(product.stock_quantity) <= 0} className="text-red-700 underline mt-1 disabled:opacity-50">Thêm vào giỏ</button>
          </div>)}
          {entry.followUp && <p className="mt-2 text-gray-600">{entry.followUp}</p>}
          {entry.mode === "keyword" && <p className="mt-2 text-xs text-gray-500">Đang dùng kết quả tìm từ khóa.</p>}
        </div>)}
        {busy && <p className="text-gray-500">Đang tìm và phân tích sản phẩm...</p>}
      </div>
      <form onSubmit={send} className="p-3 border-t flex gap-2">
        <input value={input} onChange={(event) => setInput(event.target.value)} maxLength={500}
          aria-label="Nhắn tin cho trợ lý" placeholder="VD: laptop dưới 20 triệu..." className="flex-1 min-w-0 border rounded-lg px-3 py-2 text-sm" />
        <button disabled={busy || input.trim().length < 2} className="bg-red-600 text-white px-3 rounded-lg disabled:opacity-50">Gửi</button>
      </form>
    </section>}
    <button onClick={() => setOpen((value) => !value)} aria-expanded={open} className="ml-auto block rounded-full bg-red-600 text-white shadow-lg px-5 py-3 font-semibold">
      {open ? "Đóng" : "Tư vấn AI"}
    </button>
  </div>;
}
