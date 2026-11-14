import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useStore } from "../store";
import { AXES, BUDGET_MAX, BUDGET_MIN, CATEGORY_VI, PRESETS, formatVND, matchReasons } from "../lib/mind";
import ProductCard from "../components/ProductCard";
import LaptopVisual from "../components/LaptopVisual";
import MatchRing from "../components/MatchRing";
import SpecRadar from "../components/SpecRadar";
import LoadMore from "../components/LoadMore";
import { CartIcon } from "../components/Icons";

const PAGE = 24;

const SORTS = [
  { id: "match", label: "Hợp nhất" },
  { id: "price-asc", label: "Giá tăng" },
  { id: "price-desc", label: "Giá giảm" },
  { id: "light", label: "Nhẹ nhất" },
  { id: "perf", label: "Mạnh nhất" },
];

const pill = (active) =>
  `shrink-0 rounded-full px-4 py-2 text-sm font-medium transition ${
    active ? "bg-ink text-paper" : "bg-surface text-ink/65 ring-1 ring-ink/10 hover:ring-ink/30"
  }`;

// ---------------------------------------------------------------------
// HERO: chọn chân dung + chỉnh nhu cầu
// ---------------------------------------------------------------------
function Hero() {
  const { profile, setProfile, ranked, products } = useStore();
  const top = ranked[0];
  const setWeight = (key, v) => setProfile((p) => ({ ...p, preset: "custom", weights: { ...p.weights, [key]: v } }));
  const budgetPct = ((profile.budget - BUDGET_MIN) / (BUDGET_MAX - BUDGET_MIN)) * 100;

  return (
    <section className="mx-auto max-w-7xl px-4 pt-6 md:px-8 md:pt-10">
      <div className="relative overflow-hidden rounded-[32px] border border-ink/[.07] bg-surface">
        <div className="dot-grid absolute inset-0" />
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-mind-500/15 blur-[100px]" />
        <div className="absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-mind-400/10 blur-[100px]" />

        <div className="relative grid gap-10 p-6 md:p-12 lg:grid-cols-[1fr_1fr] lg:gap-14">
          <div className="flex flex-col justify-center">
            <p className="eyebrow">MindMatch</p>
            <h1 className="mt-4 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Đừng lọc.
              <span className="block text-accent">Hãy nói bạn là ai.</span>
            </h1>

            <div className="mt-8 flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setProfile({ preset: p.id, weights: { ...p.weights }, budget: p.budget })}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    profile.preset === p.id ? "bg-mind-600 text-white" : "bg-ink/[.05] text-ink/75 hover:bg-ink/10"
                  }`}
                >
                  <span aria-hidden="true">{p.icon}</span>
                  {p.label}
                </button>
              ))}
            </div>

            <p className="mt-8 font-mono text-xs text-ink/45">
              {products.length ? `${products.length.toLocaleString("vi-VN")} máy · xếp hạng theo bạn` : "Đang tải…"}
            </p>
          </div>

          <div className="grid items-center gap-6 rounded-3xl bg-paper/70 p-5 ring-1 ring-ink/[.06] sm:grid-cols-[170px_1fr] md:p-7">
            <div className="mx-auto w-full max-w-[180px]">
              <SpecRadar size={180} need={profile.weights} scores={top?.scores} />
            </div>
            <div className="space-y-4">
              {AXES.map((a) => (
                <label key={a.key} className="block">
                  <div className="mb-1.5 flex justify-between text-sm">
                    <span className="font-medium">{a.label}</span>
                    <span className="font-mono text-xs text-ink/45">{profile.weights[a.key]}</span>
                  </div>
                  <input
                    type="range" min="0" max="100" step="5"
                    value={profile.weights[a.key]}
                    onChange={(e) => setWeight(a.key, Number(e.target.value))}
                    className="mind-range"
                    style={{ "--val": `${profile.weights[a.key]}%` }}
                    aria-label={a.label}
                  />
                </label>
              ))}
              <label className="block border-t border-ink/[.07] pt-4">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="font-medium">Ngân sách</span>
                  <span className="font-display font-bold text-accent">
                    {profile.budget >= BUDGET_MAX ? "Không giới hạn" : `${profile.budget} triệu`}
                  </span>
                </div>
                <input
                  type="range" min={BUDGET_MIN} max={BUDGET_MAX} step="1"
                  value={profile.budget}
                  onChange={(e) => setProfile((p) => ({ ...p, budget: Number(e.target.value) }))}
                  className="mind-range"
                  style={{ "--val": `${budgetPct}%` }}
                  aria-label="Ngân sách"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// TOP 3
// ---------------------------------------------------------------------
function Podium() {
  const { ranked, profile, addToCart } = useStore();
  // Bỏ biến thể trùng cấu hình để Top 3 đa dạng
  const top = useMemo(() => {
    const out = [];
    for (const p of ranked) {
      if (!out.some((o) => o.brand === p.brand && AXES.every((a) => o.scores[a.key] === p.scores[a.key]))) out.push(p);
      if (out.length === 3) break;
    }
    return out;
  }, [ranked]);
  if (top.length === 0) return null;

  return (
    <section className="mx-auto mt-16 max-w-7xl px-4 md:px-8">
      <p className="eyebrow">Dành cho bạn</p>
      <h2 className="mt-2 text-3xl font-bold">Top 3 hợp nhất</h2>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {top.map((p, i) => (
          <article key={p.id} className={`card flex flex-col p-6 animate-fadeUp ${i === 0 ? "ring-2 ring-mind-500" : ""}`} style={{ animationDelay: `${i * 80}ms` }}>
            <div className="flex items-start justify-between">
              <span className="font-display text-5xl font-bold leading-none text-ink/[.08]">0{i + 1}</span>
              <MatchRing value={p.match} size={56} />
            </div>
            <Link to={`/product/${p.id}`} className="mb-4 mt-3 block aspect-[16/10] px-2">
              <LaptopVisual product={p} />
            </Link>
            <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/45">{p.brand}</p>
            <Link to={`/product/${p.id}`}>
              <h3 className="mt-1 line-clamp-2 text-lg font-bold leading-snug hover:text-accent">{p.name}</h3>
            </Link>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {matchReasons(p, profile, 2).map((r) => (
                <span key={r} className="chip bg-mind-50 text-accent">{r}</span>
              ))}
            </div>
            <div className="mt-auto flex items-center justify-between pt-6">
              <span className="font-display text-xl font-bold">{formatVND(p.price)}</span>
              <button onClick={() => addToCart(p)} className="btn-primary h-10 w-10 p-0" aria-label="Thêm vào giỏ">
                <CartIcon className="h-4 w-4" />
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------
// TẤT CẢ SẢN PHẨM
// ---------------------------------------------------------------------
function BrandLogo({ name }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className="text-xs font-bold uppercase tracking-wider text-ink/70">{name}</span>;
  return <img src={`/Laptop_Logo/${name}.png`} alt={name} className="max-h-6 max-w-full object-contain" onError={() => setFailed(true)} />;
}

function Explore() {
  const { ranked, brands, status, reload } = useStore();
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [sort, setSort] = useState("match");
  const [limit, setLimit] = useState(PAGE);

  const categories = useMemo(() => {
    const c = {};
    ranked.forEach((p) => p.category && (c[p.category] = (c[p.category] || 0) + 1));
    return Object.keys(c).sort((a, b) => c[b] - c[a]);
  }, [ranked]);

  const list = useMemo(() => {
    let r = ranked;
    if (category) r = r.filter((p) => p.category === category);
    if (brand) r = r.filter((p) => p.brand === brand);
    const s = [...r];
    if (sort === "price-asc") s.sort((a, b) => a.price - b.price);
    if (sort === "price-desc") s.sort((a, b) => b.price - a.price);
    if (sort === "light") s.sort((a, b) => (Number(a.weight_kg) || 9) - (Number(b.weight_kg) || 9));
    if (sort === "perf") s.sort((a, b) => b.scores.perf + b.scores.gpu - (a.scores.perf + a.scores.gpu));
    return s;
  }, [ranked, category, brand, sort]);

  const inStockCount = useMemo(() => list.filter((p) => p.stock_quantity > 0).length, [list]);

  const pick = (fn) => (v) => {
    fn(v);
    setLimit(PAGE);
  };

  return (
    <section className="mx-auto mt-20 max-w-7xl px-4 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Cửa hàng</p>
          <h2 className="mt-2 text-3xl font-bold">Tất cả laptop</h2>
          <p className="mt-1 font-mono text-xs text-ink/50">
            {list.length.toLocaleString("vi-VN")} sản phẩm ·{" "}
            <span className="text-emerald-600 dark:text-emerald-400">{inStockCount.toLocaleString("vi-VN")} còn hàng</span>
          </p>
        </div>
        <select
          value={sort}
          onChange={(e) => pick(setSort)(e.target.value)}
          className="rounded-full border border-ink/10 px-4 py-2 text-sm font-medium outline-none focus:border-mind-400"
          aria-label="Sắp xếp"
        >
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        <button onClick={() => pick(setCategory)("")} className={pill(!category)}>Tất cả</button>
        {categories.map((c) => (
          <button key={c} onClick={() => pick(setCategory)(c === category ? "" : c)} className={pill(category === c)}>
            {CATEGORY_VI[c] || c}
          </button>
        ))}
      </div>

      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {brands.map((b) => (
          <button
            key={b}
            onClick={() => pick(setBrand)(b === brand ? "" : b)}
            title={b}
            className={`flex h-11 w-28 shrink-0 items-center justify-center rounded-2xl bg-[#fff] px-3 transition dark:bg-[#e9eef9] ${brand === b ? "ring-2 ring-mind-500" : "ring-1 ring-ink/[.07] hover:ring-ink/25"}`}
          >
            <BrandLogo name={b} />
          </button>
        ))}
      </div>

      {status === "loading" && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-[380px] animate-pulse" />
          ))}
        </div>
      )}

      {status === "error" && (
        <div className="card mt-6 flex flex-col items-center gap-3 p-10 text-center">
          <p className="font-semibold">Không kết nối được máy chủ</p>
          <button onClick={reload} className="btn-primary">Thử lại</button>
        </div>
      )}

      {status === "ready" && (
        <>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.slice(0, limit).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i % PAGE} />
            ))}
          </div>
          <LoadMore shown={limit} total={list.length} step={PAGE} onMore={() => setLimit((l) => l + PAGE)} />
        </>
      )}
    </section>
  );
}

export default function Home() {
  return (
    <div className="pb-8">
      <Hero />
      <Podium />
      <Explore />
    </div>
  );
}
