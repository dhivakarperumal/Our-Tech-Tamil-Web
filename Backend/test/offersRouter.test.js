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
  show_in_header: true,
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
  assert.equal(inserted[5], true);

  const listed = await fetch(url, { headers: headers() });
  const listedBody = await listed.json();
  assert.equal(listed.status, 200);
  assert.equal(listedBody.success, true);
  assert.equal(listedBody.offers[0].id, 42);
  assert.equal(listedBody.offers[0].show_in_header, true);
});

test("public website header lists selected active offers", async (t) => {
  const url = await startTestServer(t, {
    async execute(query) {
      assert.match(query, /status = 'active' AND show_in_header = TRUE/);
      return [[{ id: 42, title: validOffer.title, offer_percentage: validOffer.offer_percentage }]];
    },
  });
  const response = await fetch(`${url}/header`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.offers.length, 1);
  assert.equal(result.offers[0].title, validOffer.title);
});

test("admin can independently toggle an offer in the website header", async (t) => {
  let updated;
  const url = await startTestServer(t, {
    async execute(query, params) {
      assert.match(query, /^UPDATE offers SET show_in_header = \? WHERE id = \?$/);
      updated = params;
      return [{ affectedRows: 1 }];
    },
  });
  const response = await fetch(`${url}/42/header`, {
    method: "PATCH",
    headers: headers(),
    body: JSON.stringify({ show_in_header: true }),
  });
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.deepEqual(updated, [true, 42]);
  assert.equal(result.show_in_header, true);
});

test("offer creation rejects invalid percentage, icon, status, and header selection", async (t) => {
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
    { ...validOffer, show_in_header: "true" },
  ]) {
    const response = await fetch(url, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(offer),
    });
    assert.equal(response.status, 400);
  }
});
