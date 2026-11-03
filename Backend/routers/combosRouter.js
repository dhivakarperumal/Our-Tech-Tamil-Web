const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

const uploadDirectory = path.join(__dirname, "..", "uploads", "combos");
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
    const isImage = file.fieldname === "gallery" &&
      mediaExtensions[file.mimetype] && file.mimetype.startsWith("image/");
    const isVideo = file.fieldname === "video" &&
      mediaExtensions[file.mimetype] && file.mimetype.startsWith("video/");
    if (!isImage && !isVideo) {
      const error = new Error("Upload supported image files or MP4, WebM, and MOV videos only.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function parseList(value, field, maxLength = 100) {
  let list = value;
  if (list === undefined || list === null) list = [];
  if (typeof list === "string") {
    try {
      list = JSON.parse(list);
    } catch {
      throw httpError(400, `${field} must be a valid list.`);
    }
  }
  if (!Array.isArray(list) || list.length > maxLength) {
    throw httpError(400, `${field} must contain no more than ${maxLength} items.`);
  }
  return list;
}

function requiredText(value, field, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > maxLength) {
    throw httpError(400, `${field} is required and must be at most ${maxLength} characters.`);
  }
  return text;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.length > maxLength) {
    throw httpError(400, `${field} must be at most ${maxLength} characters.`);
  }
  return value.trim();
}

function numberValue(value, field, { required = false, min = 0, max = 100000000, integer = false } = {}) {
  if ((value === undefined || value === null || value === "") && !required) return 0;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw httpError(400, `${field} must be ${integer ? "a whole number" : "a number"} between ${min} and ${max}.`);
  }
  return number;
}

function normalizeCombo(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Combo details must be provided.");
  }
  const name = requiredText(body.name, "Combo name", 191);
  const code = requiredText(body.code, "Combo code", 100);
  const categoryType = requiredText(body.category_type, "Category type", 100);
  const category = requiredText(body.category, "Category", 191);
  const subcategory = requiredText(body.subcategory, "Subcategory", 191);
  const status = body.status === "Draft" ? "Draft" : body.status === "Inactive" ? "Inactive" : "Active";
  const products = parseList(body.products, "Selected products", 100).map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw httpError(400, "Each selected product must be valid.");
    }
    const id = Number(item.id);
    const quantity = numberValue(item.quantity, "Product quantity", { required: true, min: 1, max: 10000, integer: true });
    if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Each selected product must have a valid ID.");
    return { id, quantity };
  });
  if (status !== "Draft" && !products.length) {
    throw httpError(400, "Select at least one product for the combo.");
  }

  const mrp = numberValue(body.mrp, "Combo MRP", { required: status !== "Draft", min: 0.01 });
  const offer = numberValue(body.offer, "Offer percentage", { max: 100 });
  const gst = numberValue(body.gst, "GST", { max: 100 });
  const offerPrice = numberValue(body.offer_price, "Offer price");
  const finalPrice = numberValue(body.final_price, "Final selling price");
  const minimumOrderQuantity = numberValue(body.minimum_order_quantity, "Minimum order quantity", { min: 1, max: 100000, integer: true });
  const maximumOrderQuantity = numberValue(body.maximum_order_quantity, "Maximum order quantity", { min: 0, max: 100000, integer: true });
  if (maximumOrderQuantity && maximumOrderQuantity < minimumOrderQuantity) {
    throw httpError(400, "Maximum order quantity must not be less than the minimum.");
  }

  const specifications = parseList(body.specifications, "Specifications", 100)
    .map((item) => {
      if (!item || typeof item.key !== "string" || typeof item.value !== "string") {
        throw httpError(400, "Each specification needs a title and value.");
      }
      const key = item.key.trim();
      const value = item.value.trim();
      if (!key || !value || key.length > 100 || value.length > 500) {
        throw httpError(400, "Specification titles and values are required and must be within their length limits.");
      }
      return { key, value };
    });

  return {
    name,
    code,
    category_type: categoryType,
    category,
    subcategory,
    brand: optionalText(body.brand, "Brand", 120),
    short_description: optionalText(body.short_description, "Short description", 500),
    description: optionalText(body.description, "Full description", 20000),
    thumbnail: optionalText(body.thumbnail, "Combo thumbnail", 512),
    gallery_images: parseList(body.gallery_images, "Gallery images", 10),
    video: optionalText(body.video, "Product video", 512),
    status,
    products,
    mrp,
    offer,
    offer_price: offerPrice,
    total_savings: numberValue(body.total_savings, "Total savings"),
    gst,
    final_price: finalPrice,
    available_stock: numberValue(body.available_stock, "Available combo stock", { max: 10000000, integer: true }),
    minimum_order_quantity: minimumOrderQuantity || 1,
    maximum_order_quantity: maximumOrderQuantity,
    stock_status: optionalText(body.stock_status, "Stock status", 32) || "Out of Stock",
    track_inventory: Boolean(body.track_inventory),
    allow_backorders: Boolean(body.allow_backorders),
    specifications,
    warranty: optionalText(body.warranty, "Warranty", 191),
    return_policy: optionalText(body.return_policy, "Return policy", 5000),
    delivery_information: optionalText(body.delivery_information, "Delivery information", 2000),
    rating: numberValue(body.rating, "Rating", { max: 5 }),
    featured: Boolean(body.featured),
    trending: Boolean(body.trending),
    new_arrival: Boolean(body.new_arrival),
  };
}

