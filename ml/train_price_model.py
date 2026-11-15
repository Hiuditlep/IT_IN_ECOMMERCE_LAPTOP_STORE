"""
Mô hình XGBoost dự đoán "giá hợp lý" của laptop từ thông số kỹ thuật.

Quy trình:
  1. Lấy dữ liệu: từ PostgreSQL (DATABASE_URL) hoặc từ file CSV (--csv).
  2. Tạo đặc trưng (feature engineering) từ CPU, GPU, RAM, SSD, màn hình, ...
  3. Đánh giá trên tập kiểm tra 20% (MAE, MAPE, R²) và so với 2 mô hình cơ sở.
  4. Dự đoán giá cho TỪNG sản phẩm bằng 5-fold cross-validation
     (mỗi máy được dự đoán bởi mô hình KHÔNG nhìn thấy nó lúc huấn luyện).
  5. Gắn nhãn: Giá tốt / Hợp lý / Giá cao  →  ghi vào bảng price_predictions.

Chạy:
  ml/.venv/Scripts/python ml/train_price_model.py          # dùng database, ghi kết quả
  ml/.venv/Scripts/python ml/train_price_model.py --csv    # chỉ đánh giá trên CSV, không ghi DB
"""

import argparse
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.linear_model import Ridge
from sklearn.metrics import mean_absolute_error, mean_absolute_percentage_error, r2_score
from sklearn.model_selection import KFold, cross_val_predict, train_test_split
from xgboost import XGBRegressor

ROOT = Path(__file__).resolve().parent.parent
ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
CSV_PATH = ROOT / "backend" / "laptops_clean_FINAL.csv"
EGP_TO_VND = 500  # cùng tỷ giá với backend/seed.js
MODEL_VERSION = "xgb-price-v1"
GOOD_DEAL = 0.90   # giá thật < 90% giá dự đoán  → "good"
OVERPRICED = 1.15  # giá thật > 115% giá dự đoán → "high"
SEED = 42


# ---------------------------------------------------------------------------
# 1. DỮ LIỆU
# ---------------------------------------------------------------------------
def load_from_db(url):
    import psycopg

    sql = """
        SELECT p.product_id, p.name, p.price_vnd::float8 AS price_vnd,
               b.brand_name AS brand, c.category_name AS category,
               p.cpu, p.gpu, p.gpu_vram_gb::float8 AS gpu_vram_gb, p.ram_gb, p.ssd_gb, p.hdd_gb,
               p.screen_size_in::float8 AS screen_size_in, p.panel_type, p.resolution,
               p.refresh_rate_hz, p.weight_kg::float8 AS weight_kg,
               p.battery_wh::float8 AS battery_wh, p.operating_system
        FROM products p
        LEFT JOIN brands b ON b.brand_id = p.brand_id
        LEFT JOIN categories c ON c.category_id = p.category_id
        WHERE p.price_vnd > 0
    """
    with psycopg.connect(url) as conn:
        return pd.read_sql(sql, conn)


def load_from_csv():
    df = pd.read_csv(CSV_PATH, encoding="utf-8-sig")
    df = df.rename(columns={"id": "product_id"})
    df["price_vnd"] = pd.to_numeric(df["price"], errors="coerce") * EGP_TO_VND
    return df[df["price_vnd"] > 0].reset_index(drop=True)


def database_url():
    if os.environ.get("DATABASE_URL"):
        return os.environ["DATABASE_URL"]
    try:
        from dotenv import dotenv_values
    except ImportError:
        return None
    for p in (ROOT / "backend" / ".env.local", ROOT / ".env.local", ROOT / "backend" / ".env"):
        if p.exists():
            url = dotenv_values(p).get("DATABASE_URL")
            if url:
                return url
    return None


