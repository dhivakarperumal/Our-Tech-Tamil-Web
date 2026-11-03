const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createProductsRouter = require("../routers/productsRouter");

process.env.JWT_SECRET = "products-router-test-secret";

async function startTestServer(t, pool) {
  const app = express();
  app.use(express.json());
  app.use("/api/products", createProductsRouter(pool));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const address = server.address();
  const token = jwt.sign({ id: 1, role: "admin" }, process.env.JWT_SECRET);
  return {
    url: `http://127.0.0.1:${address.port}/api/products`,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  };
}

test("latest product code follows the largest existing OTP SKU", async (t) => {
  let latestCodeQuery = "";
  const pool = {
    async execute(query) {
      latestCodeQuery = query;
      return [[{ nextCode: "11" }]];
    },
  };
  const server = await startTestServer(t, pool);
  const response = await fetch(`${server.url}/latest-code`, { headers: server.headers });

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { latestCode: "OTP0011" });
  assert.match(latestCodeQuery, /MAX\(CAST\(SUBSTRING\(product_code, 4\) AS UNSIGNED\)\)/);
});

test("public product search returns matching active products", async (t) => {
  const queries = [];
  const pool = {
    async execute(query, parameters) {
      queries.push({ query, parameters });
      if (query.startsWith("SELECT COUNT(*)")) return [[{ total: 1 }]];
      return [[{
        id: 8,
        name: "Wireless Headphones",
        product_code: "OTP0008",
        images: "[]",
        variants: "[]",
        available_sizes: "[]",
        available_colors: "[]",
        specifications: "[]",
        featured: 0,
        trending: 0,
        new_arrival: 0,
      }]];
    },
  };
  const server = await startTestServer(t, pool);
  const response = await fetch(`${server.url}/public?search=headphones&limit=6`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.equal(result.products[0].name, "Wireless Headphones");
  assert.deepEqual(result.pagination, { total: 1, totalPages: 1 });
  assert.equal(queries.length, 2);
  assert.deepEqual(queries[0].parameters, Array(8).fill("%headphones%"));
  assert.deepEqual(queries[1].parameters, [...Array(8).fill("%headphones%"), 6, 0]);
  assert.match(queries[0].query, /status = 'Active'/);
  assert.match(queries[1].query, /product_code LIKE \?/);
});

test("product creation assigns a free URL slug when another product has the same name", async (t) => {
  let insertedValues;
  const pool = {
    async execute(query, parameters) {
      if (query.includes("WHERE product_code = ?")) return [[]];
      if (query.includes("SELECT slug FROM products")) {
        return [[{ slug: "same-product" }, { slug: "same-product-2" }]];
      }
      if (query.startsWith("INSERT INTO products")) {
        insertedValues = parameters;
        return [{ insertId: 25 }];
      }
      throw new Error(`Unexpected query: ${query}`);
    },
  };
  const server = await startTestServer(t, pool);
  const response = await fetch(server.url, {
    method: "POST",
    headers: server.headers,
    body: JSON.stringify({
      name: "Same Product",
      product_code: "OTP0011",
      slug: "same-product",
      cat_type: "Gadgets & Electronics",
      category: "Mobile",
      mrp: "1000",
      images: [],
      variants: [],
    }),
  });
  const result = await response.json();

  assert.equal(response.status, 201);
  assert.equal(result.slug, "same-product-3");
  assert.equal(insertedValues[1], "OTP0011");
  assert.equal(insertedValues[2], "same-product-3");
});

test("product creation explains SKU conflicts instead of returning an ambiguous duplicate error", async (t) => {
  let insertAttempted = false;
  const pool = {
    async execute(query) {
      if (query.includes("WHERE product_code = ?")) return [[{ id: 3 }]];
      if (query.includes("SELECT slug FROM products")) return [[]];
      if (query.startsWith("INSERT INTO products")) {
        insertAttempted = true;
        return [{ insertId: 25 }];
      }
      throw new Error(`Unexpected query: ${query}`);
    },
  };
  const server = await startTestServer(t, pool);
  const response = await fetch(server.url, {
    method: "POST",
    headers: server.headers,
    body: JSON.stringify({
      name: "New Product",
      product_code: "OTP0003",
      slug: "new-product",
      cat_type: "Gadgets & Electronics",
      category: "Mobile",
      mrp: "1000",
      images: [],
      variants: [],
    }),
  });

  assert.equal(response.status, 409);
  assert.match((await response.json()).message, /SKU is already in use/i);
  assert.equal(insertAttempted, false);
});
