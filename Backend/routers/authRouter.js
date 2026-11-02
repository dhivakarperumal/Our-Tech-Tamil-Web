const express = require("express");
const jwt = require("jsonwebtoken");

function requireAdmin(request, response, next) {
  const authorization = request.get("authorization") || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication is required." });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return response.status(403).json({ message: "Administrator access is required." });
    }

    request.user = user;
    return next();
  } catch {
    return response.status(401).json({ message: "Authentication token is invalid or expired." });
  }
}

function createAuthRouter(authController) {
  const router = express.Router();

  router.get("/users", requireAdmin, authController.listUsers);
  router.post("/register", authController.register);
  router.post("/login", authController.login);
  router.post("/google-login", authController.googleLogin);

  return router;
}

module.exports = createAuthRouter;
