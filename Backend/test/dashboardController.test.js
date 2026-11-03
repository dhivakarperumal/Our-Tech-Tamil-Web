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

test("dashboard returns real inventory, order, revenue, and low-stock data", async () => {
  let customerQuery = "";
  let revenueQuery = "";
  let revenueSummaryQuery = "";
  const pool = {
    async execute(query) {
      if (query.includes("COUNT(*) AS total") && query.includes("FROM products")) {
        return [[{ total: "24", active: "19", lowStock: "2" }]];
      }
      if (query.includes("FROM users")) {
        customerQuery = query;
        return [[{ total: "7" }]];
      }
      if (query.includes("FROM admin_services")) return [[{ total: "4" }]];
      if (query.includes("FROM admin_youtube_videos")) return [[{ total: "9" }]];
      if (query.includes("AS today") && query.includes("THEN total_amount")) {
        revenueSummaryQuery = query;
        return [[{ total: "42500.50", today: "1200.00" }]];
      }
      if (query.includes("COUNT(*) AS total") && query.includes("FROM orders")) {
        return [[{ total: "24", today: "3", cancelled: "4", delivery: "6" }]];
      }
      if (query.includes("AS order_number")) {
        return [[{
          id: 8,
          order_number: "ORD00008",
          customer: "Kavitha",
          date: "2026-11-03T08:30:00.000Z",
          amount: "4250.00",
          status: "Order Placed",
        }]];
      }
      if (query.includes("GROUP BY status")) {
        return [[
          { status: "Order Placed", count: "3" },
          { status: "Packing", count: "4" },
          { status: "Shipping", count: "2" },
          { status: "Out for Delivery", count: "1" },
          { status: "Delivered", count: "10" },
          { status: "Cancelled", count: "4" },
          { status: "Processing", count: "1" },
        ]];
      }
      if (query.includes("DATE_FORMAT(created_at, ?)")) {
        revenueQuery = query;
        return [[
          { period: "Mon", revenue: "1200.50" },
          { period: "Tue", revenue: "2000.00" },
        ]];
      }
      if (query.includes("FROM order_items")) {
        return [[{ id: 5, name: "Bluetooth speaker", sales: "7", img: "/uploads/speaker.png" }]];
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

  await createDashboardController(pool)({ query: { range: "week" } }, response, next);

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
  assert.deepEqual(response.body.recentOrders, [{
    id: "ORD00008",
    customer: "Kavitha",
    date: "2026-11-03T08:30:00.000Z",
    amount: "₹4,250",
    status: "Order Placed",
  }]);
  assert.deepEqual(response.body.topProducts, [{
    id: 5,
    name: "Bluetooth speaker",
    sales: 7,
    img: "/uploads/speaker.png",
  }]);
  assert.deepEqual(response.body.orderSummary, { total: 24, today: 3, cancelled: 4, delivery: 6 });
  assert.deepEqual(response.body.revenueSummary, { total: 42500.5, today: 1200 });
  assert.deepEqual(response.body.revenueTrends, [
    { month: "Mon", revenue: 1200.5 },
    { month: "Tue", revenue: 2000 },
  ]);
  assert.deepEqual(response.body.orderStatusCounts, {
    "Order Placed": 3,
    Confirmed: 1,
    Packed: 4,
    Shipped: 3,
    Delivered: 10,
    Cancelled: 4,
  });
  assert.match(revenueQuery, /status = 'Delivered'/);
  assert.match(revenueQuery, /INTERVAL 6 DAY/);
  assert.match(revenueSummaryQuery, /SUM\(CASE WHEN status = 'Delivered' THEN total_amount ELSE 0 END\)/);
  assert.match(revenueSummaryQuery, /SUM\(CASE WHEN status = 'Delivered' AND DATE\(created_at\) = CURDATE\(\) THEN total_amount ELSE 0 END\)/);
  assert.deepEqual(response.body.contentSummary, { services: 4, youtubeVideos: 9 });
  assert.deepEqual(response.body.dataAvailability, { orders: true, sales: true });
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
