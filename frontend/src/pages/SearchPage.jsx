import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useStore } from "../store";
import { applyQuery, parseQuery } from "../lib/mind";
import ProductCard from "../components/ProductCard";
import { SearchIcon } from "../components/Icons";
import LoadMore from "../components/LoadMore";

const PAGE = 24;

export default function SearchPage() {
  const [params] = useSearchParams();
  const query = params.get("q") || "";
  const { ranked, brands, status, setPaletteOpen } = useStore();
  const [limit, setLimit] = useState(PAGE);
  const [lastQuery, setLastQuery] = useState(query);
  if (lastQuery !== query) {
    setLastQuery(query);
    setLimit(PAGE);
  }

  const parsed = useMemo(() => parseQuery(query, brands), [query, brands]);
  const results = useMemo(() => applyQuery(ranked, parsed), [ranked, parsed]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      
      <button
        onClick={() => setPaletteOpen(true)}
        className="group mt-2 flex w-full items-center gap-3 text-left"
        title="Sửa câu tìm kiếm"
      >
        <h1 className="text-3xl font-bold md:text-4xl">“{query}”</h1>
        <SearchIcon className="h-5 w-5 text-ink/30 transition group-hover:text-mind-600" />
      </button>

      <div className="mt-5 flex flex-wrap items-center gap-2 rounded-2xl bg-surface p-3 ring-1 ring-ink/5">
        <span className="eyebrow px-2">Đã hiểu</span>
        {parsed.chips.length ? (
          parsed.chips.map((c, i) => (
            <span key={i} className="rounded-full bg-mind-50 px-2.5 py-1 font-mono text-[12px] font-medium text-mind-800">
              {c}
            </span>
          ))
        ) : (
          <span className="text-sm text-ink/50">không có điều kiện, hiển thị tất cả</span>
        )}
      </div>

      <p className="mt-6 font-mono text-xs text-ink/50">
        {status === "ready" ? (
          <>
            {results.length.toLocaleString("vi-VN")} kết quả ·{" "}
            <span className="text-emerald-600 dark:text-emerald-400">
              {results.filter((p) => p.stock_quantity > 0).length.toLocaleString("vi-VN")} còn hàng
            </span>
          </>
        ) : (
          "Đang tải…"
        )}
      </p>

      {status === "ready" && results.length === 0 && (
        <div className="card mt-4 p-12 text-center">
          <p className="text-lg font-semibold">Không có kết quả.</p>
          <button onClick={() => setPaletteOpen(true)} className="btn-primary mt-5">
            Sửa câu tìm kiếm
          </button>
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {results.slice(0, limit).map((p, i) => (
          <ProductCard key={p.id} product={p} index={i % PAGE} />
        ))}
      </div>

      <LoadMore shown={limit} total={results.length} step={PAGE} onMore={() => setLimit((l) => l + PAGE)} />
    </div>
  );
}
