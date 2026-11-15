# Phần AI của dự án: RAG (LLM) + XGBoost

Tài liệu này giải thích hai thành phần AI trong web bán laptop, gồm lý thuyết, cách nhóm cài đặt, số liệu kết quả và các câu hỏi thầy có thể hỏi.

| Thành phần | Loại | Làm gì trên web | File chính |
|---|---|---|---|
| **Trợ lý mua sắm RAG** | LLM (Gemini) + truy xuất vector | Khách chat "tư vấn laptop đi học dưới 20 triệu", hệ thống trả về gợi ý **lấy từ đúng dữ liệu cửa hàng** | `backend/services/catalogSearch.js`, `backend/routes/aiRoutes.js`, `frontend/src/components/ShoppingAssistant.jsx` |
| **Định giá bằng XGBoost** | Machine Learning (hồi quy) | Dự đoán "giá hợp lý" của mỗi laptop từ thông số, gắn nhãn **Giá tốt / Giá hợp lý / Giá cao hơn thị trường** | `ml/train_price_model.py`, `frontend/src/components/PriceBadge.jsx` |

---

## Phần 1: RAG (Retrieval-Augmented Generation)

### 1.1 Vấn đề RAG giải quyết

Một LLM như Gemini hay ChatGPT **không biết cửa hàng mình đang bán máy nào, giá bao nhiêu, còn hàng không**. Nếu hỏi thẳng, nó sẽ "bịa" (gọi là *hallucination*): đưa ra tên máy không có, giá sai.

**RAG** sửa lỗi này bằng cách **tra cứu dữ liệu thật trước, rồi mới cho LLM trả lời dựa trên dữ liệu đó**:

```
 Câu hỏi khách ──► (R) RETRIEVAL: tìm laptop liên quan trong database
                         │
                         ▼
                   (A) AUGMENTED: nhét danh sách laptop thật vào prompt
                         │
                         ▼
                   (G) GENERATION: Gemini viết lời tư vấn CHỈ dựa trên danh sách đó
```

### 1.2 Embedding & tìm kiếm vector

- **Embedding** là cách biến một đoạn văn thành **một dãy số** (vector). Ở đây vector có 768 chiều, tạo bằng model `gemini-embedding-001`.
- Hai đoạn văn **gần nghĩa** sẽ cho hai vector **gần nhau** trong không gian. Ví dụ "máy nhẹ đi học pin tốt" sẽ gần với mô tả "Ultrabook 1,2 kg, pin 70 Wh", dù không trùng chữ nào.
- Độ gần được đo bằng **cosine similarity**: `cos(θ) = (A·B) / (|A|·|B|)`. Giá trị càng gần 1 thì càng giống nhau.
- Vector được lưu ngay trong PostgreSQL nhờ extension **pgvector**, ở bảng `product_embeddings`. Toán tử `<=>` tính khoảng cách cosine.
  Với khoảng 1.000 sản phẩm, nhóm tìm chính xác toàn bộ (không cần chỉ mục HNSW).

### 1.3 Luồng xử lý trong dự án (`POST /api/ai/assistant`)

1. **Hiểu ý định (intent extraction):** Gemini đọc câu của khách và trả về **JSON có cấu trúc** (structured output theo `responseSchema`), ví dụ:
   `"ASUS dưới 20 triệu, RAM 16GB"` → `{brand:"ASUS", max_price_vnd:20000000, min_ram_gb:16, keywords:"ASUS laptop"}`
   Prompt yêu cầu **không tự suy diễn** điều kiện khách không nói ra.
2. **Lọc cứng bằng SQL:** các điều kiện rõ ràng (giá, RAM, hãng, còn hàng…) thành mệnh đề `WHERE`, dùng **tham số hoá** (`$1, $2`) để chống SQL injection.
3. **Truy xuất ngữ nghĩa:** embed phần `keywords`, rồi `ORDER BY embedding <=> query_vector LIMIT 20`.
4. **Sinh câu trả lời:** đưa **tối đa 5 laptop** (dạng JSON: tên, giá, CPU, GPU, RAM…) vào prompt. Gemini trả JSON `{intro, recommendations[{product_id, reason}], follow_up}`.
5. **Rào chắn chống bịa (guardrails):**
   - Chỉ chấp nhận `product_id` có trong danh sách đã truy xuất. ID lạ bị loại.
   - Giá luôn lấy từ database để hiển thị, không lấy từ chữ của LLM.
   - `temperature: 0` để câu trả lời ổn định.
6. **Dự phòng (fallback):** không có API key hoặc Gemini lỗi thì dùng bộ hiểu câu bằng regex và tìm kiếm từ khoá, web vẫn chạy.

