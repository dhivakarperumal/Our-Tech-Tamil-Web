const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");
const { createReviewsController } = require("../controllers/reviewsController");

const uploadDirectory = path.join(__dirname, "..", "uploads", "reviews");
const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};
fs.mkdirSync(uploadDirectory, { recursive: true });

const uploadReviewImage = multer({
  storage: multer.diskStorage({
    destination: uploadDirectory,
    filename(request, file, callback) {
      callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(request, file, callback) {
    if (!imageExtensions[file.mimetype]) {
      const error = new Error("Upload a JPG, PNG, WEBP, or GIF review image.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function createReviewsRouter(pool) {
  const router = express.Router();
  const controller = createReviewsController(pool);
  router.use(requireAdmin);

  router.get("/admin/all", controller.listAdminReviews);
  router.post("/", controller.createAdminReview);
  router.post("/upload", uploadReviewImage.single("image"), (request, response) => {
    if (!request.file) {
      return response.status(400).json({ message: "Choose a review image to upload." });
    }
    return response.status(201).json({ url: `/uploads/reviews/${request.file.filename}` });
  });
  router.put("/admin/:id/status", controller.updateReviewStatus);
  router.put("/admin/:id/reply", controller.updateReviewReply);
  router.delete("/admin/:id", controller.deleteReview);

  return router;
}

module.exports = createReviewsRouter;
