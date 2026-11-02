const express = require("express");

function createPublicBannersRouter(controller) {
  const router = express.Router();
  router.get("/", controller.listPublished);
  return router;
}

module.exports = createPublicBannersRouter;
