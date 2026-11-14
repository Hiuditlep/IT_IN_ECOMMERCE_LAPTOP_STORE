// =====================================================================
// MINDMATCH ENGINE
// Chấm điểm mỗi laptop trên 5 trục nhu cầu (0–100) từ thông số thô,
// tính % phù hợp với hồ sơ người dùng, hiểu câu tìm kiếm tự nhiên
// và "dịch" thông số sang ngôn ngữ đời thường.
// Tất cả là heuristic dựa trên thông số – mang tính tham khảo.
// =====================================================================

export const AXES = [
  { key: "perf", label: "Hiệu năng", short: "CPU", hint: "Code, đa nhiệm, xử lý nặng" },
  { key: "gpu", label: "Đồ hoạ", short: "GPU", hint: "Game, dựng phim, AI" },
  { key: "move", label: "Di động", short: "Nhẹ", hint: "Mang theo mỗi ngày" },
  { key: "battery", label: "Thời lượng pin", short: "Pin", hint: "Làm việc xa ổ điện" },
  { key: "screen", label: "Màn hình", short: "Màn", hint: "Độ nét, tần số quét, tấm nền" },
];

export const BUDGET_MIN = 5; // triệu
export const BUDGET_MAX = 100; // 100 = không giới hạn

export const PRESETS = [
  {
    id: "gamer",
    icon: "🎮",
    label: "Game thủ",
    desc: "FPS cao, màn hình mượt",
    weights: { perf: 75, gpu: 100, move: 15, battery: 10, screen: 75 },
    budget: 40,
  },
  {
    id: "student",
    icon: "🎒",
    label: "Sinh viên",
    desc: "Nhẹ, pin trâu, giá mềm",
    weights: { perf: 40, gpu: 10, move: 90, battery: 80, screen: 30 },
    budget: 18,
  },
  {
    id: "dev",
    icon: "⌨️",
    label: "Lập trình viên",
    desc: "CPU khoẻ, RAM nhiều",
    weights: { perf: 95, gpu: 25, move: 55, battery: 60, screen: 50 },
    budget: 30,
  },
  {
    id: "creator",
    icon: "🎨",
    label: "Nhà sáng tạo",
    desc: "Màn đẹp, GPU dựng phim",
    weights: { perf: 85, gpu: 75, move: 30, battery: 30, screen: 95 },
    budget: 55,
  },
  {
    id: "nomad",
    icon: "✈️",
    label: "Hay di chuyển",
    desc: "Siêu nhẹ, cả ngày không sạc",
    weights: { perf: 50, gpu: 5, move: 100, battery: 95, screen: 40 },
    budget: 35,
  },
];

export const DEFAULT_PROFILE = {
  preset: "dev",
  weights: { ...PRESETS[2].weights },
  budget: PRESETS[2].budget,
};

const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const num = (v) => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
};

// ---------------------------------------------------------------------
// ĐIỂM TỪNG TRỤC
// ---------------------------------------------------------------------
function cpuScore(cpuRaw = "") {
  const c = cpuRaw.toLowerCase();
  let s = 45;
  if (/ultra 9|i9|ryzen 9|ryzen ai 9|ryzen ai max/.test(c)) s = 90;
  else if (/ultra 7|i7|ryzen 7|ryzen ai 7/.test(c)) s = 75;
  else if (/ultra 5|i5|ryzen 5|ryzen ai 5/.test(c)) s = 60;
  else if (/snapdragon x elite/.test(c)) s = 72;
  else if (/snapdragon/.test(c)) s = 58;
  else if (/core 7/.test(c)) s = 68;
  else if (/core 5/.test(c)) s = 55;
  else if (/i3|ryzen 3|core 3/.test(c)) s = 38;
  else if (/celeron|pentium|athlon|n100|n200|n\d{4}|mediatek|intel processor/.test(c)) s = 18;

  if (/\d{3,5}hx\b|\bhx\b/.test(c)) s += 7;
  else if (/\d{3,5}h[s]?\b/.test(c)) s += 2;
  else if (/\d{3,5}u\b/.test(c)) s -= 6;

  const intelGen = c.match(/i[3579]-(\d{2})\d{2,3}/);
  if (intelGen) s += (Number(intelGen[1]) - 12) * 2.5;
  const ryzenGen = c.match(/ryzen [3579] (\d)\d{3}/);
  if (ryzenGen) s += (Number(ryzenGen[1]) - 7) * 2.5;

  return clamp(s);
}

