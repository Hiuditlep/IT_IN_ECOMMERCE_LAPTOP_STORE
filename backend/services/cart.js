class CartError extends Error {}

function normalizeItems(raw) {
  if (!Array.isArray(raw) || raw.length < 1 || raw.length > 50) throw new CartError("Giỏ hàng không hợp lệ");
  const merged = new Map();
  for (const item of raw) {
    const id = Number(item?.product_id ?? item?.id);
    const qty = Number(item?.quantity ?? item?.qty);
    if (!Number.isSafeInteger(id) || id < 1 || !Number.isSafeInteger(qty) || qty < 1 || qty > 20) {
      throw new CartError("Sản phẩm hoặc số lượng không hợp lệ");
    }
    merged.set(id, (merged.get(id) || 0) + qty);
    if (merged.get(id) > 20) throw new CartError("Số lượng sản phẩm vượt giới hạn");
  }
  return [...merged].map(([product_id, quantity]) => ({ product_id, quantity }));
}

async function priceItems(db, items) {
  let total_amount = 0;
  const priced = [];
  for (const item of items) {
    const { rows } = await db.query("SELECT product_id, name, price_vnd, stock_quantity FROM products WHERE product_id=$1", [item.product_id]);
    const product = rows[0];
    if (!product) throw new CartError(`Không tìm thấy sản phẩm ${item.product_id}`);
    if (Number(product.stock_quantity) < item.quantity) throw new CartError(`${product.name} không đủ hàng`);
    const unit_price = Number(product.price_vnd);
    const subtotal = unit_price * item.quantity;
    if (!Number.isSafeInteger(unit_price) || unit_price < 0 || !Number.isSafeInteger(subtotal) ||
        !Number.isSafeInteger(total_amount + subtotal)) throw new CartError(`${product.name} có giá không hợp lệ`);
    total_amount += subtotal;
    priced.push({ product_id: item.product_id, name: product.name, quantity: item.quantity, unit_price, subtotal });
  }
  return { items: priced, total_amount };
}

module.exports = { CartError, normalizeItems, priceItems };
