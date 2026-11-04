const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createOffersRouter = require("../routers/offersRouter");

process.env.JWT_SECRET = "offers-router-test-secret";

function headers(role = "admin") {
  const token = jwt.sign({ user_id: `${role}-one`, role }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

async function startTestServer(t, pool) {
  const app = express();
  app.use(express.json());
  app.use("/api/offers", createOffersRouter(pool));
  app.use((error, request, response, next) => {
    response.status(error.status || 500).json({ message: error.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  return `http://127.0.0.1:${server.address().port}/api/offers`;
}

const validOffer = {
  title: "Mega Shopping Festival",
  offer_percentage: 10,
  description: "Save on selected products.",
  icon: "Tag",
  status: "active",
  start_date: "2026-11-01",
  end_date: "2026-12-01",
};

test("offer endpoints require admin authentication", async (t) => {
  const url = await startTestServer(t, {
    async execute() {
      return [[]];
    },
  });
  assert.equal((await fetch(url)).status, 401);
  assert.equal((await fetch(url, { headers: headers("customer") })).status, 403);
});

test("admin can create and list offers", async (t) => {
  let inserted;
  const url = await startTestServer(t, {
    async execute(query, params) {
      if (query.startsWith("INSERT INTO offers")) {
        inserted = params;
        return [{ insertId: 42 }];
      }
      if (query.includes("FROM offers ORDER BY")) return [[{ id: 42, ...validOffer }]];
      throw new Error(`Unexpected query: ${query}`);
    },
  });

  const created = await fetch(url, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(validOffer),
  });
  const createdBody = await created.json();
  assert.equal(created.status, 201);
  assert.equal(createdBody.offer.id, 42);
  assert.equal(inserted[0], validOffer.title);
  assert.equal(inserted[1], 10);
  assert.equal(inserted[5], validOffer.start_date);

  const listed = await fetch(url, { headers: headers() });
  const listedBody = await listed.json();
  assert.equal(listed.status, 200);
  assert.equal(listedBody.success, true);
  assert.equal(listedBody.offers[0].id, 42);
});

test("offer creation rejects invalid percentage, icon, status, and dates", async (t) => {
  const url = await startTestServer(t, {
    async execute() {
      throw new Error("Invalid offers must not access the database.");
    },
  });
  for (const offer of [
    { ...validOffer, offer_percentage: 101 },
    { ...validOffer, offer_percentage: "" },
    { ...validOffer, icon: "NotAnIcon" },
    { ...validOffer, status: "pending" },
    { ...validOffer, start_date: "2026-02-30" },
    { ...validOffer, end_date: "2026-10-31" },
  ]) {
    const response = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(offer),
    });
    assert.equal(response.status, 400);
  }
});
