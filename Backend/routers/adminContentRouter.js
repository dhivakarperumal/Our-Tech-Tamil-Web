const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

function createAdminContentRouter(controller) {
  const router = express.Router();
  router.use(requireAdmin);

  router.get("/services", controller.listServices);
  router.get("/services/next-id", controller.getNextServiceId);
  router.post("/services", controller.createService);
  router.put("/services/:id", controller.updateService);
  router.delete("/services/:id", controller.deleteService);
  router.get("/youtube-videos", controller.listYoutubeVideos);
  router.post("/youtube-videos", controller.createYoutubeVideo);
  router.delete("/youtube-videos/:id", controller.deleteYoutubeVideo);

  return router;
}

module.exports = createAdminContentRouter;
