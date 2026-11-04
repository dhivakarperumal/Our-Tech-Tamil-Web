const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const jwt = require("jsonwebtoken");
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

function authenticateCustomer(request, response, next) {
  const [scheme, token] = (request.headers.authorization || "").split(" ");
  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Please sign in to leave a review." });
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

function createReviewsRouter(pool) {
  const router = express.Router();
  const controller = createReviewsController(pool);
  router.get("/mine", authenticateCustomer, controller.listCustomerReviews);
  router.get("/product/:productId", controller.listProductReviews);
  router.get("/product/:productId/mine", authenticateCustomer, controller.getCustomerProductReview);
  router.post(
    "/product/:productId",
    authenticateCustomer,
    uploadReviewImage.single("image"),
    controller.createCustomerProductReview,
  );
  router.get("/combo/:comboId", controller.listComboReviews);
  router.get("/combo/:comboId/mine", authenticateCustomer, controller.getCustomerComboReview);
  router.post(
    "/combo/:comboId",
    authenticateCustomer,
    uploadReviewImage.single("image"),
    controller.createCustomerComboReview,
  );
  router.get("/public", controller.listPublicReviews);
  router.use(requireAdmin);

  router.get("/admin/all", controller.listAdminReviews);
  router.post("/", controller.createAdminReview);
  router.post("/upload", uploadReviewImage.single("image"), (request, response) => {
    if (!request.file) {
      return response.status(400).json({ message: "Choose a review image to upload." });
    }
    return response.status(201).json({ url: `/uploads/reviews/${request.file.filename}` });
  });
  router.put("/admin/:id", controller.updateReview);
  router.put("/admin/:id/status", controller.updateReviewStatus);
  router.put("/admin/:id/reply", controller.updateReviewReply);
  router.delete("/admin/:id", controller.deleteReview);

  return router;
}

module.exports = createReviewsRouter;