# ---------------------------------------------------------------------------
# 2. ĐẶC TRƯNG
# ---------------------------------------------------------------------------
def cpu_features(cpu):
    c = str(cpu or "").lower()
    tier = 2
    if re.search(r"ultra 9|i9|ryzen 9|ryzen ai 9|ryzen ai max", c):
        tier = 5
    elif re.search(r"ultra 7|i7|ryzen 7|ryzen ai 7|snapdragon x elite|core 7", c):
        tier = 4
    elif re.search(r"ultra 5|i5|ryzen 5|ryzen ai 5|snapdragon|core 5", c):
        tier = 3
    elif re.search(r"celeron|pentium|athlon|n100|n200|mediatek", c):
        tier = 1
    gen = 0
    m = re.search(r"i[3579]-(\d{2})\d{2,3}", c)
    if m:
        gen = int(m.group(1))
    m = re.search(r"ryzen [3579] (\d)\d{3}", c)
    if m:
        gen = int(m.group(1)) + 6  # đưa về thang gần với thế hệ Intel
    if re.search(r"ultra [579] 2\d\d", c):
        gen = 15
    elif "ultra" in c:
        gen = 14
    hx = 1 if re.search(r"\d{3,5}hx\b|\bhx\b", c) else 0
    low_power = 1 if re.search(r"\d{3,5}u\b|\d{3}v\b", c) else 0
    return tier, gen, hx, low_power


RTX_TIER = {50: 1, 60: 2, 70: 3, 80: 4, 90: 5}


def gpu_features(gpu):
    g = str(gpu or "").lower()
    m = re.search(r"rtx\s*(\d{2})(\d{2})\b", g)
    if m and int(m.group(2)) in RTX_TIER:
        return int(m.group(1)), RTX_TIER[int(m.group(2))], 1
    if re.search(r"rtx|quadro|rx\s*\d{4}|gtx|arc a\d", g):
        return 0, 1, 1
    return 0, 0, 0


def resolution_mp(res):
    m = re.search(r"(\d{3,4})\s*[x×*]\s*(\d{3,4})", str(res or ""))
    return int(m.group(1)) * int(m.group(2)) / 1e6 if m else np.nan


def build_features(df):
    X = pd.DataFrame(index=df.index)
    cpu = df["cpu"].apply(cpu_features)
    X["cpu_tier"] = [t[0] for t in cpu]
    X["cpu_gen"] = [t[1] for t in cpu]
    X["cpu_hx"] = [t[2] for t in cpu]
    X["cpu_low_power"] = [t[3] for t in cpu]
    gpu = df["gpu"].apply(gpu_features)
    X["gpu_series"] = [t[0] for t in gpu]
    X["gpu_tier"] = [t[1] for t in gpu]
    X["gpu_dedicated"] = [t[2] for t in gpu]
    for col in ["gpu_vram_gb", "ram_gb", "ssd_gb", "hdd_gb", "screen_size_in",
                "refresh_rate_hz", "weight_kg", "battery_wh"]:
        X[col] = pd.to_numeric(df[col], errors="coerce")
    X["resolution_mp"] = df["resolution"].apply(resolution_mp)
    panel = df["panel_type"].fillna("").str.lower()
    X["panel_oled"] = panel.str.contains("oled").astype(int)
    X["panel_miniled"] = panel.str.contains("mini").astype(int)
    X["os_windows_pro"] = df["operating_system"].fillna("").str.contains("Pro").astype(int)
    # Biến phân loại → one-hot
    cats = pd.get_dummies(df[["brand", "category"]].fillna("Unknown"), prefix=["brand", "cat"], dtype=int)
    return pd.concat([X, cats], axis=1)


def make_model():
    return XGBRegressor(
        n_estimators=600,
        learning_rate=0.05,
        max_depth=5,
        subsample=0.8,
        colsample_bytree=0.8,
        min_child_weight=2,
        reg_lambda=1.0,
        random_state=SEED,
        n_jobs=-1,
    )


def metrics(y_true, y_pred):
    return {
        "MAE_vnd": round(float(mean_absolute_error(y_true, y_pred))),
        "MAPE_pct": round(float(mean_absolute_percentage_error(y_true, y_pred)) * 100, 2),
        "R2": round(float(r2_score(y_true, y_pred)), 4),
    }