function ramScore(ram) {
  if (!ram) return 30;
  return clamp(((Math.log2(ram) - 2) / 4) * 100); // 4GB → 0, 64GB → 100
}

const RTX_TIER = { 50: 48, 60: 62, 70: 76, 80: 88, 90: 97 };
const RTX_SERIES = { 50: 4, 40: 0, 30: -10, 20: -18 };

function gpuScore(gpuRaw = "", vram) {
  const g = (gpuRaw || "").toLowerCase();
  let s = 15;
  const rtx = g.match(/rtx\s*(\d{2})(\d{2})\b/);
  if (rtx && RTX_TIER[Number(rtx[2])] !== undefined) {
    s = RTX_TIER[Number(rtx[2])] + (RTX_SERIES[Number(rtx[1])] ?? 0);
  } else if (/rtx|quadro/.test(g)) s = 62; // dòng workstation (RTX 2000 Ada, A1000...)
  else if (/rx\s*\d{4}/.test(g)) s = 55;
  else if (/gtx/.test(g)) s = 32;
  else if (/arc a\d|arc pro/.test(g)) s = 36;
  else if (/mx\s?\d/.test(g)) s = 24;
  else if (/radeon (8[89]0m|780m|890m)|arc\b/.test(g)) s = 24;
  else if (/radeon|iris|uhd|adreno|graphics|integrated/.test(g)) s = 14;
  const v = num(vram);
  if (v && v >= 12) s += 3;
  return clamp(s);
}

function moveScore(weight, screen) {
  const w = num(weight);
  let s = w ? ((3.2 - w) / 2.2) * 100 : 50; // 1.0kg → 100, 3.2kg → 0
  const sz = num(screen);
  if (sz && sz <= 14) s += 5;
  return clamp(s);
}

function batteryScore(wh, gpu, cpu) {
  const w = num(wh);
  let s = w ? ((w - 35) / 64) * 100 : 40;
  if (gpu >= 60) s -= 25; // GPU rời mạnh ngốn pin
  if (/hx\b|\d{3,5}hx/i.test(cpu || "")) s -= 10;
  if (/snapdragon|ultra [579] 2\d\dv|lunar/i.test(cpu || "")) s += 12;
  return clamp(s);
}

function parseRes(res) {
  const m = String(res || "").match(/(\d{3,4})\s*[x×*]\s*(\d{3,4})/);
  return m ? [Number(m[1]), Number(m[2])] : null;
}

function screenScore(p) {
  const r = parseRes(p.resolution);
  const mp = r ? (r[0] * r[1]) / 1e6 : 2.07;
  const resS = clamp(((mp - 1) / 7.3) * 100);
  const hz = num(p.refresh_rate_hz) || 60;
  const hzS = clamp(((hz - 60) / 180) * 100);
  const panel = (p.panel_type || "").toLowerCase();
  let bonus = 0;
  if (/oled|mini ?led/.test(panel)) bonus = 25;
  else if (/ips/.test(panel)) bonus = 6;
  return clamp(resS * 0.5 + hzS * 0.4 + bonus + 8);
}

export function scoreProduct(p) {
  const cpu = cpuScore(p.cpu);
  const ram = num(p.ram_gb);
  const gpu = gpuScore(p.gpu, p.gpu_vram_gb);
  return {
    perf: Math.round(clamp(cpu * 0.7 + ramScore(ram) * 0.3)),
    gpu: Math.round(gpu),
    move: Math.round(moveScore(p.weight_kg, p.screen_size_in)),
    battery: Math.round(batteryScore(p.battery_wh, gpu, p.cpu)),
    screen: Math.round(screenScore(p)),
  };
}

