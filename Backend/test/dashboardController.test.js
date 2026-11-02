const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const { createDashboardController } = require("../controllers/dashboardController");
const createDashboardRouter = require("../routers/dashboardRouter");

process.env.JWT_SECRET = "dashboard-controller-test-secret";

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("dashboard returns real inventory/customer totals and normalized low-stock items", async () => {
  let customerQuery = "";
  const pool = {
    async execute(query) {
      if (query.includes("COUNT(*) AS total") && query.includes("FROM products")) {
        return [[{ total: "24", active: "19", lowStock: "2" }]];
      }
      if (query.includes("FROM users")) {
        customerQuery = query;
        return [[{ total: "7" }]];
      }
      if (query.includes("FROM products") && query.includes("total_stock < 10")) {
        return [[
          { id: 8, name: "Cotton saree", total_stock: 3, images: '["/uploads/products/saree.jpg"]' },
          { id: 9, name: "Classic shirt", total_stock: 0, images: "invalid json" },
        ]];
      }
      throw new Error("Unexpected dashboard query");
    },
  };
  const response = createResponse();
  const next = (error) => { throw error; };

  await createDashboardController(pool)({}, response, next);

  assert.match(customerQuery, /role IN \('customer', 'user'\) AND status = 'active'/);
  assert.deepEqual(response.body.stats.map(({ label, value }) => [label, value]), [
    ["Products", "24"],
    ["Active products", "19"],
    ["Customers", "7"],
    ["Low stock items", "2"],
  ]);
  assert.deepEqual(response.body.lowStockAlerts, [
    { id: 8, name: "Cotton saree", stock: 3, img: "/uploads/products/saree.jpg" },
    { id: 9, name: "Classic shirt", stock: 0, img: "" },
  ]);
  assert.deepEqual(response.body.recentOrders, []);
  assert.deepEqual(response.body.topProducts, []);
  assert.deepEqual(response.body.dataAvailability, { orders: false, sales: false });
});

test("dashboard forwards database failures to Express error handling", async () => {
  const expectedError = new Error("database unavailable");
  const pool = { execute: async () => { throw expectedError; } };
  const response = createResponse();
  let actualError;

  await createDashboardController(pool)({}, response, (error) => {
    actualError = error;
  });

  assert.equal(actualError, expectedError);
  assert.equal(response.body, null);
});

test("dashboard route requires an admin token", async (t) => {
  const app = express();
  app.use("/api/dashboard", createDashboardRouter(async (request, response) => {
    response.json({ adminId: request.user.id });
  }));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/api/dashboard`;
  const unauthorized = await fetch(url);
  assert.equal(unauthorized.status, 401);

  const token = jwt.sign({ id: 42, role: "admin" }, process.env.JWT_SECRET);
  const authorized = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  assert.equal(authorized.status, 200);
  assert.deepEqual(await authorized.json(), { adminId: 42 });
});
