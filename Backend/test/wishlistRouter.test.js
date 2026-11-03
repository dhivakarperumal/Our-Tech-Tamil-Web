const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createWishlistRouter = require("../routers/wishlistRouter");

process.env.JWT_SECRET = "wishlist-router-test-secret";

function createPool() {
  const saved = new Map();
  return {
    saved,
    async execute(query, params = []) {
      if (query.includes("FROM products WHERE id = ?")) {
        return [[{
          id: params[0],
          name: "Test product",
          product_code: "TEST-008",
          images: '["/uploads/test.png"]',
          variants: JSON.stringify([{ colorName: "Blue", images: ["/uploads/blue.png"], sizesStock: { M: 2 } }]),
          mrp: "150.00",
          offer_price: "125.50",
          available_sizes: '["M","L"]',
          available_colors: '["Blue","Black"]',
        }]];
      }
      if (query.includes("INSERT IGNORE INTO wishlist_items")) {
        saved.set(`${params[0]}:${params[1]}`, { userId: params[0], productId: params[1] });
        return [{ affectedRows: 1 }];
      }
      if (query.includes("INSERT INTO wishlist_items")) {
        const [userId, productId, productName, productImage, productCode, mrp, offerPrice, color, size] = params;
        saved.set(`${userId}:${productId}:${color}:${size}`, {
          id: 1,
          userId,
          productId,
          productName,
          productImage,
          productCode,
          mrp,
          offerPrice,
          color,
          size,
        });
        return [{ affectedRows: 1 }];
      }
      if (query.includes("DELETE FROM wishlist_items")) {
        const [userId, productId, color, size] = params;
        const key = `${userId}:${productId}:${color}:${size}`;
        const deleted = saved.delete(key);
        return [{ affectedRows: deleted ? 1 : 0 }];
      }
      if (query.includes("FROM wishlist_items wi")) {
        const userId = params[0];
        const productIds = [...saved]
          .map(([, item]) => item)
          .filter((item) => item.userId === userId);
        return [productIds.map((productId) => ({
          id: productId.id || 1,
          product_id: productId.productId,
          product_name: productId.productName || "Test product",
          product_image: productId.productImage || "/uploads/test.png",
          product_code: productId.productCode || "TEST-008",
          mrp: productId.mrp || "150.00",
          offer_price: productId.offerPrice || "125.50",
          variant_color: productId.color || "",
          variant_size: productId.size || "",
          name: "Test product",
          images: '["/uploads/test.png"]',
          variants: JSON.stringify([{ colorName: "Blue", images: ["/uploads/blue.png"], sizesStock: { M: 2 } }]),
          available_sizes: '["M","L"]',
          available_colors: '["Blue","Black"]',
          mrp: "150.00",
          offer_price: "125.50",
        }))];
      }
      throw new Error(`Unexpected wishlist query: ${query}`);
    },
  };
}

async function startServer(t) {
  const pool = createPool();
  const app = express();
  app.use(express.json());
  app.use("/api/wishlist", createWishlistRouter(pool));
  app.use((error, request, response, next) => {
    response.status(500).json({ message: error.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  return { pool, url: `http://127.0.0.1:${server.address().port}/api/wishlist` };
}

function headers(userId) {
  return { Authorization: `Bearer ${jwt.sign({ user_id: userId }, process.env.JWT_SECRET)}` };
}

test("wishlist endpoints authenticate, load product data and isolate accounts", async (t) => {
  const { pool, url } = await startServer(t);
  const addResponse = await fetch(url, {
    method: "POST",
    headers: { ...headers("customer-one"), "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: 8, variant_color: "Blue", variant_size: "M", price: 0.01 }),
  });
  assert.equal(addResponse.status, 201);

  const firstUserResponse = await fetch(url, { headers: headers("customer-one") });
  const firstUserItems = await firstUserResponse.json();
  assert.equal(firstUserItems.length, 1);
  assert.equal(firstUserItems[0].product_id, 8);
  assert.equal(firstUserItems[0].id, 1);
  assert.equal(firstUserItems[0].product_name, "Test product");
  assert.equal(firstUserItems[0].product_code, "TEST-008");
  assert.equal(firstUserItems[0].image, "/uploads/blue.png");
  assert.equal(firstUserItems[0].price, 125.5);
  assert.equal(firstUserItems[0].variant_color, "Blue");
  assert.equal(firstUserItems[0].variant_size, "M");
  assert.deepEqual(firstUserItems[0].available_sizes, ["M", "L"]);
  assert.deepEqual(firstUserItems[0].available_colors, ["Blue", "Black"]);

  const secondUserResponse = await fetch(url, { headers: headers("customer-two") });
  assert.deepEqual(await secondUserResponse.json(), []);

  const removedResponse = await fetch(`${url}/8?variant_color=Blue&variant_size=M`, {
    method: "DELETE",
    headers: headers("customer-one"),
  });
  assert.equal(removedResponse.status, 200);
  assert.equal(pool.saved.size, 0);
});

test("wishlist routes reject missing authentication and invalid product IDs", async (t) => {
  const { url } = await startServer(t);
  const unauthenticated = await fetch(url);
  assert.equal(unauthenticated.status, 401);

  const invalid = await fetch(url, {
    method: "POST",
    headers: { ...headers("customer-one"), "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: "bad" }),
  });
  assert.equal(invalid.status, 400);
});

test("wishlist validates selected color and size against the product", async (t) => {
  const { url } = await startServer(t);
  const invalidColor = await fetch(url, {
    method: "POST",
    headers: { ...headers("customer-one"), "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: 8, variant_color: "Red", variant_size: "M" }),
  });
  assert.equal(invalidColor.status, 400);

  const invalidSize = await fetch(url, {
    method: "POST",
    headers: { ...headers("customer-one"), "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: 8, variant_color: "Blue", variant_size: "XL" }),
  });
  assert.equal(invalidSize.status, 400);
});
