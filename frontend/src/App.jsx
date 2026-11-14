import { useEffect, useState } from "react";
import { BrowserRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "./store";

import CommandPalette from "./components/CommandPalette";
import { CartDrawer, CompareDock, Toasts } from "./components/Overlays";
import { CartIcon, CompareIcon, MoonIcon, SearchIcon, SunIcon, UserIcon } from "./components/Icons";

import Home from "./pages/Home";
import Detail from "./pages/Detail";
import Cart from "./pages/Cart";
import Compare from "./pages/Compare";
import Auth from "./pages/Auth";
import Checkout from "./pages/Checkout";
import Admin from "./pages/Admin";
import Profile from "./pages/Profile";
import MyOrders from "./pages/MyOrders";
import SearchPage from "./pages/SearchPage";

const iconBtn = "relative rounded-full p-2.5 text-ink/70 transition hover:bg-ink/5 hover:text-ink";

function Header() {
  const { user, setUser, cartCount, setCartOpen, setPaletteOpen, compareIds, toast, theme, toggleTheme } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const isMac = typeof navigator !== "undefined" && /mac/i.test(navigator.platform);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navCls = ({ isActive }) =>
    `rounded-full px-3 py-1.5 text-sm font-medium transition ${isActive ? "bg-ink/[.07] text-ink" : "text-ink/55 hover:text-ink"}`;

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-colors ${scrolled ? "border-b border-ink/[.06] bg-paper/80 backdrop-blur-xl" : ""}`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:gap-5 md:px-8">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-white ring-1 ring-ink/10">
            <img src="/Logo.png" alt="" className="h-full w-full scale-[1.55] object-cover object-[50%_32%]" />
          </span>
          <span className="hidden font-display text-[17px] font-bold tracking-tight sm:block">
            UseYour<span className="text-accent">Mind</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          <NavLink to="/" end className={navCls}>Khám phá</NavLink>
          <NavLink to="/compare" className={navCls}>
            So sánh{compareIds.length ? ` · ${compareIds.length}` : ""}
          </NavLink>
        </nav>

        <button
          onClick={() => setPaletteOpen(true)}
          className="flex h-10 min-w-0 flex-1 items-center gap-3 rounded-full border border-ink/10 bg-surface px-4 text-left text-sm text-ink/45 transition hover:border-ink/25 md:ml-auto md:max-w-md"
        >
          <SearchIcon className="h-4 w-4 shrink-0" />
          <span className="truncate">Tìm laptop…</span>
          <kbd className="ml-auto hidden shrink-0 rounded-md border border-ink/10 px-1.5 py-0.5 font-mono text-[11px] sm:block">
            {isMac ? "⌘" : "Ctrl"} K
          </kbd>
        </button>

        <div className="flex shrink-0 items-center">
          <button onClick={toggleTheme} className={iconBtn} aria-label={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"} title={theme === "dark" ? "Chế độ sáng" : "Chế độ tối"}>
            {theme === "dark" ? <SunIcon /> : <MoonIcon />}
          </button>

          <Link to="/compare" className={`${iconBtn} lg:hidden`} aria-label="So sánh">
            <CompareIcon />
            {compareIds.length > 0 && <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-mind-500" />}
          </Link>

          {user ? (
            <div className="group relative">
              <button className="flex items-center rounded-full p-1.5" aria-haspopup="menu" aria-label="Tài khoản">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-mind-600 text-sm font-bold text-white">
                  {(user.full_name || user.username || "U").trim().charAt(0).toUpperCase()}
                </span>
              </button>
              <div className="invisible absolute right-0 top-full w-52 translate-y-1 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:translate-y-0 group-focus-within:opacity-100 group-hover:visible group-hover:translate-y-0 group-hover:opacity-100">
                <div className="rounded-2xl border border-ink/[.07] bg-surface p-1.5 shadow-xl" role="menu">
                  <p className="truncate px-3 py-2 text-xs text-ink/45">{user.email || user.username}</p>
                  <Link to="/profile" className="block rounded-xl px-3 py-2 text-sm hover:bg-ink/5">Tài khoản</Link>
                  <Link to="/my-orders" className="block rounded-xl px-3 py-2 text-sm hover:bg-ink/5">Đơn mua</Link>
                  {user.role === "admin" && (
                    <Link to="/admin" className="block rounded-xl px-3 py-2 text-sm font-semibold text-accent hover:bg-ink/5">Quản trị</Link>
                  )}
                  <button
                    onClick={() => {
                      setUser(null);
                      toast("Đã đăng xuất");
                    }}
                    className="block w-full rounded-xl px-3 py-2 text-left text-sm text-danger hover:bg-ink/5"
                  >
                    Đăng xuất
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <Link to="/auth" className={iconBtn} aria-label="Đăng nhập" title="Đăng nhập">
              <UserIcon />
            </Link>
          )}

          <button
            onClick={() => setCartOpen(true)}
            className="ml-1 flex items-center gap-2 rounded-full bg-ink px-3 py-2.5 text-paper transition hover:opacity-85"
            aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
          >
            <CartIcon className="h-5 w-5" />
            <span className="font-mono text-sm font-semibold">{cartCount}</span>
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-ink/[.06]">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-ink/50 md:px-8">
        <span className="font-display font-bold text-ink">
          UseYour<span className="text-accent">Mind</span>
        </span>
        <nav className="flex gap-5">
          <Link to="/" className="hover:text-ink">Khám phá</Link>
          <Link to="/compare" className="hover:text-ink">So sánh</Link>
          <Link to="/my-orders" className="hover:text-ink">Đơn mua</Link>
        </nav>
        <span className="font-mono text-[11px]">© {new Date().getFullYear()} · Điểm phù hợp mang tính tham khảo</span>
      </div>
    </footer>
  );
}

function Shell({ children }) {
  return <div className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8">{children}</div>;
}

function ScrollToTop() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname, search]);
  return null;
}

function AppContent() {
  const { cart, user, setUser, clearCart, updateQuantity, removeFromCart } = useStore();

  return (
    <div className="flex min-h-screen w-full flex-col">
      <ScrollToTop />
      <Header />
      <main className="w-full flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<SearchPage />} />
          <Route path="/product/:id" element={<Detail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/cart" element={<Cart cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart} />} />
          <Route path="/auth" element={<Shell><Auth setUser={setUser} /></Shell>} />
          <Route path="/checkout" element={<Shell><Checkout cart={cart} user={user} clearCart={clearCart} /></Shell>} />
          <Route path="/admin" element={<Shell><Admin /></Shell>} />
          <Route path="/profile" element={<Shell><Profile user={user} setUser={setUser} /></Shell>} />
          <Route path="/my-orders" element={<Shell><MyOrders user={user} /></Shell>} />
        </Routes>
      </main>
      <Footer />
      <CartDrawer />
      <CompareDock />
      <CommandPalette />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <AppContent />
      </StoreProvider>
    </BrowserRouter>
  );
}
