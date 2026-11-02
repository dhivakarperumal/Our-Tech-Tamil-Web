const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

const cors = require("cors");
const express = require("express");
const { createPool, initializeDatabase } = require("./modules/db");
const { createAuthService } = require("./modules/authService");
const { createAuthController } = require("./controllers/authController");
const { createAdminContentController } = require("./controllers/adminContentController");
const createAuthRouter = require("./routers/authRouter");
const createAdminContentRouter = require("./routers/adminContentRouter");
const createCategoriesRouter = require("./routers/categoriesRouter");
const createProductsRouter = require("./routers/productsRouter");

const port = Number(process.env.PORT || 5000);

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error(`Invalid PORT value: ${process.env.PORT}`);
}

const pool = createPool();
const app = express();
const authService = createAuthService(pool);
const authController = createAuthController(authService);
const adminContentController = createAdminContentController(pool);

app.use(cors());
app.use(express.json({ limit: "12mb" }));
app.get("/api/health", async (request, response) => {
  try {
    await pool.query("SELECT 1");
    response.json({ status: "ok", database: "connected" });
  } catch (error) {
    console.error("Database health check failed:", error);
    response.status(503).json({ status: "error", database: "unavailable" });
  }
});

app.use("/api/auth", createAuthRouter(authController));
app.use("/api/admin/content", createAdminContentRouter(adminContentController));
app.use("/api/categories", createCategoriesRouter(pool));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/products", createProductsRouter(pool));

app.use((error, request, response, next) => {
  console.error("Backend request failed:", error);
  const uploadLimitError = typeof error.code === "string" && error.code.startsWith("LIMIT_");
  const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500
    ? error.status
    : uploadLimitError
      ? 400
      : 500;
  response.status(status).json({
    message: status === 500 ? "Internal server error." : error.message,
  });
});

async function start() {
  try {
    await initializeDatabase(pool);

    app.listen(port, () => {
      console.log(`Backend listening on http://localhost:${port} (database connected)`);
    });
  } catch (error) {
    console.error("Could not initialize the configured MySQL database:", error);
    await pool.end();
    process.exitCode = 1;
  }
}

if (require.main === module) {
  start();
}

module.exports = { app, start };
