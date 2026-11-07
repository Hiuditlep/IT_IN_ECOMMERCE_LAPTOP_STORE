# Laptop e-commerce demo

React/Vite frontend, Express backend and Neon PostgreSQL catalog. AI uses Gemini to extract explicit laptop requirements, filters prices/specs in SQL, ranks products with embeddings, and explains real database products in a shopping assistant.

## Setup

1. In `backend/.env.local`, paste the Neon connection string into `DATABASE_URL` and a Google AI Studio key into `GEMINI_API_KEY`. Keep this file private. `backend/.env.example` shows the format.
2. Run `npm ci` in both `backend/` and `frontend/`.
3. Run `npm run migrate` in `backend/`. This adds only the pgvector extension and `product_embeddings` table; existing products and orders stay intact.
4. Run `npm run index:ai` in `backend/` to embed the existing products. This makes API calls for the catalog, skips unchanged rows on later runs, and can be rerun after rate limiting. Set `INDEX_LIMIT=20` for a small first batch.
5. Run `npm run dev` in both directories in separate terminals.

Do not rerun `backend/seed.js` on a shared database: it drops all existing tables.

## Features and limits

- `POST /api/ai/search` accepts `{ "query": "Laptop nhẹ dưới 20 triệu" }`. It returns `mode: "semantic"` when Gemini and the vector index work, or `mode: "keyword"` as fallback.
- `POST /api/ai/assistant` accepts `{ "message": "...", "history": [] }` and returns up to three linked products from the catalog. Product prices come from PostgreSQL.
- `POST /api/cart/calculate` uses product IDs and quantities to calculate a quote. Orders recalculate total from PostgreSQL; browser-supplied prices are ignored.

The original CSV has 1,013 laptops but blank currency, stock and image fields. The seed script assigns stock 10 and converts prices with a fixed multiplier. Confirm the source currency before presenting prices as real. Authentication remains the original mockup and admin routes are not protected server-side; complete authentication before public deployment.

## Checks

Run `npm test` in `backend/` and `npm run build` plus `npm run lint` in `frontend/`. After indexing, try queries such as `ASUS dưới 20 triệu RAM ít nhất 16GB`, `máy nhẹ đi học pin tốt`, and `gaming RTX màn 144Hz`.
