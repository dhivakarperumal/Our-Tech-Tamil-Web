const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

function createDashboardRouter(controller) {
  const router = express.Router();
  router.use(requireAdmin);
  router.get("/", controller);
  return router;
}

module.exports = createDashboardRouter;
