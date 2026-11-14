// Địa chỉ backend – có thể đổi bằng biến môi trường VITE_API_URL trong frontend/.env
export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function fetchProducts() {
  const res = await fetch(`${API_URL}/api/products`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
