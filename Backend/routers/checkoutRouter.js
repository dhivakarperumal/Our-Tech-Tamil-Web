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

function requiredText(value, field, maxLength) {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text || text.length > maxLength) {
    throw httpError(400, `${field} is required and must be at most ${maxLength} characters.`);
  }
  return text;
}

function optionalText(value, field, maxLength) {
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string" || value.trim().length > maxLength) {
    throw httpError(400, `${field} must be at most ${maxLength} characters.`);
  }
  return value.trim() || null;
}

function priceInCents(value, field) {
  const price = Number(value);
  if (!Number.isFinite(price) || price < 0) {
    throw httpError(400, `The product has an invalid ${field}.`);
  }
  const cents = Math.round(price * 100);
  if (!Number.isSafeInteger(cents) || cents > 9999999999) {
    throw httpError(400, `The product ${field} is outside the supported price range.`);
  }
  return cents;
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
    throw httpError(400, "A cart product has invalid variant data. Please contact support.");
  }
}

function resolveCartImage(product, variantColor, savedImage) {
  if (savedImage) return savedImage;
  const variants = parseVariants(product.variants);
  const variant = variants.find((item) =>
    (item.colorName || item.color || "") === variantColor,
  );
  return parseImages(variant?.images)[0] || parseImages(product.images)[0] || "";
}

function validateVariant(product, color, size) {
  const variants = parseVariants(product.variants);
  const colors = variants.map((variant) => variant.colorName || variant.color || "").filter(Boolean);
  if (color && colors.length && !colors.includes(color)) {
    throw httpError(400, `The selected color for ${product.name} is no longer available.`);
  }
  const variant = variants.find((item) => (item.colorName || item.color || "") === color);
  if (size) {
    const sizeStock = variant?.sizesStock;
    if (sizeStock && typeof sizeStock === "object" && !Object.hasOwn(sizeStock, size)) {
      throw httpError(400, `The selected size for ${product.name} is no longer available.`);
    }
    const selectedSizes = Array.isArray(variant?.selectedSizes) ? variant.selectedSizes : [];
    if (selectedSizes.length && !selectedSizes.includes(size)) {
      throw httpError(400, `The selected size for ${product.name} is no longer available.`);
    }
  }
  if (variant?.sizesStock && typeof variant.sizesStock === "object" && size) {
    const available = Number(variant.sizesStock[size]);
    if (!Number.isSafeInteger(available) || available < 0) {
      throw httpError(400, `The selected size stock for ${product.name} is invalid.`);
    }
    return available;
  }
  if (variant?.quantity !== undefined) {
    const available = Number(variant.quantity);
    if (!Number.isSafeInteger(available) || available < 0) {
      throw httpError(400, `The selected color stock for ${product.name} is invalid.`);
    }
    return available;
  }
  return null;
}

function updateVariantStock(product, cartRows) {
  const variants = parseVariants(product.variants).map((variant) => ({ ...variant }));
  for (const row of cartRows) {
    const color = row.variant_color || "";
    const size = row.variant_size || "";
    if (!color && !size) continue;
    const variantIndex = variants.findIndex((variant) =>
      (variant.colorName || variant.color || "") === color,
    );
    if (variantIndex < 0) continue;
    const variant = variants[variantIndex];
    if (variant.sizesStock && typeof variant.sizesStock === "object" && size) {
      variant.sizesStock = { ...variant.sizesStock };
      variant.sizesStock[size] = Number(variant.sizesStock[size]) - Number(row.quantity);
    } else if (variant.quantity !== undefined) {
      variant.quantity = Number(variant.quantity) - Number(row.quantity);
    }
    variants[variantIndex] = variant;
  }
  return variants;
}

