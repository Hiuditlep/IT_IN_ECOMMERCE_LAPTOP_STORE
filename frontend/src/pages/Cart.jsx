import { Link } from "react-router-dom";
import { formatVND } from "../lib/mind";
import LaptopVisual from "../components/LaptopVisual";
import { ArrowRight, CartIcon, MinusIcon, PlusIcon, TrashIcon } from "../components/Icons";

export default function Cart({ cart, updateQuantity, removeFromCart }) {
  const total = cart.reduce((sum, item) => sum + Number(item.price) * item.qty, 0);
  const count = cart.reduce((s, i) => s + i.qty, 0);

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-24 text-center">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-surface ring-1 ring-ink/5">
          <CartIcon className="h-7 w-7 text-mind-600" />
        </span>
        <h1 className="mt-6 text-3xl font-bold">Giỏ hàng đang trống</h1>
        
        <Link to="/" className="btn-primary mt-6">Bắt đầu khám phá</Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 md:px-8">
      
      <h1 className="mt-2 text-3xl font-bold md:text-4xl">Giỏ hàng · {count}</h1>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {cart.map((item) => (
            <div key={item.id} className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
              <Link to={`/product/${item.id}`} className="h-24 w-full shrink-0 rounded-2xl bg-paper p-2 sm:w-36">
                <LaptopVisual product={item} />
              </Link>
              <div className="min-w-0 flex-1">
                <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-ink/45">{item.brand}</p>
                <Link to={`/product/${item.id}`} className="line-clamp-2 font-semibold hover:text-mind-700">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-ink/50">{formatVND(item.price)} / máy</p>
              </div>
              <div className="flex items-center justify-between gap-4 sm:justify-end">
                <div className="flex items-center rounded-full border border-ink/10 bg-surface">
                  <button className="p-2.5 disabled:opacity-30" disabled={item.qty <= 1} onClick={() => updateQuantity(item.id, -1)} aria-label="Giảm">
                    <MinusIcon className="h-4 w-4" />
                  </button>
                  <span className="w-8 text-center font-mono font-semibold">{item.qty}</span>
                  <button
                    className="p-2.5 disabled:opacity-30"
                    disabled={item.qty >= Number(item.stock_quantity ?? 10)}
                    onClick={() => updateQuantity(item.id, 1)}
                    aria-label="Tăng"
                  >
                    <PlusIcon className="h-4 w-4" />
                  </button>
                </div>
                <span className="w-36 text-right font-display text-lg font-bold">{formatVND(item.price * item.qty)}</span>
                <button onClick={() => removeFromCart(item.id)} className="rounded-full p-2 text-ink/30 hover:bg-red-50 hover:text-danger" aria-label="Xoá">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <aside className="h-fit card p-6 lg:sticky lg:top-24">
          <p className="eyebrow">Tóm tắt</p>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex justify-between text-ink/60">
              <dt>Tạm tính ({count} máy)</dt>
              <dd>{formatVND(total)}</dd>
            </div>
            <div className="flex justify-between text-ink/60">
              <dt>Vận chuyển</dt>
              <dd className="text-accent">Miễn phí</dd>
            </div>
          </dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-ink/[.07] pt-5">
            <span>Tổng cộng</span>
            <span className="font-display text-3xl font-bold">{formatVND(total)}</span>
          </div>
          <Link to="/checkout" className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-mind-600 py-4 font-semibold text-white transition hover:bg-mind-500">
            Thanh toán <ArrowRight className="h-4 w-4" />
          </Link>
          <Link to="/" className="mt-3 block text-center text-sm text-ink/50 hover:text-ink">
            Tiếp tục mua sắm
          </Link>
        </aside>
      </div>
    </div>
  );
}
