const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

function createAdminContentRouter(controller) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get("/services", controller.listServices);
  router.post("/services", controller.createService);
  router.delete("/services/:id", controller.deleteService);
  router.get("/youtube-videos", controller.listYoutubeVideos);
  router.post("/youtube-videos", controller.createYoutubeVideo);
  router.delete("/youtube-videos/:id", controller.deleteYoutubeVideo);

  return router;
}

module.exports = createAdminContentRouter;
