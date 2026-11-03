const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createCartRouter = require("../routers/cartRouter");

process.env.JWT_SECRET = "cart-router-test-secret";

function createPool() {
  const items = [];
  let nextId = 1;
  const product = {
    id: 8,
    name: "Test product",
    product_code: "TEST-008",
    mrp: "150.00",
    offer_price: "125.50",
    total_stock: 10,
    status: "Active",
    images: '["/uploads/test.png"]',
    variants: "[]",
  };

  const execute = async (query, params = []) => {
    if (query.includes("FROM users")) return [[{ user_id: params[0] }]];
    if (query.includes("FROM products")) return [[{ ...product }]];

    if (query.includes("SELECT id, quantity") && query.includes("FROM cart_items")) {
      const [userId, productId, color, size] = params;
      return [items.filter((item) =>
        item.user_id === userId && item.product_id === productId &&
        item.variant_color === color && item.variant_size === size,
      ).map(({ id, quantity }) => ({ id, quantity }))];
    }

    if (query.includes("SUM(quantity)") && query.includes("FROM cart_items")) {
      const [userId, productId, excludedId] = params;
      const quantity = items
        .filter((item) => item.user_id === userId && item.product_id === productId)
        .filter((item) => !query.includes("id <> ?") || item.id !== excludedId)
        .reduce((sum, item) => sum + item.quantity, 0);
      return [[{ quantity }]];
    }

    if (query.includes("SUM(subtotal)") && query.includes("FROM cart_items")) {
      const userId = params[0];
      return [[{
        grand_total: items
          .filter((item) => item.user_id === userId)
          .reduce((sum, item) => sum + item.subtotal, 0),
      }]];
    }

    if (query.includes("SELECT ci.id") && query.includes("FROM cart_items ci")) {
      const [id, userId] = params;
      const item = items.find((entry) => entry.id === id && entry.user_id === userId);
      return [item ? [{
        ...item,
        name: product.name,
        product_code: product.product_code,
        mrp: product.mrp,
        offer_price: product.offer_price,
        total_stock: product.total_stock,
        status: product.status,
        images: product.images,
        variants: product.variants,
      }] : []];
    }

    if (query.includes("INSERT INTO cart_items")) {
      const [
        user_id, product_id, product_name, product_image, product_code, mrp, offer_price,
        quantity, subtotal, total, variant_color, variant_size,
      ] = params;
      const item = {
        id: nextId++,
        user_id,
        product_id,
        product_name,
        product_image,
        product_code,
        mrp,
        offer_price,
        quantity,
        subtotal,
        total,
        variant_color,
        variant_size,
      };
      items.push(item);
      return [{ insertId: item.id }];
    }

    if (query.includes("UPDATE cart_items SET total = ?")) {
      const [total, userId] = params;
      items.filter((item) => item.user_id === userId).forEach((item) => { item.total = total; });
      return [{ affectedRows: 1 }];
    }

    if (query.includes("UPDATE cart_items") && query.includes("WHERE id = ? AND user_id = ?")) {
      const [product_name, product_image, product_code, mrp, offer_price, quantity, subtotal, id, userId] = params;
      const item = items.find((entry) => entry.id === id && entry.user_id === userId);
      if (item) Object.assign(item, { product_name, product_image, product_code, mrp, offer_price, quantity, subtotal });
      return [{ affectedRows: item ? 1 : 0 }];
    }

    if (query.startsWith("DELETE FROM cart_items WHERE user_id = ?")) {
      const userId = params[0];
      const before = items.length;
      for (let index = items.length - 1; index >= 0; index -= 1) {
        if (items[index].user_id === userId) items.splice(index, 1);
      }
      return [{ affectedRows: before - items.length }];
    }

    if (query.startsWith("DELETE FROM cart_items WHERE id = ?")) {
      const [id, userId] = params;
      const index = items.findIndex((item) => item.id === id && item.user_id === userId);
      if (index < 0) return [{ affectedRows: 0 }];
      items.splice(index, 1);
      return [{ affectedRows: 1 }];
    }

    if (query.includes("FROM cart_items") && query.includes("ORDER BY created_at")) {
      return [items.filter((item) => item.user_id === params[0]).map((item) => ({ ...item }))];
    }

    throw new Error(`Unexpected cart query: ${query}`);
  };

  return {
    async execute(query, params) {
      return execute(query, params);
    },
    async getConnection() {
      return {
        execute,
        async beginTransaction() {},
        async commit() {},
        async rollback() {},
        release() {},
      };
    },
  };
}

