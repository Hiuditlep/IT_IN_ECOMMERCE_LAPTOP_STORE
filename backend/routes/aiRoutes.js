const express = require("express");
const router = express.Router();
const gemini = require("../services/gemini");
const { extractIntent, searchCatalog } = require("../services/catalogSearch");

const ADVICE_SCHEMA = {
  type: "OBJECT",
  properties: {
    intro: { type: "STRING" },
    recommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: { product_id: { type: "INTEGER" }, reason: { type: "STRING" } },
        required: ["product_id", "reason"],
      },
    },
    follow_up: { type: "STRING" },
  },
  required: ["intro", "recommendations", "follow_up"],
};

function validateQuery(value) {
  return typeof value === "string" && value.trim().length >= 2 && value.trim().length <= 500;
}

router.post("/search", async (req, res) => {
  const query = req.body?.query;
  if (!validateQuery(query)) return res.status(400).json({ message: "Câu tìm kiếm phải dài 2–500 ký tự" });
  try {
    const { intent, aiAvailable } = await extractIntent(query.trim());
    const result = await searchCatalog(query.trim(), intent, aiAvailable);
    res.json({ ...result, intent, aiAvailable });
  } catch (error) {
    console.error("AI search lỗi:", error);
    res.status(500).json({ message: "Không thể tìm sản phẩm lúc này" });
  }
});

router.post("/assistant", async (req, res) => {
  const message = req.body?.message;
  if (!validateQuery(message)) return res.status(400).json({ message: "Tin nhắn phải dài 2–500 ký tự" });
  const history = Array.isArray(req.body?.history) ? req.body.history.slice(-6).filter(
    (item) => ["user", "assistant"].includes(item?.role) && typeof item.content === "string",
  ).map((item) => ({ role: item.role, content: item.content.slice(0, 500) })) : [];
  try {
    const { intent, aiAvailable } = await extractIntent(message.trim(), history);
    const { products, mode } = await searchCatalog(message.trim(), intent, aiAvailable);
    const candidates = products.slice(0, 5);
    if (!candidates.length) {
      return res.json({ intro: "Mình chưa tìm được laptop đáp ứng yêu cầu này trong danh mục hiện tại.",
        recommendations: [], followUp: "Bạn muốn nới mức giá hoặc thông số nào?", mode, intent });
    }

    if (!aiAvailable) {
      return res.json({ intro: "Mình tìm được các mẫu sau trong danh mục. Gemini đang không khả dụng nên chưa thể phân tích thêm.",
        recommendations: candidates.slice(0, 3).map((product) => ({ product, reason: "Phù hợp với kết quả tìm kiếm hiện tại." })),
        followUp: "Bạn có thể nói rõ ngân sách và mục đích sử dụng không?", mode, intent });
    }

    try {
      const prompt = `Bạn là trợ lý chọn laptop. Chỉ dùng danh sách sản phẩm JSON được cung cấp.
Không tự thêm sản phẩm, giá, tồn kho hoặc thông số không có trong JSON. Chỉ đề xuất ID trong danh sách.
Trả lời ngắn gọn bằng tiếng Việt. intro tóm tắt nhu cầu, mỗi reason nêu 1-2 điểm phù hợp thực có trong dữ liệu.
Không nói giá bằng chữ; giao diện sẽ hiển thị giá trực tiếp từ database. Nếu dữ liệu thiếu, nói chưa rõ.
Tối đa 3 gợi ý. follow_up là một câu hỏi ngắn để tư vấn tiếp.`;
      const data = await gemini.generateJson(prompt, JSON.stringify({ message, history, intent,
        products: candidates.map(({ id, name, brand, category, price_vnd, stock_quantity, cpu, gpu, ram_gb, ssd_gb, weight_kg, battery_wh, refresh_rate_hz }) =>
          ({ id, name, brand, category, price_vnd, stock_quantity, cpu, gpu, ram_gb, ssd_gb, weight_kg, battery_wh, refresh_rate_hz })) }), ADVICE_SCHEMA);
      const byId = new Map(candidates.map((product) => [Number(product.id), product]));
      const recommendations = (Array.isArray(data.recommendations) ? data.recommendations : [])
        .slice(0, 3).map((item) => ({ product: byId.get(Number(item.product_id)), reason: String(item.reason || "").slice(0, 300) }))
        .filter((item) => item.product);
      res.json({ intro: String(data.intro || "Đây là các mẫu phù hợp.").slice(0, 500),
        recommendations: recommendations.length ? recommendations : candidates.slice(0, 3).map((product) => ({ product, reason: "Mẫu phù hợp trong danh mục." })),
        followUp: String(data.follow_up || "Bạn muốn ưu tiên tiêu chí nào?").slice(0, 250), mode, intent });
    } catch (error) {
      console.warn("Gemini tư vấn không khả dụng:", error.message);
      res.json({ intro: "Mình tìm được các laptop sau từ dữ liệu cửa hàng.",
        recommendations: candidates.slice(0, 3).map((product) => ({ product, reason: "Phù hợp với yêu cầu tìm kiếm." })),
        followUp: "Bạn muốn ưu tiên giá, hiệu năng hay trọng lượng?", mode, intent });
    }
  } catch (error) {
    console.error("Shopping assistant lỗi:", error);
    res.status(500).json({ message: "Trợ lý đang không khả dụng" });
  }
});

module.exports = router;
