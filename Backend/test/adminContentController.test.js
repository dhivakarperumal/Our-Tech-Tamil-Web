const test = require("node:test");
const assert = require("node:assert/strict");
const { createAdminContentController } = require("../controllers/adminContentController");

function createResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end() {
      return this;
    },
  };
}

test("article creation validates required content and does not access the database on invalid input", async () => {
  let connectionRequested = false;
  const pool = {
    async getConnection() {
      connectionRequested = true;
      throw new Error("Database should not be reached for invalid input");
    },
  };
  const response = createResponse();

  await createAdminContentController(pool).createArticle(
    { body: { content_type: "article", title: "Short" } },
    response,
    (error) => { throw error; },
  );

  assert.equal(response.statusCode, 400);
  assert.match(response.body.message, /description is required/i);
  assert.equal(connectionRequested, false);
});

test("product review creation persists the selected fields and returns a generated ID", async () => {
  const calls = [];
  const article = {
    id: 42,
    content_id: "REV-00042",
    content_type: "product_review",
    title: null,
    product_name: "Tamil phone",
    description: "A useful product review.",
    product_features: JSON.stringify([{ name: "Battery", value: "5000 mAh" }]),
    image_url: "/uploads/articles/12345678-1234-1234-1234-123456789abc.png",
    rating: 4.5,
    buy_link: "https://amazon.example/product",
    buy_links: JSON.stringify([
      { name: "Amazon", url: "https://amazon.example/product" },
      { name: "Store", url: "https://store.example/product" },
    ]),
    more_details: "Tested for one week.",
  };
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(query, parameters) {
      calls.push({ query, parameters });
      if (query.startsWith("INSERT")) return [{ insertId: article.id }];
      if (query.startsWith("SELECT")) return [[article]];
      return [{ affectedRows: 1 }];
    },
  };
  const pool = { async getConnection() { return connection; } };
  const response = createResponse();

  await createAdminContentController(pool).createArticle(
    {
      body: {
        content_type: "product_review",
        product_name: article.product_name,
        description: article.description,
        product_features: [{ name: "Battery", value: "5000 mAh" }],
        image_url: article.image_url,
        rating: article.rating,
        buy_links: [
          { name: "Amazon", url: "https://amazon.example/product" },
          { name: "Store", url: "https://store.example/product" },
        ],
        more_details: article.more_details,
      },
    },
    response,
    (error) => { throw error; },
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.article.content_id, "REV-00042");
  assert.equal(response.body.article.content_type, "product_review");
  assert.equal(response.body.article.rating, 4.5);
  assert.deepEqual(response.body.article.product_features, [{ name: "Battery", value: "5000 mAh" }]);
  assert.deepEqual(response.body.article.buy_links, [
    { name: "Amazon", url: "https://amazon.example/product" },
    { name: "Store", url: "https://store.example/product" },
  ]);
  assert.equal(calls[0].parameters[1], "product_review");
  assert.equal(calls[0].parameters[4], "A useful product review.");
  assert.equal(calls[0].parameters[5], JSON.stringify([{ name: "Battery", value: "5000 mAh" }]));
  assert.equal(calls[0].parameters[9], JSON.stringify([
    { name: "Amazon", url: "https://amazon.example/product" },
    { name: "Store", url: "https://store.example/product" },
  ]));
});

test("article creation persists and returns named article links", async () => {
  const calls = [];
  const article = {
    id: 8,
    content_id: "ART-00008",
    content_type: "article",
    title: "Useful guide",
    product_name: null,
    description: "An article description.",
    product_features: null,
    image_url: "/uploads/articles/12345678-1234-1234-1234-123456789abc.png",
    rating: null,
    buy_link: "https://example.com/guide",
    buy_links: JSON.stringify([
      { name: "Read more", url: "https://example.com/guide" },
      { name: "Source", url: "https://example.com/source" },
    ]),
    more_details: null,
  };
  const connection = {
    async beginTransaction() {},
    async commit() {},
    async rollback() {},
    release() {},
    async execute(query, parameters) {
      calls.push({ query, parameters });
      if (query.startsWith("INSERT")) return [{ insertId: article.id }];
      if (query.startsWith("SELECT")) return [[article]];
      return [{ affectedRows: 1 }];
    },
  };
  const response = createResponse();

  await createAdminContentController({ async getConnection() { return connection; } }).createArticle(
    {
      body: {
        content_type: "article",
        title: article.title,
        description: article.description,
        product_features: [],
        image_url: article.image_url,
        buy_links: [
          { name: "Read more", url: "https://example.com/guide" },
          { name: "Source", url: "https://example.com/source" },
        ],
      },
    },
    response,
    (error) => { throw error; },
  );

  assert.equal(response.statusCode, 201);
  assert.equal(response.body.article.content_id, "ART-00008");
  assert.deepEqual(response.body.article.buy_links, [
    { name: "Read more", url: "https://example.com/guide" },
    { name: "Source", url: "https://example.com/source" },
  ]);
  assert.equal(calls[0].parameters[9], JSON.stringify([
    { name: "Read more", url: "https://example.com/guide" },
    { name: "Source", url: "https://example.com/source" },
  ]));
});
