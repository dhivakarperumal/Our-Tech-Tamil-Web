const express = require("express");

function createPublicYoutubeVideosRouter(controller) {
  const router = express.Router();
  router.get("/", controller.listPublicYoutubeVideos);
  return router;
}

module.exports = createPublicYoutubeVideosRouter;
