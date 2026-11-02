const express = require("express");
const requireAdmin = require("../middleware/requireAdmin");

function createAuthRouter(authController) {
  const router = express.Router();

  router.get("/users", requireAdmin, authController.listUsers);
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/google-login", authController.googleLogin);

  return router;
}

module.exports = createAuthRouter;
