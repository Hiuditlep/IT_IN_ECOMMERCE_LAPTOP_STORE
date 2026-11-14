import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchProducts } from "./lib/api";
import { DEFAULT_PROFILE, isRealImage, matchScore, scoreProduct } from "./lib/mind";

// Danh mục trưng bày: toàn bộ máy có ảnh thật + bổ sung cho đủ ~300 máy,
// chia đều các phân khúc. Dữ liệu gốc trên Neon không bị xoá.
// Đặt CATALOG_SIZE = Infinity để hiển thị lại toàn bộ sản phẩm.
const CATALOG_SIZE = 300;
const CATEGORY_QUOTA = { Ultrabook: 60, Business: 60, General: 60, Creator: 6, Gaming: 44 };

function pickCatalog(all) {
  if (!Number.isFinite(CATALOG_SIZE) || all.length <= CATALOG_SIZE) return all;
  const real = all.filter((p) => isRealImage(p.image_url));
  const rest = all.filter((p) => !isRealImage(p.image_url));
  const picked = [];
  for (const [cat, quota] of Object.entries(CATEGORY_QUOTA)) {
    const pool = rest.filter((p) => p.category === cat);
    // Lấy mẫu rải đều theo id để đa dạng hãng và mức giá
    const step = Math.max(1, pool.length / quota);
    for (let i = 0; i < quota && Math.floor(i * step) < pool.length; i++) picked.push(pool[Math.floor(i * step)]);
  }
  const ids = new Set(picked.map((p) => p.id ?? p.product_id));
  const filler = rest.filter((p) => !ids.has(p.id ?? p.product_id));
  return [...real, ...picked, ...filler].slice(0, Math.max(CATALOG_SIZE, real.length));
}

const StoreCtx = createContext(null);

// localStorage có thể bị chặn (chế độ ẩn danh...) nên luôn bọc try/catch
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}
function save(key, value) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* bỏ qua */
  }
}

