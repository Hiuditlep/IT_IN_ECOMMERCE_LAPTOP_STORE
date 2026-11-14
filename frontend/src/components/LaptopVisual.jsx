import { useState } from "react";
import { isRealImage } from "../lib/mind";

// Bảng màu "màn hình" theo phân khúc
// Cùng một họ xanh, chỉ khác sắc độ để phân biệt phân khúc
const THEMES = {
  Gaming: ["#6B7BFF", "#2A2F9E", "#0B0F33"],
  Creator: ["#7FB2FF", "#3463FF", "#0F1C4D"],
  Business: ["#5A86FF", "#1B2A50", "#0A1530"],
  Ultrabook: ["#B9CEFF", "#5A86FF", "#16306E"],
  General: ["#5A86FF", "#1F4BF0", "#0F1C4D"],
};

// Sinh số giả ngẫu nhiên ổn định theo id → mỗi máy một "vân mạch" riêng
function seeded(seed) {
  let s = (Number(seed) || 1) * 9301 + 49297;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

/**
 * Hình minh hoạ laptop sinh tự động: kích thước màn hình theo inch thật,
 * màu theo phân khúc, đường mạch theo id (gợi nhớ logo Use Your Mind).
 */
export default function LaptopVisual({ product, className = "" }) {
  const [broken, setBroken] = useState(false);
  if (isRealImage(product.image_url) && !broken) {
    return (
      <div className={`flex h-full w-full items-center justify-center overflow-hidden rounded-2xl bg-[#fff] p-2 ${className}`}>
        <img
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setBroken(true)}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }
  return <GeneratedLaptop product={product} className={className} />;
}

function GeneratedLaptop({ product, className }) {
  const [c1, c2, bg] = THEMES[product.category] || THEMES.General;
  const size = Number(product.screen_size_in) || 15.6;
  const t = Math.max(0, Math.min(1, (size - 11) / 7));
  const W = 320;
  const sw = 176 + t * 84;
  const sh = sw * 0.6;
  const sx = (W - sw) / 2;
  const sy = 22 + (1 - t) * 16;
  const gid = `g${product.id}`;
  const cid = `c${product.id}`;

  const rnd = seeded(product.id);
  const lines = Array.from({ length: 7 }, () => {
    const y = sy + 10 + rnd() * (sh - 20);
    const x1 = sx + rnd() * sw * 0.4;
    const len = 30 + rnd() * sw * 0.5;
    const bend = (rnd() > 0.5 ? 1 : -1) * (8 + rnd() * 18);
    return { x1, y, x2: x1 + len, y2: y + bend };
  });

  return (
    <svg
      viewBox="0 0 320 210"
      className={`h-full w-full ${className}`}
      role="img"
      aria-label={`Minh hoạ ${product.name}`}
    >
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={bg} />
          <stop offset="55%" stopColor={c2} stopOpacity=".85" />
          <stop offset="100%" stopColor={c1} />
        </linearGradient>
        <clipPath id={cid}>
          <rect x={sx} y={sy} width={sw} height={sh} rx="4" />
        </clipPath>
      </defs>

      {/* bóng đổ */}
      <ellipse cx="160" cy={sy + sh + 26} rx={sw * 0.62} ry="7" fill="rgb(var(--ink))" opacity=".10" />

      {/* viền màn hình */}
      <rect x={sx - 7} y={sy - 7} width={sw + 14} height={sh + 14} rx="11" fill="#0B1022" />
      <rect x={sx} y={sy} width={sw} height={sh} rx="4" fill={`url(#${gid})`} />

      {/* vân mạch */}
      <g clipPath={`url(#${cid})`} stroke="#fff" strokeOpacity=".35" strokeWidth="1.4" fill="none">
        {lines.map((l, i) => (
          <g key={i}>
            <polyline points={`${l.x1},${l.y} ${l.x2 - 10},${l.y} ${l.x2},${l.y2}`} />
            <circle cx={l.x2} cy={l.y2} r="2.6" fill="#fff" fillOpacity=".55" stroke="none" />
          </g>
        ))}
        <circle cx={sx + sw * 0.82} cy={sy + sh * 0.25} r={sh * 0.5} fill={c1} fillOpacity=".25" stroke="none" />
      </g>

      {/* tên hãng trên màn hình */}
      <text
        x="160"
        y={sy + sh / 2 + 6}
        textAnchor="middle"
        fontFamily="Space Grotesk, sans-serif"
        fontWeight="700"
        fontSize={14 + t * 6}
        letterSpacing="3"
        fill="#fff"
        opacity=".92"
      >
        {(product.brand || "LAPTOP").toUpperCase()}
      </text>

      {/* thân máy */}
      <path
        d={`M ${sx - 26} ${sy + sh + 9} L ${sx + sw + 26} ${sy + sh + 9} L ${sx + sw + 18} ${sy + sh + 20} Q ${sx + sw + 15} ${sy + sh + 22} ${sx + sw + 10} ${sy + sh + 22} L ${sx - 10} ${sy + sh + 22} Q ${sx - 15} ${sy + sh + 22} ${sx - 18} ${sy + sh + 20} Z`}
        fill="#D5DBE6"
      />
      <rect x={160 - sw * 0.12} y={sy + sh + 9} width={sw * 0.24} height="3.5" rx="1.75" fill="#AEB7C6" />

      {/* nhãn kích thước */}
      <text
        x={sx + sw + 4}
        y={sy - 12}
        textAnchor="end"
        fontFamily="JetBrains Mono, monospace"
        fontSize="10"
        fill="rgb(var(--ink))"
        opacity=".45"
      >
        {size}&quot;
      </text>
    </svg>
  );
}
