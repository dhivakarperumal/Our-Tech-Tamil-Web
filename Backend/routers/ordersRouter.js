const express = require("express");
const jwt = require("jsonwebtoken");
const requireAdmin = require("../middleware/requireAdmin");

const ORDER_STATUSES = new Set([
  "Order Placed",
  "Packing",
  "Shipping",
  "Out for Delivery",
  "Delivered",
  "Cancelled",
  "New",
  "Processing",
  "Shipped",
]);
const ORDER_COLUMNS = `
  o.id, o.order_id, o.user_id, o.address_id, a.recipient_name AS customer_name,
  o.customer_email, a.phone AS customer_phone, a.street_address, a.city, a.district, a.state, a.country,
  a.zip_code, o.order_type, o.items_type, o.payment_method, o.payment_status, o.status, o.total_amount,
  o.tracking_number, o.courier_name, o.shipped_at, o.cancellation_reason, o.cancelled_at,
  o.created_at, o.updated_at
`;
const ORDER_QUERY_FROM = "FROM orders o LEFT JOIN addresses a ON a.id = o.address_id";

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
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

function parseItems(value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > 100) {
    throw httpError(400, "Add between 1 and 100 products to the order.");
  }
  return value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw httpError(400, "Each order item must be a product.");
    }
    const productId = Number(item.product_id);
    const quantity = Number(item.quantity);
    if (!Number.isSafeInteger(productId) || productId < 1 ||
        !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 10000) {
      throw httpError(400, "Each order item must have a valid product and quantity.");
    }
    return {
      productId,
      quantity,
      variantColor: optionalText(item.variant_color, "Variant color", 100),
      variantSize: optionalText(item.variant_size, "Variant size", 100),
      image: optionalText(item.image, "Product image", 2048),
    };
  });
}

function toOrderItem(row) {
  return {
    product_id: row.product_id,
    ...(row.combo_id ? { combo_id: Number(row.combo_id), item_type: "combo" } : {}),
    product_name: row.product_name,
    name: row.product_name,
    price: Number(row.price),
    quantity: Number(row.quantity),
    total: Number(row.total),
    variant_color: row.variant_color,
    variant_size: row.variant_size,
    image: row.image || "",
  };
}

async function attachOrderItems(pool, orders) {
  if (!orders.length) return orders;
  const orderIds = orders.map((order) => order.id);
  const placeholders = orderIds.map(() => "?").join(", ");
  const [rows] = await pool.execute(
    `SELECT order_id, product_id, combo_id, product_name, price, quantity, total,
            variant_color, variant_size, image
     FROM order_items
     WHERE order_id IN (${placeholders})
     ORDER BY id`,
    orderIds,
  );
  const comboIds = [...new Set(rows
    .map((row) => Number(row.combo_id))
    .filter((id) => Number.isSafeInteger(id) && id > 0))];
  const comboProductsById = new Map();
  if (comboIds.length) {
    const comboPlaceholders = comboIds.map(() => "?").join(", ");
    const [combos] = await pool.execute(
      `SELECT id, products FROM combos WHERE id IN (${comboPlaceholders})`,
      comboIds,
    );
    const selectedProducts = combos.flatMap((combo) => {
      let products = combo.products;
      if (typeof products === "string") {
        try {
          products = JSON.parse(products);
        } catch {
          products = [];
        }
      }
      const entries = Array.isArray(products) ? products : [];
      return entries.flatMap((item) => {
        const productId = Number(item?.id ?? item?.product_id);
        const quantity = Number(item?.quantity) || 1;
        if (!Number.isSafeInteger(productId) || productId < 1 ||
            !Number.isSafeInteger(quantity) || quantity < 1) return [];
        return [{ comboId: Number(combo.id), productId, quantity }];
      });
    });
    const productIds = [...new Set(selectedProducts.map((item) => item.productId))];
    let products = [];
    if (productIds.length) {
      const productPlaceholders = productIds.map(() => "?").join(", ");
      [products] = await pool.execute(
        `SELECT id, name, product_code, images FROM products WHERE id IN (${productPlaceholders})`,
        productIds,
      );
    }
    const productById = new Map(products.map((product) => [Number(product.id), product]));
    for (const item of selectedProducts) {
      const product = productById.get(item.productId);
      const images = parseImageList(product?.images);
      if (!comboProductsById.has(item.comboId)) comboProductsById.set(item.comboId, []);
      comboProductsById.get(item.comboId).push({
        id: item.productId,
        name: product?.name || `Product #${item.productId}`,
        product_code: product?.product_code || "",
        quantity: item.quantity,
        image: images[0] || "",
      });
    }
  }
  const itemsByOrderId = new Map(orderIds.map((id) => [String(id), []]));
  for (const row of rows) {
    const item = toOrderItem(row);
    if (row.combo_id) item.included_products = comboProductsById.get(Number(row.combo_id)) || [];
    itemsByOrderId.get(String(row.order_id))?.push(item);
  }
  return orders.map((order) => ({
    ...order,
    items: itemsByOrderId.get(String(order.id)) || [],
  }));
}

