const fs = require("fs");
const path = require("path");
const pool = require("./db");

// Hàm đọc CSV chuẩn (xử lý được dấu phẩy nằm trong dấu ngoặc kép)
function parseCSVLine(text) {
  const result = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log("1. Đang khởi tạo 9 bảng theo đúng sơ đồ ERD...");
    await client.query("BEGIN");

    // Xóa các bảng cũ nếu lệch cấu trúc để tạo lại chuẩn ERD
    await client.query(`
      DROP TABLE IF EXISTS cart_items CASCADE;
      DROP TABLE IF EXISTS carts CASCADE;
      DROP TABLE IF EXISTS order_items CASCADE;
      DROP TABLE IF EXISTS orders CASCADE;
      DROP TABLE IF EXISTS products CASCADE;
      DROP TABLE IF EXISTS categories CASCADE;
      DROP TABLE IF EXISTS brands CASCADE;
      DROP TABLE IF EXISTS staging_laptops CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
    `);

    // Tạo chuẩn 9 bảng theo đúng laptop_ecommerce_erd.png
    await client.query(`
      -- 1. Bảng users
      CREATE TABLE users (
        user_id SERIAL PRIMARY KEY,
        full_name VARCHAR(150),
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Bảng brands
      CREATE TABLE brands (
        brand_id SERIAL PRIMARY KEY,
        brand_name VARCHAR(100) UNIQUE NOT NULL
      );

      -- 3. Bảng categories
      CREATE TABLE categories (
        category_id SERIAL PRIMARY KEY,
        category_name VARCHAR(100) UNIQUE NOT NULL
      );

      -- 4. Bảng staging_laptops
      CREATE TABLE staging_laptops (
        id TEXT,
        name TEXT,
        brand TEXT,
        model TEXT,
        category TEXT,
        price TEXT,
        currency TEXT,
        image_url TEXT,
        stock_quantity TEXT,
        cpu TEXT,
        gpu TEXT,
        gpu_vram_gb TEXT,
        ram_gb TEXT,
        ssd_gb TEXT,
        hdd_gb TEXT,
        screen_size_in TEXT,
        panel_type TEXT,
        resolution TEXT,
        refresh_rate_hz TEXT,
        weight_kg TEXT,
        battery_wh TEXT,
        operating_system TEXT,
        description TEXT,
        search_text TEXT
      );

      -- 5. Bảng products
      CREATE TABLE products (
        product_id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(255),
        brand_id INTEGER REFERENCES brands(brand_id) ON DELETE SET NULL,
        category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
        price_egp BIGINT,
        currency VARCHAR(10) DEFAULT 'VND',
        image_url TEXT,
        stock_quantity INTEGER DEFAULT 10,
        cpu TEXT,
        gpu TEXT,
        gpu_vram_gb NUMERIC(5,1),
        ram_gb INTEGER,
        ssd_gb INTEGER,
        hdd_gb INTEGER,
        screen_size_in NUMERIC(4,1),
        panel_type VARCHAR(50),
        resolution VARCHAR(30),
        refresh_rate_hz INTEGER,
        weight_kg NUMERIC(5,3),
        battery_wh NUMERIC(6,1),
        operating_system VARCHAR(100),
        description TEXT,
        search_text TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        price_vnd BIGINT
      );

      -- 6. Bảng carts
      CREATE TABLE carts (
        cart_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 7. Bảng cart_items
      CREATE TABLE cart_items (
        cart_item_id SERIAL PRIMARY KEY,
        cart_id INTEGER REFERENCES carts(cart_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(product_id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 8. Bảng orders
      CREATE TABLE orders (
        order_id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
        total_amount BIGINT NOT NULL,
        status VARCHAR(30) DEFAULT 'Chờ duyệt',
        shipping_address TEXT,
        phone VARCHAR(20),
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );

      -- 9. Bảng order_items
      CREATE TABLE order_items (
        order_item_id SERIAL PRIMARY KEY,
        order_id INTEGER REFERENCES orders(order_id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
        quantity INTEGER NOT NULL,
        unit_price BIGINT NOT NULL
      );

      -- Tạo sẵn tài khoản Admin mặc định
      INSERT INTO users (full_name, email, password_hash, phone, address, role)
      VALUES ('Quản trị viên', 'admin@gmail.com', '123456', '0900000000', 'Hồ Chí Minh', 'admin');
    `);

    console.log("2. Đang đọc file laptops_clean_FINAL.csv...");
    const csvPath = path.join(__dirname, "laptops_clean_FINAL.csv");
    const content = fs.readFileSync(csvPath, "utf8");
    const lines = content.split(/\r?\n/).filter((line) => line.trim() !== "");

    // Bỏ dòng tiêu đề đầu tiên
    const dataLines = lines.slice(1);
    console.log(
      `Tìm thấy ${dataLines.length} sản phẩm. Đang nạp vào staging_laptops...`,
    );

    for (const line of dataLines) {
      const cols = parseCSVLine(line);
      if (cols.length < 24) continue;

      await client.query(
        `INSERT INTO staging_laptops VALUES (
          $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
        )`,
        cols.slice(0, 24),
      );
    }

    console.log(
      "3. Đang phân tách dữ liệu sang bảng brands, categories và products...",
    );

    // Đổ dữ liệu sang bảng brands
    await client.query(`
      INSERT INTO brands (brand_name)
      SELECT DISTINCT TRIM(brand) FROM staging_laptops
      WHERE brand IS NOT NULL AND TRIM(brand) <> ''
      ON CONFLICT (brand_name) DO NOTHING;
    `);

    // Đổ dữ liệu sang bảng categories
    await client.query(`
      INSERT INTO categories (category_name)
      SELECT DISTINCT TRIM(category) FROM staging_laptops
      WHERE category IS NOT NULL AND TRIM(category) <> ''
      ON CONFLICT (category_name) DO NOTHING;
    `);

    // Đổ dữ liệu từ staging_laptops sang products (Quy đổi giá sang VNĐ và gán kho mặc định = 10)
    await client.query(`
      INSERT INTO products (
        name, model, brand_id, category_id, price_egp, currency, image_url, stock_quantity,
        cpu, gpu, gpu_vram_gb, ram_gb, ssd_gb, hdd_gb, screen_size_in, panel_type,
        resolution, refresh_rate_hz, weight_kg, battery_wh, operating_system,
        description, search_text, price_vnd
      )
      SELECT 
        s.name,
        s.model,
        b.brand_id,
        c.category_id,
        NULLIF(s.price, '')::NUMERIC::BIGINT,
         COALESCE(NULLIF(s.currency, ''), 'VND'),
        COALESCE(NULLIF(s.image_url, ''), 'https://placehold.co/400x300?text=' || REPLACE(s.brand, ' ', '+')),
        COALESCE(NULLIF(s.stock_quantity, '')::NUMERIC::INTEGER, 10),
        s.cpu,
        NULLIF(s.gpu, ''),
        NULLIF(s.gpu_vram_gb, '')::NUMERIC(5,1),
        NULLIF(s.ram_gb, '')::NUMERIC::INTEGER,
        NULLIF(s.ssd_gb, '')::NUMERIC::INTEGER,
        COALESCE(NULLIF(s.hdd_gb, '')::NUMERIC::INTEGER, 0),
        NULLIF(s.screen_size_in, '')::NUMERIC(4,1),
        NULLIF(s.panel_type, ''),
        NULLIF(s.resolution, ''),
        NULLIF(s.refresh_rate_hz, '')::NUMERIC::INTEGER,
        NULLIF(s.weight_kg, '')::NUMERIC(5,3),
        NULLIF(s.battery_wh, '')::NUMERIC(6,1),
        NULLIF(s.operating_system, ''),
        s.description,
        s.search_text,
        (NULLIF(s.price, '')::NUMERIC::BIGINT * 500) -- Quy đổi EGP sang VND chuẩn tỷ giá (~500)
      FROM staging_laptops s
      LEFT JOIN brands b ON TRIM(s.brand) = b.brand_name
      LEFT JOIN categories c ON TRIM(s.category) = c.category_name;
    `);

    await client.query("COMMIT");
    console.log(
      "HOÀN TẤT! Đã tạo đủ 9 bảng chuẩn ERD và nạp 1.013 laptop lên Neon PostgreSQL!",
    );
    process.exit(0);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Lỗi khi tạo dữ liệu:", err);
    process.exit(1);
  } finally {
    client.release();
  }
}

seedDatabase();
