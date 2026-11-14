import { Link } from "react-router-dom";
import { useStore } from "../store";
import { AXES, formatVND, resLabel, shortCpu, storageLabel } from "../lib/mind";
import LaptopVisual from "./LaptopVisual";
import MatchRing from "./MatchRing";
import { CartIcon, CheckIcon, CompareIcon } from "./Icons";

export default function ProductCard({ product, index = 0 }) {
  const { addToCart, toggleCompare, compareIds, matchOf } = useStore();
  const match = product.match ?? matchOf.get(product.id) ?? 0;
  const inCompare = compareIds.includes(product.id);
  const inStock = product.stock_quantity > 0;

  return (
    <article
      className="card group relative flex flex-col overflow-hidden transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_40px_-20px_rgb(var(--ink)/.35)] animate-fadeUp"
      style={{ animationDelay: `${Math.min(index, 11) * 35}ms` }}
    >
      <Link to={`/product/${product.id}`} className="relative block bg-ink/[.025] px-5 pb-2 pt-12">
        <div className="aspect-[16/10.5] transition duration-500 group-hover:scale-[1.04]">
          <LaptopVisual product={product} />
        </div>
        <div className="absolute left-3 top-3">
          <MatchRing value={match} size={40} />
        </div>
      </Link>

      <button
        type="button"
        onClick={() => toggleCompare(product.id)}
        aria-pressed={inCompare}
        aria-label={inCompare ? "Bỏ khỏi so sánh" : "Thêm vào so sánh"}
        title="So sánh"
        className={`absolute right-3 top-3 rounded-full p-2 transition ${
          inCompare ? "bg-mind-600 text-white" : "bg-surface/90 text-ink/50 ring-1 ring-ink/10 hover:text-ink"
        }`}
      >
        {inCompare ? <CheckIcon className="h-4 w-4" /> : <CompareIcon className="h-4 w-4" />}
      </button>

      <div className="flex flex-1 flex-col gap-3 p-4 pt-3">
        <Link to={`/product/${product.id}`}>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-wider text-ink/40">{product.brand}</p>
          <h3 className="mt-1 line-clamp-2 min-h-[2.6em] text-[15px] font-semibold leading-snug transition group-hover:text-accent">
            {product.name}
          </h3>
        </Link>

        <div className="flex flex-wrap gap-1.5">
          <span className="chip">{shortCpu(product.cpu)}</span>
          <span className="chip">{product.ram_gb}GB · {storageLabel(product)}</span>
          <span className="chip">
            {product.screen_size_in}" {resLabel(product.resolution)}
          </span>
        </div>

        <div className="flex gap-1" aria-label="DNA cấu hình">
          {AXES.map((a) => (
            <div key={a.key} className="h-1 flex-1 overflow-hidden rounded-full bg-ink/[.07]" title={`${a.label}: ${product.scores[a.key]}`}>
              <div className="h-full rounded-full bg-mind-500" style={{ width: `${product.scores[a.key]}%` }} />
            </div>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between gap-2 pt-1">
          <div>
            <span className="font-display text-lg font-bold">{formatVND(product.price)}</span>
            <span className={`mt-0.5 flex items-center gap-1.5 text-[11px] font-medium ${inStock ? "text-emerald-600 dark:text-emerald-400" : "text-danger"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${inStock ? "bg-emerald-500" : "bg-danger"}`} />
              {inStock ? `Còn hàng · ${product.stock_quantity}` : "Hết hàng"}
            </span>
          </div>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={!inStock}
            aria-label="Thêm vào giỏ"
            className="btn-primary h-10 w-10 p-0"
          >
            <CartIcon className="h-[18px] w-[18px]" />
          </button>
        </div>
      </div>
    </article>
  );
}