function createCheckoutRouter(pool) {
  const router = express.Router();
  router.use(authenticate);

  router.get("/addresses", async (request, response, next) => {
    try {
      const [addresses] = await pool.execute(
        `SELECT id, recipient_name, phone, street_address, city, district,
                state, country, zip_code
         FROM addresses
         WHERE user_id = ?
         ORDER BY updated_at DESC, id DESC`,
        [request.user.user_id],
      );
      return response.json(addresses);
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    let connection;
    try {
      const body = request.body || {};
      const recipientName = requiredText(body.recipient_name, "Full name", 160);
      const phone = requiredText(body.phone, "Phone number", 32);
      const streetAddress = requiredText(body.street_address, "Street address", 512);
      const city = requiredText(body.city, "City", 120);
      const district = optionalText(body.district, "District", 120);
      const state = requiredText(body.state, "State", 120);
      const zipCode = requiredText(body.zip_code, "Postal code", 24);
      const customerEmail = optionalText(body.customer_email, "Email", 191);
      if (customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
        throw httpError(400, "Enter a valid email address.");
      }

      connection = await pool.getConnection();
      await connection.beginTransaction();
      const userId = request.user.user_id;
      const [users] = await connection.execute(
        "SELECT user_id FROM users WHERE user_id = ? AND status = 'active' LIMIT 1 FOR UPDATE",
        [userId],
      );
      if (!users.length) throw httpError(401, "Your account is unavailable. Please sign in again.");

      const [cartRows] = await connection.execute(
        `SELECT ci.id AS cart_item_id, ci.product_id, ci.product_name, ci.product_image,
                ci.product_code, ci.quantity, ci.variant_color, ci.variant_size,
                p.name, p.product_code AS current_product_code, p.mrp, p.offer_price,
                p.total_stock, p.status, p.images, p.variants
         FROM cart_items ci
         INNER JOIN products p ON p.id = ci.product_id
         WHERE ci.user_id = ?
         ORDER BY ci.id
         FOR UPDATE`,
        [userId],
      );
      if (!cartRows.length) throw httpError(400, "Your cart is empty.");

      const quantitiesByProduct = new Map();
      for (const row of cartRows) {
        if (row.status !== "Active") {
          throw httpError(400, `${row.name || row.product_name} is no longer available.`);
        }
        const quantity = Number(row.quantity);
        if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) {
          throw httpError(400, "A cart item has an invalid quantity. Please update your cart.");
        }
        const variantStock = validateVariant(row, row.variant_color || "", row.variant_size || "");
        if (variantStock !== null && variantStock < quantity) {
          throw httpError(400, `Only ${Math.max(0, variantStock)} ${row.name || row.product_name} item(s) are available in the selected option.`);
        }
        quantitiesByProduct.set(
          Number(row.product_id),
          (quantitiesByProduct.get(Number(row.product_id)) || 0) + quantity,
        );
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        const row = cartRows.find((item) => Number(item.product_id) === productId);
        const stock = Number(row.total_stock);
        if (!Number.isSafeInteger(stock) || stock < quantity) {
          throw httpError(400, `Only ${Math.max(0, Number.isFinite(stock) ? stock : 0)} ${row.name || row.product_name} item(s) are available.`);
        }
      }

      let totalCents = 0;
      const orderItems = cartRows.map((row) => {
        const mrpCents = priceInCents(row.mrp, "MRP");
        const offerValue = row.offer_price === null || row.offer_price === undefined || row.offer_price === ""
          ? row.mrp
          : row.offer_price;
        const unitPriceCents = priceInCents(offerValue, "offer price");
        const quantity = Number(row.quantity);
        const subtotalCents = unitPriceCents * quantity;
        if (!Number.isSafeInteger(subtotalCents) || subtotalCents > 9999999999) {
          throw httpError(400, "A cart item subtotal exceeds the supported amount.");
        }
        totalCents += subtotalCents;
        if (!Number.isSafeInteger(totalCents) || totalCents > 9999999999) {
          throw httpError(400, "Your order total exceeds the supported amount.");
        }
        return {
          product_id: Number(row.product_id),
          product_name: row.name || row.product_name,
          price: Number((unitPriceCents / 100).toFixed(2)),
          quantity,
          total: Number((subtotalCents / 100).toFixed(2)),
          variant_color: row.variant_color || "",
          variant_size: row.variant_size || "",
          image: resolveCartImage(row, row.variant_color || "", row.product_image),
          mrp: Number((mrpCents / 100).toFixed(2)),
        };
      });

      const addressValues = [
        userId,
        recipientName,
        phone,
        streetAddress,
        city,
        district,
        state,
        "India",
        zipCode,
      ];
      const [existingAddresses] = await connection.execute(
        `SELECT id
         FROM addresses
         WHERE user_id = ? AND recipient_name = ? AND phone = ?
           AND street_address = ? AND city = ? AND district <=> ?
           AND state = ? AND country = ? AND zip_code = ?
         ORDER BY id
         LIMIT 1
         FOR UPDATE`,
        addressValues,
      );
      let addressId = existingAddresses[0]?.id;
      if (!addressId) {
        const [addressResult] = await connection.execute(
          `INSERT INTO addresses
            (user_id, recipient_name, phone, street_address, city, district, state, country, zip_code)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          addressValues,
        );
        addressId = addressResult.insertId;
      }
      const [orderResult] = await connection.execute(
        `INSERT INTO orders
          (user_id, address_id, customer_email, order_type, payment_method,
           payment_status, status, total_amount)
         VALUES (?, ?, ?, 'Online', 'Cash on Delivery', 'Pending', 'Order Placed', ?)`,
        [userId, addressId, customerEmail, Number((totalCents / 100).toFixed(2))],
      );
      const orderId = `ORD${String(orderResult.insertId).padStart(5, "0")}`;
      await connection.execute("UPDATE orders SET order_id = ? WHERE id = ?", [orderId, orderResult.insertId]);

      for (const item of orderItems) {
        await connection.execute(
          `INSERT INTO order_items
            (order_id, product_id, product_name, price, quantity, total,
             variant_color, variant_size, image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            orderResult.insertId,
            item.product_id,
            item.product_name,
            item.price,
            item.quantity,
            item.total,
            item.variant_color,
            item.variant_size,
            item.image || null,
          ],
        );
      }

      for (const [productId, quantity] of quantitiesByProduct) {
        const row = cartRows.find((item) => Number(item.product_id) === productId);
        const remainingStock = Number(row.total_stock) - quantity;
        const stockStatus = remainingStock === 0 ? "Out of Stock" : remainingStock < 10 ? "Low Stock" : "In Stock";
        const productRows = cartRows.filter((item) => Number(item.product_id) === productId);
        const variants = updateVariantStock(row, productRows);
        await connection.execute(
          "UPDATE products SET total_stock = ?, stock_status = ?, variants = ? WHERE id = ?",
          [remainingStock, stockStatus, JSON.stringify(variants), productId],
        );
      }
      await connection.execute("DELETE FROM cart_items WHERE user_id = ?", [userId]);
      await connection.commit();

      return response.status(201).json({
        id: orderResult.insertId,
        order_id: orderId,
        address_id: addressId,
        total_amount: Number((totalCents / 100).toFixed(2)),
        payment_method: "Cash on Delivery",
        status: "Order Placed",
        items: orderItems,
        message: "Order placed successfully.",
      });
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

module.exports = createCheckoutRouter;