async function startCartServer(t, pool = createPool()) {
  const app = express();
  app.use(express.json());
  app.use("/api/cart", createCartRouter(pool));
  app.use((error, request, response, next) => {
    response.status(500).json({ message: error.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  return { pool, baseUrl: `http://127.0.0.1:${server.address().port}/api/cart` };
}

function tokenFor(userId) {
  return jwt.sign({ user_id: userId, role: "customer" }, process.env.JWT_SECRET);
}

test("cart add reads prices and product details from the database and isolates users", async (t) => {
  const { baseUrl } = await startCartServer(t);
  const add = async (userId, body) => fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor(userId)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const firstResponse = await add("customer-one", {
    user_id: "customer-two",
    product_id: 8,
    quantity: 1,
    price: 0.01,
    image: "/untrusted.png",
  });
  const first = await firstResponse.json();
  assert.equal(firstResponse.status, 201);
  assert.equal(first.message, "Product added to cart successfully");
  assert.equal(first.items[0].user_id, "customer-one");
  assert.equal(first.items[0].product_name, "Test product");
  assert.equal(first.items[0].product_code, "TEST-008");
  assert.equal(first.items[0].mrp, 150);
  assert.equal(first.items[0].offer_price, 125.5);
  assert.equal(first.items[0].image, "/uploads/test.png");
  assert.equal(first.items[0].subtotal, 125.5);
  assert.equal(first.total, 125.5);

  const duplicateResponse = await add("customer-one", { product_id: 8 });
  const duplicate = await duplicateResponse.json();
  assert.equal(duplicate.items.length, 1);
  assert.equal(duplicate.items[0].quantity, 2);
  assert.equal(duplicate.items[0].subtotal, 251);

  const secondResponse = await add("customer-two", { product_id: 8 });
  const second = await secondResponse.json();
  assert.equal(second.items.length, 1);
  assert.equal(second.items[0].user_id, "customer-two");
  assert.equal(second.items[0].quantity, 1);
});

test("cart quantity updates are recalculated and cart items cannot be removed by another user", async (t) => {
  const { baseUrl } = await startCartServer(t);
  const headers = (userId) => ({
    Authorization: `Bearer ${tokenFor(userId)}`,
    "Content-Type": "application/json",
  });
  const addResponse = await fetch(baseUrl, {
    method: "POST",
    headers: headers("customer-one"),
    body: JSON.stringify({ product_id: 8 }),
  });
  const { items } = await addResponse.json();
  const cartItemId = items[0].id;

  const unauthorizedRemove = await fetch(`${baseUrl}/${cartItemId}`, {
    method: "DELETE",
    headers: headers("customer-two"),
  });
  assert.equal(unauthorizedRemove.status, 404);

  const updateResponse = await fetch(`${baseUrl}/${cartItemId}`, {
    method: "PUT",
    headers: headers("customer-one"),
    body: JSON.stringify({ quantity: 3 }),
  });
  const updated = await updateResponse.json();
  assert.equal(updateResponse.status, 200);
  assert.equal(updated.items[0].quantity, 3);
  assert.equal(updated.items[0].subtotal, 376.5);
  assert.equal(updated.total, 376.5);
});

test("cart items can be removed and a user's cart can be cleared without affecting another account", async (t) => {
  const { baseUrl } = await startCartServer(t);
  const headers = (userId) => ({
    Authorization: `Bearer ${tokenFor(userId)}`,
    "Content-Type": "application/json",
  });
  const firstItemResponse = await fetch(baseUrl, {
    method: "POST",
    headers: headers("customer-one"),
    body: JSON.stringify({ product_id: 8 }),
  });
  const firstItem = (await firstItemResponse.json()).items[0];
  const secondUserResponse = await fetch(baseUrl, {
    method: "POST",
    headers: headers("customer-two"),
    body: JSON.stringify({ product_id: 8 }),
  });
  const secondUserItem = (await secondUserResponse.json()).items[0];

  const removedResponse = await fetch(`${baseUrl}/${firstItem.id}`, {
    method: "DELETE",
    headers: headers("customer-one"),
  });
  const removed = await removedResponse.json();
  assert.equal(removedResponse.status, 200);
  assert.deepEqual(removed.items, []);
  assert.equal(removed.total, 0);

  const otherCartResponse = await fetch(baseUrl, { headers: headers("customer-two") });
  const otherCart = await otherCartResponse.json();
  assert.equal(otherCart.items[0].id, secondUserItem.id);

  const clearResponse = await fetch(`${baseUrl}/clear`, {
    method: "DELETE",
    headers: headers("customer-two"),
  });
  const cleared = await clearResponse.json();
  assert.equal(clearResponse.status, 200);
  assert.deepEqual(cleared.items, []);
  assert.equal(cleared.total, 0);
  assert.ok(secondUserItem.id);
});

test("cart APIs require authentication and reject invalid quantities", async (t) => {
  const { baseUrl } = await startCartServer(t);
  const unauthenticated = await fetch(baseUrl);
  assert.equal(unauthenticated.status, 401);

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenFor("customer-one")}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product_id: 8, quantity: 0 }),
  });
  assert.equal(response.status, 400);
});
