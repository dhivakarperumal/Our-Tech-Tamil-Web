const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { once } = require("node:events");
const { createAdminContentController } = require("../controllers/adminContentController");
const createPublicArticlesRouter = require("../routers/publicArticlesRouter");

test("public articles endpoint returns all article entries and their links", async (t) => {
  let query = "";
  const pool = {
    async execute(statement) {
      query = statement;
      return [Array.from({ length: 5 }, (_, index) => ({
        id: 12 + index,
        content_id: `ART-${String(12 + index).padStart(5, "0")}`,
        title: index === 0 ? "Choosing a wireless speaker" : `Article ${index + 1}`,
        description: "What to consider before buying a speaker.",
        image_url: "/uploads/articles/speaker.png",
        buy_link: null,
        buy_links: index === 0
          ? JSON.stringify([{ name: "Read Guide", url: "https://example.com/guide" }])
          : null,
        created_at: `2026-11-0${2 - index}-10:00:00.000Z`,
      }))];
    },
  };
  const app = express();
  app.use("/api/articles", createPublicArticlesRouter(createAdminContentController(pool)));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/articles`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.match(query, /content_type = 'article'/);
  assert.doesNotMatch(query, /\bLIMIT\b/i);
  assert.equal(result.articles.length, 5);
  assert.equal(result.articles[0].title, "Choosing a wireless speaker");
  assert.deepEqual(result.articles[0].buy_links, [
    { name: "Read Guide", url: "https://example.com/guide" },
  ]);
});
