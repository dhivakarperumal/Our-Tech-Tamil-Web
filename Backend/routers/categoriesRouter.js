const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

function parseStringArray(value, field, maxItems) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value) || value.length > maxItems || value.some(item => typeof item !== "string")) {
    const error = new Error(`${field} must be a list of up to ${maxItems} strings.`);
    error.status = 400;
    throw error;
  }
  return value.map(item => item.trim()).filter(Boolean);
}

function parseCategory(body, catId) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (typeof catId !== "string" || !catId.trim() || catId.length > 64 || !name || name.length > 191) {
    const error = new Error("A category ID and a name of up to 191 characters are required.");
    error.status = 400;
    throw error;
  }
  if (body.catId !== undefined && body.catId !== catId) {
    const error = new Error("Category ID cannot be changed.");
    error.status = 400;
    throw error;
  }

  const categoryType = body.categoryType ?? "";
  const description = body.description ?? "";
  const userId = body.user_id ?? null;
  if (typeof categoryType !== "string" || categoryType.length > 100) {
    const error = new Error("Category type must be a string of up to 100 characters.");
    error.status = 400;
    throw error;
  }
  if (typeof description !== "string" || description.length > 10000) {
    const error = new Error("Description must be a string of up to 10000 characters.");
    error.status = 400;
    throw error;
  }
  if (userId !== null && (typeof userId !== "string" || userId.length > 255)) {
    const error = new Error("User ID must be a string of up to 255 characters.");
    error.status = 400;
    throw error;
  }

  return {
    catId,
    name,
    categoryType: categoryType.trim(),
    description,
    subcategory: parseStringArray(body.subcategory, "Subcategories", 100),
    images: parseStringArray(body.images, "Images", 1),
    userId,
  };
}

function parseJsonArray(value) {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return Array.isArray(parsed) ? parsed : [];
}

function toCategory(row) {
  return {
    id: row.id,
    catId: row.cat_id,
    name: row.name,
    categoryType: row.category_type || "",
    description: row.description || "",
    subcategory: parseJsonArray(row.subcategory),
    images: parseJsonArray(row.images),
    user_id: row.user_id,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function createCategoriesRouter(pool) {
  const router = express.Router();

  router.get("/", async (request, response, next) => {
    try {
      const [rows] = await pool.execute(
        "SELECT id, cat_id, name, category_type, description, subcategory, images, user_id, status, created_at, updated_at FROM categories ORDER BY created_at DESC, id DESC",
      );
      return response.json(rows.map(toCategory));
    } catch (error) {
      return next(error);
    }
  });

  router.post("/", requireAdmin, async (request, response, next) => {
    try {
      const category = parseCategory(request.body || {}, request.body?.catId);
      const [result] = await pool.execute(
        "INSERT INTO categories (cat_id, name, category_type, description, subcategory, images, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          category.catId,
          category.name,
          category.categoryType || null,
          category.description,
          JSON.stringify(category.subcategory),
          JSON.stringify(category.images),
          category.userId,
        ],
      );
      return response.status(201).json({ id: result.insertId, ...category });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return response.status(409).json({ message: "A category with this ID already exists." });
      }
      if (error.status) {
        return response.status(error.status).json({ message: error.message });
      }
      return next(error);
    }
  });

  router.put("/:catId", requireAdmin, async (request, response, next) => {
    try {
      const category = parseCategory(request.body || {}, request.params.catId);
      const [result] = await pool.execute(
        "UPDATE categories SET name = ?, category_type = ?, description = ?, subcategory = ?, images = ?, user_id = ? WHERE cat_id = ?",
        [
          category.name,
          category.categoryType || null,
          category.description,
          JSON.stringify(category.subcategory),
          JSON.stringify(category.images),
          category.userId,
          category.catId,
        ],
      );
      if (result.affectedRows === 0) {
        const [rows] = await pool.execute(
          "SELECT id FROM categories WHERE cat_id = ? LIMIT 1",
          [category.catId],
        );
        if (rows.length === 0) {
          return response.status(404).json({ message: "Category not found." });
        }
      }
      return response.json({ message: "Category updated successfully.", ...category });
    } catch (error) {
      if (error.status) {
        return response.status(error.status).json({ message: error.message });
      }
      return next(error);
    }
  });

  router.delete("/:catId", requireAdmin, async (request, response, next) => {
    try {
      const [result] = await pool.execute(
        "DELETE FROM categories WHERE cat_id = ?",
        [request.params.catId],
      );
      if (result.affectedRows === 0) {
        return response.status(404).json({ message: "Category not found." });
      }
      return response.status(204).end();
    } catch (error) {
      return next(error);
    }
  });

  return router;
}

module.exports = createCategoriesRouter;
