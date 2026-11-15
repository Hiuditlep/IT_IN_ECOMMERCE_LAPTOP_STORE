// Địa chỉ backend. Trên Vercel đặt biến VITE_API_URL (loại Config) = URL của project backend.
export const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");
