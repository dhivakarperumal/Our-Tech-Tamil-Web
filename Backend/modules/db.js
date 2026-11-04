const mysql = require("mysql2/promise");
const { getDatabaseConfig } = require("../config/db");

function createPool() {
  return mysql.createPool(getDatabaseConfig());
}

async function initializeDatabase(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS banners (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      subtitle VARCHAR(240) NULL,
      description TEXT NULL,
      destination_link VARCHAR(2048) NULL,
      target_section VARCHAR(16) NOT NULL DEFAULT 'hero',
      is_published BOOLEAN NOT NULL DEFAULT TRUE,
      desktop_image VARCHAR(512) NOT NULL,
      mobile_image VARCHAR(512) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY banners_section_status_idx (target_section, is_published),
      KEY banners_created_at_idx (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [bannerColumnRows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'banners'`,
  );
  const bannerColumns = new Set(bannerColumnRows.map((column) => column.COLUMN_NAME));
  if (!bannerColumns.has("created_at")) {
    await pool.query(
      "ALTER TABLE banners ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP",
    );
  }
  if (!bannerColumns.has("updated_at")) {
    await pool.query(
      "ALTER TABLE banners ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP",
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS categories (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      cat_id VARCHAR(64) NOT NULL UNIQUE,
      name VARCHAR(191) NOT NULL,
      category_type VARCHAR(100) NULL,
      description TEXT NOT NULL,
      subcategory JSON NOT NULL,
      images JSON NOT NULL,
      user_id VARCHAR(255) NULL,
      status VARCHAR(32) NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      product_code VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(220) NOT NULL UNIQUE,
      cat_type VARCHAR(100) NULL,
      category VARCHAR(191) NOT NULL,
      subcategory VARCHAR(191) NULL,
      brand VARCHAR(120) NULL,
      model_number VARCHAR(120) NULL,
      description TEXT NOT NULL,
      mrp DECIMAL(12, 2) NOT NULL,
      offer DECIMAL(5, 2) NOT NULL DEFAULT 0,
      offer_price DECIMAL(12, 2) NOT NULL,
      total_stock INT UNSIGNED NOT NULL DEFAULT 0,
      unit VARCHAR(32) NOT NULL DEFAULT 'Piece',
      stock_status VARCHAR(32) NOT NULL DEFAULT 'Out of Stock',
      images JSON NOT NULL,
      size_chart VARCHAR(512) NULL,
      connectivity VARCHAR(100) NULL,
      weight DECIMAL(10, 3) NULL,
      dimensions VARCHAR(191) NULL,
      power_battery TEXT NULL,
      specifications JSON NULL,
      natural_product_type VARCHAR(100) NULL,
      ingredients TEXT NULL,
      net_quantity DECIMAL(12, 3) NULL,
      quantity_unit VARCHAR(32) NOT NULL DEFAULT 'g',
      manufacturing_date DATE NULL,
      expiry_date DATE NULL,
      shelf_life VARCHAR(100) NULL,
      organic_certification VARCHAR(191) NULL,
      storage_instructions TEXT NULL,
      country_of_origin VARCHAR(100) NULL,
      video VARCHAR(512) NULL,
      warranty VARCHAR(191) NULL,
      return_policy TEXT NULL,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      trending BOOLEAN NOT NULL DEFAULT FALSE,
      new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
      status VARCHAR(32) NOT NULL DEFAULT 'Active',
      variants JSON NOT NULL,
      rating DECIMAL(2, 1) NOT NULL DEFAULT 5,
      gender VARCHAR(32) NULL,
      material VARCHAR(191) NULL,
      wash_care TEXT NULL,
      available_sizes JSON NULL,
      available_colors JSON NULL,
      pattern VARCHAR(100) NULL,
      saree_length VARCHAR(100) NULL,
      blouse_length VARCHAR(100) NULL,
      top_length VARCHAR(100) NULL,
      bottom_length VARCHAR(100) NULL,
      dupatta_length VARCHAR(100) NULL,
      gown_length VARCHAR(100) NULL,
      sleeve_type VARCHAR(100) NULL,
      neck_type VARCHAR(100) NULL,
      fit_type VARCHAR(100) NULL,
      work_type VARCHAR(100) NULL,
      zari_color VARCHAR(100) NULL,
      age VARCHAR(64) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY products_category_idx (category),
      KEY products_cat_type_idx (cat_type),
      KEY products_stock_status_idx (stock_status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS coupons (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      code VARCHAR(64) NOT NULL,
      name VARCHAR(160) NOT NULL,
      description TEXT NULL,
      discount_type ENUM('percentage', 'fixed') NOT NULL,
      discount_value DECIMAL(12, 2) NOT NULL,
      min_order_value DECIMAL(12, 2) NOT NULL DEFAULT 0,
      start_date DATETIME NOT NULL,
      expiry_date DATETIME NOT NULL,
      usage_limit_global BIGINT UNSIGNED NULL,
      usage_limit_per_customer BIGINT UNSIGNED NOT NULL DEFAULT 1,
      usage_count BIGINT UNSIGNED NOT NULL DEFAULT 0,
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      coupon_scope ENUM('all', 'first_order_only', 'new_customers_only', 'specific_products', 'specific_categories') NOT NULL DEFAULT 'all',
      applicable_product_ids JSON NOT NULL,
      applicable_category_ids JSON NOT NULL,
      applicable_subcategory_ids JSON NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY coupons_code_unique (code),
      KEY coupons_status_dates_idx (status, start_date, expiry_date)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS offers (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(160) NOT NULL,
      offer_percentage DECIMAL(5, 2) NOT NULL,
      description TEXT NULL,
      icon VARCHAR(32) NOT NULL DEFAULT 'Tag',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      show_in_header BOOLEAN NOT NULL DEFAULT FALSE,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY offers_status_dates_idx (status, start_date, end_date),
      KEY offers_created_at_idx (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [offerColumnRows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'offers'`,
  );
  const offerColumns = new Set(offerColumnRows.map((column) => column.COLUMN_NAME));
  if (!offerColumns.has("show_in_header")) {
    await pool.query(
      "ALTER TABLE offers ADD COLUMN show_in_header BOOLEAN NOT NULL DEFAULT FALSE AFTER status",
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS combos (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(191) NOT NULL,
      code VARCHAR(100) NOT NULL,
      category_type VARCHAR(100) NOT NULL,
      category VARCHAR(191) NOT NULL,
      subcategory VARCHAR(191) NOT NULL,
      brand VARCHAR(120) NULL,
      short_description VARCHAR(500) NULL,
      description TEXT NULL,
      thumbnail VARCHAR(512) NULL,
      gallery_images JSON NOT NULL,
      video VARCHAR(512) NULL,
      status ENUM('Draft', 'Active', 'Inactive') NOT NULL DEFAULT 'Draft',
      products JSON NOT NULL,
      mrp DECIMAL(12, 2) NOT NULL DEFAULT 0,
      offer DECIMAL(5, 2) NOT NULL DEFAULT 0,
      offer_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      total_savings DECIMAL(12, 2) NOT NULL DEFAULT 0,
      gst DECIMAL(5, 2) NOT NULL DEFAULT 0,
      final_price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      available_stock INT UNSIGNED NOT NULL DEFAULT 0,
      minimum_order_quantity INT UNSIGNED NOT NULL DEFAULT 1,
      maximum_order_quantity INT UNSIGNED NOT NULL DEFAULT 0,
      stock_status VARCHAR(32) NOT NULL DEFAULT 'Out of Stock',
      track_inventory BOOLEAN NOT NULL DEFAULT TRUE,
      allow_backorders BOOLEAN NOT NULL DEFAULT FALSE,
      specifications JSON NOT NULL,
      warranty VARCHAR(191) NULL,
      return_policy TEXT NULL,
      delivery_information TEXT NULL,
      rating DECIMAL(2, 1) NOT NULL DEFAULT 5,
      featured BOOLEAN NOT NULL DEFAULT FALSE,
      trending BOOLEAN NOT NULL DEFAULT FALSE,
      new_arrival BOOLEAN NOT NULL DEFAULT FALSE,
      created_by VARCHAR(255) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY combos_code_unique (code),
      KEY combos_status_created_idx (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [comboColumns] = await pool.execute(
    `SELECT COLUMN_NAME, IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'combos'`,
  );
  const thumbnailColumn = comboColumns.find((column) => column.COLUMN_NAME === "thumbnail");
  if (thumbnailColumn && thumbnailColumn.IS_NULLABLE === "NO") {
    await pool.query("ALTER TABLE combos MODIFY thumbnail VARCHAR(512) NULL");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      product_id BIGINT UNSIGNED NOT NULL,
      user_id VARCHAR(255) NULL,
      user_name VARCHAR(160) NOT NULL,
      user_email VARCHAR(191) NULL,
      rating TINYINT UNSIGNED NOT NULL,
      comment TEXT NOT NULL,
      review_image VARCHAR(512) NULL,
      admin_reply TEXT NULL,
      status ENUM('Pending', 'Published', 'Flagged') NOT NULL DEFAULT 'Pending',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY reviews_product_idx (product_id),
      KEY reviews_status_idx (status),
      KEY reviews_created_at_idx (created_at),
      UNIQUE KEY reviews_product_user_unique (product_id, user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [reviewColumnRows] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'`,
  );
  const reviewColumns = new Set(reviewColumnRows.map((column) => column.COLUMN_NAME));
  if (!reviewColumns.has("user_id")) {
    await pool.query("ALTER TABLE reviews ADD COLUMN user_id VARCHAR(255) NULL AFTER product_id");
  }
  const [reviewIndexRows] = await pool.execute(
    `SELECT INDEX_NAME
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'reviews'`,
  );
  if (!reviewIndexRows.some((index) => index.INDEX_NAME === "reviews_product_user_unique")) {
    await pool.query(
      "ALTER TABLE reviews ADD UNIQUE KEY reviews_product_user_unique (product_id, user_id)",
    );
  }

  const [productColumnRows] = await pool.execute(
    `SELECT COLUMN_NAME, DATA_TYPE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'products'`,
  );
  const productColumns = new Set(productColumnRows.map(column => column.COLUMN_NAME));
  const productMigrations = [
    ["slug", "ALTER TABLE products ADD COLUMN slug VARCHAR(220) NULL"],
    ["cat_type", "ALTER TABLE products ADD COLUMN cat_type VARCHAR(100) NULL"],
    ["brand", "ALTER TABLE products ADD COLUMN brand VARCHAR(120) NULL"],
    ["model_number", "ALTER TABLE products ADD COLUMN model_number VARCHAR(120) NULL"],
    ["unit", "ALTER TABLE products ADD COLUMN unit VARCHAR(32) NOT NULL DEFAULT 'Piece'"],
    ["stock_status", "ALTER TABLE products ADD COLUMN stock_status VARCHAR(32) NOT NULL DEFAULT 'Out of Stock'"],
    ["images", "ALTER TABLE products ADD COLUMN images JSON NULL"],
    ["size_chart", "ALTER TABLE products ADD COLUMN size_chart VARCHAR(512) NULL"],
    ["connectivity", "ALTER TABLE products ADD COLUMN connectivity VARCHAR(100) NULL"],
    ["weight", "ALTER TABLE products ADD COLUMN weight DECIMAL(10, 3) NULL"],
    ["dimensions", "ALTER TABLE products ADD COLUMN dimensions VARCHAR(191) NULL"],
    ["power_battery", "ALTER TABLE products ADD COLUMN power_battery TEXT NULL"],
    ["specifications", "ALTER TABLE products ADD COLUMN specifications JSON NULL"],
    ["natural_product_type", "ALTER TABLE products ADD COLUMN natural_product_type VARCHAR(100) NULL"],
    ["ingredients", "ALTER TABLE products ADD COLUMN ingredients TEXT NULL"],
    ["net_quantity", "ALTER TABLE products ADD COLUMN net_quantity DECIMAL(12, 3) NULL"],
    ["quantity_unit", "ALTER TABLE products ADD COLUMN quantity_unit VARCHAR(32) NOT NULL DEFAULT 'g'"],
    ["manufacturing_date", "ALTER TABLE products ADD COLUMN manufacturing_date DATE NULL"],
    ["expiry_date", "ALTER TABLE products ADD COLUMN expiry_date DATE NULL"],
    ["shelf_life", "ALTER TABLE products ADD COLUMN shelf_life VARCHAR(100) NULL"],
    ["organic_certification", "ALTER TABLE products ADD COLUMN organic_certification VARCHAR(191) NULL"],
    ["storage_instructions", "ALTER TABLE products ADD COLUMN storage_instructions TEXT NULL"],
    ["country_of_origin", "ALTER TABLE products ADD COLUMN country_of_origin VARCHAR(100) NULL"],
    ["video", "ALTER TABLE products ADD COLUMN video VARCHAR(512) NULL"],
    ["warranty", "ALTER TABLE products ADD COLUMN warranty VARCHAR(191) NULL"],
    ["return_policy", "ALTER TABLE products ADD COLUMN return_policy TEXT NULL"],
    ["featured", "ALTER TABLE products ADD COLUMN featured BOOLEAN NOT NULL DEFAULT FALSE"],
    ["trending", "ALTER TABLE products ADD COLUMN trending BOOLEAN NOT NULL DEFAULT FALSE"],
    ["new_arrival", "ALTER TABLE products ADD COLUMN new_arrival BOOLEAN NOT NULL DEFAULT FALSE"],
    ["variants", "ALTER TABLE products ADD COLUMN variants JSON NULL"],
    ["gender", "ALTER TABLE products ADD COLUMN gender VARCHAR(32) NULL"],
    ["material", "ALTER TABLE products ADD COLUMN material VARCHAR(191) NULL"],
    ["available_sizes", "ALTER TABLE products ADD COLUMN available_sizes JSON NULL"],
    ["available_colors", "ALTER TABLE products ADD COLUMN available_colors JSON NULL"],
    ["pattern", "ALTER TABLE products ADD COLUMN pattern VARCHAR(100) NULL"],
    ["wash_care", "ALTER TABLE products ADD COLUMN wash_care TEXT NULL"],
    ["rating", "ALTER TABLE products ADD COLUMN rating DECIMAL(2, 1) NOT NULL DEFAULT 5"],
    ["saree_length", "ALTER TABLE products ADD COLUMN saree_length VARCHAR(100) NULL"],
    ["blouse_length", "ALTER TABLE products ADD COLUMN blouse_length VARCHAR(100) NULL"],
    ["top_length", "ALTER TABLE products ADD COLUMN top_length VARCHAR(100) NULL"],
    ["bottom_length", "ALTER TABLE products ADD COLUMN bottom_length VARCHAR(100) NULL"],
    ["dupatta_length", "ALTER TABLE products ADD COLUMN dupatta_length VARCHAR(100) NULL"],
    ["gown_length", "ALTER TABLE products ADD COLUMN gown_length VARCHAR(100) NULL"],
    ["sleeve_type", "ALTER TABLE products ADD COLUMN sleeve_type VARCHAR(100) NULL"],
    ["neck_type", "ALTER TABLE products ADD COLUMN neck_type VARCHAR(100) NULL"],
    ["fit_type", "ALTER TABLE products ADD COLUMN fit_type VARCHAR(100) NULL"],
    ["work_type", "ALTER TABLE products ADD COLUMN work_type VARCHAR(100) NULL"],
    ["zari_color", "ALTER TABLE products ADD COLUMN zari_color VARCHAR(100) NULL"],
    ["age", "ALTER TABLE products ADD COLUMN age VARCHAR(64) NULL"],
    ["created_at", "ALTER TABLE products ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["updated_at", "ALTER TABLE products ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ];

  for (const [column, statement] of productMigrations) {
    if (!productColumns.has(column)) {
      await pool.query(statement);
    }
  }

  const washCareColumn = productColumnRows.find(column => column.COLUMN_NAME === "wash_care");
  if (washCareColumn && washCareColumn.DATA_TYPE.toLowerCase() !== "text") {
    await pool.query("ALTER TABLE products MODIFY COLUMN wash_care TEXT NULL");
  }

  await pool.query(`
    UPDATE products
    SET stock_status = CASE
      WHEN total_stock = 0 THEN 'Out of Stock'
      WHEN total_stock < 10 THEN 'Low Stock'
      ELSE 'In Stock'
    END
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL UNIQUE,
      username VARCHAR(120) NOT NULL,
      email VARCHAR(191) NOT NULL,
      phone VARCHAR(32) NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(32) NOT NULL DEFAULT 'customer',
      status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY users_email_unique (email),
      UNIQUE KEY users_phone_unique (phone)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      product_name VARCHAR(255) NOT NULL,
      product_image TEXT NULL,
      product_code VARCHAR(100) NOT NULL,
      mrp DECIMAL(10, 2) NOT NULL,
      offer_price DECIMAL(10, 2) NOT NULL,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
      total DECIMAL(10, 2) NOT NULL DEFAULT 0,
      variant_color VARCHAR(100) NOT NULL DEFAULT '',
      variant_size VARCHAR(100) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY cart_items_user_product_variant_unique (user_id, product_id, variant_color, variant_size),
      KEY cart_items_user_id_idx (user_id),
      KEY cart_items_product_id_idx (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [cartColumns] = await pool.execute(
    `SELECT COLUMN_NAME, IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'`,
  );
  const existingCartColumns = new Set(cartColumns.map((column) => column.COLUMN_NAME));
  if (!existingCartColumns.has("combo_id")) {
    await pool.query("ALTER TABLE cart_items ADD COLUMN combo_id BIGINT UNSIGNED NULL AFTER product_id");
  }
  const productIdColumn = cartColumns.find((column) => column.COLUMN_NAME === "product_id");
  if (productIdColumn?.IS_NULLABLE === "NO") {
    await pool.query("ALTER TABLE cart_items MODIFY COLUMN product_id BIGINT UNSIGNED NULL");
  }
  const [cartIndexes] = await pool.execute(
    `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'cart_items'`,
  );
  if (!cartIndexes.some((index) =>
    index.INDEX_NAME === "cart_items_user_combo_unique" &&
    index.COLUMN_NAME === "combo_id" &&
    index.SEQ_IN_INDEX === 2,
  )) {
    await pool.query("ALTER TABLE cart_items ADD UNIQUE KEY cart_items_user_combo_unique (user_id, combo_id)");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS wishlist_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NOT NULL,
      product_id BIGINT UNSIGNED NOT NULL,
      product_name VARCHAR(255) NOT NULL DEFAULT '',
      product_image TEXT NULL,
      product_code VARCHAR(100) NOT NULL DEFAULT '',
      mrp DECIMAL(10, 2) NOT NULL DEFAULT 0,
      offer_price DECIMAL(10, 2) NOT NULL DEFAULT 0,
      variant_color VARCHAR(100) NOT NULL DEFAULT '',
      variant_size VARCHAR(100) NOT NULL DEFAULT '',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY wishlist_user_product_variant_unique (user_id, product_id, variant_color, variant_size),
      KEY wishlist_user_id_idx (user_id),
      KEY wishlist_product_id_idx (product_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [wishlistColumnRows] = await pool.execute(
    `SELECT COLUMN_NAME, IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlist_items'`,
  );
  const wishlistColumns = new Set(wishlistColumnRows.map((column) => column.COLUMN_NAME));
  const wishlistColumnMigrations = [
    ["product_name", "ALTER TABLE wishlist_items ADD COLUMN product_name VARCHAR(255) NOT NULL DEFAULT '' AFTER product_id"],
    ["product_image", "ALTER TABLE wishlist_items ADD COLUMN product_image TEXT NULL AFTER product_name"],
    ["product_code", "ALTER TABLE wishlist_items ADD COLUMN product_code VARCHAR(100) NOT NULL DEFAULT '' AFTER product_image"],
    ["mrp", "ALTER TABLE wishlist_items ADD COLUMN mrp DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER product_code"],
    ["offer_price", "ALTER TABLE wishlist_items ADD COLUMN offer_price DECIMAL(10, 2) NOT NULL DEFAULT 0 AFTER mrp"],
    ["variant_color", "ALTER TABLE wishlist_items ADD COLUMN variant_color VARCHAR(100) NOT NULL DEFAULT '' AFTER offer_price"],
    ["variant_size", "ALTER TABLE wishlist_items ADD COLUMN variant_size VARCHAR(100) NOT NULL DEFAULT '' AFTER variant_color"],
    ["updated_at", "ALTER TABLE wishlist_items ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ];
  for (const [column, statement] of wishlistColumnMigrations) {
    if (!wishlistColumns.has(column)) await pool.query(statement);
  }
  if (!wishlistColumns.has("combo_id")) {
    await pool.query("ALTER TABLE wishlist_items ADD COLUMN combo_id BIGINT UNSIGNED NULL AFTER product_id");
  }
  const wishlistProductIdColumn = wishlistColumnRows.find((column) => column.COLUMN_NAME === "product_id");
  if (wishlistProductIdColumn?.IS_NULLABLE === "NO") {
    await pool.query("ALTER TABLE wishlist_items MODIFY COLUMN product_id BIGINT UNSIGNED NULL");
  }
  const [wishlistIndexes] = await pool.execute(
    `SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'wishlist_items'`,
  );
  const oldWishlistIndex = wishlistIndexes.some((index) =>
    index.INDEX_NAME === "wishlist_user_product_unique",
  );
  if (oldWishlistIndex) {
    await pool.query("ALTER TABLE wishlist_items DROP INDEX wishlist_user_product_unique");
  }
  const hasVariantUniqueIndex = wishlistIndexes.some((index) =>
    index.INDEX_NAME === "wishlist_user_product_variant_unique" &&
    index.COLUMN_NAME === "variant_size" &&
    index.SEQ_IN_INDEX === 4,
  );
  if (!hasVariantUniqueIndex) {
    await pool.query(
      "ALTER TABLE wishlist_items ADD UNIQUE KEY wishlist_user_product_variant_unique (user_id, product_id, variant_color, variant_size)",
    );
  }
  const hasComboUniqueIndex = wishlistIndexes.some((index) =>
    index.INDEX_NAME === "wishlist_user_combo_unique" &&
    index.COLUMN_NAME === "combo_id" &&
    index.SEQ_IN_INDEX === 2,
  );
  if (!hasComboUniqueIndex) {
    await pool.query("ALTER TABLE wishlist_items ADD UNIQUE KEY wishlist_user_combo_unique (user_id, combo_id)");
  }
  await pool.query(`
    UPDATE wishlist_items wi
    INNER JOIN products p ON p.id = wi.product_id
    SET wi.product_name = p.name,
        wi.product_code = p.product_code,
        wi.mrp = p.mrp,
        wi.offer_price = p.offer_price
    WHERE wi.product_name = '' OR wi.product_code = ''
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS addresses (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      user_id VARCHAR(255) NULL,
      recipient_name VARCHAR(160) NOT NULL,
      email VARCHAR(191) NULL,
      phone VARCHAR(32) NOT NULL,
      street_address VARCHAR(512) NOT NULL,
      city VARCHAR(120) NOT NULL,
      district VARCHAR(120) NULL,
      state VARCHAR(120) NOT NULL,
      country VARCHAR(120) NOT NULL DEFAULT 'India',
      zip_code VARCHAR(24) NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY addresses_user_id_idx (user_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [addressColumns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'addresses'`,
  );
  const existingAddressColumns = new Set(addressColumns.map((column) => column.COLUMN_NAME));
  if (!existingAddressColumns.has("is_active")) {
    await pool.query(
      "ALTER TABLE addresses ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE AFTER zip_code",
    );
  }
  if (!existingAddressColumns.has("email")) {
    await pool.query(
      "ALTER TABLE addresses ADD COLUMN email VARCHAR(191) NULL AFTER recipient_name",
    );
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS orders (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id VARCHAR(32) NULL UNIQUE,
      user_id VARCHAR(255) NULL,
      address_id BIGINT UNSIGNED NULL,
      customer_email VARCHAR(191) NULL,
      order_type VARCHAR(32) NOT NULL DEFAULT 'Shop',
      items_type VARCHAR(16) NOT NULL DEFAULT 'Single',
      payment_method VARCHAR(64) NOT NULL DEFAULT 'Cash',
      payment_status VARCHAR(32) NOT NULL DEFAULT 'Pending',
      razorpay_order_id VARCHAR(64) NULL,
      razorpay_payment_id VARCHAR(64) NULL UNIQUE,
      coupon_code VARCHAR(64) NULL,
      discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      status VARCHAR(32) NOT NULL DEFAULT 'Order Placed',
      total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
      tracking_number VARCHAR(160) NULL,
      courier_name VARCHAR(160) NULL,
      shipped_at DATETIME NULL,
      cancellation_reason TEXT NULL,
      cancelled_at DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      KEY orders_user_id_idx (user_id),
      KEY orders_status_created_idx (status, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS order_items (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      order_id BIGINT UNSIGNED NOT NULL,
      product_id BIGINT UNSIGNED NULL,
      product_name VARCHAR(191) NOT NULL,
      price DECIMAL(12, 2) NOT NULL DEFAULT 0,
      quantity INT UNSIGNED NOT NULL DEFAULT 1,
      total DECIMAL(12, 2) NOT NULL DEFAULT 0,
      variant_color VARCHAR(100) NULL,
      variant_size VARCHAR(100) NULL,
      image VARCHAR(2048) NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      KEY order_items_order_id_idx (order_id),
      CONSTRAINT order_items_order_fk FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
  const [orderItemColumns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'order_items'`,
  );
  if (!orderItemColumns.some((column) => column.COLUMN_NAME === "combo_id")) {
    await pool.query("ALTER TABLE order_items ADD COLUMN combo_id BIGINT UNSIGNED NULL AFTER product_id");
  }

  const [orderColumns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'orders'`,
  );
  const existingOrderColumns = new Set(orderColumns.map((column) => column.COLUMN_NAME));
  if (!existingOrderColumns.has("items_type")) {
    await pool.query("ALTER TABLE orders ADD COLUMN items_type VARCHAR(16) NOT NULL DEFAULT 'Single' AFTER order_type");
    await pool.query(`
      UPDATE orders
      SET items_type = CASE
        WHEN EXISTS (
          SELECT 1 FROM order_items oi
          WHERE oi.order_id = orders.id AND oi.combo_id IS NOT NULL
        ) AND EXISTS (
          SELECT 1 FROM order_items oi
          WHERE oi.order_id = orders.id AND oi.combo_id IS NULL
        ) THEN 'Mixed'
        WHEN EXISTS (
          SELECT 1 FROM order_items oi
          WHERE oi.order_id = orders.id AND oi.combo_id IS NOT NULL
        ) THEN 'Combo'
        ELSE 'Single'
      END
    `);
  }
  if (!existingOrderColumns.has("address_id")) {
    await pool.query("ALTER TABLE orders ADD COLUMN address_id BIGINT UNSIGNED NULL AFTER user_id");
  }
  if (!existingOrderColumns.has("coupon_code")) {
    await pool.query("ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(64) NULL");
  }
  if (!existingOrderColumns.has("discount_amount")) {
    await pool.query("ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(12, 2) NOT NULL DEFAULT 0");
  }
  if (!existingOrderColumns.has("razorpay_order_id")) {
    await pool.query("ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(64) NULL");
  }
  if (!existingOrderColumns.has("razorpay_payment_id")) {
    await pool.query("ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(64) NULL UNIQUE");
  }

  if (existingOrderColumns.has("items")) {
    const [ordersWithLegacyItems] = await pool.execute(
      "SELECT id, items FROM orders",
    );
    if (ordersWithLegacyItems.length) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const order of ordersWithLegacyItems) {
          let items = order.items;
          if (typeof items === "string") {
            try {
              items = JSON.parse(items);
            } catch {
              throw new Error(`Cannot migrate order ${order.id}: its items JSON is invalid.`);
            }
          }
          if (!Array.isArray(items)) {
            throw new Error(`Cannot migrate order ${order.id}: its items value is not a list.`);
          }

          const [existingItems] = await connection.execute(
            "SELECT id FROM order_items WHERE order_id = ? LIMIT 1",
            [order.id],
          );
          if (existingItems.length || items.length === 0) continue;

          for (const item of items) {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
              throw new Error(`Cannot migrate order ${order.id}: an item is invalid.`);
            }
            const price = Number(item.price ?? 0);
            const quantity = Number(item.quantity ?? 1);
            const total = Number(item.total ?? price * quantity);
            if (!Number.isFinite(price) || price < 0 ||
                !Number.isInteger(quantity) || quantity < 1 ||
                !Number.isFinite(total) || total < 0) {
              throw new Error(`Cannot migrate order ${order.id}: an item has invalid price or quantity.`);
            }
            const rawProductId = Number(item.product_id);
            const productId = Number.isSafeInteger(rawProductId) && rawProductId > 0 ? rawProductId : null;
            const productName = String(item.product_name || item.name || "Order item").slice(0, 191);
            await connection.execute(
              `INSERT INTO order_items
                (order_id, product_id, product_name, price, quantity, total, variant_color, variant_size, image)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                order.id,
                productId,
                productName,
                price,
                quantity,
                total,
                item.variant_color ? String(item.variant_color).slice(0, 100) : null,
                item.variant_size ? String(item.variant_size).slice(0, 100) : null,
                item.image ? String(item.image).slice(0, 2048) : null,
              ],
            );
          }
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

    await pool.query("ALTER TABLE orders DROP COLUMN items");
  }

  const legacyAddressColumns = [
    "street_address",
    "city",
    "district",
    "state",
    "country",
    "zip_code",
  ];
  const availableLegacyAddressColumns = legacyAddressColumns.filter((column) =>
    existingOrderColumns.has(column),
  );
  const hasLegacyCustomerName = existingOrderColumns.has("customer_name");
  const hasLegacyCustomerPhone = existingOrderColumns.has("customer_phone");
  if (availableLegacyAddressColumns.length || hasLegacyCustomerName || hasLegacyCustomerPhone) {
    const selectColumns = [
      "id",
      "user_id",
      ...(hasLegacyCustomerName ? ["customer_name"] : []),
      ...(hasLegacyCustomerPhone ? ["customer_phone"] : []),
      ...availableLegacyAddressColumns,
    ];
    const addressValueConditions = [
      ...(hasLegacyCustomerName ? ["COALESCE(customer_name, '') <> ''"] : []),
      ...(hasLegacyCustomerPhone ? ["COALESCE(customer_phone, '') <> ''"] : []),
      ...availableLegacyAddressColumns.map((column) => `COALESCE(${column}, '') <> ''`),
    ];
    const [ordersToMigrate] = await pool.execute(`
      SELECT ${selectColumns.join(", ")}
      FROM orders
      WHERE address_id IS NULL
        AND (${addressValueConditions.join(" OR ")})
    `);

    if (ordersToMigrate.length) {
      const connection = await pool.getConnection();
      try {
        await connection.beginTransaction();
        for (const order of ordersToMigrate) {
          const [addressResult] = await connection.execute(
            `INSERT INTO addresses
              (user_id, recipient_name, phone, street_address, city, district, state, country, zip_code)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              order.user_id,
              order.customer_name || "Guest Customer",
              order.customer_phone || "",
              order.street_address || "",
              order.city || "",
              order.district || null,
              order.state || "",
              order.country || "India",
              order.zip_code || "",
            ],
          );
          await connection.execute(
            "UPDATE orders SET address_id = ? WHERE id = ? AND address_id IS NULL",
            [addressResult.insertId, order.id],
          );
        }
        await connection.commit();
      } catch (error) {
        await connection.rollback();
        throw error;
      } finally {
        connection.release();
      }
    }

  }

  for (const column of [...legacyAddressColumns, "customer_name", "customer_phone"]) {
    if (existingOrderColumns.has(column)) {
      await pool.query(`ALTER TABLE orders DROP COLUMN ${column}`);
    }
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_services (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      service_id VARCHAR(40) NOT NULL,
      name VARCHAR(120) NOT NULL,
      title VARCHAR(160) NOT NULL,
      subtitle VARCHAR(240) NULL,
      description TEXT NULL,
      note TEXT NULL,
      price DECIMAL(10, 2) NULL,
      duration VARCHAR(80) NULL,
      image_url VARCHAR(2048) NULL,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY admin_services_service_id_unique (service_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_articles (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      content_id VARCHAR(40) NOT NULL,
      content_type ENUM('article', 'product_review') NOT NULL,
      title VARCHAR(200) NULL,
      product_name VARCHAR(191) NULL,
      description TEXT NOT NULL,
      product_features TEXT NULL,
      image_url VARCHAR(2048) NOT NULL,
      rating DECIMAL(2, 1) NULL,
      buy_link VARCHAR(2048) NULL,
      buy_links LONGTEXT NULL,
      more_details TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY admin_articles_content_id_unique (content_id),
      KEY admin_articles_type_created_idx (content_type, created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [articleColumns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_articles'`,
  );
  if (!articleColumns.some((column) => column.COLUMN_NAME === "buy_links")) {
    await pool.query("ALTER TABLE admin_articles ADD COLUMN buy_links LONGTEXT NULL AFTER buy_link");
  }

  const [serviceColumns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_services'`,
  );
  const existingServiceColumns = new Set(serviceColumns.map((column) => column.COLUMN_NAME));
  const serviceMigrations = [
    ["service_id", "ALTER TABLE admin_services ADD COLUMN service_id VARCHAR(40) NULL"],
    ["title", "ALTER TABLE admin_services ADD COLUMN title VARCHAR(160) NULL"],
    ["subtitle", "ALTER TABLE admin_services ADD COLUMN subtitle VARCHAR(240) NULL"],
    ["note", "ALTER TABLE admin_services ADD COLUMN note TEXT NULL"],
  ];

  for (const [column, statement] of serviceMigrations) {
    if (!existingServiceColumns.has(column)) {
      await pool.query(statement);
    }
  }

  await pool.query(`
    UPDATE admin_services
    SET service_id = CONCAT('SRV-', LPAD(id, 5, '0'))
    WHERE service_id IS NULL OR service_id = ''
  `);
  await pool.query("UPDATE admin_services SET title = name WHERE title IS NULL");
  await pool.query("ALTER TABLE admin_services MODIFY COLUMN service_id VARCHAR(40) NOT NULL");

  const [serviceIndexes] = await pool.execute(
    `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_services'`,
  );
  const serviceIdHasUniqueIndex = serviceIndexes.some(
    (index) => index.COLUMN_NAME === "service_id" && index.SEQ_IN_INDEX === 1 && index.NON_UNIQUE === 0,
  );
  if (!serviceIdHasUniqueIndex) {
    await pool.query("ALTER TABLE admin_services ADD UNIQUE KEY admin_services_service_id_unique (service_id)");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS admin_youtube_videos (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      video_code VARCHAR(40) NOT NULL,
      title VARCHAR(160) NOT NULL,
      video_url VARCHAR(2048) NOT NULL,
      video_id VARCHAR(20) NOT NULL,
      thumbnail_image LONGTEXT NULL,
      thumbnail_url VARCHAR(2048) NULL,
      description TEXT NULL,
      application_links LONGTEXT NULL,
      documents LONGTEXT NULL,
      follow_up_notes TEXT NULL,
      status ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY admin_youtube_videos_video_code_unique (video_code),
      UNIQUE KEY admin_youtube_videos_video_id_unique (video_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

  const [videoColumns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_youtube_videos'`,
  );
  const existingVideoColumns = new Set(videoColumns.map((column) => column.COLUMN_NAME));
  const videoMigrations = [
    ["video_code", "ALTER TABLE admin_youtube_videos ADD COLUMN video_code VARCHAR(40) NULL"],
    ["thumbnail_image", "ALTER TABLE admin_youtube_videos ADD COLUMN thumbnail_image LONGTEXT NULL"],
    ["thumbnail_url", "ALTER TABLE admin_youtube_videos ADD COLUMN thumbnail_url VARCHAR(2048) NULL"],
    ["application_links", "ALTER TABLE admin_youtube_videos ADD COLUMN application_links LONGTEXT NULL"],
    ["documents", "ALTER TABLE admin_youtube_videos ADD COLUMN documents LONGTEXT NULL"],
    ["follow_up_notes", "ALTER TABLE admin_youtube_videos ADD COLUMN follow_up_notes TEXT NULL"],
  ];

  for (const [column, statement] of videoMigrations) {
    if (!existingVideoColumns.has(column)) {
      await pool.query(statement);
    }
  }

  await pool.query(`
    UPDATE admin_youtube_videos
    SET video_code = CONCAT('YT-', LPAD(id, 5, '0'))
    WHERE video_code IS NULL OR video_code = ''
  `);
  await pool.query("ALTER TABLE admin_youtube_videos MODIFY COLUMN video_code VARCHAR(40) NOT NULL");

  const [videoIndexes] = await pool.execute(
    `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'admin_youtube_videos'`,
  );
  const videoCodeHasUniqueIndex = videoIndexes.some(
    (index) => index.COLUMN_NAME === "video_code" && index.SEQ_IN_INDEX === 1 && index.NON_UNIQUE === 0,
  );
  if (!videoCodeHasUniqueIndex) {
    await pool.query("ALTER TABLE admin_youtube_videos ADD UNIQUE KEY admin_youtube_videos_video_code_unique (video_code)");
  }

  const [columns] = await pool.execute(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`,
  );
  const existingColumns = new Set(columns.map((column) => column.COLUMN_NAME));
  const migrations = [
    ["status", "ALTER TABLE users ADD COLUMN status ENUM('active', 'inactive') NOT NULL DEFAULT 'active'"],
    ["created_at", "ALTER TABLE users ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP"],
    ["updated_at", "ALTER TABLE users ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"],
  ];

  for (const [column, statement] of migrations) {
    if (!existingColumns.has(column)) {
      await pool.query(statement);
    }
  }

  if (!existingColumns.has("id")) {
    await pool.query(`
      ALTER TABLE users
      DROP PRIMARY KEY,
      ADD COLUMN id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY FIRST
    `);
  }

  const [userIdColumns] = await pool.execute(
    `SELECT COLUMN_TYPE, EXTRA
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'user_id'`,
  );
  const userIdColumn = userIdColumns[0];

  if (userIdColumn.COLUMN_TYPE.toLowerCase() !== "varchar(255)" || userIdColumn.EXTRA.includes("auto_increment")) {
    await pool.query("ALTER TABLE users MODIFY COLUMN user_id VARCHAR(255) NOT NULL");
  }

  const [phoneColumns] = await pool.execute(
    `SELECT IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'phone'`,
  );
  if (phoneColumns[0]?.IS_NULLABLE === "NO") {
    await pool.query("ALTER TABLE users MODIFY COLUMN phone VARCHAR(32) NULL");
  }

  await pool.query(`
    UPDATE users
    SET user_id = UUID()
    WHERE user_id NOT REGEXP '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
  `);

  const [indexes] = await pool.execute(
    `SELECT INDEX_NAME, NON_UNIQUE, COLUMN_NAME, SEQ_IN_INDEX
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`,
  );
  const userIdHasUniqueIndex = indexes.some(
    (index) => index.COLUMN_NAME === "user_id" && index.SEQ_IN_INDEX === 1 && index.NON_UNIQUE === 0,
  );

  if (!userIdHasUniqueIndex) {
    await pool.query("ALTER TABLE users ADD UNIQUE KEY users_user_id_unique (user_id)");
  }
}

module.exports = { createPool, initializeDatabase };