function authenticate(request, response, next) {
  const [scheme, token] = (request.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication is required." });
  }
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return response.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
    }
    return next(error);
  }
}

function parseDateTime(value, field) {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw httpError(400, `${field} must be a valid date and time.`);
  return date.toISOString().slice(0, 19).replace("T", " ");
}

function parseImageList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createOrdersRouter(pool) {
  const router = express.Router();

  router.get("/", authenticate, async (request, response, next) => {
    try {
      const conditions = [];
      const params = [];
      if (request.user.role !== "admin") {
        if (!request.user.user_id) return response.json([]);
        conditions.push("o.user_id = ?");
        params.push(request.user.user_id);
      }
      if (request.query.status && request.query.status !== "All") {
        conditions.push("o.status = ?");
        params.push(String(request.query.status).slice(0, 32));
      }
      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      const [rows] = await pool.execute(
        `SELECT ${ORDER_COLUMNS} ${ORDER_QUERY_FROM} ${where} ORDER BY o.created_at DESC, o.id DESC`,
        params,
      );
      return response.json(await attachOrderItems(pool, rows));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", requireAdmin, async (request, response, next) => {
    let connection;
    try {
      const body = request.body || {};
      const customerName = requiredText(body.customer_name, "Customer name", 160);
      const customerPhone = requiredText(body.customer_phone, "Customer phone", 32);
      const streetAddress = requiredText(body.street_address, "Street address", 512);
      const city = requiredText(body.city, "City", 120);
      const state = requiredText(body.state, "State", 120);
      const zipCode = requiredText(body.zip_code, "Zip code", 24);
      const customerEmail = optionalText(body.customer_email, "Customer email", 191);
      const district = optionalText(body.district, "District", 120);
      const country = optionalText(body.country, "Country", 120) || "India";
      const orderType = optionalText(body.order_type, "Order type", 32) || "Shop";
      const paymentMethod = optionalText(body.payment_method, "Payment method", 64) || "Cash";
      const paymentStatus = optionalText(body.payment_status, "Payment status", 32) || "Pending";
      const status = optionalText(body.status, "Order status", 32) || "Order Placed";
      if (!ORDER_STATUSES.has(status)) throw httpError(400, "Order status is not valid.");
      const itemsToSave = parseItems(body.items);
      const createdAt = parseDateTime(body.created_at, "Order date");

      connection = await pool.getConnection();
      await connection.beginTransaction();

      let userId = optionalText(body.user_id, "User ID", 255) || request.user.user_id;
      if (!userId) {
        throw httpError(400, "The logged-in account could not be identified. Please sign in again.");
      }
      const [users] = await connection.execute(
        "SELECT user_id FROM users WHERE user_id = ? LIMIT 1",
        [userId],
      );
      if (!users.length) {
        throw httpError(400, "The selected or logged-in account was not found.");
      }
      userId = users[0].user_id;

      let totalCents = 0;
      const savedItems = [];
      for (const item of itemsToSave) {
        const [products] = await connection.execute(
          "SELECT id, name, offer_price, images FROM products WHERE id = ? AND status = 'Active' LIMIT 1",
          [item.productId],
        );
        const product = products[0];
        if (!product) throw httpError(400, "A selected product is no longer available.");
        const price = Number(product.offer_price);
        if (!Number.isFinite(price) || price < 0) {
          throw httpError(400, "A selected product has an invalid price.");
        }
        const priceCents = Math.round(price * 100);
        totalCents += priceCents * item.quantity;
        const productImages = parseImageList(product.images);
        savedItems.push({
          product_id: product.id,
          product_name: product.name,
          name: product.name,
          price: Number((priceCents / 100).toFixed(2)),
          quantity: item.quantity,
          total: Number(((priceCents * item.quantity) / 100).toFixed(2)),
          variant_color: item.variantColor,
          variant_size: item.variantSize,
          image: item.image || productImages[0] || "",
        });
      }

      const [addressResult] = await connection.execute(
        `INSERT INTO addresses
          (user_id, recipient_name, phone, street_address, city, district, state, country, zip_code)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, customerName, customerPhone, streetAddress, city, district, state, country, zipCode],
      );
      const addressId = addressResult.insertId;

      const [orderResult] = await connection.execute(
        `INSERT INTO orders
          (user_id, address_id, customer_email, order_type,
           payment_method, payment_status, status, total_amount, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`,
        [
          userId,
          addressId,
          customerEmail,
          orderType,
          paymentMethod,
          paymentStatus,
          status,
          Number((totalCents / 100).toFixed(2)),
          createdAt,
        ],
      );
      const orderId = `ORD${String(orderResult.insertId).padStart(5, "0")}`;
      await connection.execute("UPDATE orders SET order_id = ? WHERE id = ?", [orderId, orderResult.insertId]);
      for (const item of savedItems) {
        await connection.execute(
          `INSERT INTO order_items
            (order_id, product_id, product_name, price, quantity, total, variant_color, variant_size, image)
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
      await connection.commit();
      return response.status(201).json({
        id: orderResult.insertId,
        order_id: orderId,
        user_id: userId,
        address_id: addressId,
        items: savedItems,
        total_amount: Number((totalCents / 100).toFixed(2)),
        status,
        message: "Order created successfully.",
      });
    } catch (error) {
      if (connection) await connection.rollback();
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    } finally {
      connection?.release();
    }
  });

  router.get("/:id", authenticate, async (request, response, next) => {
    try {
      const isNumericId = /^\d+$/.test(request.params.id);
      const identityColumn = isNumericId ? "id" : "order_id";
      const [rows] = await pool.execute(
        `SELECT ${ORDER_COLUMNS} ${ORDER_QUERY_FROM} WHERE o.${identityColumn} = ? LIMIT 1`,
        [request.params.id],
      );
      const order = rows[0];
      if (!order) return response.status(404).json({ message: "Order not found." });
      if (request.user.role !== "admin" && order.user_id !== request.user.user_id) {
        return response.status(403).json({ message: "You cannot access this order." });
      }
      const [orderWithItems] = await attachOrderItems(pool, [order]);
      return response.json(orderWithItems);
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id/status", requireAdmin, async (request, response, next) => {
    try {
      const body = request.body || {};
      const status = requiredText(body.status, "Order status", 32);
      if (!ORDER_STATUSES.has(status)) throw httpError(400, "Order status is not valid.");

      const updates = ["status = ?"];
      const values = [status];
      const fields = [
        ["tracking_number", "Tracking number", 160],
        ["courier_name", "Courier name", 160],
        ["cancellation_reason", "Cancellation reason", 10000],
      ];
      for (const [column, label, maxLength] of fields) {
        if (Object.hasOwn(body, column)) {
          updates.push(`${column} = ?`);
          values.push(optionalText(body[column], label, maxLength));
        }
      }
      for (const [column, label] of [["shipped_at", "Shipped date"], ["cancelled_at", "Cancellation date"]]) {
        if (Object.hasOwn(body, column)) {
          updates.push(`${column} = ?`);
          values.push(parseDateTime(body[column], label));
        }
      }
      const [result] = await pool.execute(
        `UPDATE orders SET ${updates.join(", ")} WHERE id = ? OR order_id = ?`,
        [...values, request.params.id, request.params.id],
      );
      if (!result.affectedRows) {
        const [rows] = await pool.execute(
          "SELECT id FROM orders WHERE id = ? OR order_id = ? LIMIT 1",
          [request.params.id, request.params.id],
        );
        if (!rows.length) return response.status(404).json({ message: "Order not found." });
      }
      return response.json({ message: "Order status updated successfully." });
    } catch (error) {
      if (error.status) return response.status(error.status).json({ message: error.message });
      return next(error);
    }
  });

  return router;
}

module.exports = createOrdersRouter;
