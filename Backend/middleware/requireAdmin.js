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

module.exports = requireAdmin;
