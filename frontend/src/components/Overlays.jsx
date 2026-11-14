import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../store";
import { formatVND } from "../lib/mind";
import LaptopVisual from "./LaptopVisual";
import { ArrowRight, CartIcon, CompareIcon, MinusIcon, PlusIcon, TrashIcon, XIcon } from "./Icons";

// ---------------------------------------------------------------------
// GIỎ HÀNG TRƯỢT
// ---------------------------------------------------------------------
export function CartDrawer() {
  const { cart, cartOpen, setCartOpen, cartTotal, updateQuantity, removeFromCart } = useStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!cartOpen) return;
    const onKey = (e) => e.key === "Escape" && setCartOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cartOpen, setCartOpen]);

  if (!cartOpen) return null;

  return (
    <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Giỏ hàng">
      <button aria-label="Đóng" className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-pop" onClick={() => setCartOpen(false)} />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-surface shadow-2xl animate-slideIn">
        <header className="flex items-center justify-between border-b border-ink/5 px-6 py-5">
          <div>
            <p className="eyebrow text-ink/40">Giỏ hàng</p>
            <h2 className="text-xl font-bold">{cart.length ? `${cart.length} sản phẩm` : "Đang trống"}</h2>
          </div>
          <button onClick={() => setCartOpen(false)} className="rounded-full p-2 hover:bg-ink/5" aria-label="Đóng">
            <XIcon />
          </button>
        </header>

        <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
          {cart.length === 0 && (
            <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-ink/50">
              <CartIcon className="h-10 w-10" />
              <p>Giỏ hàng trống</p>
            </div>
          )}
          {cart.map((item) => (
            <div key={item.id} className="flex gap-3 rounded-2xl border border-ink/5 p-3">
              <Link to={`/product/${item.id}`} onClick={() => setCartOpen(false)} className="h-16 w-24 shrink-0 rounded-xl bg-paper p-1">
                <LaptopVisual product={item} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="line-clamp-2 text-sm font-semibold leading-snug">{item.name}</p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center rounded-full border border-ink/10">
                    <button className="p-1.5 disabled:opacity-30" disabled={item.qty <= 1} onClick={() => updateQuantity(item.id, -1)} aria-label="Giảm">
                      <MinusIcon className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-6 text-center font-mono text-sm">{item.qty}</span>
                    <button
                      className="p-1.5 disabled:opacity-30"
                      disabled={item.qty >= item.stock_quantity}
                      onClick={() => updateQuantity(item.id, 1)}
                      aria-label="Tăng"
                    >
                      <PlusIcon className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <span className="font-display text-sm font-bold">{formatVND(item.price * item.qty)}</span>
                </div>
              </div>
              <button onClick={() => removeFromCart(item.id)} className="self-start p-1 text-ink/30 hover:text-danger" aria-label="Xoá">
                <TrashIcon className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {cart.length > 0 && (
          <footer className="space-y-3 border-t border-ink/5 px-6 py-5">
            <div className="flex items-baseline justify-between">
              <span className="text-ink/60">Tạm tính</span>
              <span className="font-display text-2xl font-bold">{formatVND(cartTotal)}</span>
            </div>
            <button
              className="btn-accent w-full py-3.5"
              onClick={() => {
                setCartOpen(false);
                navigate("/checkout");
              }}
            >
              Thanh toán <ArrowRight className="h-4 w-4" />
            </button>
            <button
              className="w-full text-center text-sm font-medium text-ink/60 hover:text-ink"
              onClick={() => {
                setCartOpen(false);
                navigate("/cart");
              }}
            >
              Xem giỏ hàng
            </button>
          </footer>
        )}
      </aside>
    </div>
  );
}

// ---------------------------------------------------------------------
// THANH SO SÁNH NỔI
// ---------------------------------------------------------------------
export function CompareDock() {
  const { compareList, toggleCompare, clearCompare } = useStore();
  if (compareList.length === 0) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex justify-center px-4">
      <div className="pointer-events-auto flex max-w-full items-center gap-3 rounded-full bg-ink p-2 pl-4 text-paper shadow-2xl animate-fadeUp">
        <CompareIcon className="hidden h-5 w-5 text-mind-400 sm:block" />
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
          {compareList.map((p) => (
            <span key={p.id} className="inline-flex max-w-[150px] shrink-0 items-center gap-1 rounded-full bg-paper/10 py-1 pl-3 pr-1 text-xs">
              <span className="truncate">{p.name}</span>
              <button onClick={() => toggleCompare(p.id)} className="rounded-full p-0.5 hover:bg-paper/20" aria-label={`Bỏ ${p.name}`}>
                <XIcon className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {Array.from({ length: 3 - compareList.length }).map((_, i) => (
            <span key={i} className="hidden h-7 w-16 shrink-0 rounded-full border border-dashed border-paper/20 sm:block" />
          ))}
        </div>
        <button onClick={clearCompare} className="shrink-0 px-1 text-xs text-paper/50 hover:text-paper">
          Xoá
        </button>
        <Link to="/compare" className="shrink-0 rounded-full bg-mind-500 px-4 py-2 text-sm font-semibold text-white hover:bg-mind-400">
          So sánh {compareList.length}
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// THÔNG BÁO
// ---------------------------------------------------------------------
export function Toasts() {
  const { toasts } = useStore();
  const dot = { ok: "bg-emerald-400", warn: "bg-warn", info: "bg-mind-400" };
  return (
    <div className="pointer-events-none fixed left-1/2 top-20 z-[80] flex w-[calc(100%-32px)] max-w-sm -translate-x-1/2 flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className="flex items-center gap-3 rounded-2xl bg-ink px-4 py-3 text-sm text-paper shadow-xl animate-pop">
          <span className={`h-2 w-2 shrink-0 rounded-full ${dot[t.tone] || dot.info}`} />
          <span className="line-clamp-2">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
