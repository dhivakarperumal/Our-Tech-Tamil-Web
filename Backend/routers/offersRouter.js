const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

const OFFER_STATUSES = new Set(["active", "inactive"]);
const OFFER_ICONS = new Set([
  "Tag",
  "Sparkles",
  "ShoppingBag",
  "Gift",
  "Zap",
  "Percent",
  "Heart",
  "Star",
  "ShoppingCart",
]);

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

function parseDate(value, field) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw httpError(400, `${field} is required and must be a valid date.`);
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    throw httpError(400, `${field} is required and must be a valid date.`);
  }
  return value;
}

function normalizeOffer(body = {}) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw httpError(400, "Offer details must be provided as an object.");
  }
  const title = requiredText(body.title, "Offer title", 160);
  const percentage = Number(body.offer_percentage);
  if (body.offer_percentage === undefined || body.offer_percentage === null || body.offer_percentage === "" ||
      !Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
    throw httpError(400, "Offer percentage must be a number between 0 and 100.");
  }

  let description = "";
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== "string" || body.description.length > 5000) {
      throw httpError(400, "Description must be at most 5000 characters.");
    }
    description = body.description.trim();
  }
  const icon = requiredText(body.icon, "Offer icon", 32);
  if (!OFFER_ICONS.has(icon)) throw httpError(400, "Select a supported offer icon.");
  const status = requiredText(body.status, "Status", 16).toLowerCase();
  if (!OFFER_STATUSES.has(status)) throw httpError(400, "Status must be active or inactive.");
  if (body.show_in_header !== undefined && typeof body.show_in_header !== "boolean") {
    throw httpError(400, "Show in header must be true or false.");
  }

  const startDate = parseDate(body.start_date, "Start date");
  const endDate = parseDate(body.end_date, "End date");
  if (endDate < startDate) throw httpError(400, "End date must be on or after the start date.");

  return {
    title,
    offer_percentage: percentage,
    description,
    icon,
    status,
    show_in_header: body.show_in_header === true,
    start_date: startDate,
    end_date: endDate,
  };
}

const OFFER_COLUMNS = `
  id, title, offer_percentage, description, icon, status, show_in_header, start_date, end_date,
  created_at, updated_at
`;

function createOffersRouter(pool) {
  const router = express.Router();

  router.get("/header", async (request, response, next) => {
    try {
      const [offers] = await pool.execute(
        `SELECT id, title, offer_percentage
         FROM offers
         WHERE status = 'active' AND show_in_header = TRUE
           AND start_date <= CURDATE() AND end_date >= CURDATE()
         ORDER BY created_at DESC, id DESC`,
      );
      return response.json({ success: true, offers });
    } catch (error) {
      return next(error);
    }
  });

  router.use(requireAdmin);

  router.get("/", async (request, response, next) => {
    try {
      const [offers] = await pool.execute(
        `SELECT ${OFFER_COLUMNS} FROM offers ORDER BY created_at DESC, id DESC`,
      );
      return response.json({ success: true, offers });
    } catch (error) {
      return next(error);
    }
  });

  router.get("/:id", async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || Number(request.params.id) < 1) {
        return response.status(400).json({ message: "Offer ID must be a positive integer." });
      }
      const [offers] = await pool.execute(
        `SELECT ${OFFER_COLUMNS} FROM offers WHERE id = ? LIMIT 1`,
        [Number(request.params.id)],
      );
      if (!offers.length) return response.status(404).json({ message: "Offer not found." });
      return response.json({ success: true, offer: offers[0] });
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", async (request, response, next) => {
    try {
      const offer = normalizeOffer(request.body);
      const [result] = await pool.execute(
        `INSERT INTO offers (title, offer_percentage, description, icon, status, show_in_header, start_date, end_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [offer.title, offer.offer_percentage, offer.description, offer.icon, offer.status, offer.show_in_header, offer.start_date, offer.end_date],
      );
      return response.status(201).json({ success: true, offer: { id: result.insertId, ...offer } });
    } catch (error) {
      return next(error);
    }
  });

  router.put("/:id", async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || Number(request.params.id) < 1) {
        return response.status(400).json({ message: "Offer ID must be a positive integer." });
      }
      const offer = normalizeOffer(request.body);
      const [result] = await pool.execute(
        `UPDATE offers SET
          title = ?, offer_percentage = ?, description = ?, icon = ?, status = ?, show_in_header = ?,
          start_date = ?, end_date = ?
         WHERE id = ?`,
        [offer.title, offer.offer_percentage, offer.description, offer.icon, offer.status, offer.show_in_header, offer.start_date, offer.end_date, Number(request.params.id)],
      );
      if (!result.affectedRows) {
        const [rows] = await pool.execute("SELECT id FROM offers WHERE id = ? LIMIT 1", [Number(request.params.id)]);
        if (!rows.length) return response.status(404).json({ message: "Offer not found." });
      }
      return response.json({ success: true, offer: { id: Number(request.params.id), ...offer } });
    } catch (error) {
      return next(error);
    }
  });

  router.patch("/:id/header", async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || Number(request.params.id) < 1) {
        return response.status(400).json({ message: "Offer ID must be a positive integer." });
      }
      if (typeof request.body?.show_in_header !== "boolean") {
        return response.status(400).json({ message: "Show in header must be true or false." });
      }
      const id = Number(request.params.id);
      const [result] = await pool.execute(
        "UPDATE offers SET show_in_header = ? WHERE id = ?",
        [request.body.show_in_header, id],
      );
      if (!result.affectedRows) {
        const [rows] = await pool.execute("SELECT id FROM offers WHERE id = ? LIMIT 1", [id]);
        if (!rows.length) return response.status(404).json({ message: "Offer not found." });
      }
      return response.json({ success: true, id, show_in_header: request.body.show_in_header });
    } catch (error) {
      return next(error);
    }
  });

  router.delete("/:id", async (request, response, next) => {
    try {
      if (!/^\d+$/.test(request.params.id) || Number(request.params.id) < 1) {
        return response.status(400).json({ message: "Offer ID must be a positive integer." });
      }
      const [result] = await pool.execute("DELETE FROM offers WHERE id = ?", [Number(request.params.id)]);
      if (!result.affectedRows) return response.status(404).json({ message: "Offer not found." });
      return response.json({ success: true, message: "Offer deleted successfully." });
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createOffersRouter;
module.exports.normalizeOffer = normalizeOffer;
