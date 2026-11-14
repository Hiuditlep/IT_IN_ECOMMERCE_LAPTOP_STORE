import { ArrowRight } from "./Icons";

/** Nút "Xem thêm" kèm tiến độ: đang xem bao nhiêu / tổng số, còn lại bao nhiêu */
export default function LoadMore({ shown, total, step, onMore }) {
  if (total === 0) return null;
  const visible = Math.min(shown, total);
  const remaining = total - visible;
  return (
    <div className="mt-10 flex flex-col items-center gap-3">
      <p className="font-mono text-xs text-ink/50">
        Đang xem <b className="text-ink">{visible.toLocaleString("vi-VN")}</b> / {total.toLocaleString("vi-VN")} sản phẩm
      </p>
      <div className="h-1 w-48 overflow-hidden rounded-full bg-ink/[.08]">
        <div className="h-full rounded-full bg-mind-500 transition-all duration-500" style={{ width: `${(visible / total) * 100}%` }} />
      </div>
      {remaining > 0 && (
        <button onClick={onMore} className="btn-ghost mt-2 px-8 py-3">
          Xem thêm {Math.min(step, remaining)} · còn {remaining.toLocaleString("vi-VN")} sản phẩm
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
