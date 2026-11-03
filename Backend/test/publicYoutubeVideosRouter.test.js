const test = require("node:test");
const assert = require("node:assert/strict");
const express = require("express");
const { once } = require("node:events");
const { createAdminContentController } = require("../controllers/adminContentController");
const createPublicYoutubeVideosRouter = require("../routers/publicYoutubeVideosRouter");

test("public YouTube endpoint returns active videos with valid links and supporting details", async (t) => {
  let query = "";
  const pool = {
    async execute(statement) {
      query = statement;
      return [[{
        id: 8,
        title: "Using our products",
        video_url: "https://www.youtube.com/watch?v=abcdefghijk",
        video_id: "abcdefghijk",
        thumbnail_image: "/uploads/youtube/video.png",
        thumbnail_url: null,
        description: "A short product guide.",
        video_code: "YT-00008",
        documents: JSON.stringify([
          { name: "Guide.pdf", type: "application/pdf", url: "/uploads/youtube-videos/123e4567-e89b-12d3-a456-426614174000.pdf" },
          { name: "Unsafe file", type: "application/pdf", url: "javascript:alert(1)" },
        ]),
        follow_up_notes: "Remember to check the setup tips.",
        created_at: "2026-11-02T10:00:00.000Z",
        application_links: JSON.stringify([
          { title: "Get the app", url: "https://example.com/app" },
          { title: "Invalid link", url: "javascript:alert(1)" },
        ]),
      }]];
    },
  };
  const app = express();
  app.use("/api/youtube-videos", createPublicYoutubeVideosRouter(createAdminContentController(pool)));
  const server = app.listen(0, "127.0.0.1");
  await once(server, "listening");
  t.after(() => server.close());

  const response = await fetch(`http://127.0.0.1:${server.address().port}/api/youtube-videos`);
  const result = await response.json();

  assert.equal(response.status, 200);
  assert.match(query, /WHERE status = 'Active'/);
  assert.match(query, /ORDER BY created_at DESC, id DESC/);
  assert.equal(result.videos.length, 1);
  assert.equal(result.videos[0].video_id, "abcdefghijk");
  assert.deepEqual(result.videos[0].application_links, [
    { title: "Get the app", url: "https://example.com/app" },
  ]);
  assert.equal(result.videos[0].video_code, "YT-00008");
  assert.equal(result.videos[0].documents.length, 1);
  assert.equal(result.videos[0].documents[0].name, "Guide.pdf");
  assert.equal(result.videos[0].follow_up_notes, "Remember to check the setup tips.");
  assert.equal(result.videos[0].created_at, "2026-11-02T10:00:00.000Z");
});
