const express = require("express");
const jwt = require("jsonwebtoken");

const MAX_QUANTITY = 10000;
const MAX_PRICE_CENTS = 9999999999;

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

function parseQuantity(value, fallback = null) {
  if (value === undefined && fallback !== null) return fallback;
  const quantity = Number(value);
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_QUANTITY) {
    throw httpError(400, `Quantity must be a whole number between 1 and ${MAX_QUANTITY}.`);
  }
  return quantity;
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

function priceInCents(value, label) {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw httpError(400, `The product has an invalid ${label}.`);
  }
  const cents = Math.round(price * 100);
  if (!Number.isSafeInteger(cents) || cents > MAX_PRICE_CENTS) {
    throw httpError(400, `The product ${label} is outside the supported price range.`);
  }
  return cents;
}

function validateAmountCents(cents, label) {
  if (!Number.isSafeInteger(cents) || cents < 0 || cents > MAX_PRICE_CENTS) {
    throw httpError(400, `${label} exceeds the supported cart amount.`);
  }
  return cents;
}

function parseImageArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getProductImage(product, variantColor) {
  let variants = product.variants;
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch {
      variants = [];
    }
  }
  const matchingVariant = Array.isArray(variants)
    ? variants.find((variant) => (variant.colorName || variant.color || "") === variantColor)
    : null;
  const variantImages = parseImageArray(matchingVariant?.images);
  const images = parseImageArray(product.images);
  const image = variantImages[0] || images[0] || "";
  return typeof image === "string" ? image : "";
}

function toCartItem(row) {
  const quantity = Number(row.quantity);
  const offerPrice = Number(row.offer_price);
  const subtotal = Number(row.subtotal);
  return {
    id: Number(row.id),
    user_id: row.user_id,
    product_id: Number(row.product_id),
    product_name: row.product_name,
    name: row.product_name,
    product_image: row.product_image || "",
    image: row.product_image || "",
    product_code: row.product_code,
    mrp: Number(row.mrp),
    offer_price: offerPrice,
    price: offerPrice,
    quantity,
    subtotal,
    total_price: subtotal,
    total: Number(row.total),
    variant_color: row.variant_color || "",
    colorName: row.variant_color || "",
    variant_size: row.variant_size || "",
    size: row.variant_size || "",
  };
}

async function getCart(pool, userId) {
  const [rows] = await pool.execute(
    `SELECT id, user_id, product_id, product_name, product_image, product_code,
            mrp, offer_price, quantity, subtotal, total, variant_color, variant_size
     FROM cart_items
     WHERE user_id = ?
     ORDER BY created_at DESC, id DESC`,
    [userId],
  );
  const items = rows.map(toCartItem);
  const totalCents = items.reduce((sum, item) => sum + Math.round(item.subtotal * 100), 0);
  return {
    items,
    total: Number((totalCents / 100).toFixed(2)),
    item_count: items.reduce((sum, item) => sum + item.quantity, 0),
  };
}

async function updateCartTotal(connection, userId) {
  const [rows] = await connection.execute(
    "SELECT COALESCE(SUM(subtotal), 0) AS grand_total FROM cart_items WHERE user_id = ?",
    [userId],
  );
  const totalCents = validateAmountCents(
    Math.round(Number(rows[0]?.grand_total ?? 0) * 100),
    "Cart total",
  );
  await connection.execute(
    "UPDATE cart_items SET total = ? WHERE user_id = ?",
    [Number((totalCents / 100).toFixed(2)), userId],
  );
  return totalCents;
}

async function lockCartForUser(connection, userId) {
  const [users] = await connection.execute(
    "SELECT user_id FROM users WHERE user_id = ? LIMIT 1 FOR UPDATE",
    [userId],
  );
  if (!users.length) throw httpError(401, "The customer account could not be found. Please sign in again.");
}

