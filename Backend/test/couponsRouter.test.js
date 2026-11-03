const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createCouponsRouter = require("../routers/couponsRouter");

process.env.JWT_SECRET = "coupons-router-test-secret";

function headers(role = "admin") {
  const token = jwt.sign({ user_id: `${role}-one`, role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function startTestServer(t, pool) {
  const app = express();
  app.use(express.json());
  app.use("/api/coupons", createCouponsRouter(pool));
  app.use((error, request, response, next) => {
    response.status(error.status || 500).json({ message: error.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  return `http://127.0.0.1:${server.address().port}/api/coupons`;
}

const validCoupon = {
  code: "summer-20",
  name: "Summer offer",
  description: "Seasonal discount",
  discount_type: "percentage",
  discount_value: "20",
  min_order_value: "1000",
  start_date: "2026-11-01T10:00:00",
  expiry_date: "2026-12-01T10:00:00",
  usage_limit_global: "",
  usage_limit_per_customer: "1",
  status: "active",
  coupon_scope: "specific_products",
  applicable_product_ids: [4, "5", 4],
  applicable_category_ids: [],
  applicable_subcategory_ids: [],
};

test("coupon CRUD endpoints require admin authentication", async (t) => {
  const url = await startTestServer(t, {
    async execute() {
      return [[{ id: 1 }]];
    },
  });
  const response = await fetch(url);
  assert.equal(response.status, 401);

  const customerResponse = await fetch(url, { headers: headers("customer") });
  assert.equal(customerResponse.status, 403);
});

test("admin can list coupons in the UI response shape", async (t) => {
  const coupon = { id: 3, code: "SAVE10", name: "Save ten" };
  const url = await startTestServer(t, {
    async execute(query) {
      assert.match(query, /SELECT[\s\S]+FROM coupons ORDER BY/);
      return [[coupon]];
    },
  });
  const response = await fetch(url, { headers: headers() });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.success, true);
  assert.deepEqual(result.coupons, [coupon]);
});

test("admin can create a validated coupon and persist selected product scope", async (t) => {
  let inserted;
  const url = await startTestServer(t, {
    async execute(query, params) {
      assert.match(query, /INSERT INTO coupons/);
      inserted = params;
      return [{ insertId: 12 }];
    },
  });
  const response = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(validCoupon),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.success, true);
  assert.equal(result.coupon.id, 12);
  assert.equal(result.coupon.code, "SUMMER-20");
  assert.deepEqual(result.coupon.applicable_product_ids, [4, 5]);
  assert.equal(inserted[0], "SUMMER-20");
  assert.equal(inserted[8], null);
  assert.equal(inserted[12], "[4,5]");
});

test("coupon creation rejects invalid dates, discount values, and empty targeted scopes", async (t) => {
  const url = await startTestServer(t, {
    async execute() {
      throw new Error("Invalid coupon should not access the database.");
    },
  });

  for (const body of [
    { ...validCoupon, expiry_date: "invalid" },
    { ...validCoupon, discount_value: "101" },
    { ...validCoupon, applicable_product_ids: [] },
  ]) {
    const response = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    });
    assert.equal(response.status, 400);
  }
});

test("coupon update supports unchanged values and delete returns not found for missing coupons", async (t) => {
  const url = await startTestServer(t, {
    async execute(query, params) {
      if (query.startsWith("UPDATE coupons SET")) return [{ affectedRows: 0 }];
      if (query.startsWith("SELECT id FROM coupons")) return [[{ id: params[0] }]];
      if (query.startsWith("DELETE FROM coupons")) return [{ affectedRows: 0 }];
      throw new Error(`Unexpected coupon query: ${query}`);
    },
  });

  const update = await fetch(`${url}/12`, {
    method: "PUT",
    headers: headers(),
    body: JSON.stringify(validCoupon),
  });
  assert.equal(update.status, 200);

  const remove = await fetch(`${url}/99`, { method: "DELETE", headers: headers() });
  assert.equal(remove.status, 404);
});
