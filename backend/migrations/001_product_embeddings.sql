-- Run against the existing catalog. Do not rerun seed.js: it drops all tables.
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS product_embeddings (
  product_id INTEGER PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
  embedding vector(768) NOT NULL,
  model TEXT NOT NULL,
  source_hash TEXT NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- With roughly 1,000 products, exact nearest-neighbor search is sufficient.
-- An HNSW index can be added after measuring a larger catalog's query latency.
