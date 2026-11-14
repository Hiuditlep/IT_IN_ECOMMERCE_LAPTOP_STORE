import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { applyQuery, formatVND, parseQuery, shortCpu, shortGpu } from "../lib/mind";
import LaptopVisual from "./LaptopVisual";
import MatchRing from "./MatchRing";
import { ArrowRight, SearchIcon } from "./Icons";

const EXAMPLES = [
  "gaming dưới 30tr rtx 4060",
  "mỏng nhẹ pin trâu 16gb",
  "asus oled 14 inch",
];

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen, ranked, brands } = useStore();
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  // Phím tắt Ctrl/⌘ + K và "/"
  useEffect(() => {
    const onKey = (e) => {
      const typing = /input|textarea|select/i.test(document.activeElement?.tagName || "");
      if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) setTimeout(() => inputRef.current?.focus(), 10);
  }, [paletteOpen]);

  const parsed = useMemo(() => parseQuery(q, brands), [q, brands]);
  const results = useMemo(() => (q.trim() ? applyQuery(ranked, parsed) : ranked), [q, parsed, ranked]);
  const top = results.slice(0, 6);

  if (!paletteOpen) return null;

  const close = () => setPaletteOpen(false);
  const goSearch = (text = q) => {
    if (!text.trim()) return;
    close();
    navigate(`/search?q=${encodeURIComponent(text.trim())}`);
  };
  const goProduct = (p) => {
    close();
    setQ("");
    navigate(`/product/${p.id}`);
  };

  const onKeyDown = (e) => {
    if (e.key === "Escape") close();
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(s + 1, top.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(s - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (sel === 0 || !top[sel - 1]) goSearch();
      else goProduct(top[sel - 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[10vh]" role="dialog" aria-modal="true" aria-label="Tìm kiếm">
      <button aria-label="Đóng" className="absolute inset-0 bg-ink/50 backdrop-blur-sm" onClick={close} />
      <div className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-surface shadow-2xl animate-pop">
        <div className="flex items-center gap-3 border-b border-ink/5 px-5">
          <SearchIcon className="h-5 w-5 text-ink/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSel(0);
            }}
            onKeyDown={onKeyDown}
            placeholder="Mô tả chiếc laptop bạn cần…"
            className="h-16 flex-1 bg-transparent text-lg outline-none placeholder:text-ink/35"
          />
          <kbd className="rounded-md border border-ink/10 px-1.5 py-0.5 font-mono text-[11px] text-ink/40">ESC</kbd>
        </div>

        {/* MindParse: hiển thị máy đã hiểu gì */}
        <div className="flex min-h-[52px] flex-wrap items-center gap-2 border-b border-ink/5 bg-paper/60 px-5 py-3">
          {q.trim() ? (
            <>
              <span className="eyebrow mr-1">Đã hiểu</span>
              {parsed.chips.map((c, i) => (
                <span key={i} className="rounded-full bg-surface px-2.5 py-1 font-mono text-[11.5px] font-medium text-ink shadow-sm ring-1 ring-ink/5">
                  {c}
                </span>
              ))}
            </>
          ) : (
            <>
              <span className="eyebrow mr-1">Thử</span>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  onClick={() => setQ(ex)}
                  className="rounded-full bg-surface px-2.5 py-1 text-[12.5px] text-ink/70 ring-1 ring-ink/5 hover:text-mind-700 hover:ring-mind-200"
                >
                  {ex}
                </button>
              ))}
            </>
          )}
        </div>

        <ul className="max-h-[52vh] overflow-y-auto p-2">
          <li>
            <button
              onMouseEnter={() => setSel(0)}
              onClick={() => goSearch()}
              disabled={!q.trim()}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm ${sel === 0 && q.trim() ? "bg-mind-50" : ""} disabled:opacity-50`}
            >
              <span>
                {q.trim() ? (
                  <>
                    Xem tất cả <b>{results.length}</b> kết quả
                  </>
                ) : (
                  <>Gợi ý cho bạn</>
                )}
              </span>
              {q.trim() && <ArrowRight className="h-4 w-4 text-mind-600" />}
            </button>
          </li>
          {top.map((p, i) => (
            <li key={p.id}>
              <button
                onMouseEnter={() => setSel(i + 1)}
                onClick={() => goProduct(p)}
                className={`flex w-full items-center gap-4 rounded-2xl px-3 py-2.5 text-left ${sel === i + 1 ? "bg-paper" : ""}`}
              >
                <div className="h-11 w-16 shrink-0">
                  <LaptopVisual product={p} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{p.name}</p>
                  <p className="truncate font-mono text-[11px] text-ink/50">
                    {shortCpu(p.cpu)} · {shortGpu(p.gpu)} · {p.ram_gb}GB
                  </p>
                </div>
                <span className="hidden font-display text-sm font-bold sm:block">{formatVND(p.price)}</span>
                <MatchRing value={p.match} size={36} />
              </button>
            </li>
          ))}
          {q.trim() && top.length === 0 && (
            <li className="px-4 py-8 text-center text-sm text-ink/50">Không có kết quả.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
