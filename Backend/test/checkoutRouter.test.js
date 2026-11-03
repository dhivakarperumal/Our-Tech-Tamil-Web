const test = require("node:test");
const assert = require("node:assert/strict");
const { once } = require("node:events");
const express = require("express");
const jwt = require("jsonwebtoken");
const { createHmac } = require("node:crypto");
const createCheckoutRouter = require("../routers/checkoutRouter");

process.env.JWT_SECRET = "checkout-router-test-secret";

function createPool({ stock = 5, quantity = 2, coupon = null, combo = false } = {}) {
  const statements = [];
  const addresses = [];
  const orders = [];
  const cartRows = [combo ? {
    cart_item_id: 7,
    product_id: null,
    combo_id: 5,
    product_name: "Bundle deal",
    product_image: "/uploads/combo.png",
    product_code: "COMBO-005",
    quantity,
    variant_color: "",
    variant_size: "",
    name: "Bundle deal",
    current_product_code: "COMBO-005",
    mrp: "300.00",
    offer_price: "250.00",
    total_stock: stock,
    status: "Active",
    track_inventory: 1,
    allow_backorders: 0,
    minimum_order_quantity: 1,
    maximum_order_quantity: 10,
    images: "[]",
    variants: "[]",
  } : {
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
    if (query.includes("FROM coupons WHERE code")) {
      return [coupon && coupon.code === params[0] ? [{ ...coupon }] : []];
    }
    if (query.includes("COUNT(*) AS used_count")) {
      return [[{
        used_count: orders.filter((order) =>
          order.user_id === params[1] && order.coupon_code === params[0],
        ).length,
      }]];
    }
    if (query.includes("COUNT(*) AS order_count")) {
      return [[{ order_count: orders.filter((order) => order.user_id === params[0]).length }]];
    }
    if (query.includes("SELECT id, recipient_name, phone")) {
      const userId = params[0];
      return [addresses
        .filter((address) => address.user_id === userId)
        .map(({ id, recipient_name, phone, street_address, city, district, state, country, zip_code }) => ({
          id, recipient_name, phone, street_address, city, district, state, country, zip_code,
        }))];
    }
    if (query.includes("FROM orders") && query.includes("razorpay_payment_id")) {
      return [orders.filter((order) =>
        order.user_id === params[0] && order.razorpay_payment_id === params[1],
      )];
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
    if (query.includes("INSERT INTO orders")) {
      const [
        user_id, address_id, customer_email, payment_method, payment_status,
        total_amount, razorpay_order_id, razorpay_payment_id, coupon_code, discount_amount, items_type,
      ] = params;
      orders.push({
        id: 45,
        user_id,
        address_id,
        customer_email,
        payment_method,
        payment_status,
        total_amount,
        razorpay_order_id,
        razorpay_payment_id,
        coupon_code,
        discount_amount,
        items_type,
        status: "Order Placed",
      });
      return [{ insertId: 45 }];
    }
    if (query.includes("UPDATE coupons SET usage_count")) {
      if (coupon?.id === params[0]) coupon.usage_count += 1;
      return [{ affectedRows: 1 }];
    }
    if (query.includes("INSERT INTO order_items")) return [{ insertId: 61 }];
    if (query.includes("UPDATE orders SET order_id")) {
      const order = orders.find((item) => item.id === params[1]);
      if (order) order.order_id = params[0];
      return [{ affectedRows: 1 }];
    }
    if (query.includes("UPDATE products SET total_stock")) return [{ affectedRows: 1 }];
    if (query.includes("UPDATE combos SET available_stock")) return [{ affectedRows: 1 }];
    if (query.includes("DELETE FROM cart_items")) return [{ affectedRows: 1 }];
    throw new Error(`Unexpected checkout query: ${query}`);
  };
  return {
    statements,
    addresses,
    orders,
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

function validCoupon(overrides = {}) {
  const now = Date.now();
  return {
    id: 8,
    code: "SAVE10",
    name: "Save ten percent",
    discount_type: "percentage",
    discount_value: "10.00",
    min_order_value: "0.00",
    start_date: new Date(now - 86400000),
    expiry_date: new Date(now + 86400000),
    usage_limit_global: null,
    usage_limit_per_customer: 1,
    usage_count: 0,
    status: "active",
    coupon_scope: "specific_products",
    applicable_product_ids: "[9]",
    applicable_category_ids: "[]",
    ...overrides,
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
  assert.equal(result.items_type, "Single");
  const orderInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO orders"));
  assert.match(orderInsert.query, /'Online'/);
  assert.equal(orderInsert.params[3], "Cash on Delivery");
  assert.equal(result.payment_method, "Cash on Delivery");
  assert.equal(result.payment_status, "Pending");
  assert.equal(result.items[0].price, 150);
  assert.equal(result.items[0].total, 300);
  assert.equal(result.items[0].image, "/uploads/headphones.png");

  const addressInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO addresses"));
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

test("checkout creates combo order lines and decrements combo inventory", async (t) => {
  const pool = createPool({ combo: true, stock: 4, quantity: 2 });
  const url = await startServer(t, pool);
  const response = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(address),
  });
  const order = await response.json();

  assert.equal(response.status, 201, JSON.stringify(order));
  assert.equal(order.total_amount, 500);
  assert.equal(order.items_type, "Combo");
  assert.equal(order.items[0].product_id, null);
  assert.equal(order.items[0].combo_id, 5);
  assert.equal(order.items[0].product_name, "Bundle deal");
  const itemInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO order_items"));
  assert.equal(itemInsert.params[1], null);
  assert.equal(itemInsert.params[2], 5);
  const comboUpdate = pool.statements.find(({ query }) => query.includes("UPDATE combos SET available_stock"));
  assert.deepEqual(comboUpdate.params, [2, "Low Stock", 5]);
});

test("customer can validate and redeem a coupon against the server-calculated cart total", async (t) => {
  const coupon = validCoupon();
  const pool = createPool({ coupon });
  const url = await startServer(t, pool);
  const validation = await fetch(`${url}/coupon`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ code: "save10" }),
  });
  const validationResult = await validation.json();
  assert.equal(validation.status, 200, JSON.stringify(validationResult));
  assert.equal(validationResult.discount, 30);
  assert.equal(validationResult.total, 270);

  const orderResponse = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({ ...address, coupon_code: "SAVE10" }),
  });
  const order = await orderResponse.json();
  assert.equal(orderResponse.status, 201, JSON.stringify(order));
  assert.equal(order.total_amount, 270);
  assert.equal(order.discount_amount, 30);
  assert.equal(order.coupon_code, "SAVE10");
  assert.equal(coupon.usage_count, 1);
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

test("Razorpay order and payment verification use server-calculated totals", async (t) => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const previousFetch = global.fetch;
  process.env.RAZORPAY_KEY_ID = "rzp_test_public";
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
  t.after(() => {
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret;
    global.fetch = previousFetch;
  });
  global.fetch = async (url, options) => {
    if (!String(url).startsWith("https://api.razorpay.com/")) {
      return previousFetch(url, options);
    }
    if (url.endsWith("/orders") && options.method === "POST") {
      const request = JSON.parse(options.body);
      assert.equal(request.amount, 30000);
      assert.equal(request.notes.user_id, "customer-uuid");
      return Response.json({ id: "order_test123", amount: 30000, currency: "INR" });
    }
    if (url.endsWith("/payments/pay_test123")) {
      return Response.json({
        id: "pay_test123",
        order_id: "order_test123",
        amount: 30000,
        currency: "INR",
        status: "captured",
      });
    }
    if (url.endsWith("/orders/order_test123")) {
      return Response.json({
        id: "order_test123",
        amount: 30000,
        currency: "INR",
        status: "created",
        notes: { user_id: "customer-uuid" },
      });
    }
    throw new Error(`Unexpected Razorpay request: ${url}`);
  };

  const pool = createPool();
  const url = await startServer(t, pool);
  const orderResponse = await fetch(`${url}/razorpay/order`, {
    method: "POST",
    headers: authHeaders(),
  });
  const paymentOrder = await orderResponse.json();
  assert.equal(orderResponse.status, 201);
  assert.equal(paymentOrder.amount, 30000);

  const paymentId = "pay_test123";
  const paymentOrderId = "order_test123";
  const signature = createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(`${paymentOrderId}|${paymentId}`)
    .digest("hex");
  const verifyResponse = await fetch(`${url}/razorpay/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      ...address,
      razorpay_order_id: paymentOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
  });
  const order = await verifyResponse.json();
  const orderInsert = pool.statements.find(({ query }) => query.includes("INSERT INTO orders"));

  assert.equal(verifyResponse.status, 201, JSON.stringify(order));
  assert.equal(order.payment_method, "Razorpay");
  assert.equal(order.payment_status, "Paid");
  assert.equal(orderInsert.params[3], "Razorpay");
  assert.equal(orderInsert.params[4], "Paid");
  assert.equal(orderInsert.params[6], paymentOrderId);
  assert.equal(orderInsert.params[7], paymentId);

  const retryResponse = await fetch(`${url}/razorpay/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      ...address,
      razorpay_order_id: paymentOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signature,
    }),
  });
  const retryOrder = await retryResponse.json();
  assert.equal(retryResponse.status, 200);
  assert.equal(retryOrder.order_id, "ORD00045");
  assert.equal(pool.orders.length, 1);
});

