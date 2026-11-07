const gemini = require("./gemini");

const CATEGORIES = ["Gaming", "General", "Business", "Ultrabook", "Creator"];
const BRANDS = ["Acer", "ASUS", "Dell", "HP", "Lenovo", "MSI", "Razer", "Microsoft", "Huawei", "Infinix", "Dynabook"];

const INTENT_SCHEMA = {
  type: "OBJECT",
  properties: {
    keywords: { type: "STRING", description: "Short English laptop-related search phrase, or empty string." },
    brand: { type: "STRING" },
    category: { type: "STRING" },
    min_price_vnd: { type: "INTEGER" },
    max_price_vnd: { type: "INTEGER" },
    min_ram_gb: { type: "INTEGER" },
    min_ssd_gb: { type: "INTEGER" },
    max_weight_kg: { type: "NUMBER" },
    min_refresh_rate_hz: { type: "INTEGER" },
    dedicated_gpu: { type: "BOOLEAN" },
  },
  required: ["keywords"],
};

const INTENT_PROMPT = `Bạn là bộ trích xuất điều kiện mua laptop từ câu tiếng Việt hoặc tiếng Anh.
Chỉ lấy điều kiện được người dùng nói rõ; không tự suy diễn CPU, RAM, GPU, trọng lượng hay ngân sách từ nghề/ngành học.
Giá phải là VND: "15 triệu" = 15000000. Không đổi ngoại tệ khi không có tỷ giá.
category chỉ nhận: ${CATEGORIES.join(", ")}. brand chỉ nhận: ${BRANDS.join(", ")}.
keywords là cụm tiếng Anh ngắn mô tả nhu cầu sử dụng để tìm tương đồng với mô tả sản phẩm tiếng Anh.
Ví dụ: "Laptop ASUS dưới 20 triệu, RAM ít nhất 16GB" -> {"keywords":"ASUS laptop","brand":"ASUS","max_price_vnd":20000000,"min_ram_gb":16}.
Ví dụ: "Máy nhẹ để đi học, pin tốt" -> {"keywords":"lightweight portable laptop with good battery"}.
Không đưa điều kiện không được nêu rõ vào JSON.`;

function positiveNumber(value, max) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 && number <= max ? number : undefined;
}

function normalizeIntent(raw, query) {
  const result = { keywords: String(raw?.keywords || query).trim().slice(0, 150) };
  const brand = BRANDS.find((item) => item.toLowerCase() === String(raw?.brand || "").toLowerCase());
  const category = CATEGORIES.find((item) => item.toLowerCase() === String(raw?.category || "").toLowerCase());
  if (brand) result.brand = brand;
  if (category) result.category = category;
  for (const [key, max] of Object.entries({
    min_price_vnd: 1000000000,
    max_price_vnd: 1000000000,
    min_ram_gb: 1024,
    min_ssd_gb: 100000,
    max_weight_kg: 20,
    min_refresh_rate_hz: 1000,
  })) {
    const value = positiveNumber(raw?.[key], max);
    if (value !== undefined) result[key] = value;
  }
  if (raw?.dedicated_gpu === true) result.dedicated_gpu = true;
  return result;
}

function fallbackIntent(query) {
  const plain = query.toLowerCase().normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d");
  const raw = {};

  const brand = BRANDS.find((name) => new RegExp(`\\b${name.toLowerCase()}\\b`).test(plain));
  if (brand) raw.brand = brand;

  const budget = plain.match(/(?:duoi|toi da|khong qua|khong hon|under|below)\s*(\d+(?:[.,]\d+)?)\s*(?:trieu|tr)\b/);
  if (budget) raw.max_price_vnd = Math.round(Number(budget[1].replace(",", ".")) * 1_000_000);

  const ram = plain.match(/\bram\s*(?:it nhat|toi thieu|tu)?\s*(\d+)\s*gb\b/)
    || plain.match(/(?:it nhat|toi thieu)\s*(\d+)\s*gb\s*ram\b/);
  if (ram) raw.min_ram_gb = Number(ram[1]);

  const ssd = plain.match(/\bssd\s*(?:it nhat|toi thieu|tu)?\s*(\d+)\s*gb\b/);
  if (ssd) raw.min_ssd_gb = Number(ssd[1]);

  return normalizeIntent(raw, query);
}