### 1.4 Chuẩn bị dữ liệu vector

```bash
cd backend
npm run migrate      # tạo extension vector + bảng product_embeddings
npm run index:ai     # tạo embedding cho từng sản phẩm (có thể chạy lại để tiếp tục)
```

Cần `GEMINI_API_KEY` trong `backend/.env.local` (lấy miễn phí tại Google AI Studio).

---

## Phần 2: XGBoost dự đoán giá hợp lý

### 2.1 Bài toán

- **Loại bài toán:** hồi quy có giám sát (supervised regression).
- **Đầu vào (X):** thông số kỹ thuật của laptop.
- **Đầu ra (y):** giá bán (VND).
- **Ứng dụng:** so sánh **giá thật** với **giá mô hình dự đoán**. Máy bán rẻ hơn nhiều so với các máy cùng cấu hình được gắn nhãn **"Giá tốt"**.

### 2.2 XGBoost là gì?

**XGBoost** (eXtreme Gradient Boosting) là thuật toán **Gradient Boosting trên cây quyết định**:

1. Bắt đầu bằng một dự đoán đơn giản (ví dụ giá trung bình).
2. Tính **phần dư** (residual) = giá thật − giá dự đoán.
3. Huấn luyện **một cây quyết định nhỏ** để dự đoán phần dư đó.
4. Cộng cây mới vào mô hình, nhân với **learning rate** (0,05) để học từ từ.
5. Lặp lại nhiều lần (600 cây). Mỗi cây sửa lỗi của các cây trước.

```
dự_đoán = f₀ + η·cây₁(x) + η·cây₂(x) + … + η·cây₆₀₀(x)
```

Điểm "eXtreme" so với Gradient Boosting thường:
- **Regularization** (`reg_lambda`) phạt cây quá phức tạp, chống **overfitting**.
- Dùng **đạo hàm bậc 2** (Newton) để tìm điểm chia tốt hơn.
- Tự xử lý **giá trị thiếu** (ví dụ máy không ghi cân nặng).
- **Subsampling** (`subsample=0.8`, `colsample_bytree=0.8`): mỗi cây chỉ học trên 80% dữ liệu và 80% đặc trưng, giúp mô hình tổng quát hơn.

Vì sao chọn XGBoost: dữ liệu dạng **bảng**, quan hệ **phi tuyến** (RTX 4090 không đắt gấp đôi 4060 theo kiểu tuyến tính), có giá trị thiếu. Đây là đúng thế mạnh của cây boosting.

### 2.3 Tạo đặc trưng (feature engineering)

Dữ liệu gốc là chữ (ví dụ `"Intel Core i9-14900HX"`), nên phải chuyển thành số:

| Đặc trưng | Cách tạo |
|---|---|
| `cpu_tier` (1–5) | i3/Ryzen 3 → 2, i5 → 3, i7 → 4, i9/Ultra 9 → 5, Celeron → 1 |
| `cpu_gen`, `cpu_hx`, `cpu_low_power` | Thế hệ CPU, dòng HX hiệu năng cao, dòng U tiết kiệm điện |
| `gpu_series`, `gpu_tier`, `gpu_dedicated` | RTX **40**60 → series 40, tier 2. Có card rời hay không |
| `ram_gb`, `ssd_gb`, `gpu_vram_gb`, `screen_size_in`, `refresh_rate_hz`, `weight_kg`, `battery_wh` | Số có sẵn |
| `resolution_mp` | 2560×1440 → 3,69 megapixel |
| `panel_oled`, `panel_miniled` | Tấm nền cao cấp |
| `brand_*`, `cat_*` | **One-hot encoding** cho hãng và phân khúc |

**Biến đổi mục tiêu:** mô hình dự đoán `log(1 + giá)` thay vì giá. Lý do là giá **lệch phải** (vài máy 160 triệu, đa số 15–30 triệu). Dùng log giúp mô hình học **sai số theo phần trăm** thay vì để vài máy đắt chi phối.

### 2.4 Đánh giá mô hình

- **Chia dữ liệu:** 80% huấn luyện, 20% kiểm tra (`random_state=42`).
- **Mô hình cơ sở (baseline)** để so sánh: đoán giá trung vị, và hồi quy tuyến tính Ridge.

**Kết quả trên tập kiểm tra (1.013 laptop):**

| Mô hình | MAE (sai số trung bình) | MAPE (sai số %) | R² |
|---|---|---|---|
| Đoán giá trung vị | 10,14 triệu ₫ | 43,9% | −0,08 |
| Hồi quy tuyến tính (Ridge) | 5,73 triệu ₫ | 21,7% | 0,68 |
| **XGBoost** | **3,93 triệu ₫** | **16,0%** | **0,86** |

