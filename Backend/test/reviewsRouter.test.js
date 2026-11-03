const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createReviewsRouter = require("../routers/reviewsRouter");

process.env.JWT_SECRET = "reviews-router-test-secret";

function authHeaders(userId) {
  const token = jwt.sign({ user_id: userId, role: "customer" }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

function adminHeaders() {
  const token = jwt.sign({ user_id: "admin-one", role: "admin" }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function startTestServer(t, pool) {
  const app = express();
  app.use(express.json());
  app.use("/api/reviews", createReviewsRouter(pool));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const address = server.address();
  return `http://127.0.0.1:${address.port}/api/reviews`;
}

test("public reviews endpoint returns only published review fields without authentication", async (t) => {
  let query = "";
  const pool = {
    async execute(statement) {
      query = statement;
      return [[{
        id: 12,
        product_id: 8,
        product_name: "Tamil phone",
        user_name: "Customer",
        rating: 5,
        comment: "Works very well.",
        review_image: null,
        admin_reply: null,
        created_at: "2026-10-30T12:00:00.000Z",
      }]];
    },
  };
  const url = await startTestServer(t, pool);
  const response = await fetch(`${url}/public`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.reviews.length, 1);
  assert.equal(result.reviews[0].product_name, "Tamil phone");
  assert.match(query, /WHERE r\.status = 'Published'/);
  assert.match(query, /LIMIT 8/);
});

test("product review listing returns all published reviews for that product without user filtering", async (t) => {
  let query = "";
  let parameters = [];
  const pool = {
    async execute(statement, params = []) {
      query = statement;
      parameters = params;
      return [[
        { id: 21, product_id: 8, user_name: "Customer One", rating: 5, comment: "Good.", created_at: "2026-11-01" },
        { id: 22, product_id: 8, user_name: "Customer Two", rating: 4, comment: "Nice.", created_at: "2026-11-02" },
      ]];
    },
  };
  const url = await startTestServer(t, pool);
  const response = await fetch(`${url}/product/8`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(parameters, [8]);
  assert.equal(result.reviews.length, 2);
  assert.match(query, /WHERE product_id = \? AND status = 'Published'/);
  assert.doesNotMatch(query, /user_id\s*=/i);
});

test("customer review history returns only the authenticated customer's reviews", async (t) => {
  let query = "";
  let parameters = [];
  const pool = {
    async execute(statement, params = []) {
      query = statement;
      parameters = params;
      return [[{
        id: 21,
        product_id: 8,
        product_name: "Tamil phone",
        rating: 5,
        comment: "Good.",
        status: "Pending",
      }]];
    },
  };
  const url = await startTestServer(t, pool);
  const unauthorized = await fetch(`${url}/mine`);
  assert.equal(unauthorized.status, 401);

  const response = await fetch(`${url}/mine`, { headers: authHeaders("customer-one") });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(parameters, ["customer-one"]);
  assert.equal(result.reviews.length, 1);
  assert.equal(result.reviews[0].product_name, "Tamil phone");
  assert.match(query, /WHERE r\.user_id = \?/);
});

test("admin can edit review content and invalid edits are rejected", async (t) => {
  let updateParams;
  const url = await startTestServer(t, {
    async execute(query, params = []) {
      if (query.startsWith("UPDATE reviews SET user_name")) {
        updateParams = params;
        return [{ affectedRows: 1 }];
      }
      if (query.startsWith("SELECT id FROM reviews WHERE id")) return [[{ id: params[0] }]];
      throw new Error(`Unexpected review query: ${query}`);
    },
  });
  const update = await fetch(`${url}/admin/7`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({
      user_name: "Updated Customer",
      user_email: "",
      rating: 4,
      comment: "Updated review text.",
    }),
  });
  assert.equal(update.status, 200);
  assert.deepEqual(updateParams, ["Updated Customer", null, 4, "Updated review text.", 7]);

  const invalid = await fetch(`${url}/admin/7`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({
      user_name: "",
      user_email: "",
      rating: 8,
      comment: "",
    }),
  });
  assert.equal(invalid.status, 400);

  const unchanged = await fetch(`${url}/admin/7`, {
    method: "PUT",
    headers: adminHeaders(),
    body: JSON.stringify({
      user_name: "Updated Customer",
      user_email: "",
      rating: 4,
      comment: "Updated review text.",
    }),
  });
  assert.equal(unchanged.status, 200);
});

test("customers can submit one review per product and see their review status", async (t) => {
  const savedReviews = new Map();
  let nextId = 1;
  const pool = {
    async execute(query, params = []) {
      if (query.includes("SELECT id FROM products")) return [[{ id: params[0] }]];
      if (query.includes("SELECT username, email FROM users")) {
        return [[{ username: params[0], email: `${params[0]}@example.com` }]];
      }
      if (query.includes("INSERT INTO reviews")) {
        const key = `${params[0]}:${params[1]}`;
        if (savedReviews.has(key)) {
          const error = new Error("Duplicate review");
          error.code = "ER_DUP_ENTRY";
          throw error;
        }
        const review = {
          id: nextId++,
          product_id: params[0],
          user_id: params[1],
          user_name: params[2],
          rating: params[4],
          comment: params[5],
          review_image: params[6],
          status: "Pending",
        };
        savedReviews.set(key, review);
        return [{ insertId: review.id }];
      }
      if (query.includes("WHERE product_id = ? AND user_id = ?")) {
        const review = savedReviews.get(`${params[0]}:${params[1]}`);
        return [[review || undefined].filter(Boolean)];
      }
      if (query.includes("WHERE product_id = ? AND status = 'Published'")) return [[]];
      throw new Error(`Unexpected review query: ${query}`);
    },
  };
  const url = await startTestServer(t, pool);
  const payload = JSON.stringify({ user_name: "Customer One", rating: 5, comment: "Great product." });
  const formData = new FormData();
  formData.append("user_name", "Customer One");
  formData.append("rating", "5");
  formData.append("comment", "Great product.");
  formData.append("image", new Blob(["test image"], { type: "image/png" }), "review.png");

  const unauthenticated = await fetch(`${url}/product/10`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: payload,
  });
  assert.equal(unauthenticated.status, 401);

  const firstReview = await fetch(`${url}/product/10`, {
    method: "POST",
    headers: { Authorization: authHeaders("customer-one").Authorization },
    body: formData,
  });
  assert.equal(firstReview.status, 201);
  const firstReviewResult = await firstReview.json();
  assert.match(firstReviewResult.review.review_image, /^\/uploads\/reviews\/[0-9a-f-]+\.png$/i);
  const uploadedImagePath = path.join(
    __dirname,
    "..",
    "uploads",
    "reviews",
    path.basename(firstReviewResult.review.review_image),
  );
  t.after(() => {
    if (fs.existsSync(uploadedImagePath)) fs.unlinkSync(uploadedImagePath);
  });

  const duplicateReview = await fetch(`${url}/product/10`, {
    method: "POST",
    headers: authHeaders("customer-one"),
    body: payload,
  });
  assert.equal(duplicateReview.status, 409);

  const anotherCustomerReview = await fetch(`${url}/product/10`, {
    method: "POST",
    headers: authHeaders("customer-two"),
    body: payload,
  });
  assert.equal(anotherCustomerReview.status, 201);

  const ownReview = await fetch(`${url}/product/10/mine`, {
    headers: authHeaders("customer-one"),
  });
  const ownReviewResult = await ownReview.json();
  assert.equal(ownReviewResult.review.user_name, "Customer One");
  assert.equal(ownReviewResult.review.status, "Pending");

  const differentProductReview = await fetch(`${url}/product/11`, {
    method: "POST",
    headers: authHeaders("customer-one"),
    body: payload,
  });
  assert.equal(differentProductReview.status, 201);
  assert.equal(savedReviews.size, 3);
});
