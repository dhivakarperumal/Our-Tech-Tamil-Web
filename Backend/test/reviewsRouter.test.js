const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const createReviewsRouter = require("../routers/reviewsRouter");

async function startTestServer(t, pool) {
  const app = express();
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
