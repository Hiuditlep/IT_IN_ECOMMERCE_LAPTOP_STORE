const test = require("node:test");
const assert = require("node:assert/strict");
const { CartError, normalizeItems, priceItems } = require("../services/cart");

test("cart ignores browser prices and calculates database total", async () => {
  const items = normalizeItems([{ product_id: 7, quantity: 1, unit_price: 1 }, { product_id: 7, quantity: 2, unit_price: 1 }]);
  assert.deepEqual(items, [{ product_id: 7, quantity: 3 }]);
  const db = { query: async () => ({ rows: [{ product_id: 7, name: "Laptop", price_vnd: "10000000", stock_quantity: 3 }] }) };
  assert.equal((await priceItems(db, items)).total_amount, 30000000);
});

test("cart rejects invalid quantities and insufficient stock", async () => {
  assert.throws(() => normalizeItems([{ product_id: 1, quantity: -1 }]), CartError);
  const db = { query: async () => ({ rows: [{ product_id: 1, name: "Laptop", price_vnd: "100", stock_quantity: 1 }] }) };
  await assert.rejects(priceItems(db, [{ product_id: 1, quantity: 2 }]), CartError);
});
