import { AXES } from "../lib/mind";

const COMPARE_COLORS = ["#1F4BF0", "#5A86FF", "#8AADFF"];

/**
 * Biểu đồ DNA cấu hình: vùng đặc = năng lực máy, nét đứt = nhu cầu người dùng.
 * Màu lấy từ biến CSS nên tự đổi theo chế độ sáng/tối.
 */
export default function SpecRadar({ scores, need, size = 260, labels = true, compare = [] }) {
  const pad = labels ? 40 : 8;
  const R = size / 2 - pad;
  const cx = size / 2;
  const cy = size / 2 + (labels ? 4 : 0);
  const pt = (i, v) => {
    const a = (-90 + i * (360 / AXES.length)) * (Math.PI / 180);
    const r = (R * Math.max(4, v)) / 100;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const poly = (vals) => AXES.map((a, i) => pt(i, vals[a.key] ?? 0).join(",")).join(" ");
  const grid = "rgb(var(--ink) / .09)";

  return (
    <svg viewBox={`0 0 ${size} ${size + (labels ? 6 : 0)}`} width="100%" style={{ maxWidth: size }} role="img" aria-label="Biểu đồ DNA cấu hình">
      {[25, 50, 75, 100].map((r) => (
        <polygon key={r} points={poly(Object.fromEntries(AXES.map((a) => [a.key, r])))} fill="none" stroke={grid} />
      ))}
      {AXES.map((a, i) => {
        const [x, y] = pt(i, 100);
        return <line key={a.key} x1={cx} y1={cy} x2={x} y2={y} stroke={grid} />;
      })}

      {compare.map((s, idx) => (
        <polygon key={idx} points={poly(s)} fill={COMPARE_COLORS[idx]} fillOpacity=".12" stroke={COMPARE_COLORS[idx]} strokeWidth="2" />
      ))}

      {scores && (
        <polygon points={poly(scores)} fill="#3463FF" fillOpacity=".18" stroke="#3463FF" strokeWidth="2" strokeLinejoin="round" />
      )}

      {need && (
        <polygon points={poly(need)} fill="none" stroke="rgb(var(--ink) / .55)" strokeWidth="1.5" strokeDasharray="4 4" />
      )}

      {labels &&
        AXES.map((a, i) => {
          const [x, y] = pt(i, 126);
          return (
            <text key={a.key} x={x} y={y + 4} textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="10.5" fontWeight="600" fill="rgb(var(--ink) / .55)">
              {a.short.toUpperCase()}
            </text>
          );
        })}
    </svg>
  );
}
