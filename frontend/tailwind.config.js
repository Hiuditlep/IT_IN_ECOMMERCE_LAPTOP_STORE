/** @type {import('tailwindcss').Config} */

// Một tông chủ đạo duy nhất: xanh "mind" lấy từ logo Use Your Mind
const mind = {
  50: "rgb(var(--mind-50) / <alpha-value>)",
  100: "rgb(var(--mind-100) / <alpha-value>)",
  200: "rgb(var(--mind-200) / <alpha-value>)",
  300: "#8AADFF",
  400: "#5A86FF",
  500: "#3463FF",
  600: "#1F4BF0",
  700: "#183BC4",
  800: "#17349B",
  900: "#172F7A",
  950: "#0F1C4D",
};

// Thang xám tự đảo chiều ở chế độ tối (cho các trang cũ dùng gray-*)
const gray = Object.fromEntries(
  [50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((k) => [k, `rgb(var(--g${k}) / <alpha-value>)`]),
);

const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mind,
        red: mind, // trang cũ dùng red-* → màu thương hiệu
        gray,
        ink: v("ink"), // chữ / viền (đảo chiều theo theme)
        paper: v("paper"), // nền trang
        surface: v("surface"), // nền thẻ
        accent: v("accent"), // xanh nhấn, sáng hơn ở chế độ tối
        warn: "#F59E0B",
        danger: "#E5484D",
      },
      fontFamily: {
        display: ['"Space Grotesk"', '"Be Vietnam Pro"', "system-ui", "sans-serif"],
        sans: ['"Be Vietnam Pro"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
      },
      keyframes: {
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        fadeUp: "fadeUp .5s cubic-bezier(.2,.7,.2,1) both",
        slideIn: "slideIn .35s cubic-bezier(.2,.7,.2,1) both",
        pop: "pop .2s ease-out both",
      },
    },
  },
  plugins: [],
};
