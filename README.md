# UseYourMind – Laptop Store

Cửa hàng laptop trực tuyến, đồ án môn **IT in E-commerce**.

Thay vì bắt người dùng lọc qua hàng trăm thông số, web hỏi **"bạn là ai"** rồi tự chấm điểm và xếp hạng toàn bộ laptop theo nhu cầu của từng người. Tính năng này được gọi là **MindMatch**.

---

## Tính năng chính

| Tính năng | Mô tả |
|---|---|
| **MindMatch** | Chọn chân dung (Game thủ, Sinh viên, Lập trình viên, Nhà sáng tạo, Hay di chuyển) hoặc kéo 5 thanh nhu cầu cùng ngân sách. Mỗi máy hiện **% phù hợp** kèm lý do. |
| **DNA cấu hình** | Biểu đồ 5 trục (CPU, GPU, độ nhẹ, pin, màn hình), vẽ chồng lên nhu cầu của người dùng. |
| **Tìm kiếm tự nhiên** | `Ctrl + K`, gõ kiểu *"gaming dưới 30tr rtx 4060"*. Web tự hiểu ngân sách, phân khúc, RAM, GPU… |
| **Thông số → Đời thực** | *"2,4 kg ≈ 4,8 chai nước"*, *"165Hz mượt gấp 2,8 lần màn 60Hz"*… |
| **Song sinh DNA** | Gợi ý các máy cấu hình gần giống, kèm chênh lệch giá. |
| **So sánh** | Đặt tối đa 3 máy cạnh nhau, ô tốt nhất mỗi dòng được tô sáng. |
| **Giao diện sáng / tối** | Tự theo hệ điều hành, có nút chuyển trên header. |
| **Giỏ hàng, đặt hàng, tài khoản** | Giỏ hàng trượt bên phải (lưu lại khi tải lại trang), thanh toán, đơn mua, hồ sơ, trang quản trị. |

> Điểm MindMatch là **ước tính** dựa trên thông số kỹ thuật, không phải kết quả benchmark.

---

## Công nghệ

**Frontend:** React 19 · Vite 8 · React Router 7 · Tailwind CSS 3 · Oxlint
**Backend:** Node.js · Express 5 · node-postgres (`pg`) · dotenv · nodemon
**Cơ sở dữ liệu:** PostgreSQL trên [Neon](https://neon.tech), gồm 9 bảng: `users`, `brands`, `categories`, `products`, `carts`, `cart_items`, `orders`, `order_items`, `staging_laptops`

---

## Cấu trúc thư mục

```
├── backend/
│   ├── server.js                # Khởi tạo Express, gắn các route
│   ├── db.js                    # Kết nối PostgreSQL (đọc DATABASE_URL)
│   ├── seed.js                  # Tạo bảng + nạp dữ liệu từ CSV
│   ├── laptops_clean_FINAL.csv  # 1.013 laptop
│   ├── routes/                  # products · users · orders
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── lib/mind.js          # Engine MindMatch: chấm điểm, hiểu câu tìm kiếm, "đời thực"
    │   ├── store.jsx            # State chung: sản phẩm, hồ sơ nhu cầu, giỏ hàng, theme
    │   ├── components/          # ProductCard, SpecRadar, CommandPalette, ...
    │   └── pages/               # Home, Detail, Compare, Cart, Checkout, Admin, ...
    ├── public/                  # Logo, logo các hãng
    └── .env.example
```

---

## Chạy trên máy (localhost)

**Yêu cầu:** Node.js 20 trở lên, cùng một database PostgreSQL (Neon hoặc cài trên máy).

### 1. Cấu hình backend

```bash
cd backend
copy .env.example .env.local      # macOS/Linux: cp .env.example .env.local
```

Mở `backend/.env.local` và dán chuỗi kết nối thật vào `DATABASE_URL`. Chuỗi này lấy ở Neon Console → project → **Connect**.

### 2. Nạp dữ liệu (chỉ khi database còn trống)

```bash
npm install
node seed.js
```

⚠️ `seed.js` sẽ **xoá toàn bộ bảng cũ** rồi tạo lại. **Không chạy** lệnh này trên database đang có dữ liệu thật của nhóm.

### 3. Chạy backend

```bash
npm run dev            # http://localhost:5000
```

### 4. Chạy frontend (mở terminal khác)

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173 (nếu cổng bận, Vite tự chuyển sang 5174…)
```

Nếu backend không chạy ở `localhost:5000`, tạo `frontend/.env.local` theo mẫu `frontend/.env.example`.

### Tài khoản quản trị mẫu

Sau khi chạy `seed.js`: **admin@gmail.com** / **123456**

---

## Ghi chú

- **Danh mục trưng bày:** web hiển thị 300 máy, gồm toàn bộ máy có ảnh thật cộng thêm máy chia đều các phân khúc. Dữ liệu trên database vẫn đủ 1.013 máy. Đổi `CATALOG_SIZE` trong `frontend/src/store.jsx` để thay đổi số lượng (`Infinity` = hiển thị tất cả).
- Máy chưa có ảnh dùng hình minh hoạ tự sinh, theo đúng kích thước màn hình và phân khúc.
- Không commit các file `.env.local`, vì chúng đã nằm trong `.gitignore`.

### Hạn chế đã biết

Dự án dùng cho mục đích học tập, **chưa sẵn sàng chạy thật**:

- Mật khẩu đang lưu dạng chữ thường, chưa được hash (nên dùng `bcrypt`).
- Các API của admin chưa kiểm tra quyền truy cập.
- Nhiều ảnh sản phẩm là link thumbnail của Bing, có thể hết hạn.
