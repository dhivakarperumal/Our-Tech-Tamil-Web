const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

const uploadDirectory = path.join(__dirname, "..", "uploads", "products");
fs.mkdirSync(uploadDirectory, { recursive: true });

const mediaExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
  "video/mp4": ".mp4",
  "video/webm": ".webm",
  "video/quicktime": ".mov",
};

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename(request, file, callback) {
      callback(null, `${crypto.randomUUID()}${mediaExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 50 * 1024 * 1024, files: 12 },
  fileFilter(request, file, callback) {
    const allowedImage = (file.fieldname === "images" || file.fieldname === "size_chart") &&
      mediaExtensions[file.mimetype] && file.mimetype.startsWith("image/");
    const allowedVideo = file.fieldname === "video" && file.mimetype in mediaExtensions && file.mimetype.startsWith("video/");
    if (!allowedImage && !allowedVideo) {
      const error = new Error("Upload image files or MP4, WebM, and MOV videos only.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function parseJson(value, fallback) {
  if (typeof value !== "string") return value ?? fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function parseArray(value, field, maxItems) {
  const parsed = parseJson(value, []);
  if (!Array.isArray(parsed) || parsed.length > maxItems || parsed.some(item => typeof item !== "string")) {
    const error = new Error(`${field} must be a list of up to ${maxItems} strings.`);
    error.status = 400;
    throw error;
  }
  return parsed.map(item => item.trim()).filter(Boolean);
}

function parseSpecifications(value) {
  const parsed = parseJson(value, []);
  if (!Array.isArray(parsed)) {
    const error = new Error("Specifications must be a list of key-value pairs.");
    error.status = 400;
    throw error;
  }
  const specifications = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      const error = new Error("Each specification must have a name and value.");
      error.status = 400;
      throw error;
    }
    const key = typeof item.key === "string" ? item.key.trim() : "";
    const specValue = typeof item.value === "string" ? item.value.trim() : "";
    if (!key && !specValue) continue;
    if (!key || !specValue || key.length > 100 || specValue.length > 500) {
      const error = new Error("Specification names and values are required and must be within their length limits.");
      error.status = 400;
      throw error;
    }
    specifications.push({ key, value: specValue });
  }
  return specifications;
}

function numberField(value, field, { required = false, min = 0, max = 100000000, integer = false } = {}) {
  if ((value === undefined || value === null || value === "") && !required) return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    const error = new Error(`${field} must be between ${min} and ${max}.`);
    error.status = 400;
    throw error;
  }
  return number;
}

function dateField(value, field) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const error = new Error(`${field} must be a valid date.`);
    error.status = 400;
    throw error;
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    const error = new Error(`${field} must be a valid date.`);
    error.status = 400;
    throw error;
  }
  return value;
}

function parseProduct(body) {
  const mrp = numberField(body.mrp, "MRP", { required: true, min: 0.01 });
  const hasOfferPrice = body.offer_price !== undefined && body.offer_price !== null && body.offer_price !== "";
  const offerPrice = hasOfferPrice
    ? numberField(body.offer_price, "Offer price", { min: 0, max: mrp })
    : null;
  const offer = hasOfferPrice
    ? Number((((mrp - offerPrice) / mrp) * 100).toFixed(2))
    : numberField(body.offer, "Offer", { max: 100 });
  const product = {
    name: typeof body.name === "string" ? body.name.trim() : "",
    product_code: typeof body.product_code === "string" ? body.product_code.trim() : "",
    slug: typeof body.slug === "string" ? body.slug.trim() : "",
    cat_type: typeof body.cat_type === "string" ? body.cat_type.trim() : "",
    category: typeof body.category === "string" ? body.category.trim() : "",
    subcategory: typeof body.subcategory === "string" ? body.subcategory.trim() : "",
    brand: typeof body.brand === "string" ? body.brand.trim() : "",
    model_number: typeof body.model_number === "string" ? body.model_number.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : "",
    mrp,
    offer,
    offer_price: offerPrice ?? Number((mrp * (1 - offer / 100)).toFixed(2)),
    total_stock: numberField(body.total_stock ?? body.stock, "Stock quantity", { max: 10000000, integer: true }),
    unit: typeof body.unit === "string" && body.unit.trim() ? body.unit.trim() : "Piece",
    size_chart: typeof body.size_chart === "string" ? body.size_chart.trim() : "",
    connectivity: typeof body.connectivity === "string" ? body.connectivity.trim() : "",
    weight: body.weight === undefined || body.weight === null || body.weight === ""
      ? null
      : numberField(body.weight, "Weight", { max: 100000 }),
    dimensions: typeof body.dimensions === "string" ? body.dimensions.trim() : "",
    power_battery: typeof body.power_battery === "string" ? body.power_battery.trim() : "",
    specifications: parseSpecifications(body.specifications),
    natural_product_type: typeof body.natural_product_type === "string" ? body.natural_product_type.trim() : "",
    ingredients: typeof body.ingredients === "string" ? body.ingredients.trim() : "",
    net_quantity: body.net_quantity === undefined || body.net_quantity === null || body.net_quantity === ""
      ? null
      : numberField(body.net_quantity, "Net quantity", { max: 100000000 }),
    quantity_unit: typeof body.quantity_unit === "string" && body.quantity_unit.trim() ? body.quantity_unit.trim() : "g",
    manufacturing_date: dateField(body.manufacturing_date, "Manufacturing date"),
    expiry_date: dateField(body.expiry_date, "Expiry date"),
    shelf_life: typeof body.shelf_life === "string" ? body.shelf_life.trim() : "",
    organic_certification: typeof body.organic_certification === "string" ? body.organic_certification.trim() : "",
    storage_instructions: typeof body.storage_instructions === "string" ? body.storage_instructions.trim() : "",
    country_of_origin: typeof body.country_of_origin === "string" ? body.country_of_origin.trim() : "",
    warranty: typeof body.warranty === "string" ? body.warranty.trim() : "",
    return_policy: typeof body.return_policy === "string" ? body.return_policy.trim() : "",
    status: body.status === "Inactive" ? "Inactive" : "Active",
    featured: Boolean(body.featured),
    trending: Boolean(body.trending),
    new_arrival: Boolean(body.new_arrival),
    images: parseArray(body.images, "Product images", 10),
    variants: parseJson(body.variants, []),
    video: typeof body.video === "string" ? body.video.trim() : "",
    rating: numberField(body.rating, "Rating", { max: 5 }) || 5,
    gender: typeof body.gender === "string" ? body.gender.trim() : "",
    material: typeof body.material === "string" ? body.material.trim() : "",
    wash_care: typeof body.wash_care === "string" ? body.wash_care.trim() : "",
    available_sizes: parseArray(body.available_sizes, "Available sizes", 20),
    available_colors: parseArray(body.available_colors, "Available colors", 50),
    pattern: typeof body.pattern === "string" ? body.pattern.trim() : "",
    saree_length: typeof body.saree_length === "string" ? body.saree_length.trim() : "",
    blouse_length: typeof body.blouse_length === "string" ? body.blouse_length.trim() : "",
    top_length: typeof body.top_length === "string" ? body.top_length.trim() : "",
    bottom_length: typeof body.bottom_length === "string" ? body.bottom_length.trim() : "",
    dupatta_length: typeof body.dupatta_length === "string" ? body.dupatta_length.trim() : "",
    gown_length: typeof body.gown_length === "string" ? body.gown_length.trim() : "",
    sleeve_type: typeof body.sleeve_type === "string" ? body.sleeve_type.trim() : "",
    neck_type: typeof body.neck_type === "string" ? body.neck_type.trim() : "",
    fit_type: typeof body.fit_type === "string" ? body.fit_type.trim() : "",
    work_type: typeof body.work_type === "string" ? body.work_type.trim() : "",
    zari_color: typeof body.zari_color === "string" ? body.zari_color.trim() : "",
    age: typeof body.age === "string" ? body.age.trim() : "",
  };

  if (!product.name || product.name.length > 191 ||
      !product.product_code || product.product_code.length > 100 ||
      !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(product.slug) || product.slug.length > 220 ||
      !product.cat_type ||
      !product.category || product.category.length > 191) {
    const error = new Error("Product name, SKU, valid slug, category type, and category are required.");
    error.status = 400;
    throw error;
  }
  if (product.cat_type.length > 100 || product.brand.length > 120 || product.model_number.length > 120 ||
      product.subcategory.length > 191 || product.warranty.length > 191 ||
      product.description.length > 20000 || product.return_policy.length > 5000 ||
      product.unit.length > 32 || product.size_chart.length > 512 ||
      product.connectivity.length > 100 || product.dimensions.length > 191 || product.power_battery.length > 1000 ||
      product.natural_product_type.length > 100 || product.ingredients.length > 5000 ||
      product.quantity_unit.length > 32 || product.shelf_life.length > 100 ||
      product.organic_certification.length > 191 || product.storage_instructions.length > 2000 ||
      product.country_of_origin.length > 100 ||
      product.gender.length > 32 || product.pattern.length > 100 || product.material.length > 191 ||
      product.wash_care.length > 2000 || product.fit_type.length > 100 ||
      product.sleeve_type.length > 100 || product.neck_type.length > 100) {
    const error = new Error("One or more product fields exceed the allowed length.");
    error.status = 400;
    throw error;
  }
  if (product.manufacturing_date && product.expiry_date &&
      product.expiry_date < product.manufacturing_date) {
    const error = new Error("Expiry date cannot be before manufacturing date.");
    error.status = 400;
    throw error;
  }
  if (!Array.isArray(product.variants) || product.variants.length > 30 ||
      product.variants.some(variant => !variant || typeof variant !== "object" || Array.isArray(variant))) {
    const error = new Error("Product variants must be a list of up to 30 variant objects.");
    error.status = 400;
    throw error;
  }

  product.stock_status = product.total_stock === 0
    ? "Out of Stock"
    : product.total_stock < 10
      ? "Low Stock"
      : "In Stock";
  return product;
}

const PRODUCT_COLUMNS = `id, name, product_code, slug, cat_type, category, subcategory,
  brand, model_number, description, mrp, offer, offer_price, total_stock, unit, stock_status,
  images, size_chart, connectivity, weight, dimensions, power_battery, specifications,
  natural_product_type, ingredients, net_quantity, quantity_unit, manufacturing_date, expiry_date,
  shelf_life, organic_certification, storage_instructions, country_of_origin,
  video, warranty, return_policy, featured, trending, new_arrival, status, variants,
  rating, gender, material, wash_care, available_sizes, available_colors, pattern, saree_length, blouse_length, top_length, bottom_length,
  dupatta_length, gown_length, sleeve_type, neck_type, fit_type, work_type, zari_color, age,
  created_at, updated_at`;

function toProduct(row) {
  return {
    ...row,
    images: parseJson(row.images, []),
    variants: parseJson(row.variants, []),
    available_sizes: parseJson(row.available_sizes, []),
    available_colors: parseJson(row.available_colors, []),
    specifications: parseJson(row.specifications, []),
    featured: Boolean(row.featured),
    trending: Boolean(row.trending),
    new_arrival: Boolean(row.new_arrival),
  };
}

const INSERT_COLUMNS = [
  "name", "product_code", "slug", "cat_type", "category", "subcategory", "brand", "model_number",
  "description", "mrp", "offer", "offer_price", "total_stock", "unit", "stock_status", "images", "size_chart",
  "connectivity", "weight", "dimensions", "power_battery", "specifications", "video",
  "natural_product_type", "ingredients", "net_quantity", "quantity_unit", "manufacturing_date",
  "expiry_date", "shelf_life", "organic_certification", "storage_instructions", "country_of_origin",
  "warranty", "return_policy", "featured", "trending", "new_arrival", "status", "variants", "rating",
  "gender", "material", "wash_care", "available_sizes", "available_colors", "pattern",
  "saree_length", "blouse_length", "top_length", "bottom_length",
  "dupatta_length", "gown_length", "sleeve_type", "neck_type", "fit_type", "work_type", "zari_color", "age",
];

function productValues(product) {
  return [
    product.name, product.product_code, product.slug, product.cat_type || null, product.category,
    product.subcategory || null, product.brand || null, product.model_number || null,
    product.description, product.mrp, product.offer, product.offer_price, product.total_stock, product.unit,
    product.stock_status, JSON.stringify(product.images), product.size_chart || null, product.connectivity || null,
    product.weight, product.dimensions || null, product.power_battery || null, JSON.stringify(product.specifications),
    product.video || null, product.natural_product_type || null, product.ingredients || null, product.net_quantity,
    product.quantity_unit || "g", product.manufacturing_date, product.expiry_date, product.shelf_life || null,
    product.organic_certification || null, product.storage_instructions || null, product.country_of_origin || null,
    product.warranty || null,
    product.return_policy || null, product.featured, product.trending, product.new_arrival, product.status,
    JSON.stringify(product.variants), product.rating, product.gender || null, product.material || null,
    product.wash_care || null, JSON.stringify(product.available_sizes), JSON.stringify(product.available_colors),
    product.pattern || null,
    product.saree_length || null, product.blouse_length || null, product.top_length || null,
    product.bottom_length || null, product.dupatta_length || null, product.gown_length || null,
    product.sleeve_type || null, product.neck_type || null, product.fit_type || null,
    product.work_type || null, product.zari_color || null, product.age || null,
  ];
}

function createConflictError(message) {
  const error = new Error(message);
  error.status = 409;
  return error;
}

async function findAvailableSlug(pool, baseSlug, excludeId) {
  const query = excludeId
    ? "SELECT slug FROM products WHERE (slug = ? OR slug LIKE ?) AND id <> ?"
    : "SELECT slug FROM products WHERE slug = ? OR slug LIKE ?";
  const parameters = excludeId
    ? [baseSlug, `${baseSlug}-%`, excludeId]
    : [baseSlug, `${baseSlug}-%`];
  const [rows] = await pool.execute(query, parameters);
  const existingSlugs = new Set(rows.map((row) => row.slug));
  if (!existingSlugs.has(baseSlug)) return baseSlug;

  for (let suffix = 2; suffix <= 10000; suffix += 1) {
    const suffixText = `-${suffix}`;
    const candidate = `${baseSlug.slice(0, 220 - suffixText.length)}${suffixText}`;
    if (!existingSlugs.has(candidate)) return candidate;
  }
  throw createConflictError("Could not generate a unique product URL. Please try again.");
}

async function ensureProductCodeAvailable(pool, productCode, excludeId) {
  const query = excludeId
    ? "SELECT id FROM products WHERE product_code = ? AND id <> ? LIMIT 1"
    : "SELECT id FROM products WHERE product_code = ? LIMIT 1";
  const parameters = excludeId ? [productCode, excludeId] : [productCode];
  const [rows] = await pool.execute(query, parameters);
  if (rows.length) {
    throw createConflictError("This product SKU is already in use. Refresh the form to get a new SKU.");
  }
}

async function insertProductWithUniqueSlug(pool, product) {
  const baseSlug = product.slug;
  await ensureProductCodeAvailable(pool, product.product_code);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    product.slug = await findAvailableSlug(pool, baseSlug);
    try {
      return await pool.execute(
        `INSERT INTO products (${INSERT_COLUMNS.join(", ")}) VALUES (${INSERT_COLUMNS.map(() => "?").join(", ")})`,
        productValues(product),
      );
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY") throw error;
      await ensureProductCodeAvailable(pool, product.product_code);
      if (attempt === 4) {
        throw createConflictError("Could not generate a unique product URL. Please try again.");
      }
    }
  }
  throw createConflictError("Could not generate a unique product URL. Please try again.");
}

async function updateProductWithUniqueSlug(pool, product, id) {
  const baseSlug = product.slug;
  await ensureProductCodeAvailable(pool, product.product_code, id);

  for (let attempt = 0; attempt < 5; attempt += 1) {
    product.slug = await findAvailableSlug(pool, baseSlug, id);
    try {
      return await pool.execute(
        `UPDATE products SET ${INSERT_COLUMNS.map(column => `${column} = ?`).join(", ")} WHERE id = ?`,
        [...productValues(product), id],
      );
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY") throw error;
      await ensureProductCodeAvailable(pool, product.product_code, id);
      if (attempt === 4) {
        throw createConflictError("Could not generate a unique product URL. Please try again.");
      }
    }
  }
  throw createConflictError("Could not generate a unique product URL. Please try again.");
}

function createProductsRouter(pool) {
  const router = express.Router();

  router.get("/public", async (request, response, next) => {
    try {
      const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
      const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
      const filters = ["status = 'Active'"];
      const params = [];
      if (search) {
        filters.push(
          "(name LIKE ? OR product_code LIKE ? OR model_number LIKE ? OR category LIKE ? OR cat_type LIKE ? OR subcategory LIKE ? OR brand LIKE ? OR description LIKE ?)",
        );
        params.push(...Array(8).fill(`%${search}%`));
      }
      const where = `WHERE ${filters.join(" AND ")}`;
      const [[countRows], [rows]] = await Promise.all([
        pool.execute(`SELECT COUNT(*) AS total FROM products ${where}`, params),
        pool.execute(
          `SELECT ${PRODUCT_COLUMNS} FROM products
           ${where}
           ORDER BY created_at DESC, id DESC
           LIMIT ? OFFSET ?`,
          [...params, limit, (page - 1) * limit],
        ),
      ]);
      const total = Number(countRows[0].total) || 0;
      return response.json({
        products: rows.map(toProduct),
        pagination: { total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/public/:id", async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid product id." });
      }

      const [rows] = await pool.execute(
        `SELECT ${PRODUCT_COLUMNS} FROM products
         WHERE id = ? AND status = 'Active'
         LIMIT 1`,
        [id],
      );
      if (!rows.length) {
        return response.status(404).json({ message: "Product not found." });
      }
      return response.json(toProduct(rows[0]));
    } catch (error) {
      return next(error);
    }
  });

  router.use(requireAdmin);

  router.post("/upload", upload.fields([
    { name: "images", maxCount: 10 },
    { name: "size_chart", maxCount: 1 },
    { name: "video", maxCount: 1 },
  ]), (request, response) => {
    const basePath = "/uploads/products/";
    return response.json({
      images: (request.files.images || []).map(file => `${basePath}${file.filename}`),
      size_chart: request.files.size_chart?.[0] ? `${basePath}${request.files.size_chart[0].filename}` : "",
      video: request.files.video?.[0] ? `${basePath}${request.files.video[0].filename}` : "",
    });
  });

  router.get("/latest-code", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(product_code, 4) AS UNSIGNED)), 0) + 1 AS nextCode
         FROM products
         WHERE product_code REGEXP '^OTP[0-9]+$'`,
      );
      const nextId = Number(rows[0]?.nextCode) || 1;
      return response.json({ latestCode: `OTP${String(nextId).padStart(4, "0")}` });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/", async (request, response, next) => {
    try {
      const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 10));
      const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
      const status = typeof request.query.status === "string" ? request.query.status : "All";
      const filters = [];
      const params = [];
      if (search) {
        filters.push("(name LIKE ? OR product_code LIKE ? OR brand LIKE ? OR model_number LIKE ?)");
        params.push(...Array(4).fill(`%${search}%`));
      }
      if (status === "Low Stock" || status === "Out of Stock" || status === "In Stock") {
        filters.push("stock_status = ?");
        params.push(status);
      } else if (status === "Active" || status === "Inactive") {
        filters.push("status = ?");
        params.push(status);
      }
      const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
      const [[countRows], [rows], [statsRows]] = await Promise.all([
        pool.execute(`SELECT COUNT(*) AS total FROM products ${where}`, params),
        pool.execute(
          `SELECT ${PRODUCT_COLUMNS} FROM products ${where} ORDER BY created_at DESC, id DESC LIMIT ? OFFSET ?`,
          [...params, limit, (page - 1) * limit],
        ),
        pool.execute(`SELECT COUNT(*) AS total,
          SUM(status = 'Active') AS active,
          SUM(status = 'Inactive') AS inactive,
          SUM(stock_status = 'Low Stock') AS lowStock,
          SUM(stock_status = 'Out of Stock') AS outOfStock
          FROM products`),
      ]);
      const total = Number(countRows[0].total) || 0;
      const stats = statsRows[0];
      return response.json({
        products: rows.map(toProduct),
        pagination: { total, totalPages: Math.max(1, Math.ceil(total / limit)) },
        stats: {
          total: Number(stats.total) || 0,
          active: Number(stats.active) || 0,
          inactive: Number(stats.inactive) || 0,
          lowStock: Number(stats.lowStock) || 0,
          outOfStock: Number(stats.outOfStock) || 0,
        },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        `SELECT ${PRODUCT_COLUMNS} FROM products WHERE id = ? LIMIT 1`,
        [request.params.id],
      );
      if (!rows.length) return response.status(404).json({ message: "Product not found." });
      return response.json(toProduct(rows[0]));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const product = parseProduct(request.body || {});
      const [result] = await insertProductWithUniqueSlug(pool, product);
      return response.status(201).json({ id: result.insertId, ...product });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.put("/:id", async (request, response, next) => {
    try {
      const product = parseProduct(request.body || {});
      const [result] = await updateProductWithUniqueSlug(pool, product, request.params.id);
      if (!result.affectedRows) {
        const [rows] = await pool.execute("SELECT id FROM products WHERE id = ? LIMIT 1", [request.params.id]);
        if (!rows.length) return response.status(404).json({ message: "Product not found." });
      }
      return response.json({ id: Number(request.params.id), ...product });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.delete("/:id", async (request, response, next) => {
    try {
      const [result] = await pool.execute("DELETE FROM products WHERE id = ?", [request.params.id]);
      if (!result.affectedRows) return response.status(404).json({ message: "Product not found." });
      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createProductsRouter;
