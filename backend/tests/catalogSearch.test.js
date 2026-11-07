const test = require("node:test");
const assert = require("node:assert/strict");
const { normalizeIntent, fallbackIntent, filterSql } = require("../services/catalogSearch");

test("intent keeps explicit filters and rejects invalid numbers", () => {
  assert.deepEqual(normalizeIntent({ keywords: "lightweight laptop", max_price_vnd: 20000000,
    min_ram_gb: 16, min_ssd_gb: -1 }, "laptop nhẹ"),
  { keywords: "lightweight laptop", max_price_vnd: 20000000, min_ram_gb: 16 });
});

test("SQL uses parameters for user filters", () => {
  const params = [];
  const sql = filterSql({ brand: "ASUS", max_price_vnd: 20000000 }, params);
  assert.match(sql, /LOWER\(b\.brand_name\) = LOWER\(\$1\)/);
  assert.match(sql, /p\.price_vnd <= \$2/);
  assert.deepEqual(params, ["ASUS", 20000000]);
});

test("fallback preserves an explicit Vietnamese budget and hardware requirements", () => {
  const intent = fallbackIntent("Laptop ASUS dưới 20 triệu, RAM 16GB, SSD 512GB");
  assert.equal(intent.brand, "ASUS");
  assert.equal(intent.max_price_vnd, 20000000);
  assert.equal(intent.min_ram_gb, 16);
  assert.equal(intent.min_ssd_gb, 512);

  const params = [];
  const sql = filterSql(intent, params);
  assert.match(sql, /p\.price_vnd <= \$2/);
  assert.deepEqual(params, ["ASUS", 20000000, 16, 512]);
});

test("fallback does not infer a budget that was not stated", () => {
  const intent = fallbackIntent("Laptop học tập pin tốt");
  assert.equal(intent.max_price_vnd, undefined);
});
