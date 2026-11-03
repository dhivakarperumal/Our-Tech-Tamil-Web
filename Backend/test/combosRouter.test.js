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

test("public combo listing returns active combos without admin authentication", async (t) => {
  const server = await startTestServer(t, {
    async execute(query) {
      assert.match(query, /WHERE status = 'Active'/);
      return [[{
        id: 21,
        name: "Kitchen bundle",
        code: "COMBO0021",
        category_type: "Home",
        category: "Kitchen",
        gallery_images: '["/uploads/combos/kitchen.jpg"]',
        products: '[{"id":2,"quantity":1}]',
        mrp: 500,
        offer_price: 450,
        final_price: 450,
        available_stock: 6,
        stock_status: "Low Stock",
      }]];
    },
  });
  const response = await fetch(`${server.url}/public`);
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.combos[0].name, "Kitchen bundle");
  assert.deepEqual(result.combos[0].gallery_images, ["/uploads/combos/kitchen.jpg"]);
});

test("public combo detail returns the active combo and included product details", async (t) => {
  const server = await startTestServer(t, {
    async execute(query, params = []) {
      if (query.includes("FROM combos WHERE id = ? AND status = 'Active'")) {
        assert.equal(params[0], 17);
        return [[{
          id: 17,
          name: "Kitchen starter set",
          code: "COMBO0017",
          status: "Active",
          gallery_images: '["/uploads/combos/kitchen.jpg"]',
          products: '[{"id":2,"quantity":3}]',
          specifications: '[{"key":"Material","value":"Steel"}]',
          mrp: 500,
          offer_price: 450,
          final_price: 450,
          available_stock: 4,
        }]];
      }
      if (query.includes("FROM products WHERE status = 'Active'")) {
        assert.deepEqual(params, [2]);
        return [[{
          id: 2,
          name: "Steel pan",
          product_code: "PAN-2",
          mrp: 300,
          offer_price: 250,
          images: '["/uploads/pan.jpg"]',
        }]];
      }
      throw new Error(`Unexpected query: ${query}`);
    },
  });
  const response = await fetch(`${server.url}/public/17`);
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.combo.name, "Kitchen starter set");
  assert.deepEqual(result.combo.products[0].images, ["/uploads/pan.jpg"]);
  assert.equal(result.combo.products[0].quantity, 3);
  assert.deepEqual(result.combo.specifications, [{ key: "Material", value: "Steel" }]);
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

test("combo product selection filters by category type", async (t) => {
  const server = await startTestServer(t, {
    async execute(query, params) {
      assert.match(query, /cat_type = \?/);
      assert.ok(params.includes("Natural Products"));
      if (query.includes("COUNT(*)")) return [[{ total: 0 }]];
      return [[]];
    },
  });
  const response = await fetch(`${server.url}/products?categoryType=Natural%20Products`, {
    headers: server.headers,
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.pagination.total, 0);
});

test("combo stock endpoint adds inventory and returns the new stock status", async (t) => {
  let stock = 8;
  const server = await startTestServer(t, {
    async execute(query, params = []) {
      if (query.includes("UPDATE combos SET") && query.includes("available_stock = available_stock +")) {
        stock += params[0];
        return [{ affectedRows: 1 }];
      }
      if (query.includes("SELECT id, available_stock, stock_status FROM combos")) {
        return [[{ id: params[0], available_stock: stock, stock_status: stock <= 10 ? "Low Stock" : "In Stock" }]];
      }
      throw new Error(`Unexpected query: ${query}`);
    },
  });
  const response = await fetch(`${server.url}/17/stock`, {
    method: "PATCH",
    headers: server.headers,
    body: JSON.stringify({ quantity: 5 }),
  });
  const result = await response.json();
  assert.equal(response.status, 200);
  assert.equal(result.combo.available_stock, 13);
  assert.equal(result.combo.stock_status, "In Stock");
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

test("combo detail, update, and delete endpoints operate on the requested combo", async (t) => {
  const savedCombo = {
    id: 17,
    ...combo,
    gallery_images: "[]",
    specifications: JSON.stringify(combo.specifications),
    products: JSON.stringify(combo.products),
  };
  let updatedParams;
  let deletedId;
  const server = await startTestServer(t, {
    async execute(query, params = []) {
      if (query.includes("DELETE FROM combos")) {
        deletedId = params[0];
        return [{ affectedRows: 1 }];
      }
      if (query.includes("FROM combos WHERE id = ?")) return [[savedCombo]];
      if (query.includes("FROM products WHERE id IN")) {
        return [[{ id: 2, name: "Pan", product_code: "PAN-2", mrp: 300, offer_price: 250, total_stock: 8, images: "[]" }]];
      }
      if (query.includes("UPDATE combos SET")) {
        updatedParams = params;
        return [{ affectedRows: 1 }];
      }
      throw new Error(`Unexpected query: ${query}`);
    },
  });

  const detailResponse = await fetch(`${server.url}/17`, { headers: server.headers });
  const detail = await detailResponse.json();
  assert.equal(detailResponse.status, 200);
  assert.equal(detail.combo.products[0].name, "Pan");
  assert.equal(detail.combo.products[0].quantity, 1);

  const updateResponse = await fetch(`${server.url}/17`, {
    method: "PUT",
    headers: server.headers,
    body: JSON.stringify({ ...combo, name: "Updated kitchen set" }),
  });
  assert.equal(updateResponse.status, 200);
  assert.equal(updatedParams[0], "Updated kitchen set");
  assert.equal(updatedParams.at(-1), 17);

  const deleteResponse = await fetch(`${server.url}/17`, {
    method: "DELETE",
    headers: server.headers,
  });
  assert.equal(deleteResponse.status, 200);
  assert.equal(deletedId, 17);
});
