const mysql = require("mysql2/promise");
const { getDatabaseConfig } = require("../config/db");

function createPool() {
  return mysql.createPool(getDatabaseConfig());
}

async function initializeDatabase(pool) {
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