# ---------------------------------------------------------------------------
# 3–5. HUẤN LUYỆN, ĐÁNH GIÁ, GHI KẾT QUẢ
# ---------------------------------------------------------------------------
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--csv", action="store_true", help="Dùng CSV, chỉ đánh giá, không ghi database")
    args = ap.parse_args()

    url = None if args.csv else database_url()
    if not args.csv and not url:
        raise SystemExit("Không tìm thấy DATABASE_URL (backend/.env.local). Dùng --csv để chỉ đánh giá.")
    df = load_from_csv() if args.csv else load_from_db(url)
    source = "csv" if args.csv else "database"
    print(f"Nguồn dữ liệu: {source} – {len(df)} laptop")

    X = build_features(df)
    y = np.log1p(df["price_vnd"].to_numpy())  # dự đoán log(giá) vì giá lệch phải mạnh

    # --- Đánh giá trên tập kiểm tra 20% ---
    X_tr, X_te, y_tr, y_te = train_test_split(X, y, test_size=0.2, random_state=SEED)
    true_te = np.expm1(y_te)
    xgb = make_model().fit(X_tr, y_tr)
    ridge = Ridge(alpha=1.0).fit(X_tr.fillna(X_tr.median()), y_tr)
    results = {
        "baseline_median": metrics(true_te, np.full_like(true_te, np.expm1(np.median(y_tr)))),
        "baseline_linear_ridge": metrics(true_te, np.expm1(ridge.predict(X_te.fillna(X_tr.median())))),
        "xgboost": metrics(true_te, np.expm1(xgb.predict(X_te))),
    }
    print("\nĐánh giá trên tập kiểm tra (20%):")
    for name, m in results.items():
        print(f"  {name:<24} MAE={m['MAE_vnd']:>13,} ₫   MAPE={m['MAPE_pct']:>6}%   R²={m['R2']}")

    # --- Dự đoán cho mọi sản phẩm bằng 5-fold (out-of-fold) ---
    oof = np.expm1(cross_val_predict(make_model(), X, y, cv=KFold(5, shuffle=True, random_state=SEED)))
    ratio = df["price_vnd"].to_numpy() / oof
    label = np.where(ratio < GOOD_DEAL, "good", np.where(ratio > OVERPRICED, "high", "fair"))
    oof_metrics = metrics(df["price_vnd"], oof)
    print(f"\n5-fold CV trên toàn bộ: {oof_metrics}")
    counts = pd.Series(label).value_counts().to_dict()
    print(f"Nhãn: {counts}")

    # --- Mô hình cuối (học trên toàn bộ dữ liệu) + độ quan trọng đặc trưng ---
    final = make_model().fit(X, y)
    importance = (
        pd.Series(final.feature_importances_, index=X.columns).sort_values(ascending=False).head(15).round(4)
    )
    print("\nTop đặc trưng quan trọng:")
    for k, v in importance.head(8).items():
        print(f"  {k:<20} {v}")

    ARTIFACTS.mkdir(exist_ok=True)
    final.save_model(ARTIFACTS / "price_model.json")
    report = {
        "model_version": MODEL_VERSION,
        "trained_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "source": source,
        "n_samples": int(len(df)),
        "n_features": int(X.shape[1]),
        "target": "log1p(price_vnd)",
        "thresholds": {"good_deal_below": GOOD_DEAL, "overpriced_above": OVERPRICED},
        "holdout_test_20pct": results,
        "cv_5fold_all": oof_metrics,
        "label_counts": counts,
        "top_features": importance.to_dict(),
    }
    (ARTIFACTS / "metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nĐã lưu {ARTIFACTS / 'metrics.json'} và price_model.json")

    if args.csv:
        print("Chế độ --csv: không ghi database.")
        return

    import psycopg

    rows = [
        (int(pid), int(round(pred)), float(round(r, 4)), lab, MODEL_VERSION)
        for pid, pred, r, lab in zip(df["product_id"], oof, ratio, label)
    ]
    with psycopg.connect(url) as conn, conn.cursor() as cur:
        cur.execute((ROOT / "backend" / "migrations" / "002_price_predictions.sql").read_text(encoding="utf-8"))
        cur.executemany(
            """INSERT INTO price_predictions (product_id, predicted_price_vnd, price_ratio, price_label, model_version, updated_at)
               VALUES (%s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
               ON CONFLICT (product_id) DO UPDATE SET
                 predicted_price_vnd = EXCLUDED.predicted_price_vnd,
                 price_ratio = EXCLUDED.price_ratio,
                 price_label = EXCLUDED.price_label,
                 model_version = EXCLUDED.model_version,
                 updated_at = CURRENT_TIMESTAMP""",
            rows,
        )
    print(f"Đã ghi {len(rows)} dự đoán vào bảng price_predictions.")


if __name__ == "__main__":
    main()
