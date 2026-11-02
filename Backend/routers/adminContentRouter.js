const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const express = require("express");
const multer = require("multer");
const requireAdmin = require("../middleware/requireAdmin");

const uploadDirectory = path.join(__dirname, "..", "uploads", "youtube-videos");
fs.mkdirSync(uploadDirectory, { recursive: true });

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

const uploadThumbnail = createUploader(imageExtensions, 3 * 1024 * 1024);
const uploadDocuments = createUploader(documentExtensions, 1024 * 1024, 4);

function createAdminContentRouter(controller) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get("/services", controller.listServices);
  router.get("/services/next-id", controller.getNextServiceId);
  router.post("/services", controller.createService);
  router.put("/services/:id", controller.updateService);
  router.delete("/services/:id", controller.deleteService);
  router.get("/youtube-videos", controller.listYoutubeVideos);
  router.get("/youtube-videos/next-id", controller.getNextYoutubeVideoCode);
  router.post("/youtube-videos/upload-thumbnail", uploadThumbnail.single("file"), (request, response) => {
    if (!request.file) {
      return response.status(400).json({ message: "Choose a thumbnail image to upload." });
    }
    return response.status(201).json({ image: `/uploads/youtube-videos/${request.file.filename}` });
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
  router.delete("/youtube-videos/:id", controller.deleteYoutubeVideo);

  return router;
}

module.exports = createAdminContentRouter;