export function StoreProvider({ children }) {
  const navigate = useNavigate();

  // ---------- Sản phẩm ----------
  const [raw, setRaw] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | error
  const reload = useCallback(() => {
    setStatus("loading");
    fetchProducts()
      .then((data) => {
        setRaw(data);
        setStatus("ready");
      })
      .catch((err) => {
        console.error("Lỗi tải sản phẩm:", err);
        setStatus("error");
      });
  }, []);
  useEffect(() => {
    reload();
  }, [reload]);

  const products = useMemo(
    () =>
      pickCatalog(raw).map((p) => {
        const id = p.id ?? p.product_id;
        const price = Number(p.price_vnd || p.price || 0);
        return { ...p, id, price, stock_quantity: Number(p.stock_quantity ?? 10), scores: scoreProduct(p) };
      }),
    [raw],
  );
  const brands = useMemo(() => {
    const count = {};
    products.forEach((p) => p.brand && (count[p.brand] = (count[p.brand] || 0) + 1));
    return Object.keys(count).sort((a, b) => count[b] - count[a]);
  }, [products]);

  // ---------- Hồ sơ nhu cầu (MindMatch) ----------
  const [profile, setProfileState] = useState(() => load("uym_profile", DEFAULT_PROFILE));
  const setProfile = useCallback((next) => {
    setProfileState((prev) => {
      const value = typeof next === "function" ? next(prev) : next;
      save("uym_profile", value);
      return value;
    });
  }, []);
  const ranked = useMemo(
    () =>
      products
        .map((p) => ({ ...p, match: matchScore(p, profile) }))
        .sort((a, b) => b.match - a.match || a.price - b.price),
    [products, profile],
  );
  const matchOf = useMemo(() => {
    const m = new Map();
    ranked.forEach((p) => m.set(p.id, p.match));
    return m;
  }, [ranked]);

  // ---------- Người dùng ----------
  const [user, setUserState] = useState(() => load("user", null));
  const setUser = useCallback((u) => {
    setUserState(u);
    save("user", u);
  }, []);

  // ---------- Thông báo ----------
  const [toasts, setToasts] = useState([]);
  const tid = useRef(0);
  const toast = useCallback((message, opts = {}) => {
    const id = ++tid.current;
    setToasts((t) => [...t, { id, message, ...opts }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), opts.duration || 2800);
  }, []);

  // ---------- Giỏ hàng (lưu lại khi tải lại trang) ----------
  const [cart, setCart] = useState(() => load("uym_cart", []));
  const [cartOpen, setCartOpen] = useState(false);
  useEffect(() => {
    save("uym_cart", cart);
  }, [cart]);

  const addToCart = useCallback(
    (product) => {
      if (!user) {
        toast("Đăng nhập để thêm vào giỏ hàng", { tone: "info" });
        navigate("/auth");
        return;
      }
      const stock = Number(product.stock_quantity ?? 10);
      if (stock <= 0) {
        toast("Sản phẩm tạm hết hàng", { tone: "warn" });
        return;
      }
      const found = cart.find((i) => i.id === product.id);
      if (found && found.qty >= stock) {
        toast(`Kho chỉ còn ${stock} sản phẩm`, { tone: "warn" });
        return;
      }
      const price = Number(product.price_vnd || product.price || 0);
      // eslint-disable-next-line no-unused-vars
      const { scores, match, similarity, ...rest } = product;
      setCart((prev) =>
        prev.some((i) => i.id === product.id)
          ? prev.map((i) => (i.id === product.id ? { ...i, qty: i.qty + 1 } : i))
          : [...prev, { ...rest, price, qty: 1 }],
      );
      toast(`Đã thêm “${product.name}”`, { tone: "ok" });
      setCartOpen(true);
    },
    [user, cart, navigate, toast],
  );
  const updateQuantity = useCallback(
    (id, delta) =>
      setCart((prev) =>
        prev.map((i) => {
          if (i.id !== id) return i;
          const qty = Math.min(Math.max(1, i.qty + delta), Number(i.stock_quantity ?? 10));
          return { ...i, qty };
        }),
      ),
    [],
  );
  const removeFromCart = useCallback((id) => setCart((prev) => prev.filter((i) => i.id !== id)), []);
  const clearCart = useCallback(() => setCart([]), []);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);
  const cartTotal = cart.reduce((s, i) => s + Number(i.price) * i.qty, 0);

  // ---------- So sánh ----------
  const [compareIds, setCompareIds] = useState(() => load("uym_compare", []));
  useEffect(() => {
    save("uym_compare", compareIds);
  }, [compareIds]);
  const toggleCompare = useCallback(
    (id) => {
      setCompareIds((prev) => {
        if (prev.includes(id)) return prev.filter((x) => x !== id);
        if (prev.length >= 3) {
          toast("So sánh tối đa 3 máy cùng lúc", { tone: "warn" });
          return prev;
        }
        return [...prev, id];
      });
    },
    [toast],
  );
  const compareList = useMemo(
    () => compareIds.map((id) => products.find((p) => p.id === id)).filter(Boolean),
    [compareIds, products],
  );

  // ---------- Bảng lệnh (Ctrl+K) ----------
  const [paletteOpen, setPaletteOpen] = useState(false);

  // ---------- Giao diện sáng / tối ----------
  const [theme, setTheme] = useState(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  const toggleTheme = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      try {
        localStorage.setItem("uym_theme", next);
      } catch {
        /* bỏ qua */
      }
      return next;
    });
  }, []);

  const value = {
    theme,
    toggleTheme,
    products,
    ranked,
    matchOf,
    brands,
    status,
    reload,
    profile,
    setProfile,
    user,
    setUser,
    cart,
    cartCount,
    cartTotal,
    cartOpen,
    setCartOpen,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    compareIds,
    compareList,
    toggleCompare,
    clearCompare: () => setCompareIds([]),
    paletteOpen,
    setPaletteOpen,
    toasts,
    toast,
  };

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore phải nằm trong StoreProvider");
  return ctx;
}
