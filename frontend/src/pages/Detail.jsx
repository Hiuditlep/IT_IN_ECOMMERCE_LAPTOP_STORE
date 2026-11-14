import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useStore } from "../store";
import {
  AXES,
  CATEGORY_VI,
  dnaTwins,
  formatShort,
  formatVND,
  matchReasons,
  matchScore,
  matchWarnings,
  realLife,
  storageLabel,
} from "../lib/mind";
import LaptopVisual from "../components/LaptopVisual";
import MatchRing from "../components/MatchRing";
import SpecRadar from "../components/SpecRadar";
import ProductCard from "../components/ProductCard";
import { ArrowLeft, CartIcon, CheckIcon, CompareIcon } from "../components/Icons";

export default function Detail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products, status, profile, addToCart, toggleCompare, compareIds } = useStore();

  const product = useMemo(() => products.find((p) => String(p.id) === String(id)), [products, id]);
  const twins = useMemo(() => (product ? dnaTwins(product, products, 4) : []), [product, products]);

  if (status === "loading") {
    return (
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:px-8 lg:grid-cols-2">
        <div className="card h-[420px] animate-pulse" />
        <div className="card h-[420px] animate-pulse" />
      </div>
    );
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <h1 className="text-3xl font-bold">Không tìm thấy sản phẩm</h1>
        <Link to="/" className="btn-primary mt-6">Về trang chủ</Link>
      </div>
    );
  }

  const match = matchScore(product, profile);
  const reasons = matchReasons(product, profile, 3);
  const warns = matchWarnings(product, profile);
  const inStock = product.stock_quantity > 0;
  const inCompare = compareIds.includes(product.id);

  const specs = [
    ["CPU", product.cpu],
    ["GPU", `${product.gpu || "Tích hợp"}${Number(product.gpu_vram_gb) ? ` · ${Number(product.gpu_vram_gb)}GB` : ""}`],
    ["RAM", product.ram_gb ? `${product.ram_gb} GB` : "—"],
    ["Ổ cứng", `${storageLabel(product)} SSD${Number(product.hdd_gb) > 0 ? ` + ${product.hdd_gb}GB HDD` : ""}`],
    ["Màn hình", [product.screen_size_in && `${product.screen_size_in}"`, product.panel_type, product.resolution, product.refresh_rate_hz && `${product.refresh_rate_hz}Hz`].filter(Boolean).join(" · ")],
    ["Cân nặng", product.weight_kg ? `${Number(product.weight_kg)} kg` : "—"],
    ["Pin", product.battery_wh ? `${Number(product.battery_wh)} Wh` : "—"],
    ["Hệ điều hành", product.operating_system || "—"],
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 pb-10 pt-6 md:px-8">
      <button onClick={() => navigate(-1)} className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-ink/50 hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Quay lại
      </button>

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-12">
        {/* Trái: hình + DNA */}
        <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="card dot-grid p-8 md:p-12">
            <div className="aspect-[16/10.5]">
              <LaptopVisual product={product} />
            </div>
          </div>
          <div className="card grid items-center gap-6 p-6 sm:grid-cols-[200px_1fr]">
            <div className="mx-auto w-full max-w-[200px]">
              <SpecRadar scores={product.scores} need={profile.weights} size={200} />
            </div>
            <div className="space-y-3">
              {AXES.map((a) => (
                <div key={a.key}>
                  <div className="flex justify-between text-xs">
                    <span className="font-medium">{a.label}</span>
                    <span className="font-mono text-ink/45">{product.scores[a.key]}</span>
                  </div>
                  <div className="relative mt-1 h-1.5 rounded-full bg-ink/[.07]">
                    <div className="h-full rounded-full bg-mind-500" style={{ width: `${product.scores[a.key]}%` }} />
                    <div className="absolute top-1/2 h-3 w-0.5 -translate-y-1/2 rounded bg-ink/60" style={{ left: `${profile.weights[a.key]}%` }} title="Mức bạn cần" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Phải: mua hàng */}
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink/45">
            {product.brand} · {CATEGORY_VI[product.category] || product.category}
          </p>
          <h1 className="mt-2 text-3xl font-bold leading-tight md:text-4xl">{product.name}</h1>

          <div className="mt-6 flex items-center gap-4 rounded-3xl bg-mind-50 p-5">
            <MatchRing value={match} size={60} />
            <div className="flex flex-wrap gap-1.5">
              {reasons.map((r) => (
                <span key={r} className="chip bg-surface text-ink/80">{r}</span>
              ))}
              {warns.map((w) => (
                <span key={w} className="chip bg-warn/15 text-warn">{w}</span>
              ))}
            </div>
          </div>

          <p className="mt-6 font-display text-4xl font-bold">{formatVND(product.price)}</p>
          {!inStock && <p className="mt-1 text-sm font-medium text-danger">Tạm hết hàng</p>}

          <div className="mt-5 flex gap-3">
            <button onClick={() => addToCart(product)} disabled={!inStock} className="btn-accent flex-1 py-4 text-base">
              <CartIcon className="h-5 w-5" /> Thêm vào giỏ
            </button>
            <button
              onClick={() => toggleCompare(product.id)}
              aria-label="So sánh"
              title="So sánh"
              className={`inline-flex w-14 items-center justify-center rounded-full border transition ${inCompare ? "border-mind-500 bg-mind-50 text-accent" : "border-ink/15 hover:border-ink/40"}`}
            >
              {inCompare ? <CheckIcon /> : <CompareIcon />}
            </button>
          </div>

          <section className="mt-10">
            <h2 className="text-xl font-bold">Trong đời thực</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {realLife(product).map((l) => (
                <div key={l.title} className="card p-4">
                  <p className="font-mono text-sm font-semibold">
                    <span className="mr-2" aria-hidden="true">{l.icon}</span>
                    {l.title}
                  </p>
                  <p className="mt-1.5 text-sm text-ink/60">{l.text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-xl font-bold">Thông số</h2>
            <dl className="card mt-4 divide-y divide-ink/[.06]">
              {specs.map(([k, v]) => (
                <div key={k} className="grid grid-cols-[110px_1fr] gap-4 px-5 py-3 text-sm">
                  <dt className="text-ink/45">{k}</dt>
                  <dd className="font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
        </div>
      </div>

      {twins.length > 0 && (
        <section className="mt-20">
          <p className="eyebrow">Song sinh DNA</p>
          <h2 className="mt-2 text-3xl font-bold">Cấu hình gần giống</h2>
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {twins.map((t, i) => {
              const diff = t.price - product.price;
              return (
                <div key={t.id} className="relative">
                  <span
                    className={`absolute -top-3 left-4 z-10 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold ${
                      diff < 0 ? "bg-mind-600 text-white" : "bg-surface text-ink/60 ring-1 ring-ink/10"
                    }`}
                  >
                    {diff < 0 ? `−${formatShort(-diff)}` : diff > 0 ? `+${formatShort(diff)}` : "cùng giá"}
                  </span>
                  <ProductCard product={t} index={i} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
