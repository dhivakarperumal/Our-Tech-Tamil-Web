const express = require("express");
const jwt = require("jsonwebtoken");

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function authenticate(request, response, next) {
  const [scheme, token] = (request.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication is required." });
  }
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    if (typeof request.user.user_id !== "string" || !request.user.user_id.trim()) {
      return response.status(401).json({ message: "Your session does not identify a user. Please sign in again." });
    }
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return response.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
    }
    return next(error);
  }
}

function parseProductId(value) {
  const productId = Number(value);
  if (!Number.isSafeInteger(productId) || productId < 1) {
    throw httpError(400, "A valid product ID is required.");
  }
  return productId;
}

function parseVariant(value, label) {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.trim().length > 100) {
    throw httpError(400, `${label} must be at most 100 characters.`);
  }
  return value.trim();
}

function parseImages(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseVariants(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseOptions(value) {
  const parsed = parseImages(value);
  return parsed.filter((option) => typeof option === "string");
}

function toWishlistItem(row) {
  const variants = parseVariants(row.variants);
  const selectedVariant = variants.find((variant) =>
    (variant.colorName || variant.color || "") === row.variant_color,
  ) || variants[0] || {};
  const variantImages = parseImages(selectedVariant.images);
  const images = parseImages(row.images);
  return {
    id: Number(row.id),
    product_id: Number(row.product_id),
    name: row.product_name || row.name,
    product_name: row.product_name || row.name,
    product_code: row.product_code || row.current_product_code,
    image: row.product_image || variantImages[0] || images[0] || "",
    product_image: row.product_image || variantImages[0] || images[0] || "",
    price: Number(row.offer_price ?? row.current_offer_price ?? row.mrp ?? row.current_mrp),
    mrp: Number(row.mrp ?? row.current_mrp),
    offer_price: Number(row.offer_price ?? row.current_offer_price ?? row.mrp ?? row.current_mrp),
    colorName: row.variant_color || "",
    variant_color: row.variant_color || "",
    size: row.variant_size || "",
    variant_size: row.variant_size || "",
    available_sizes: parseOptions(row.available_sizes),
    available_colors: parseOptions(row.available_colors),
    variants,
  };
}

function createWishlistRouter(pool) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        `SELECT wi.id, wi.product_id, wi.product_name, wi.product_image, wi.product_code,
                wi.mrp, wi.offer_price, wi.variant_color, wi.variant_size,
                p.name, p.product_code AS current_product_code, p.images, p.variants,
                p.available_sizes, p.available_colors, p.mrp AS current_mrp,
                p.offer_price AS current_offer_price
         FROM wishlist_items wi
         INNER JOIN products p ON p.id = wi.product_id
         WHERE wi.user_id = ? AND p.status = 'Active'
         ORDER BY wi.created_at DESC, wi.id DESC`,
        [request.user.user_id],
      );
      return response.json(rows.map(toWishlistItem));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const productId = parseProductId(request.body?.product_id);
      const variantColor = parseVariant(request.body?.variant_color, "Variant color");
      const variantSize = parseVariant(request.body?.variant_size, "Variant size");
      const [products] = await pool.execute(
        `SELECT id, name, product_code, images, variants, mrp, offer_price,
                available_sizes, available_colors
         FROM products WHERE id = ? AND status = 'Active' LIMIT 1`,
        [productId],
      );
      const product = products[0];
      if (!product) throw httpError(404, "This product is no longer available.");
      const variants = parseVariants(product.variants);
      const availableColors = parseOptions(product.available_colors);
      const availableSizes = parseOptions(product.available_sizes);
      const selectedVariant = variants.find((variant) =>
        (variant.colorName || variant.color || "") === variantColor,
      );
      if (variantColor && ((variants.length && !selectedVariant) ||
          (availableColors.length && !availableColors.includes(variantColor)))) {
        throw httpError(400, "The selected product color is not available.");
      }
      if (variantSize) {
        const sizes = selectedVariant?.sizesStock && typeof selectedVariant.sizesStock === "object"
          ? Object.keys(selectedVariant.sizesStock)
          : availableSizes;
        if (sizes.length && !sizes.includes(variantSize)) {
          throw httpError(400, "The selected product size is not available.");
        }
      }
      const variantImages = parseImages(selectedVariant?.images);
      const productImages = parseImages(product.images);
      const image = variantImages[0] || productImages[0] || "";
      const mrp = Number(product.mrp);
      const offerPrice = Number(product.offer_price ?? product.mrp);
      if (!Number.isFinite(mrp) || mrp < 0 || !Number.isFinite(offerPrice) || offerPrice < 0) {
        throw httpError(400, "This product has an invalid price.");
      }
      await pool.execute(
        `INSERT INTO wishlist_items
          (user_id, product_id, product_name, product_image, product_code, mrp,
           offer_price, variant_color, variant_size)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           product_name = VALUES(product_name), product_image = VALUES(product_image),
           product_code = VALUES(product_code), mrp = VALUES(mrp), offer_price = VALUES(offer_price)`,
        [
          request.user.user_id,
          productId,
          product.name,
          image,
          product.product_code,
          mrp,
          offerPrice,
          variantColor,
          variantSize,
        ],
      );
      return response.status(201).json({ message: "Product added to favorites." });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.delete("/item/:wishlistItemId", async (request, response, next) => {
    try {
      const wishlistItemId = parseProductId(request.params.wishlistItemId);
      const [result] = await pool.execute(
        "DELETE FROM wishlist_items WHERE user_id = ? AND id = ?",
        [request.user.user_id, wishlistItemId],
      );
      if (!result.affectedRows) throw httpError(404, "Favorite not found.");
      return response.json({ message: "Product removed from favorites." });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  router.delete("/:productId", async (request, response, next) => {
    try {
      const productId = parseProductId(request.params.productId);
      const variantColor = parseVariant(request.query.variant_color, "Variant color");
      const variantSize = parseVariant(request.query.variant_size, "Variant size");
      const [result] = await pool.execute(
        `DELETE FROM wishlist_items
         WHERE user_id = ? AND product_id = ? AND variant_color = ? AND variant_size = ?`,
        [request.user.user_id, productId, variantColor, variantSize],
      );
      if (!result.affectedRows) throw httpError(404, "Favorite not found.");
      return response.json({ message: "Product removed from favorites." });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  return router;
}

module.exports = createWishlistRouter;
