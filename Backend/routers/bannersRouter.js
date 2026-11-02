const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

const uploadDirectory = path.join(__dirname, "..", "uploads", "banners");
fs.mkdirSync(uploadDirectory, { recursive: true });

const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const upload = multer({
  storage: multer.diskStorage({
    destination(request, file, callback) {
      callback(null, uploadDirectory);
    },
    filename(request, file, callback) {
      callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 8 * 1024 * 1024, files: 2 },
  fileFilter(request, file, callback) {
    if (!["desktop_image", "mobile_image"].includes(file.fieldname) ||
        !imageExtensions[file.mimetype]) {
      const error = new Error("Upload JPEG, PNG, WebP, or GIF banner images only.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

function createBannersRouter(controller) {
  const router = express.Router();
  router.use(requireAdmin);
  router.get("/", controller.list);
  router.post("/", upload.fields([
    { name: "desktop_image", maxCount: 1 },
    { name: "mobile_image", maxCount: 1 },
  ]), controller.create);
  router.put("/:id", upload.fields([
    { name: "desktop_image", maxCount: 1 },
    { name: "mobile_image", maxCount: 1 },
  ]), controller.update);
  router.delete("/:id", controller.remove);
  return router;
}

module.exports = createBannersRouter;
