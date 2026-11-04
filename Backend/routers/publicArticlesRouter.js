const express = require("express");

function createPublicArticlesRouter(controller) {
  const router = express.Router();
  router.get("/content", controller.listPublicContent);
  router.get("/", controller.listPublicArticles);
  return router;
}

module.exports = createPublicArticlesRouter;
