const express = require("express");
const jwt = require("jsonwebtoken");
const requireAdmin = require("../middleware/requireAdmin");

function requireAuth(request, response, next) {
  const header = request.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return response.status(401).json({ message: "Authentication required." });
  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return response.status(401).json({ message: "Session expired. Please sign in again." });
  }
}

function createAuthRouter(authController) {
  const router = express.Router();

  router.get("/users", requireAdmin, authController.listUsers);
  router.post("/users", requireAdmin, authController.createUser);
  router.put("/users/:id", requireAdmin, authController.updateUser);
  router.delete("/users/:id", requireAdmin, authController.deleteUser);
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/google-login", authController.googleLogin);
  router.put("/profile", requireAuth, authController.updateProfile);
  router.put("/profile/password", requireAuth, authController.changePassword);

  return router;
}

module.exports = createAuthRouter;
