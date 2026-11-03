const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const createCheckoutRouter = require("../routers/checkoutRouter");

process.env.JWT_SECRET = "checkout-router-test-secret";

function createPool({ stock = 5, quantity = 2 } = {}) {
  const statements = [];
  const addresses = [];
  const cartRows = [{
    cart_item_id: 7,
    product_id: 9,
    product_name: "Headphones",
    product_image: "/uploads/headphones.png",
    product_code: "HEAD-009",
    quantity,
    variant_color: "Black",
    variant_size: "",
    name: "Headphones",
    current_product_code: "HEAD-009",
    mrp: "200.00",
    offer_price: "150.00",
    total_stock: stock,
    status: "Active",
    images: '["/uploads/headphones.png"]',
    variants: JSON.stringify([{ colorName: "Black", quantity: stock, images: ["/uploads/black.png"] }]),
  }];
  const execute = async (query, params = []) => {
    statements.push({ query, params });
    if (query.includes("FROM users")) return [[{ user_id: params[0] }]];
    if (query.includes("FROM cart_items ci")) return [cartRows];
    if (query.includes("SELECT id, recipient_name, phone")) {
      const userId = params[0];
      return [addresses
        .filter((address) => address.user_id === userId)
        .map(({ id, recipient_name, phone, street_address, city, district, state, country, zip_code }) => ({
          id, recipient_name, phone, street_address, city, district, state, country, zip_code,
        }))];
    }
    if (query.includes("FROM addresses")) {
      const [
        userId, recipientName, phone, streetAddress, city, district, state, country, zipCode,
      ] = params;
      const existing = addresses.find((address) =>
        address.user_id === userId &&
        address.recipient_name === recipientName &&
        address.phone === phone &&
        address.street_address === streetAddress &&
        address.city === city &&
        address.district === district &&
        address.state === state &&
        address.country === country &&
        address.zip_code === zipCode,
      );
      return [existing ? [{ id: existing.id }] : []];
    }
    if (query.includes("INSERT INTO addresses")) {
      const [
        user_id, recipient_name, phone, street_address, city, district, state, country, zip_code,
      ] = params;
      addresses.push({
        id: 31,
        user_id,
        recipient_name,
        phone,
        street_address,
        city,
        district,
        state,
        country,
        zip_code,
      });
      return [{ insertId: 31 }];
    }
    if (query.includes("INSERT INTO orders")) return [{ insertId: 45 }];
    if (query.includes("INSERT INTO order_items")) return [{ insertId: 61 }];
    if (query.includes("UPDATE orders SET order_id")) return [{ affectedRows: 1 }];
    if (query.includes("UPDATE products SET total_stock")) return [{ affectedRows: 1 }];
    if (query.includes("DELETE FROM cart_items")) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected checkout query: ${query}`);
  };
  return {
    statements,
    addresses,
    execute,
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

async function startServer(t, pool) {
  const app = express();
  app.use(express.json());
  app.use("/api/checkout", createCheckoutRouter(pool));
  app.use((error, request, response, next) => {
    response.status(500).json({ message: error.message });
  });
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());
  return `http://127.0.0.1:${server.address().port}/api/checkout`;
}

function authHeaders(userId = "customer-uuid") {
  const token = jwt.sign({ user_id: userId, role: "customer" }, process.env.JWT_SECRET);
  return { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}

const address = {
  recipient_name: "Customer One",
  phone: "9876543210",
  street_address: "12 Test Street",
  city: "Chennai",
  district: "Chennai",
  state: "Tamil Nadu",
  zip_code: "600001",
  customer_email: "customer@example.com",
};

test("checkout creates an order from authenticated user's cart and database prices", async (t) => {
  const pool = createPool();
  const url = await startServer(t, pool);
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...address, user_id: "another-user", total_amount: 0.01 }),
  });
  const result = await response.json();

  assert.equal(response.status, 201, JSON.stringify(result));
  assert.equal(result.order_id, "ORD00045");
  assert.equal(result.total_amount, 300);
  assert.match(
    pool.statements.find(({ query }) => query.includes("INSERT INTO orders")).query,
    /'Online', 'Cash on Delivery'/,
  );
  assert.equal(result.payment_method, "Cash on Delivery");
  assert.equal(result.items[0].price, 150);
  assert.equal(result.items[0].total, 300);
  assert.equal(result.items[0].image, "/uploads/headphones.png");

  const addressInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO addresses"));
  const orderInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO orders"));
  const productUpdate = pool.statements.find(({ query }) => query.includes("UPDATE products SET total_stock"));
  assert.equal(addressInsert.params[0], "customer-uuid");
  assert.equal(orderInsert.params[0], "customer-uuid");
  assert.equal(productUpdate.params[0], 3);
  assert.ok(pool.statements.some(({ query }) => query.includes("DELETE FROM cart_items WHERE user_id = ?")));
});

test("checkout requires a non-empty cart and sufficient current stock", async (t) => {
  const pool = createPool({ stock: 1, quantity: 2 });
  const url = await startServer(t, pool);
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(address),
  });

  assert.equal(response.status, 400);
  const message = (await response.json()).message;
  assert.match(message, /Only 1 Headphones item/);
  assert.ok(!pool.statements.some(({ query }) => query.includes("INSERT INTO orders")));
});

test("checkout reuses the same customer's matching delivery address", async (t) => {
  const pool = createPool();
  const url = await startServer(t, pool);
  const submitOrder = () => fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(address),
  });

  const firstResponse = await submitOrder();
  const firstOrder = await firstResponse.json();
  const secondResponse = await submitOrder();
  const secondOrder = await secondResponse.json();

  assert.equal(firstResponse.status, 201);
  assert.equal(secondResponse.status, 201);
  assert.equal(firstOrder.address_id, 31);
  assert.equal(secondOrder.address_id, 31);
  assert.equal(pool.addresses.length, 1);
  assert.equal(pool.statements.filter(({ query }) => query.includes("INSERT INTO addresses")).length, 1);
});

test("saved checkout addresses are listed only for the authenticated customer", async (t) => {
  const pool = createPool();
  const url = await startServer(t, pool);
  const orderResponse = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(address),
  });
  assert.equal(orderResponse.status, 201);

  const customerAddressesResponse = await fetch(`${url}/addresses`, {
    headers: authHeaders(),
  });
  const customerAddresses = await customerAddressesResponse.json();
  assert.equal(customerAddressesResponse.status, 200);
  assert.equal(customerAddresses.length, 1);
  assert.equal(customerAddresses[0].street_address, address.street_address);

  const otherCustomerResponse = await fetch(`${url}/addresses`, {
    headers: authHeaders("other-customer"),
  });
  assert.deepEqual(await otherCustomerResponse.json(), []);
});

test("checkout rejects unauthenticated customers and invalid addresses", async (t) => {
  const url = await startServer(t, createPool());
  const unauthenticated = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(address),
  });
  assert.equal(unauthenticated.status, 401);

  const invalidAddress = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...address, street_address: "" }),
  });
  assert.equal(invalidAddress.status, 400);
});
