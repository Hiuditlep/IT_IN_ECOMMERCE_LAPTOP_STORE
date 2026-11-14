/** Vòng tròn % phù hợp – một tông xanh, đậm dần theo mức hợp */
export default function MatchRing({ value = 0, size = 46 }) {
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const color = value >= 75 ? "#3463FF" : value >= 50 ? "#5A86FF" : value >= 30 ? "#8AADFF" : "rgb(var(--ink) / .25)";
  return (
    <div className="relative inline-flex shrink-0 items-center justify-center" style={{ width: size, height: size }} title={`Phù hợp ${value}%`}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="rgb(var(--surface))" stroke="rgb(var(--ink) / .08)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - value / 100)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.2,.7,.2,1)" }}
        />
      </svg>
      <span className="absolute font-mono font-semibold text-ink" style={{ fontSize: size * 0.27 }}>
        {value}
        <span style={{ fontSize: size * 0.17 }}>%</span>
      </span>
    </div>
  );
}
