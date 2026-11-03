const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createCombosRouter = require("../routers/combosRouter");

process.env.JWT_SECRET = "combos-router-test-secret";

async function startTestServer(t, pool) {
  const app = express();
  app.use(express.json());
  app.use("/api/combos", createCombosRouter(pool));
  app.use((error, request, response, next) => {
    response.status(error.status || 500).json({ message: error.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  const token = jwt.sign({ user_id: "admin-one", role: "admin" }, process.env.JWT_SECRET);
  return {
    url: `http://127.0.0.1:${server.address().port}/api/combos`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

const combo = {
  name: "Kitchen starter set",
  code: "COMBO0001",
  category_type: "Home",
  category: "Kitchen",
  subcategory: "Cookware",
  products: [{ id: 2, quantity: 1 }, { id: 3, quantity: 2 }],
  mrp: 500,
  offer: 10,
  offer_price: 450,
  total_savings: 150,
  gst: 5,
  final_price: 472.5,
  available_stock: 4,
  minimum_order_quantity: 1,
  maximum_order_quantity: 0,
  specifications: [{ key: "Material", value: "Steel" }],
};

test("combo endpoints require admin authentication", async (t) => {
  const server = await startTestServer(t, { async execute() { return [[]]; } });
  const response = await fetch(server.url);
  assert.equal(response.status, 401);
});

test("combo SKU endpoint creates the next combo code", async (t) => {
  const server = await startTestServer(t, {
    async execute(query) {
      assert.match(query, /FROM combos WHERE code REGEXP/);
      return [[{ nextCode: 8 }]];
    },
  });
  const response = await fetch(`${server.url}/next-code`, { headers: server.headers });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { code: "COMBO0008" });
});

test("combo creation saves combo details and selected product quantities", async (t) => {
  let inserted;
  const server = await startTestServer(t, {
    async execute(query, params) {
      assert.match(query, /INSERT INTO combos/);
      inserted = params;
      return [{ insertId: 17 }];
    },
  });
  const response = await fetch(server.url, {
    method: "POST",
    headers: server.headers,
    body: JSON.stringify(combo),
  });
  const result = await response.json();

  assert.equal(response.status, 201, JSON.stringify(result));
  assert.equal(result.combo.id, 17);
  assert.equal(result.combo.name, combo.name);
  assert.equal(inserted.length, 34);
  assert.equal(inserted[8], "");
  assert.equal(inserted[12], JSON.stringify(combo.products));
  assert.equal(inserted[33], "admin-one");
});

test("active combos require selected products and duplicate codes return a conflict", async (t) => {
  const server = await startTestServer(t, {
    async execute() {
      const error = new Error("Duplicate combo");
      error.code = "ER_DUP_ENTRY";
      throw error;
    },
  });
  const noProducts = await fetch(server.url, {
    method: "POST",
    headers: server.headers,
    body: JSON.stringify({ ...combo, products: [] }),
  });
  assert.equal(noProducts.status, 400);

  const duplicate = await fetch(server.url, {
    method: "POST",
    headers: server.headers,
    body: JSON.stringify(combo),
  });
  assert.equal(duplicate.status, 409);
});
