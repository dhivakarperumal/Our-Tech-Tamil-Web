const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createOrdersRouter = require("../routers/ordersRouter");

process.env.JWT_SECRET = "orders-router-test-secret";

function createPool({ orderItems } = {}) {
  const statements = [];
  const savedOrderItems = orderItems || [{
    order_id: 42,
    product_id: 8,
    product_name: "Test product",
    price: "125.50",
    quantity: 2,
    total: "251.00",
    variant_color: "Blue",
    variant_size: "M",
    image: "/uploads/products/test.png",
  }];
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(query, params = []) {
      statements.push({ query, params });
      if (query.includes("FROM users")) return [[{ user_id: params[0] }]];
      if (query.includes("FROM products")) {
        return [[{
          id: 8,
          name: "Test product",
          offer_price: "125.50",
          images: '["/uploads/products/test.png"]',
        }]];
      }
      if (query.includes("INSERT INTO addresses")) return [{ insertId: 15 }];
      if (query.includes("INSERT INTO orders")) return [{ insertId: 42 }];
      if (query.includes("INSERT INTO order_items")) return [{ insertId: 25 }];
      return [{ affectedRows: 1 }];
    },
  };
  return {
    statements,
    async execute(query, params = []) {
      statements.push({ query, params });
      if (query.includes("FROM orders o LEFT JOIN addresses")) {
        return [[{
          id: 42,
          order_id: "ORD00042",
          user_id: "customer-uuid",
          address_id: 15,
          customer_name: "Customer One",
          customer_phone: "9876543210",
          street_address: "12 Test Street",
          city: "Chennai",
          state: "Tamil Nadu",
          country: "India",
          zip_code: "600001",
        }]];
      }
      if (query.includes("FROM order_items")) {
        return [savedOrderItems];
      }
      if (query.includes("FROM combos WHERE id IN")) {
        return [[{
          id: 5,
          products: '[{"id":8,"quantity":2},{"id":9,"quantity":1}]',
        }]];
      }
      if (query.includes("FROM products WHERE id IN")) {
        return [[
          { id: 8, name: "Test pan", product_code: "PAN-008", images: '["/uploads/pan.png"]' },
          { id: 9, name: "Test lid", product_code: "LID-009", images: '["/uploads/lid.png"]' },
        ]];
      }
      throw new Error("Unexpected pool query");
    },
    async getConnection() {
      return connection;
    },
  };
}

test("admin order creation stores the address against the selected user ID", async (t) => {
  const pool = createPool();
  const app = express();
  app.use(express.json());
  app.use("/api/orders", createOrdersRouter(pool));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const token = jwt.sign({ id: 1, user_id: "admin-uuid", role: "admin" }, process.env.JWT_SECRET);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user_id: "customer-uuid",
      customer_name: "Customer One",
      customer_email: "customer@example.com",
      customer_phone: "9876543210",
      street_address: "12 Test Street",
      city: "Chennai",
      state: "Tamil Nadu",
      zip_code: "600001",
      items: [{ product_id: 8, quantity: 2, variant_color: "Blue", variant_size: "M" }],
    }),
  });

  const result = await response.json();
  assert.equal(response.status, 201, JSON.stringify(result));
  assert.equal(result.id, 42);
  assert.equal(result.order_id, "ORD00042");
  assert.equal(result.user_id, "customer-uuid");
  assert.equal(result.address_id, 15);
  assert.equal(result.total_amount, 251);
  assert.equal(result.items[0].product_name, "Test product");

  const addressInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO addresses"));
  const orderInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO orders"));
  assert.equal(addressInsert.params[0], "customer-uuid");
  assert.equal(orderInsert.params[0], "customer-uuid");
  assert.equal(orderInsert.params[1], 15);
  const itemInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO order_items"));
  assert.equal(itemInsert.params[0], 42);
  assert.equal(itemInsert.params[1], 8);
  assert.equal(itemInsert.params[2], "Test product");
});

test("admin order creation uses the logged-in user ID when no customer is selected", async (t) => {
  const pool = createPool();
  const app = express();
  app.use(express.json());
  app.use("/api/orders", createOrdersRouter(pool));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const token = jwt.sign({ id: 1, user_id: "admin-uuid", role: "admin" }, process.env.JWT_SECRET);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders`, {
    method: "POST",
    headers: {
      Authorization: ["Bearer", token].join(" "),
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      customer_name: "Walk-in Customer",
      customer_phone: "9876543210",
      street_address: "12 Test Street",
      city: "Chennai",
      state: "Tamil Nadu",
      zip_code: "600001",
      items: [{ product_id: 8, quantity: 1 }],
    }),
  });

  const result = await response.json();
  assert.equal(response.status, 201, JSON.stringify(result));
  assert.equal(result.user_id, "admin-uuid");
  const addressInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO addresses"));
  const orderInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO orders"));
  assert.equal(addressInsert.params[0], "admin-uuid");
  assert.equal(orderInsert.params[0], "admin-uuid");
});

test("order details load the delivery address from the addresses table", async (t) => {
  const pool = createPool();
  const app = express();
  app.use("/api/orders", createOrdersRouter(pool));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const token = jwt.sign({ id: 1, user_id: "admin-uuid", role: "admin" }, process.env.JWT_SECRET);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders/42`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  assert.equal(response.status, 200);
  const order = await response.json();
  assert.equal(order.address_id, 15);
  assert.equal(order.street_address, "12 Test Street");
  assert.equal(order.city, "Chennai");
  assert.deepEqual(order.items, [{
    product_id: 8,
    product_name: "Test product",
    name: "Test product",
    price: 125.5,
    quantity: 2,
    total: 251,
    variant_color: "Blue",
    variant_size: "M",
    image: "/uploads/products/test.png",
  }]);
  assert.ok(pool.statements.some(({ query }) =>
    query.includes("FROM orders o LEFT JOIN addresses a ON a.id = o.address_id"),
  ));
});

test("order details include every product and quantity inside combo order lines", async (t) => {
  const pool = createPool({
    orderItems: [{
      order_id: 42,
      product_id: null,
      combo_id: 5,
      product_name: "Kitchen combo",
      price: "500.00",
      quantity: 1,
      total: "500.00",
      variant_color: "",
      variant_size: "",
      image: "/uploads/combo.png",
    }],
  });
  const app = express();
  app.use("/api/orders", createOrdersRouter(pool));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const token = jwt.sign({ id: 1, user_id: "admin-uuid", role: "admin" }, process.env.JWT_SECRET);
  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders/42`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const order = await response.json();

  assert.equal(response.status, 200);
  assert.equal(order.items[0].item_type, "combo");
  assert.deepEqual(order.items[0].included_products, [
    { id: 8, name: "Test pan", product_code: "PAN-008", quantity: 2, image: "/uploads/pan.png" },
    { id: 9, name: "Test lid", product_code: "LID-009", quantity: 1, image: "/uploads/lid.png" },
  ]);
});

test("order creation requires admin authentication", async (t) => {
  const app = express();
  app.use("/api/orders", createOrdersRouter(createPool()));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  assert.equal(response.status, 401);
});