async function extractIntent(query, history = []) {
  if (!gemini.isConfigured()) return { intent: fallbackIntent(query), aiAvailable: false };
  try {
    const context = history.slice(-4).map((item) => `${item.role}: ${String(item.content).slice(0, 300)}`).join("\n");
    const raw = await gemini.generateJson(INTENT_PROMPT, `Ngữ cảnh trước đó:\n${context}\nYêu cầu hiện tại: ${query}`, INTENT_SCHEMA);
    return { intent: normalizeIntent(raw, query), aiAvailable: true };
  } catch (error) {
    console.warn("Gemini intent không khả dụng:", error.message);
    return { intent: fallbackIntent(query), aiAvailable: false };
  }
}

function filterSql(intent, params) {
  const conditions = ["p.stock_quantity > 0"];
  const add = (value, fragment) => {
    params.push(value);
    conditions.push(fragment.replace("?", `$${params.length}`));
  };
  if (intent.brand) add(intent.brand, "LOWER(b.brand_name) = LOWER(?)");
  if (intent.category) add(intent.category, "LOWER(c.category_name) = LOWER(?)");
  if (intent.min_price_vnd) add(intent.min_price_vnd, "p.price_vnd >= ?");
  if (intent.max_price_vnd) add(intent.max_price_vnd, "p.price_vnd <= ?");
  if (intent.min_ram_gb) add(intent.min_ram_gb, "p.ram_gb >= ?");
  if (intent.min_ssd_gb) add(intent.min_ssd_gb, "p.ssd_gb >= ?");
  if (intent.max_weight_kg) add(intent.max_weight_kg, "p.weight_kg <= ?");
  if (intent.min_refresh_rate_hz) add(intent.min_refresh_rate_hz, "p.refresh_rate_hz >= ?");
  if (intent.dedicated_gpu) conditions.push("(p.gpu ILIKE '%NVIDIA%' OR p.gpu ILIKE '%Radeon RX%' OR p.gpu ILIKE '%Arc%')");
  return conditions.join(" AND ");
}

const PRODUCT_COLUMNS = `p.product_id AS id, p.product_id, p.name, p.model,
  p.price_vnd::float8 AS price, p.price_vnd::float8 AS price_vnd,
  p.image_url AS image, p.image_url, p.stock_quantity, p.cpu, p.gpu,
  p.ram_gb, p.ssd_gb, p.screen_size_in, p.resolution, p.refresh_rate_hz,
  p.weight_kg, p.battery_wh, p.description, b.brand_name AS brand,
  c.category_name AS category`;
const JOINS = `FROM products p
  LEFT JOIN brands b ON p.brand_id = b.brand_id
  LEFT JOIN categories c ON p.category_id = c.category_id`;

async function searchCatalog(query, intent, useSemantic = true) {
  const pool = require("../db");
  const params = [];
  const filters = filterSql(intent, params);
  if (useSemantic && gemini.isConfigured()) {
    try {
      const embedding = await gemini.embedText(intent.keywords || query, "RETRIEVAL_QUERY");
      const vector = `[${embedding.join(",")}]`;
      const vectorParams = [...params, vector];
      const result = await pool.query(`SELECT ${PRODUCT_COLUMNS},
        1 - (e.embedding <=> $${vectorParams.length}::vector) AS similarity
        ${JOINS}
        JOIN product_embeddings e ON e.product_id = p.product_id AND e.model = '${gemini.EMBEDDING_MODEL}'
        WHERE ${filters}
        ORDER BY e.embedding <=> $${vectorParams.length}::vector LIMIT 20`, vectorParams);
      if (result.rows.length) return { products: result.rows, mode: "semantic" };
    } catch (error) {
      console.warn("Semantic search không khả dụng:", error.message);
    }
  }

  const keyword = (intent.keywords || query).trim();
  const keywordParams = [...params];
  const terms = [...new Set(keyword.split(/[^\p{L}\p{N}]+/u).filter((term) => term.length >= 3))].slice(0, 6);
  const textClauses = terms.map((term) => {
    keywordParams.push(`%${term}%`);
    return `(p.name ILIKE $${keywordParams.length} OR p.search_text ILIKE $${keywordParams.length})`;
  });
  const textFilter = textClauses.length ? `AND (${textClauses.join(" OR ")})` : "";
  let result = await pool.query(`SELECT ${PRODUCT_COLUMNS} ${JOINS}
    WHERE ${filters} ${textFilter} ORDER BY p.product_id ASC LIMIT 20`, keywordParams);
  if (!result.rows.length && params.length) {
    result = await pool.query(`SELECT ${PRODUCT_COLUMNS} ${JOINS}
      WHERE ${filters} ORDER BY p.product_id ASC LIMIT 20`, params);
  }
  return { products: result.rows, mode: "keyword" };
}

module.exports = { extractIntent, searchCatalog, normalizeIntent, fallbackIntent, filterSql, PRODUCT_COLUMNS, JOINS };
