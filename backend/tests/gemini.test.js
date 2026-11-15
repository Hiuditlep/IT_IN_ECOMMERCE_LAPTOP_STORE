const test = require("node:test");
const assert = require("node:assert/strict");
const gemini = require("../services/gemini");

test("Gemini structured output stays on backend", async () => {
  const originalFetch = global.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  let request;
  global.fetch = async (url, options) => {
    request = { url, options };
    return { ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: '{"keywords":"gaming laptop"}' }] } }] }) };
  };
  try {
    assert.deepEqual(await gemini.generateJson("Extract", "laptop gaming", { type: "OBJECT" }), { keywords: "gaming laptop" });
    assert.match(request.url, /:generateContent$/);
    assert.equal(request.options.headers["x-goog-api-key"], "test-key");
  } finally {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
  }
});
