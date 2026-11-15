const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models";
const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-3.5-flash-lite";
const EMBEDDING_MODEL = "gemini-embedding-001";
const EMBEDDING_DIMENSIONS = 768;

function isConfigured() {
  return Boolean(process.env.GEMINI_API_KEY);
}

async function request(model, action, body) {
  if (!isConfigured()) throw new Error("GEMINI_API_KEY chưa được cấu hình");

  const response = await fetch(`${GEMINI_BASE_URL}/${model}:${action}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": process.env.GEMINI_API_KEY,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    // Do not log the request or key. The caller can fall back to catalog search.
    throw new Error(`Gemini API trả về HTTP ${response.status}`);
  }
  return response.json();
}

async function generateJson(systemPrompt, userPrompt, schema) {
  const data = await request(CHAT_MODEL, "generateContent", {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: schema,
    },
  });
  const answer = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("");
  if (!answer) throw new Error("Gemini không trả về nội dung JSON");
  return JSON.parse(answer);
}

async function embedText(text, taskType, title) {
  const data = await request(EMBEDDING_MODEL, "embedContent", {
    model: `models/${EMBEDDING_MODEL}`,
    content: { parts: [{ text }] },
    taskType,
    ...(title ? { title } : {}),
    outputDimensionality: EMBEDDING_DIMENSIONS,
  });
  const values = data.embedding?.values;
  if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
    throw new Error("Embedding không đúng số chiều");
  }
  return values;
}

module.exports = { isConfigured, generateJson, embedText, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS };
