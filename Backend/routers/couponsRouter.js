const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

const COUPON_SCOPES = new Set([
  "all",
  "first_order_only",
  "new_customers_only",
  "specific_products",
  "specific_categories",
]);
const DISCOUNT_TYPES = new Set(["percentage", "fixed"]);
const COUPON_STATUSES = new Set(["active", "inactive"]);

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
  if (typeof value !== "string" || value.length > maxLength) {
    throw httpError(400, `${field} must be at most ${maxLength} characters.`);
  }
  return value.trim() || null;
}

function numericValue(value, field, { required = false, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false } = {}) {
  if ((value === undefined || value === null || value === "") && !required) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < min || number > max || (integer && !Number.isInteger(number))) {
    throw httpError(400, `${field} must be ${integer ? "an integer" : "a number"} between ${min} and ${max}.`);
  }
  return number;
}

function parseDate(value, field) {
  if (typeof value !== "string" || !value.trim()) {
    throw httpError(400, `${field} is required and must be a valid date and time.`);
  }
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    throw httpError(400, `${field} is required and must be a valid date and time.`);
  }
  const [, year, month, day, hour, minute, seconds = "00"] = match;
  const date = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day), Number(hour), Number(minute), Number(seconds)));
  if (date.getUTCFullYear() !== Number(year) ||
      date.getUTCMonth() !== Number(month) - 1 ||
      date.getUTCDate() !== Number(day) ||
      Number(hour) > 23 ||
      Number(minute) > 59 ||
      Number(seconds) > 59) {
    throw httpError(400, `${field} is required and must be a valid date and time.`);
  }
  return `${year}-${month}-${day} ${hour}:${minute}:${seconds}`;
}

function idList(value, field) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > 500) {
    throw httpError(400, `${field} must be a list of at most 500 IDs.`);
  }
  return [...new Set(value.map((id) => {
    const text = String(id);
    if (!/^\d+$/.test(text) || !Number.isSafeInteger(Number(text)) || Number(text) < 1) {
      throw httpError(400, `${field} contains an invalid ID.`);
    }
    return Number(text);
  }))];
}

function normalizeCoupon(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Coupon details must be provided as an object.");
  }
  const code = requiredText(body.code, "Coupon code", 64).toUpperCase();
  if (!/^[A-Z0-9_-]+$/.test(code)) {
    throw httpError(400, "Coupon code may contain only letters, numbers, underscores, and hyphens.");
  }

  const name = requiredText(body.name, "Coupon name", 160);
  const discountType = requiredText(body.discount_type, "Discount type", 16);
  if (!DISCOUNT_TYPES.has(discountType)) throw httpError(400, "Discount type must be percentage or fixed.");
  const discountValue = numericValue(body.discount_value, "Discount value", {
    required: true,
    min: 0.01,
    max: discountType === "percentage" ? 100 : 100000000,
  });
  const minOrderValue = numericValue(body.min_order_value, "Minimum order value");
  const usageLimitGlobal = numericValue(body.usage_limit_global, "Global usage limit", { min: 1, max: 100000000, integer: true });
  const usageLimitPerCustomer = numericValue(body.usage_limit_per_customer, "Per-customer usage limit", {
    required: true,
    min: 1,
    max: 100000000,
    integer: true,
  });
  const status = requiredText(body.status, "Status", 16);
  if (!COUPON_STATUSES.has(status)) throw httpError(400, "Status must be active or inactive.");
  const couponScope = requiredText(body.coupon_scope, "Coupon scope", 32);
  if (!COUPON_SCOPES.has(couponScope)) throw httpError(400, "Coupon scope is invalid.");

  const applicableProductIds = idList(body.applicable_product_ids, "Applicable product IDs");
  const applicableCategoryIds = idList(body.applicable_category_ids, "Applicable category IDs");
  if (couponScope === "specific_products" && !applicableProductIds.length) {
    throw httpError(400, "Select at least one product for this coupon.");
  }
  if (couponScope === "specific_categories" && !applicableCategoryIds.length) {
    throw httpError(400, "Select at least one category for this coupon.");
  }

  const startDate = parseDate(body.start_date, "Start date");
  const expiryDate = parseDate(body.expiry_date, "Expiry date");
  if (new Date(expiryDate) <= new Date(startDate)) {
    throw httpError(400, "Expiry date must be after the start date.");
  }

  return {
    code,
    name,
    description: optionalText(body.description, "Description", 5000),
    discount_type: discountType,
    discount_value: discountValue,
    min_order_value: minOrderValue ?? 0,
    start_date: startDate,
    expiry_date: expiryDate,
    usage_limit_global: usageLimitGlobal,
    usage_limit_per_customer: usageLimitPerCustomer,
    status,
    coupon_scope: couponScope,
    applicable_product_ids: applicableProductIds,
    applicable_category_ids: applicableCategoryIds,
    applicable_subcategory_ids: idList(body.applicable_subcategory_ids, "Applicable subcategory IDs"),
  };
}

const COUPON_COLUMNS = `
  id, code, name, description, discount_type, discount_value, min_order_value,
  start_date, expiry_date, usage_limit_global, usage_limit_per_customer,
  usage_count, status, coupon_scope, applicable_product_ids,
  applicable_category_ids, applicable_subcategory_ids, created_at, updated_at
`;

function createCouponsRouter(pool) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get("/", async (request, response, next) => {
    try {
      const [coupons] = await pool.execute(
        `SELECT ${COUPON_COLUMNS} FROM coupons ORDER BY created_at DESC, id DESC`,
      );
      return response.json({ success: true, coupons });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const coupon = normalizeCoupon(request.body);
      const [result] = await pool.execute(
        `INSERT INTO coupons (
          code, name, description, discount_type, discount_value, min_order_value,
          start_date, expiry_date, usage_limit_global, usage_limit_per_customer,
          status, coupon_scope, applicable_product_ids, applicable_category_ids,
          applicable_subcategory_ids
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          coupon.code,
          coupon.name,
          coupon.description,
          coupon.discount_type,
          coupon.discount_value,
          coupon.min_order_value,
          coupon.start_date,
          coupon.expiry_date,
          coupon.usage_limit_global,
          coupon.usage_limit_per_customer,
          coupon.status,
          coupon.coupon_scope,
          JSON.stringify(coupon.applicable_product_ids),
          JSON.stringify(coupon.applicable_category_ids),
          JSON.stringify(coupon.applicable_subcategory_ids),
        ],
      );
      return response.status(201).json({ success: true, coupon: { id: result.insertId, ...coupon, usage_count: 0 } });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return response.status(409).json({ message: "A coupon with this code already exists." });
      return next(error);
    }
  });

  router.put("/:id", async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || Number(request.params.id) < 1) {
        return response.status(400).json({ message: "Coupon ID must be a positive integer." });
      }
      const coupon = normalizeCoupon(request.body);
      const [result] = await pool.execute(
        `UPDATE coupons SET
          code = ?, name = ?, description = ?, discount_type = ?, discount_value = ?,
          min_order_value = ?, start_date = ?, expiry_date = ?, usage_limit_global = ?,
          usage_limit_per_customer = ?, status = ?, coupon_scope = ?,
          applicable_product_ids = ?, applicable_category_ids = ?,
          applicable_subcategory_ids = ?
         WHERE id = ?`,
        [
          coupon.code,
          coupon.name,
          coupon.description,
          coupon.discount_type,
          coupon.discount_value,
          coupon.min_order_value,
          coupon.start_date,
          coupon.expiry_date,
          coupon.usage_limit_global,
          coupon.usage_limit_per_customer,
          coupon.status,
          coupon.coupon_scope,
          JSON.stringify(coupon.applicable_product_ids),
          JSON.stringify(coupon.applicable_category_ids),
          JSON.stringify(coupon.applicable_subcategory_ids),
          Number(request.params.id),
        ],
      );
      if (!result.affectedRows) {
        const [rows] = await pool.execute("SELECT id FROM coupons WHERE id = ? LIMIT 1", [Number(request.params.id)]);
        if (!rows.length) return response.status(404).json({ message: "Coupon not found." });
      }
      return response.json({ success: true, coupon: { id: Number(request.params.id), ...coupon } });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") return response.status(409).json({ message: "A coupon with this code already exists." });
      return next(error);
    }
  });

  router.delete("/:id", async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || Number(request.params.id) < 1) {
        return response.status(400).json({ message: "Coupon ID must be a positive integer." });
      }
      const [result] = await pool.execute("DELETE FROM coupons WHERE id = ?", [Number(request.params.id)]);
      if (!result.affectedRows) return response.status(404).json({ message: "Coupon not found." });
      return response.json({ success: true, message: "Coupon deleted successfully." });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createCouponsRouter;
module.exports.normalizeCoupon = normalizeCoupon;
