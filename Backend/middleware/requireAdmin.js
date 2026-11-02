const jwt = require("jsonwebtoken");

function requireAdmin(request, response, next) {
  const authorization = request.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");

  if (scheme !== "Bearer" || !token) {
    return response.status(401).json({ message: "Authentication is required." });
  }

  try {
    const user = jwt.verify(token, process.env.JWT_SECRET);
    if (user.role !== "admin") {
      return response.status(403).json({ message: "Admin access is required." });
    }

    request.user = user;
    return next();
  } catch (error) {
    if (error.name === "TokenExpiredError" || error.name === "JsonWebTokenError") {
      return response.status(401).json({ message: "Your session is invalid or expired. Please sign in again." });
    }
    return next(error);
  }
}

module.exports = requireAdmin;
