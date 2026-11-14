import { Link } from "react-router-dom";
import { useStore } from "../store";
import { AXES, CATEGORY_VI, formatVND, resLabel, shortCpu, shortGpu, storageLabel } from "../lib/mind";
import LaptopVisual from "../components/LaptopVisual";
import MatchRing from "../components/MatchRing";
import SpecRadar from "../components/SpecRadar";
import { CartIcon, CompareIcon, XIcon } from "../components/Icons";

const COLORS = ["#1F4BF0", "#FF8A3D", "#22D3EE"];

export default function Compare() {
  const { compareList, toggleCompare, matchOf, addToCart, profile } = useStore();

  if (compareList.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-surface ring-1 ring-ink/5">
          <CompareIcon className="h-7 w-7 text-mind-600" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Chưa chọn máy nào</h1>
        <p className="mt-3 text-ink/55">Chọn tối đa 3 máy để so sánh.</p>
        <Link to="/" className="btn-primary mt-6">Khám phá</Link>
      </div>
    );
  }

  const best = (getter, higher = true) => {
    const vals = compareList.map(getter).map(Number);
    const valid = vals.filter((v) => Number.isFinite(v) && v > 0);
    if (valid.length < 2) return -1;
    const target = higher ? Math.max(...valid) : Math.min(...valid);
    return vals.indexOf(target);
  };

  const rows = [
    { label: "Giá", get: (p) => p.price, fmt: (p) => formatVND(p.price), higher: false },
    { label: "Mức hợp với bạn", get: (p) => matchOf.get(p.id), fmt: (p) => `${matchOf.get(p.id)}%` },
    ...AXES.map((a) => ({ label: a.label, get: (p) => p.scores[a.key], fmt: (p) => p.scores[a.key], bar: true })),
    { label: "CPU", fmt: (p) => shortCpu(p.cpu) },
    { label: "GPU", fmt: (p) => shortGpu(p.gpu) },
    { label: "RAM", get: (p) => p.ram_gb, fmt: (p) => `${p.ram_gb} GB` },
    { label: "SSD", get: (p) => p.ssd_gb, fmt: (p) => storageLabel(p) },
    { label: "Màn hình", fmt: (p) => `${p.screen_size_in}" ${resLabel(p.resolution)} ${p.panel_type || ""}` },
    { label: "Tần số quét", get: (p) => p.refresh_rate_hz, fmt: (p) => (p.refresh_rate_hz ? `${p.refresh_rate_hz} Hz` : "—") },
    { label: "Trọng lượng", get: (p) => p.weight_kg, fmt: (p) => (p.weight_kg ? `${Number(p.weight_kg)} kg` : "—"), higher: false },
    { label: "Pin", get: (p) => p.battery_wh, fmt: (p) => (p.battery_wh ? `${Number(p.battery_wh)} Wh` : "—") },
  ];

  const cols = `160px repeat(${compareList.length}, minmax(200px, 1fr))`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">So sánh</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="card flex flex-col items-center p-6">
          <SpecRadar size={280} compare={compareList.map((p) => p.scores)} need={profile.weights} />
          <ul className="mt-4 w-full space-y-2 text-sm">
            {compareList.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2">
                <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: COLORS[i] }} />
                <span className="truncate">{p.name}</span>
              </li>
            ))}
            <li className="flex items-center gap-2 text-ink/55">
              <span className="w-3 border-t-2 border-dashed border-ink/50" /> Nhu cầu của bạn
            </li>
          </ul>
        </div>

        <div className="card overflow-x-auto">
          <div className="min-w-fit">
            {/* Đầu cột */}
            <div className="grid border-b border-ink/5" style={{ gridTemplateColumns: cols }}>
              <div />
              {compareList.map((p, i) => (
                <div key={p.id} className="relative p-4">
                  <button
                    onClick={() => toggleCompare(p.id)}
                    className="absolute right-3 top-3 rounded-full p-1 text-ink/30 hover:bg-ink/5 hover:text-ink"
                    aria-label="Bỏ khỏi so sánh"
                  >
                    <XIcon className="h-4 w-4" />
                  </button>
                  <div className="h-1 w-10 rounded-full" style={{ background: COLORS[i] }} />
                  <Link to={`/product/${p.id}`} className="mt-3 block aspect-[16/10] px-3">
                    <LaptopVisual product={p} />
                  </Link>
                  <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-ink/45">
                    {p.brand} · {CATEGORY_VI[p.category] || p.category}
                  </p>
                  <Link to={`/product/${p.id}`} className="mt-1 line-clamp-2 text-sm font-semibold hover:text-mind-700">
                    {p.name}
                  </Link>
                  <div className="mt-3 flex items-center justify-between">
                    <MatchRing value={matchOf.get(p.id) ?? 0} size={40} />
                    <button onClick={() => addToCart(p)} className="btn-primary px-3 py-2 text-xs">
                      <CartIcon className="h-4 w-4" /> Thêm
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {rows.map((r) => {
              const win = r.get ? best(r.get, r.higher !== false) : -1;
              return (
                <div key={r.label} className="grid border-b border-ink/5 last:border-0" style={{ gridTemplateColumns: cols }}>
                  <div className="px-4 py-3 text-sm text-ink/50">{r.label}</div>
                  {compareList.map((p, i) => (
                    <div key={p.id} className={`px-4 py-3 text-sm ${win === i ? "bg-mind-50/70 font-semibold text-mind-800" : ""}`}>
                      {r.bar ? (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 flex-1 rounded-full bg-ink/[.06]">
                            <div className="h-full rounded-full" style={{ width: `${r.get(p)}%`, background: COLORS[i] }} />
                          </div>
                          <span className="w-7 text-right font-mono text-xs">{r.fmt(p)}</span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1">
                          {r.fmt(p)}
                          {win === i && <span className="text-[10px]">★</span>}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