const COMBO_COLUMNS = `
  id, name, code, category_type, category, subcategory, brand, short_description,
  description, thumbnail, gallery_images, video, status, products, mrp, offer,
  offer_price, total_savings, gst, final_price, available_stock,
  minimum_order_quantity, maximum_order_quantity, stock_status, track_inventory,
  allow_backorders, specifications, warranty, return_policy, delivery_information,
  rating, featured, trending, new_arrival, created_at, updated_at
`;

function createCombosRouter(pool) {
  const router = express.Router();

  router.get("/public", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        `SELECT id, name, code, category_type, category, subcategory, description,
                gallery_images, status, products, mrp, offer_price, final_price,
                total_savings, available_stock, stock_status, track_inventory,
                allow_backorders, minimum_order_quantity, maximum_order_quantity, rating
         FROM combos WHERE status = 'Active' ORDER BY created_at DESC, id DESC`,
      );
      return response.json({
        success: true,
        combos: rows.map((combo) => ({
          id: combo.id,
          name: combo.name,
          code: combo.code,
          category_type: combo.category_type,
          category: combo.category,
          subcategory: combo.subcategory,
          description: combo.description,
          gallery_images: parseList(combo.gallery_images, "Gallery images", 10),
          products: parseList(combo.products, "Selected products", 100),
          mrp: combo.mrp,
          offer_price: combo.offer_price,
          final_price: combo.final_price,
          total_savings: combo.total_savings,
          available_stock: combo.available_stock,
          stock_status: combo.stock_status,
          track_inventory: combo.track_inventory,
          allow_backorders: combo.allow_backorders,
          minimum_order_quantity: combo.minimum_order_quantity,
          maximum_order_quantity: combo.maximum_order_quantity,
          rating: Number(combo.rating) || 0,
        })),
      });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/public/:id", async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid combo ID.");
      const [rows] = await pool.execute(
        `SELECT id, name, code, category_type, category, subcategory, description,
                gallery_images, video, status, products, mrp, offer, offer_price,
                final_price, total_savings, available_stock, stock_status,
                track_inventory, allow_backorders, minimum_order_quantity, maximum_order_quantity,
                specifications, warranty, return_policy, delivery_information
         FROM combos WHERE id = ? AND status = 'Active' LIMIT 1`,
        [id],
      );
      if (!rows.length) throw httpError(404, "Combo product not found.");

      const combo = rows[0];
      const selectedProducts = parseList(combo.products, "Selected products", 100);
      const productIds = selectedProducts
        .map((item) => Number(item.id))
        .filter((productId) => Number.isSafeInteger(productId) && productId > 0);
      let productRows = [];
      if (productIds.length) {
        const [products] = await pool.execute(
          `SELECT id, name, product_code, category, subcategory, mrp, offer_price, images
           FROM products WHERE status = 'Active' AND id IN (${productIds.map(() => "?").join(", ")})`,
          productIds,
        );
        productRows = products;
      }
      const productById = new Map(productRows.map((product) => [Number(product.id), product]));

      return response.json({
        success: true,
        combo: {
          ...combo,
          gallery_images: parseList(combo.gallery_images, "Gallery images", 10),
          specifications: parseList(combo.specifications, "Specifications", 100),
          products: selectedProducts.map((item) => {
            const product = productById.get(Number(item.id));
            return product ? {
              ...product,
              images: parseList(product.images, "Product images", 100),
              quantity: Number(item.quantity) || 1,
            } : null;
          }).filter(Boolean),
        },
      });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.use(requireAdmin);

  router.get("/next-code", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        `SELECT COALESCE(MAX(CAST(SUBSTRING(code, 6) AS UNSIGNED)), 0) + 1 AS nextCode
         FROM combos WHERE code REGEXP '^COMBO[0-9]+$'`,
      );
      const nextCode = Number(rows[0]?.nextCode) || 1;
      return response.json({ code: `COMBO${String(nextCode).padStart(4, "0")}` });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/categories", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        "SELECT id, cat_id, name, category_type, subcategory FROM categories WHERE status = 'Active' ORDER BY name",
      );
      return response.json(rows.map((row) => ({
        ...row,
        subcategory: parseList(row.subcategory, "Category subcategories", 500),
      })));
    } catch (error) {
      return next(error);
    }
  });

  router.get("/products", async (request, response, next) => {
    try {
      const page = Math.max(1, Number.parseInt(request.query.page, 10) || 1);
      const limit = Math.min(100, Math.max(1, Number.parseInt(request.query.limit, 10) || 24));
      const filters = ["status = 'Active'"];
      const params = [];
      const search = typeof request.query.search === "string" ? request.query.search.trim() : "";
      const category = typeof request.query.category === "string" ? request.query.category.trim() : "";
      const subcategory = typeof request.query.subcategory === "string" ? request.query.subcategory.trim() : "";
      const categoryType = typeof request.query.categoryType === "string" ? request.query.categoryType.trim() : "";
      if (categoryType) {
        filters.push("cat_type = ?");
        params.push(categoryType);
      }
      if (search) {
        filters.push("(name LIKE ? OR product_code LIKE ?)");
        params.push(`%${search}%`, `%${search}%`);
      }
      if (category) {
        filters.push("category = ?");
        params.push(category);
      }
      if (subcategory) {
        filters.push("subcategory = ?");
        params.push(subcategory);
      }
      const where = `WHERE ${filters.join(" AND ")}`;
      const [[countRows], [rows]] = await Promise.all([
        pool.execute(`SELECT COUNT(*) AS total FROM products ${where}`, params),
        pool.execute(
          `SELECT id, name, product_code, category, subcategory, mrp, offer_price,
                  total_stock, images
           FROM products ${where}
           ORDER BY name, id LIMIT ? OFFSET ?`,
          [...params, limit, (page - 1) * limit],
        ),
      ]);
      const total = Number(countRows[0]?.total) || 0;
      return response.json({
        products: rows.map((row) => ({
          ...row,
          images: typeof row.images === "string" ? parseList(row.images, "Product images", 100) : row.images || [],
        })),
        pagination: { total, totalPages: Math.max(1, Math.ceil(total / limit)) },
      });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/upload", upload.fields([
    { name: "gallery", maxCount: 10 },
    { name: "video", maxCount: 1 },
  ]), (request, response) => {
    const basePath = "/uploads/combos/";
    return response.json({
      gallery_images: (request.files.gallery || []).map((file) => `${basePath}${file.filename}`),
      video: request.files.video?.[0] ? `${basePath}${request.files.video[0].filename}` : "",
    });
  });

  router.get("/", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(`SELECT ${COMBO_COLUMNS} FROM combos ORDER BY created_at DESC, id DESC`);
      return response.json({ success: true, combos: rows });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid combo ID.");
      const [rows] = await pool.execute(`SELECT ${COMBO_COLUMNS} FROM combos WHERE id = ? LIMIT 1`, [id]);
      if (!rows.length) throw httpError(404, "Combo product not found.");

      const combo = rows[0];
      const products = parseList(combo.products, "Selected products", 100);
      const productIds = products.map((item) => Number(item.id)).filter((productId) => Number.isSafeInteger(productId) && productId > 0);
      let productRows = [];
      if (productIds.length) {
        const [selectedProducts] = await pool.execute(
          `SELECT id, name, product_code, mrp, offer_price, total_stock, images
           FROM products WHERE id IN (${productIds.map(() => "?").join(", ")})`,
          productIds,
        );
        productRows = selectedProducts;
      }
      const productById = new Map(productRows.map((product) => [Number(product.id), product]));
      return response.json({
        success: true,
        combo: {
          ...combo,
          gallery_images: parseList(combo.gallery_images, "Gallery images", 10),
          products: products.map((item) => {
            const product = productById.get(Number(item.id));
            return {
              ...(product || {}),
              id: Number(item.id),
              quantity: Number(item.quantity) || 1,
              images: product ? parseList(product.images, "Product images", 100) : [],
            };
          }),
          specifications: parseList(combo.specifications, "Specifications", 100),
        },
      });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const combo = normalizeCombo(request.body);
      const [result] = await pool.execute(
        `INSERT INTO combos (
          name, code, category_type, category, subcategory, brand, short_description,
          description, thumbnail, gallery_images, video, status, products, mrp, offer,
          offer_price, total_savings, gst, final_price, available_stock,
          minimum_order_quantity, maximum_order_quantity, stock_status, track_inventory,
          allow_backorders, specifications, warranty, return_policy, delivery_information,
          rating, featured, trending, new_arrival, created_by
        ) VALUES (${new Array(34).fill("?").join(", ")})`,
        [
          combo.name, combo.code, combo.category_type, combo.category, combo.subcategory,
          combo.brand, combo.short_description, combo.description, combo.thumbnail,
          JSON.stringify(combo.gallery_images), combo.video, combo.status,
          JSON.stringify(combo.products), combo.mrp, combo.offer, combo.offer_price,
          combo.total_savings, combo.gst, combo.final_price, combo.available_stock,
          combo.minimum_order_quantity, combo.maximum_order_quantity, combo.stock_status,
          combo.track_inventory, combo.allow_backorders, JSON.stringify(combo.specifications),
          combo.warranty, combo.return_policy, combo.delivery_information, combo.rating,
          combo.featured, combo.trending, combo.new_arrival, request.user.user_id,
        ],
      );
      return response.status(201).json({
        success: true,
        combo: { id: result.insertId, ...combo },
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return response.status(409).json({ message: "A combo with this code already exists." });
      }
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.patch("/:id/stock", async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid combo ID.");
      const quantity = numberValue(request.body?.quantity, "Stock quantity", {
        required: true,
        min: 1,
        max: 10000000,
        integer: true,
      });
      const [result] = await pool.execute(
        `UPDATE combos SET
          available_stock = available_stock + ?,
          stock_status = CASE WHEN available_stock + ? <= 10 THEN 'Low Stock' ELSE 'In Stock' END
         WHERE id = ?`,
        [quantity, quantity, id],
      );
      if (!result.affectedRows) throw httpError(404, "Combo product not found.");
      const [rows] = await pool.execute(
        "SELECT id, available_stock, stock_status FROM combos WHERE id = ?",
        [id],
      );
      return response.json({ success: true, combo: rows[0] });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.put("/:id", async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid combo ID.");
      const combo = normalizeCombo(request.body);
      const [result] = await pool.execute(
        `UPDATE combos SET
          name = ?, code = ?, category_type = ?, category = ?, subcategory = ?, brand = ?,
          short_description = ?, description = ?, thumbnail = ?, gallery_images = ?, video = ?,
          status = ?, products = ?, mrp = ?, offer = ?, offer_price = ?, total_savings = ?,
          gst = ?, final_price = ?, available_stock = ?, minimum_order_quantity = ?,
          maximum_order_quantity = ?, stock_status = ?, track_inventory = ?, allow_backorders = ?,
          specifications = ?, warranty = ?, return_policy = ?, delivery_information = ?,
          rating = ?, featured = ?, trending = ?, new_arrival = ?
         WHERE id = ?`,
        [
          combo.name, combo.code, combo.category_type, combo.category, combo.subcategory,
          combo.brand, combo.short_description, combo.description, combo.thumbnail,
          JSON.stringify(combo.gallery_images), combo.video, combo.status,
          JSON.stringify(combo.products), combo.mrp, combo.offer, combo.offer_price,
          combo.total_savings, combo.gst, combo.final_price, combo.available_stock,
          combo.minimum_order_quantity, combo.maximum_order_quantity, combo.stock_status,
          combo.track_inventory, combo.allow_backorders, JSON.stringify(combo.specifications),
          combo.warranty, combo.return_policy, combo.delivery_information, combo.rating,
          combo.featured, combo.trending, combo.new_arrival, id,
        ],
      );
      if (!result.affectedRows) throw httpError(404, "Combo product not found.");
      return response.json({ success: true, combo: { id, ...combo } });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return response.status(409).json({ message: "A combo with this code already exists." });
      }
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.delete("/:id", async (request, response, next) => {
    try {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) throw httpError(400, "Invalid combo ID.");
      const [result] = await pool.execute("DELETE FROM combos WHERE id = ?", [id]);
      if (!result.affectedRows) throw httpError(404, "Combo product not found.");
      return response.json({ success: true, message: "Combo product deleted." });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  return router;
}

module.exports = createCombosRouter;
module.exports.normalizeCombo = normalizeCombo;