// ---------------------------------------------------------------------
// MỨC ĐỘ PHÙ HỢP
// ---------------------------------------------------------------------
export function matchScore(product, profile) {
  const { weights, budget } = profile;
  let wsum = 0;
  let acc = 0;
  for (const a of AXES) {
    const w = weights[a.key] || 0;
    wsum += w;
    acc += w * product.scores[a.key];
  }
  const base = wsum ? acc / wsum : 50;
  // Kéo giãn thang điểm để chênh lệch rõ hơn (đa số máy nằm 35–80)
  let m = clamp(((base - 20) / 70) * 100);
  if (budget < BUDGET_MAX) {
    const limit = budget * 1e6;
    if (product.price > limit) {
      const over = product.price / limit - 1;
      m *= clamp(1 - over * 2.5, 0, 1);
    }
  }
  return Math.round(m);
}

const LABEL_REASON = {
  perf: (p) => `CPU ${shortCpu(p.cpu)} + ${p.ram_gb || "?"}GB RAM`,
  gpu: (p) => `${shortGpu(p.gpu)} cho game & đồ hoạ`,
  move: (p) => (p.weight_kg ? `Chỉ ${Number(p.weight_kg)} kg` : "Thiết kế gọn"),
  battery: (p) => (p.battery_wh ? `Pin ${Number(p.battery_wh)} Wh` : "Pin ổn định"),
  screen: (p) =>
    `${p.refresh_rate_hz ? p.refresh_rate_hz + "Hz " : ""}${p.panel_type || ""} ${resLabel(p.resolution)}`.trim(),
};

/** Lý do máy hợp với người dùng: các trục có đóng góp lớn nhất */
export function matchReasons(product, profile, n = 2) {
  return AXES.map((a) => ({
    key: a.key,
    v: (profile.weights[a.key] || 0) * product.scores[a.key],
    s: product.scores[a.key],
  }))
    .filter((x) => x.s >= 55 && x.v > 0)
    .sort((a, b) => b.v - a.v)
    .slice(0, n)
    .map((x) => LABEL_REASON[x.key](product));
}

/** Điểm yếu đáng chú ý so với nhu cầu */
export function matchWarnings(product, profile) {
  const out = [];
  for (const a of AXES) {
    if ((profile.weights[a.key] || 0) >= 70 && product.scores[a.key] < 40) {
      out.push(`${a.label} chưa đáp ứng tốt nhu cầu của bạn`);
    }
  }
  if (profile.budget < BUDGET_MAX && product.price > profile.budget * 1e6) {
    out.push(`Vượt ngân sách ${formatShort(product.price - profile.budget * 1e6)}`);
  }
  return out;
}

/** Laptop có "DNA" cấu hình gần nhất */
export function dnaTwins(product, all, n = 4) {
  const d = (a, b) =>
    Math.sqrt(AXES.reduce((s, x) => s + (a.scores[x.key] - b.scores[x.key]) ** 2, 0));
  return all
    .filter((p) => p.id !== product.id)
    .map((p) => ({ p, dist: d(product, p) }))
    .sort((a, b) => a.dist - b.dist || a.p.price - b.p.price)
    .slice(0, n)
    .map(({ p, dist }) => ({ ...p, similarity: Math.round(clamp(100 - dist)) }));
}

// ---------------------------------------------------------------------
// HIỂU CÂU TÌM KIẾM TỰ NHIÊN (MindParse)
// vd: "gaming dưới 30tr 32gb rtx 4060", "asus mỏng nhẹ oled 14 inch"
// ---------------------------------------------------------------------
const CATEGORY_WORDS = [
  { re: /\b(gaming|game|chơi game|choi game)\b/, cat: "Gaming", label: "Gaming" },
  { re: /(văn phòng|van phong|sinh viên|sinh vien|học tập|hoc tap|phổ thông)/, cat: "General", label: "Phổ thông" },
  { re: /(doanh nhân|doanh nhan|business)/, cat: "Business", label: "Doanh nhân" },
  { re: /(ultrabook)/, cat: "Ultrabook", label: "Ultrabook" },
  { re: /(đồ hoạ|đồ họa|do hoa|creator|thiết kế|thiet ke)/, cat: "Creator", label: "Creator" },
];