function createCartRouter(pool) {
  const router = express.Router();

  router.use(authenticate);

  router.get("/", async (request, response, next) => {
    try {
      return response.json(await getCart(pool, request.user.user_id));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    let connection;
    try {
      const body = request.body || {};
      const productId = parseProductId(body.product_id);
      const quantity = parseQuantity(body.quantity, 1);
      const variantColor = parseVariant(body.variant_color, "Variant color");
      const variantSize = parseVariant(body.variant_size, "Variant size");
      const userId = request.user.user_id;

      connection = await pool.getConnection();
      await connection.beginTransaction();
      await lockCartForUser(connection, userId);
      const [products] = await connection.execute(
        `SELECT id, name, product_code, mrp, offer_price, total_stock, status, images, variants
         FROM products
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [productId],
      );
      const product = products[0];
      if (!product || product.status !== "Active") {
        throw httpError(404, "This product is no longer available.");
      }

      const stock = Number(product.total_stock);
      if (!Number.isSafeInteger(stock) || stock < 1) {
        throw httpError(400, "This product is out of stock.");
      }

      const [existingItems] = await connection.execute(
        `SELECT id, quantity
         FROM cart_items
         WHERE user_id = ? AND product_id = ? AND variant_color = ? AND variant_size = ?
         LIMIT 1
         FOR UPDATE`,
        [userId, productId, variantColor, variantSize],
      );
      const [productQuantityRows] = await connection.execute(
        "SELECT COALESCE(SUM(quantity), 0) AS quantity FROM cart_items WHERE user_id = ? AND product_id = ?",
        [userId, productId],
      );
      const currentProductQuantity = Number(productQuantityRows[0]?.quantity || 0);
      if (currentProductQuantity + quantity > stock) {
        throw httpError(400, `Only ${Math.max(0, stock - currentProductQuantity)} more item(s) are available.`);
      }

      const mrpCents = priceInCents(product.mrp, "MRP");
      const offerValue = product.offer_price === null || product.offer_price === undefined || product.offer_price === ""
        ? product.mrp
        : product.offer_price;
      const offerCents = priceInCents(offerValue, "offer price");
      const nextQuantity = Number(existingItems[0]?.quantity || 0) + quantity;
      const lineTotalCents = validateAmountCents(offerCents * nextQuantity, "Cart item subtotal");
      const lineTotal = Number((lineTotalCents / 100).toFixed(2));
      const productImage = getProductImage(product, variantColor);

      if (existingItems.length) {
        await connection.execute(
          `UPDATE cart_items
           SET product_name = ?, product_image = ?, product_code = ?, mrp = ?, offer_price = ?,
               quantity = ?, subtotal = ?
           WHERE id = ? AND user_id = ?`,
          [
            product.name,
            productImage,
            product.product_code,
            Number((mrpCents / 100).toFixed(2)),
            Number((offerCents / 100).toFixed(2)),
            nextQuantity,
            lineTotal,
            existingItems[0].id,
            userId,
          ],
        );
      } else {
        await connection.execute(
          `INSERT INTO cart_items
            (user_id, product_id, product_name, product_image, product_code, mrp, offer_price,
             quantity, subtotal, total, variant_color, variant_size)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            userId,
            product.id,
            product.name,
            productImage,
            product.product_code,
            Number((mrpCents / 100).toFixed(2)),
            Number((offerCents / 100).toFixed(2)),
            quantity,
            Number(((offerCents * quantity) / 100).toFixed(2)),
            Number(((offerCents * quantity) / 100).toFixed(2)),
            variantColor,
            variantSize,
          ],
        );
      }

      await updateCartTotal(connection, userId);
      await connection.commit();
      const cart = await getCart(pool, userId);
      return response.status(existingItems.length ? 200 : 201).json({
        ...cart,
        message: "Product added to cart successfully",
      });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    } finally {
      connection?.release();
    }
  });

  router.put("/:id", async (request, response, next) => {
    let connection;
    try {
      const cartItemId = parseProductId(request.params.id);
      const quantity = parseQuantity(request.body?.quantity);
      const userId = request.user.user_id;
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await lockCartForUser(connection, userId);

      const [rows] = await connection.execute(
        `SELECT ci.id, ci.product_id, ci.variant_color, ci.variant_size,
                p.name, p.product_code, p.mrp, p.offer_price, p.total_stock, p.status, p.images, p.variants
         FROM cart_items ci
         INNER JOIN products p ON p.id = ci.product_id
         WHERE ci.id = ? AND ci.user_id = ?
         LIMIT 1
         FOR UPDATE`,
        [cartItemId, userId],
      );
      const item = rows[0];
      if (!item) throw httpError(404, "Cart item not found.");
      if (item.status !== "Active") throw httpError(400, "This product is no longer available.");

      const [quantityRows] = await connection.execute(
        `SELECT COALESCE(SUM(quantity), 0) AS quantity
         FROM cart_items
         WHERE user_id = ? AND product_id = ? AND id <> ?`,
        [userId, item.product_id, cartItemId],
      );
      const availableStock = Number(item.total_stock) - Number(quantityRows[0]?.quantity || 0);
      if (quantity > availableStock) {
        throw httpError(400, `Only ${Math.max(0, availableStock)} more item(s) are available.`);
      }

      const mrpCents = priceInCents(item.mrp, "MRP");
      const offerValue = item.offer_price === null || item.offer_price === undefined || item.offer_price === ""
        ? item.mrp
        : item.offer_price;
      const offerCents = priceInCents(offerValue, "offer price");
      const subtotalCents = validateAmountCents(offerCents * quantity, "Cart item subtotal");
      const subtotal = Number((subtotalCents / 100).toFixed(2));
      await connection.execute(
        `UPDATE cart_items
         SET product_name = ?, product_image = ?, product_code = ?, mrp = ?, offer_price = ?, quantity = ?, subtotal = ?
         WHERE id = ? AND user_id = ?`,
        [
          item.name,
          getProductImage(item, item.variant_color || ""),
          item.product_code,
          Number((mrpCents / 100).toFixed(2)),
          Number((offerCents / 100).toFixed(2)),
          quantity,
          subtotal,
          cartItemId,
          userId,
        ],
      );
      await updateCartTotal(connection, userId);
      await connection.commit();
      return response.json(await getCart(pool, userId));
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    } finally {
      connection?.release();
    }
  });

  router.delete("/clear", async (request, response, next) => {
    let connection;
    try {
      const userId = request.user.user_id;
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await lockCartForUser(connection, userId);
      await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);
      await connection.commit();
      return response.json({ items: [], total: 0, item_count: 0, message: "Cart cleared." });
    } catch (error) {
      if (connection) await connection.rollback();
      return next(error);
    } finally {
      connection?.release();
    }
  });

  router.delete("/:id", async (request, response, next) => {
    let connection;
    try {
      const cartItemId = parseProductId(request.params.id);
      const userId = request.user.user_id;
      connection = await pool.getConnection();
      await connection.beginTransaction();
      await lockCartForUser(connection, userId);
      const [result] = await connection.execute(
        "DELETE FROM cart_items WHERE id = ? AND user_id = ?",
        [cartItemId, userId],
      );
      if (!result.affectedRows) throw httpError(404, "Cart item not found.");
      await updateCartTotal(connection, userId);
      await connection.commit();
      return response.json(await getCart(pool, userId));
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    } finally {
      connection?.release();
    }
  });

  return router;
}

module.exports = createCartRouter;
