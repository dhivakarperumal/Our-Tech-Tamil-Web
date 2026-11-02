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
    CREATE TABLE IF NOT EXISTS reviews (
      id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      product_id BIGINT UNSIGNED NOT NULL,
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
      KEY reviews_created_at_idx (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);

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
    ["available_sizes", "ALTER TABLE products ADD COLUMN available_sizes JSON NULL"],
    ["available_colors", "ALTER TABLE products ADD COLUMN available_colors JSON NULL"],
    ["pattern", "ALTER TABLE products ADD COLUMN pattern VARCHAR(100) NULL"],
    ["wash_care", "ALTER TABLE products ADD COLUMN wash_care TEXT NULL"],
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