5-fold cross-validation trên toàn bộ dữ liệu: **R² = 0,91, MAPE = 15,0%**.

Ý nghĩa các chỉ số:
- **MAE**: trung bình mô hình đoán lệch khoảng 3,9 triệu.
- **MAPE**: trung bình lệch khoảng 16% so với giá thật.
- **R² = 0,86**: mô hình giải thích được **86% sự biến động giá**. Bằng 1 là hoàn hảo, bằng 0 thì không hơn gì đoán trung bình.

**Đặc trưng quan trọng nhất** (feature importance): RAM, VRAM của GPU, dung lượng SSD, cấp CPU, hãng (Microsoft), độ phân giải màn hình. Kết quả này **hợp lý về mặt thực tế**, cho thấy mô hình học đúng quy luật.

> Số liệu chi tiết nằm trong `ml/artifacts/metrics.json`, được tạo lại mỗi lần chạy script.

### 2.5 Gắn nhãn giá: tránh "gian lận" dữ liệu

Nếu huấn luyện trên toàn bộ dữ liệu rồi dự đoán lại chính những máy đó, mô hình đã **"thấy đáp án"**, nên giá dự đoán gần như trùng giá thật (data leakage).

Vì vậy nhóm dùng **out-of-fold prediction** (5-fold): chia dữ liệu thành 5 phần, dự đoán mỗi phần bằng mô hình học từ 4 phần còn lại. **Mỗi máy được định giá bởi một mô hình chưa từng thấy nó.**

```
tỷ lệ = giá thật / giá dự đoán
  < 0,90  → "good"  (Giá tốt: rẻ hơn ≥10% so với máy cùng cấu hình)
  > 1,15  → "high"  (Giá cao hơn thị trường)
  còn lại → "fair"  (Giá hợp lý)
```

Kết quả: 267 máy giá tốt, 543 máy hợp lý, 203 máy giá cao. Dự đoán được lưu vào bảng `price_predictions`, backend JOIN vào API sản phẩm.

### 2.6 Chạy lại mô hình

```bash
py -3.11 -m venv ml/.venv
ml/.venv/Scripts/python -m pip install -r ml/requirements.txt

ml/.venv/Scripts/python ml/train_price_model.py --csv   # chỉ đánh giá trên CSV, không ghi DB
ml/.venv/Scripts/python ml/train_price_model.py         # đọc từ DB, ghi bảng price_predictions
```

Lệnh thứ hai cần `DATABASE_URL` trong `backend/.env.local`. Script chỉ **thêm** bảng `price_predictions`, không xoá dữ liệu.

---

## Phần 3: Hạn chế (nên chủ động nói khi thuyết trình)

- Dữ liệu chỉ có ~1.000 máy, giá quy đổi từ một bộ dữ liệu nước ngoài (EGP × 500), nên chưa phản ánh đúng thị trường Việt Nam.
- XGBoost không biết yếu tố ngoài thông số như độ bền, thương hiệu dòng máy, khuyến mãi.
- "Giá tốt" chỉ có nghĩa là **rẻ so với các máy có thông số tương tự trong bộ dữ liệu**.
- RAG phụ thuộc Gemini API (giới hạn số request ở gói miễn phí). Đã có cơ chế dự phòng.

## Phần 4: Câu hỏi thầy có thể hỏi

| Câu hỏi | Gợi ý trả lời |
|---|---|
| RAG khác fine-tuning thế nào? | Fine-tuning **dạy lại** model (tốn kém, dữ liệu cố định). RAG **không sửa model**, chỉ tra cứu dữ liệu mới mỗi lần hỏi, nên giá hay tồn kho thay đổi là cập nhật ngay. |
| Làm sao biết LLM không bịa? | Chỉ đưa dữ liệu thật vào prompt, chỉ chấp nhận ID có trong danh sách, giá hiển thị lấy từ DB, `temperature = 0`. |
| Vì sao không dùng hồi quy tuyến tính? | Đã thử làm baseline: R² chỉ 0,68 so với 0,86 của XGBoost, vì quan hệ giữa thông số và giá là phi tuyến. |
| Overfitting xử lý ra sao? | Learning rate nhỏ, `max_depth=5`, regularization, subsampling, và đánh giá trên tập test riêng cùng 5-fold CV. |
| Vì sao dự đoán log(giá)? | Giá lệch phải. Log giúp tối ưu sai số tương đối và giảm ảnh hưởng của máy rất đắt. |
| Cosine similarity là gì? | Đo góc giữa hai vector, không phụ thuộc độ dài. Gần 1 nghĩa là cùng hướng, tức cùng ngữ nghĩa. |
