-- Kết quả mô hình XGBoost dự đoán giá hợp lý (ghi bởi ml/train_price_model.py).
-- Chỉ thêm bảng mới, không đụng tới dữ liệu cũ. Không chạy lại seed.js.
CREATE TABLE IF NOT EXISTS price_predictions (
  product_id INTEGER PRIMARY KEY REFERENCES products(product_id) ON DELETE CASCADE,
  predicted_price_vnd BIGINT NOT NULL,
  price_ratio NUMERIC(6, 4) NOT NULL,          -- giá thật / giá dự đoán
  price_label TEXT NOT NULL CHECK (price_label IN ('good', 'fair', 'high')),
  model_version TEXT NOT NULL,
  updated_at TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