test("Razorpay rejects invalid signatures and unavailable credentials", async (t) => {
  const previousKeyId = process.env.RAZORPAY_KEY_ID;
  const previousKeySecret = process.env.RAZORPAY_KEY_SECRET;
  const previousFetch = global.fetch;
  process.env.RAZORPAY_KEY_ID = "rzp_test_public";
  process.env.RAZORPAY_KEY_SECRET = "test_secret";
  global.fetch = async (url, options) => {
    if (!String(url).startsWith("https://api.razorpay.com/")) {
      return previousFetch(url, options);
    }
    throw new Error("Invalid signatures must not call Razorpay.");
  };
  t.after(() => {
    if (previousKeyId === undefined) delete process.env.RAZORPAY_KEY_ID;
    else process.env.RAZORPAY_KEY_ID = previousKeyId;
    if (previousKeySecret === undefined) delete process.env.RAZORPAY_KEY_SECRET;
    else process.env.RAZORPAY_KEY_SECRET = previousKeySecret;
    global.fetch = previousFetch;
  });

  const pool = createPool();
  const url = await startServer(t, pool);
  const invalidResponse = await fetch(`${url}/razorpay/verify`, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      ...address,
      razorpay_order_id: "order_test123",
      razorpay_payment_id: "pay_test123",
      razorpay_signature: "0".repeat(64),
    }),
  });
  assert.equal(invalidResponse.status, 400);
  assert.equal(pool.statements.some(({ query }) => query.includes("INSERT INTO orders")), false);

  delete process.env.RAZORPAY_KEY_ID;
  const unavailableResponse = await fetch(`${url}/razorpay/order`, {
    method: "POST",
    headers: authHeaders(),
  });
  assert.equal(unavailableResponse.status, 503);
});
