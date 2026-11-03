const REVIEW_STATUSES = new Set(["Pending", "Published", "Flagged"]);

function createReviewsController(pool) {
  return {
    async listCustomerReviews(request, response, next) {
      try {
        const [reviews] = await pool.execute(
          `SELECT r.id, r.product_id, p.name AS product_name, r.rating, r.comment,
                  r.review_image, r.status, r.admin_reply, r.created_at
           FROM reviews r
           LEFT JOIN products p ON p.id = r.product_id
           WHERE r.user_id = ?
           ORDER BY r.created_at DESC, r.id DESC`,
          [request.user.user_id],
        );
        return response.json({ reviews });
      } catch (error) {
        return next(error);
      }
    },

    async listProductReviews(request, response, next) {
      const productId = Number(request.params.productId);
      if (!Number.isSafeInteger(productId) || productId < 1) {
        return response.status(400).json({ message: "Choose a valid product." });
      }
      try {
        const [reviews] = await pool.execute(
          `SELECT id, product_id, user_name, rating, comment, review_image, admin_reply, created_at
           FROM reviews
           WHERE product_id = ? AND status = 'Published'
           ORDER BY created_at DESC, id DESC`,
          [productId],
        );
        return response.json({ reviews });
      } catch (error) {
        return next(error);
      }
    },

    async getCustomerProductReview(request, response, next) {
      const productId = Number(request.params.productId);
      if (!Number.isSafeInteger(productId) || productId < 1) {
        return response.status(400).json({ message: "Choose a valid product." });
      }
      try {
        const [reviews] = await pool.execute(
          `SELECT id, rating, comment, status, created_at
           FROM reviews
           WHERE product_id = ? AND user_id = ?
           LIMIT 1`,
          [productId, request.user.user_id],
        );
        return response.json({ review: reviews[0] || null });
      } catch (error) {
        return next(error);
      }
    },

    async createCustomerProductReview(request, response, next) {
      const productId = Number(request.params.productId);
      const userName = typeof request.body?.user_name === "string" ? request.body.user_name.trim() : "";
      const rating = Number(request.body?.rating);
      const comment = typeof request.body?.comment === "string" ? request.body.comment.trim() : "";
      const reviewImage = request.file ? `/uploads/reviews/${request.file.filename}` : null;

      if (!Number.isSafeInteger(productId) || productId < 1) {
        return response.status(400).json({ message: "Choose a valid product." });
      }
      if (!userName || userName.length > 160) {
        return response.status(400).json({ message: "Your name is required and must be 160 characters or fewer." });
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return response.status(400).json({ message: "Rating must be between 1 and 5." });
      }
      if (!comment || comment.length > 5000) {
        return response.status(400).json({ message: "Review comment is required and must be 5,000 characters or fewer." });
      }

      try {
        const [[products], [users]] = await Promise.all([
          pool.execute("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]),
          pool.execute(
            "SELECT username, email FROM users WHERE user_id = ? AND status = 'active' LIMIT 1",
            [request.user.user_id],
          ),
        ]);
        if (!products.length) {
          return response.status(404).json({ message: "Product not found." });
        }
        if (!users.length) {
          return response.status(401).json({ message: "Your account could not be verified. Please sign in again." });
        }

        const [result] = await pool.execute(
          `INSERT INTO reviews (product_id, user_id, user_name, user_email, rating, comment, review_image, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'Pending')`,
          [productId, request.user.user_id, userName, users[0].email, rating, comment, reviewImage],
        );
        return response.status(201).json({
          review: {
            id: result.insertId,
            product_id: productId,
            user_name: userName,
            rating,
            comment,
            review_image: reviewImage,
            status: "Pending",
          },
        });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "You have already reviewed this product." });
        }
        return next(error);
      }
    },

    async listPublicReviews(request, response, next) {
      try {
        const [reviews] = await pool.execute(
          `SELECT r.id, r.product_id, p.name AS product_name, r.user_name,
                  r.rating, r.comment, r.review_image, r.admin_reply, r.created_at
           FROM reviews r
           LEFT JOIN products p ON p.id = r.product_id
           WHERE r.status = 'Published'
           ORDER BY r.created_at DESC, r.id DESC
           LIMIT 8`,
        );
        return response.json({ reviews });
      } catch (error) {
        return next(error);
      }
    },

    async listAdminReviews(request, response, next) {
      const { status, rating, search } = request.query;
      const conditions = [];
      const params = [];

      if (typeof status === "string" && status !== "All") {
        if (!REVIEW_STATUSES.has(status)) {
          return response.status(400).json({ message: "Choose a valid review status." });
        }
        conditions.push("r.status = ?");
        params.push(status);
      }

      if (rating !== undefined) {
        const parsedRating = Number(rating);
        if (!Number.isInteger(parsedRating) || parsedRating < 1 || parsedRating > 5) {
          return response.status(400).json({ message: "Rating must be between 1 and 5." });
        }
        conditions.push("r.rating = ?");
        params.push(parsedRating);
      }

      if (typeof search === "string" && search.trim()) {
        const searchTerm = `%${search.trim()}%`;
        conditions.push("(r.user_name LIKE ? OR r.user_email LIKE ? OR r.comment LIKE ? OR p.name LIKE ?)");
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
      try {
        const [[reviews], [statsRows]] = await Promise.all([
          pool.execute(
            `SELECT r.id, r.product_id, p.name AS product_name, r.user_name, r.user_email,
                    r.rating, r.comment, r.review_image, r.admin_reply, r.status, r.created_at
             FROM reviews r
             LEFT JOIN products p ON p.id = r.product_id
             ${where}
             ORDER BY r.created_at DESC, r.id DESC`,
            params,
          ),
          pool.execute(
            `SELECT COUNT(*) AS total_reviews,
                    COALESCE(AVG(rating), 0) AS average_rating,
                    COALESCE(SUM(status = 'Pending'), 0) AS pending_count
             FROM reviews`,
          ),
        ]);
        const stats = statsRows[0];
        return response.json({
          reviews,
          stats: {
            total_reviews: Number(stats.total_reviews) || 0,
            average_rating: Number(Number(stats.average_rating).toFixed(1)) || 0,
            pending_count: Number(stats.pending_count) || 0,
          },
        });
      } catch (error) {
        return next(error);
      }
    },

    async createAdminReview(request, response, next) {
      const body = request.body || {};
      const productId = Number(body.product_id);
      const userName = typeof body.user_name === "string" ? body.user_name.trim() : "";
      const userEmail = typeof body.user_email === "string" ? body.user_email.trim() : "";
      const comment = typeof body.comment === "string" ? body.comment.trim() : "";
      const rating = Number(body.rating);
      const reviewImage = typeof body.review_image === "string" ? body.review_image.trim() : "";

      if (!Number.isSafeInteger(productId) || productId < 1) {
        return response.status(400).json({ message: "Choose a valid product." });
      }
      if (!userName || userName.length > 160) {
        return response.status(400).json({ message: "Customer name is required and must be 160 characters or fewer." });
      }
      if (userEmail.length > 191 || (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))) {
        return response.status(400).json({ message: "Enter a valid customer email address." });
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return response.status(400).json({ message: "Rating must be between 1 and 5." });
      }
      if (!comment || comment.length > 5000) {
        return response.status(400).json({ message: "Review comment is required and must be 5,000 characters or fewer." });
      }
      if (reviewImage && !/^\/uploads\/reviews\/[0-9a-f-]{36}\.(?:jpg|png|webp|gif)$/i.test(reviewImage)) {
        return response.status(400).json({ message: "Upload a valid review image." });
      }

      try {
        const [products] = await pool.execute("SELECT id FROM products WHERE id = ? LIMIT 1", [productId]);
        if (!products.length) {
          return response.status(400).json({ message: "The selected product no longer exists." });
        }
        const [result] = await pool.execute(
          `INSERT INTO reviews (product_id, user_name, user_email, rating, comment, review_image, status)
           VALUES (?, ?, ?, ?, ?, ?, 'Pending')`,
          [productId, userName, userEmail || null, rating, comment, reviewImage || null],
        );
        return response.status(201).json({ id: result.insertId });
      } catch (error) {
        return next(error);
      }
    },

    async updateReviewStatus(request, response, next) {
      const { status } = request.body || {};
      if (!REVIEW_STATUSES.has(status)) {
        return response.status(400).json({ message: "Choose a valid review status." });
      }
      try {
        const [result] = await pool.execute("UPDATE reviews SET status = ? WHERE id = ?", [status, request.params.id]);
        if (!result.affectedRows) {
          return response.status(404).json({ message: "Review not found." });
        }
        return response.json({ message: "Review status updated." });
      } catch (error) {
        return next(error);
      }
    },

    async updateReview(request, response, next) {
      const reviewId = Number(request.params.id);
      const body = request.body || {};
      const userName = typeof body.user_name === "string" ? body.user_name.trim() : "";
      const userEmail = typeof body.user_email === "string" ? body.user_email.trim() : "";
      const comment = typeof body.comment === "string" ? body.comment.trim() : "";
      const rating = Number(body.rating);

      if (!Number.isSafeInteger(reviewId) || reviewId < 1) {
        return response.status(400).json({ message: "Invalid review ID." });
      }
      if (!userName || userName.length > 160) {
        return response.status(400).json({ message: "Customer name is required and must be 160 characters or fewer." });
      }
      if (userEmail.length > 191 || (userEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userEmail))) {
        return response.status(400).json({ message: "Enter a valid customer email address." });
      }
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
        return response.status(400).json({ message: "Rating must be between 1 and 5." });
      }
      if (!comment || comment.length > 5000) {
        return response.status(400).json({ message: "Review comment is required and must be 5,000 characters or fewer." });
      }

      try {
        const [result] = await pool.execute(
          "UPDATE reviews SET user_name = ?, user_email = ?, rating = ?, comment = ? WHERE id = ?",
          [userName, userEmail || null, rating, comment, reviewId],
        );
        if (!result.affectedRows) {
          return response.status(404).json({ message: "Review not found." });
        }
        return response.json({ message: "Review updated successfully." });
      } catch (error) {
        return next(error);
      }
    },

    async updateReviewReply(request, response, next) {
      const reply = typeof request.body?.admin_reply === "string" ? request.body.admin_reply.trim() : "";
      if (!reply || reply.length > 5000) {
        return response.status(400).json({ message: "Reply is required and must be 5,000 characters or fewer." });
      }
      try {
        const [result] = await pool.execute("UPDATE reviews SET admin_reply = ? WHERE id = ?", [reply, request.params.id]);
        if (!result.affectedRows) {
          return response.status(404).json({ message: "Review not found." });
        }
        return response.json({ message: "Review reply saved." });
      } catch (error) {
        return next(error);
      }
    },

    async deleteReview(request, response, next) {
      try {
        const [result] = await pool.execute("DELETE FROM reviews WHERE id = ?", [request.params.id]);
        if (!result.affectedRows) {
          return response.status(404).json({ message: "Review not found." });
        }
        return response.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createReviewsController };
