const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

const uploadDirectory = path.join(__dirname, "..", "uploads", "youtube-videos");
const youtubeImageDirectory = path.join(__dirname, "..", "uploads", "youtube");
const servicesUploadDirectory = path.join(__dirname, "..", "uploads", "services");
fs.mkdirSync(uploadDirectory, { recursive: true });
fs.mkdirSync(youtubeImageDirectory, { recursive: true });
fs.mkdirSync(servicesUploadDirectory, { recursive: true });

const imageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
};
const documentExtensions = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "application/rtf": ".rtf",
  "text/rtf": ".rtf",
  "text/plain": ".txt",
};
const serviceImageExtensions = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

function createUploader(extensions, fileSize, maxFiles = 1) {
  return multer({
    storage: multer.diskStorage({
      destination: uploadDirectory,
      filename(request, file, callback) {
        callback(null, `${crypto.randomUUID()}${extensions[file.mimetype]}`);
      },
    }),
    limits: { fileSize, files: maxFiles },
    fileFilter(request, file, callback) {
      if (!extensions[file.mimetype] || path.basename(file.originalname).length > 180) {
        const error = new Error("Choose a supported file with a name of 180 characters or fewer.");
        error.status = 400;
        return callback(error);
      }
      return callback(null, true);
    },
  });
}

const uploadServiceImage = multer({
  storage: multer.diskStorage({
    destination: servicesUploadDirectory,
    filename(request, file, callback) {
      callback(null, `${crypto.randomUUID()}${serviceImageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter(request, file, callback) {
    if (!serviceImageExtensions[file.mimetype]) {
      const error = new Error("Upload a PNG, JPEG, WEBP, or GIF service image.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});

const uploadThumbnail = multer({
  storage: multer.diskStorage({
    destination: youtubeImageDirectory,
    filename(request, file, callback) {
      callback(null, `${crypto.randomUUID()}${imageExtensions[file.mimetype]}`);
    },
  }),
  limits: { fileSize: 3 * 1024 * 1024, files: 1 },
  fileFilter(request, file, callback) {
    if (!imageExtensions[file.mimetype]) {
      const error = new Error("Upload a PNG, JPEG, or WEBP thumbnail.");
      error.status = 400;
      return callback(error);
    }
    return callback(null, true);
  },
});
const uploadDocuments = createUploader(documentExtensions, 1024 * 1024, 4);

function createAdminContentRouter(controller) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get("/services", controller.listServices);
  router.get("/services/next-id", controller.getNextServiceId);
  router.post("/services/upload-image", uploadServiceImage.single("file"), (request, response) => {
    if (!request.file) {
      return response.status(400).json({ message: "Choose a service image to upload." });
    }
    return response.status(201).json({ image: `/uploads/services/${request.file.filename}` });
  });
  router.post("/services", controller.createService);
  router.put("/services/:id", controller.updateService);
  router.delete("/services/:id", controller.deleteService);
  router.get("/youtube-videos", controller.listYoutubeVideos);
  router.get("/youtube-videos/next-id", controller.getNextYoutubeVideoCode);
  router.post("/youtube-videos/upload-thumbnail", uploadThumbnail.single("file"), (request, response) => {
    if (!request.file) {
      return response.status(400).json({ message: "Choose a thumbnail image to upload." });
    }
    return response.status(201).json({ image: `/uploads/youtube/${request.file.filename}` });
  });
  router.post("/youtube-videos/upload-documents", uploadDocuments.array("files", 4), (request, response) => {
    if (!request.files?.length) {
      return response.status(400).json({ message: "Choose at least one document to upload." });
    }
    return response.status(201).json({
      documents: request.files.map((file) => ({
        name: path.basename(file.originalname),
        type: file.mimetype,
        url: `/uploads/youtube-videos/${file.filename}`,
      })),
    });
  });
  router.post("/youtube-videos", controller.createYoutubeVideo);
  router.put("/youtube-videos/:id", controller.updateYoutubeVideo);
  router.delete("/youtube-videos/:id", controller.deleteYoutubeVideo);

  return router;
}

module.exports = createAdminContentRouter;