const toMillion = (n, unit) => {
  const v = parseFloat(String(n).replace(",", "."));
  if (!unit || /tr|triệu|trieu|m/.test(unit)) return v * 1e6;
  return v;
};

export function parseQuery(raw, brands = []) {
  let q = ` ${String(raw || "").toLowerCase().trim()} `;
  const f = {};
  const chips = [];
  const eat = (re) => {
    q = q.replace(re, " ");
  };

  // Khoảng giá "20-30tr"
  let m = q.match(/(\d+(?:[.,]\d+)?)\s*(?:-|đến|den|tới|toi)\s*(\d+(?:[.,]\d+)?)\s*(tr|triệu|trieu|m)\b/);
  if (m) {
    f.minPrice = toMillion(m[1], "tr");
    f.maxPrice = toMillion(m[2], "tr");
    chips.push(`${m[1]}–${m[2]} triệu`);
    eat(m[0]);
  }
  m = q.match(/(dưới|duoi|<|tối đa|toi da|max|không quá|khong qua)\s*(\d+(?:[.,]\d+)?)\s*(tr|triệu|trieu|m)?\b/);
  if (m) {
    f.maxPrice = toMillion(m[2], "tr");
    chips.push(`≤ ${m[2]} triệu`);
    eat(m[0]);
  }
  m = q.match(/(trên|tren|>|từ|tu|ít nhất|min)\s*(\d+(?:[.,]\d+)?)\s*(tr|triệu|trieu|m)\b/);
  if (m) {
    f.minPrice = toMillion(m[2], "tr");
    chips.push(`≥ ${m[2]} triệu`);
    eat(m[0]);
  }
  m = q.match(/\b(\d+(?:[.,]\d+)?)\s*(tr|triệu|trieu)\b/);
  if (m && !f.maxPrice) {
    f.maxPrice = toMillion(m[1], "tr") * 1.1;
    chips.push(`~ ${m[1]} triệu`);
    eat(m[0]);
  }

  // Dung lượng ổ cứng
  m = q.match(/\b(\d)\s*tb\b/);
  if (m) {
    f.minSsd = Number(m[1]) * 1024;
    chips.push(`SSD ≥ ${m[1]}TB`);
    eat(m[0]);
  }
  m = q.match(/\b(256|512|1024|2048)\s*gb?\s*(ssd)?\b/);
  if (m && (m[2] || Number(m[1]) >= 256)) {
    f.minSsd = Number(m[1]);
    chips.push(`SSD ≥ ${m[1]}GB`);
    eat(m[0]);
  }
  q = q.replace(/\bssd\b/, " ");

  // RAM
  m = q.match(/\b(?:ram\s*)?(4|8|12|16|24|32|48|64|96|128)\s*gb?\s*(?:ram)?\b/);
  if (m && /gb|ram/.test(m[0])) {
    f.minRam = Number(m[1]);
    chips.push(`RAM ≥ ${m[1]}GB`);
    eat(m[0]);
  }

  // Tần số quét / màn hình
  m = q.match(/\b(\d{2,3})\s*hz\b/);
  if (m) {
    f.minHz = Number(m[1]);
    chips.push(`≥ ${m[1]}Hz`);
    eat(m[0]);
  }
  m = q.match(/\b(1[0-8](?:[.,]\d)?)\s*(inch|in|")/);
  if (m) {
    f.screen = parseFloat(m[1].replace(",", "."));
    chips.push(`~ ${m[1]}"`);
    eat(m[0]);
  }
  if (/\boled\b/.test(q)) {
    f.panel = "oled";
    chips.push("OLED");
    eat(/\boled\b/);
  }
  if (/mini ?led/.test(q)) {
    f.panel = "mini led";
    chips.push("Mini LED");
    eat(/mini ?led/);
  }
  if (/\b4k\b/.test(q)) {
    f.minPixels = 3840 * 2160 * 0.9;
    chips.push("4K");
    eat(/\b4k\b/);
  }
  const LIGHT = /(mỏng nhẹ|mong nhe|siêu nhẹ|sieu nhe|(?<=\s)(nhẹ|nhe|mỏng)(?=\s))/;
  if (LIGHT.test(q)) {
    f.maxWeight = 1.6;
    chips.push("≤ 1.6 kg");
    eat(LIGHT);
  }
  if (/(pin trâu|pin trau|pin lâu|pin lau)/.test(q)) {
    f.minBattery = 70;
    chips.push("Pin ≥ 70Wh");
    eat(/(pin trâu|pin trau|pin lâu|pin lau)/);
  }

  // Nhu cầu không ứng với phân khúc cụ thể → chỉ ghi nhận, không lọc cứng
  const USE = /(lập trình|lap trinh|coding|code|developer|dev)/;
  if (USE.test(q)) {
    chips.push("Lập trình");
    eat(USE);
  }

  for (const c of CATEGORY_WORDS) {
    if (c.re.test(q)) {
      f.category = c.cat;
      chips.push(c.label);
      eat(c.re);
      break;
    }
  }

  for (const b of brands) {
    const re = new RegExp(`\\b${b.toLowerCase()}\\b`);
    if (re.test(q)) {
      f.brand = b;
      chips.push(b);
      eat(re);
      break;
    }
  }

  // Bỏ từ nối vô nghĩa
  q = q.replace(
    /(?<=\s)(laptop|máy|may|cho|có|co|và|va|với|voi|giá|gia|tầm|tam|khoảng|khoang|cần|can|tìm|tim|mua|tính|tinh)(?=\s)/g,
    " ",
  );
  const terms = q
    .split(/\s+/)
    .map((t) => t.trim())
    .filter((t) => t.length >= 2);
  terms.forEach((t) => chips.push(`"${t}"`));

  return { filters: f, terms, chips };
}

export function applyQuery(products, parsed) {
  const { filters: f, terms } = parsed;
  return products.filter((p) => {
    if (f.maxPrice && p.price > f.maxPrice) return false;
    if (f.minPrice && p.price < f.minPrice) return false;
    if (f.minRam && (Number(p.ram_gb) || 0) < f.minRam) return false;
    if (f.minSsd && (Number(p.ssd_gb) || 0) < f.minSsd) return false;
    if (f.minHz && (Number(p.refresh_rate_hz) || 60) < f.minHz) return false;
    if (f.screen && Math.abs((Number(p.screen_size_in) || 0) - f.screen) > 0.6) return false;
    if (f.panel && !(p.panel_type || "").toLowerCase().includes(f.panel)) return false;
    if (f.minPixels) {
      const r = parseRes(p.resolution);
      if (!r || r[0] * r[1] < f.minPixels) return false;
    }
    if (f.maxWeight && (!p.weight_kg || Number(p.weight_kg) > f.maxWeight)) return false;
    if (f.minBattery && (Number(p.battery_wh) || 0) < f.minBattery) return false;
    if (f.category && p.category !== f.category) return false;
    if (f.brand && p.brand !== f.brand) return false;
    if (terms.length) {
      const hay = `${p.name} ${p.cpu} ${p.gpu} ${p.brand} ${p.category}`.toLowerCase();
      if (!terms.every((t) => hay.includes(t))) return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------
// THÔNG SỐ → ĐỜI THỰC
// ---------------------------------------------------------------------
export function realLife(p) {
  const out = [];
  const w = num(p.weight_kg);
  if (w) {
    const bottles = (w / 0.5).toFixed(1).replace(".0", "");
    out.push({
      icon: "🎒",
      title: `${w} kg`,
      text: `≈ ${bottles} chai nước 500ml${w <= 1.4 ? ", xách cả ngày" : w >= 2.4 ? ", hợp để bàn" : ""}`,
    });
  }
  const hz = num(p.refresh_rate_hz);
  if (hz) {
    out.push({
      icon: "⚡",
      title: `${hz} Hz`,
      text:
        hz > 60
          ? `Mượt gấp ${(hz / 60).toFixed(1).replace(".0", "")} lần màn 60Hz`
          : "Tiêu chuẩn, đủ học và làm việc",
    });
  }
  const ram = num(p.ram_gb);
  if (ram) {
    const t =
      ram <= 8
        ? "Đủ cho văn phòng, học online"
        : ram <= 16
          ? "Thoải mái đa nhiệm, IDE, Photoshop"
          : ram <= 32
            ? "Máy ảo, dựng video 4K, AI nhỏ"
            : "Máy trạm: render 3D, dữ liệu lớn";
    out.push({ icon: "🧠", title: `${ram} GB RAM`, text: t });
  }
  const g = p.scores?.gpu ?? 15;
  out.push({
    icon: "🎮",
    title: shortGpu(p.gpu),
    text:
      g >= 85
        ? "Game AAA max setting, 1440p"
        : g >= 70
          ? "Game AAA mức cao, 1080p"
          : g >= 55
            ? "Esports mượt, AAA mức trung bình"
            : g >= 30
              ? "Game nhẹ, esports cấu hình thấp"
              : "Không dành cho game nặng",
  });
  const wh = num(p.battery_wh);
  if (wh) {
    const watts = g >= 60 ? 16 : /u\b|\d{3}v\b|snapdragon/i.test(p.cpu || "") ? 6 : 9;
    const hours = Math.max(2, Math.round(wh / watts));
    out.push({
      icon: "🔋",
      title: `${wh} Wh`,
      text: `~${hours} giờ làm việc nhẹ (ước tính)`,
    });
  }
  const ssd = num(p.ssd_gb);
  if (ssd) {
    out.push({
      icon: "💾",
      title: ssd >= 1024 ? `${(ssd / 1024).toFixed(ssd % 1024 ? 1 : 0)} TB SSD` : `${ssd} GB SSD`,
      text: `≈ ${Math.max(1, Math.floor(ssd / 120))} game AAA`,
    });
  }
  return out;
}

// ---------------------------------------------------------------------
// TIỆN ÍCH HIỂN THỊ
// ---------------------------------------------------------------------
export function formatVND(n) {
  return `${Math.round(Number(n) || 0).toLocaleString("vi-VN")} ₫`;
}

export function formatShort(n) {
  const v = Number(n) || 0;
  if (v >= 1e6) return `${(v / 1e6).toFixed(v >= 1e8 ? 0 : 1).replace(".0", "").replace(".", ",")} tr`;
  return `${Math.round(v / 1000)}k`;
}

export function shortCpu(cpu = "") {
  return (cpu || "—")
    .replace(/intel\s*(®|\(r\))?\s*/i, "")
    .replace(/amd\s*/i, "")
    .replace(/core\s*(?=ultra|i\d)/i, "")
    .replace(/processor/i, "")
    .trim();
}

export function shortGpu(gpu = "") {
  if (!gpu) return "Đồ hoạ tích hợp";
  const rtx = gpu.match(/rtx\s*\w*\s*\d{3,4}\w*/i);
  if (rtx) return rtx[0].replace(/\s+/g, " ").toUpperCase().replace(/^RTX\s*/, "RTX ");
  return gpu
    .replace(/nvidia\s*/i, "")
    .replace(/geforce\s*/i, "")
    .replace(/\d+\s*gb/i, "")
    .trim();
}

export function resLabel(res) {
  const r = parseRes(res);
  if (!r) return "";
  const [w, h] = r;
  if (w >= 3800) return "4K";
  if (w >= 2800) return "3K";
  if (w >= 2500) return "2.5K";
  if (w >= 1900 && h >= 1150) return "FHD+";
  if (w >= 1900) return "FHD";
  return `${w}×${h}`;
}

export function storageLabel(p) {
  const s = num(p.ssd_gb);
  if (s) return s >= 1024 ? `${+(s / 1024).toFixed(1)}TB` : `${s}GB`;
  const h = num(p.hdd_gb);
  return h ? `HDD ${h}GB` : "—";
}

export const CATEGORY_VI = {
  Gaming: "Gaming",
  General: "Phổ thông",
  Business: "Doanh nhân",
  Ultrabook: "Ultrabook",
  Creator: "Creator",
};

export function isRealImage(url) {
  return !!url && !/placehold\.co|via\.placeholder/.test(url);
}
