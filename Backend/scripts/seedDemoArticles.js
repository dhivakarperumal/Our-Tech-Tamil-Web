const fs = require("node:fs");
const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { createPool, initializeDatabase } = require("../modules/db");

const demoArticles = [
  {
    contentId: "ART-TEST-001",
    title: "Simple Ways to Use Coconut Oil in Your Daily Routine",
    description:
      "Coconut oil is a versatile household staple. Learn how to choose a quality bottle, store it correctly, and use it thoughtfully in everyday cooking and personal care.",
    sourceImage: "00753a7c-f46e-499d-8cf3-26d5fcfc5282.jpg",
    imageName: "4f4ce14f-8a2f-4f48-91ba-6d3ac01d41c2.jpg",
  },
  {
    contentId: "ART-TEST-002",
    title: "A Practical Guide to Choosing Everyday Almonds",
    description:
      "From checking freshness to storing an opened pack, these simple tips can help you choose and enjoy almonds as part of a balanced everyday snack routine.",
    sourceImage: "197dcb34-1af2-4059-b8d8-033a2c4963b6.jpg",
    imageName: "3eb8137b-e9b3-4f8d-a5a2-f350985fbc58.jpg",
  },
  {
    contentId: "ART-TEST-003",
    title: "How to Build a Comfortable Everyday Wardrobe",
    description:
      "A comfortable wardrobe starts with versatile pieces, breathable fabrics, and fits that work for your routine. Use this guide to make thoughtful clothing choices.",
    sourceImage: "0138e916-5ec6-4b4f-a866-10dff5c2b116.jpg",
    imageName: "719d9b39-9b48-4c48-b027-1fb6fa3ac25e.jpg",
  },
  {
    contentId: "ART-TEST-004",
    title: "A Quick Guide to Picking a Shirt That Fits Well",
    description:
      "A well-fitting shirt should feel comfortable across the shoulders and allow easy movement. Explore practical tips for choosing fabric, fit, and care for daily wear.",
    sourceImage: "2281ce5a-a49a-44ab-a61b-3970e84b8c7c.jpg",
    imageName: "bd89c15a-b788-4a81-a179-c787c45c4ce8.jpg",
  },
];

async function seedDemoArticles() {
  const uploadsDirectory = path.join(__dirname, "..", "uploads");
  const productImagesDirectory = path.join(uploadsDirectory, "products");
  const articleImagesDirectory = path.join(uploadsDirectory, "articles");
  fs.mkdirSync(articleImagesDirectory, { recursive: true });

  for (const article of demoArticles) {
    const sourcePath = path.join(productImagesDirectory, article.sourceImage);
    if (!fs.existsSync(sourcePath)) {
      throw new Error(`Demo article image is missing: ${sourcePath}`);
    }
    fs.copyFileSync(sourcePath, path.join(articleImagesDirectory, article.imageName));
    article.imageUrl = `/uploads/articles/${article.imageName}`;
  }

  const pool = createPool();
  let connection;
  let transactionStarted = false;
  let added = 0;
  let updated = 0;

  try {
    await initializeDatabase(pool);
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;

    for (const article of demoArticles) {
      const [existing] = await connection.execute(
        "SELECT id FROM admin_articles WHERE content_id = ? LIMIT 1",
        [article.contentId],
      );

      if (existing.length) {
        await connection.execute(
          `UPDATE admin_articles
           SET content_type = 'article', title = ?, product_name = NULL, description = ?,
               product_features = NULL, image_url = ?, rating = NULL, buy_link = NULL,
               buy_links = NULL, more_details = NULL
           WHERE id = ?`,
          [article.title, article.description, article.imageUrl, existing[0].id],
        );
        updated += 1;
        continue;
      }

      await connection.execute(
        `INSERT INTO admin_articles
          (content_id, content_type, title, product_name, description, product_features,
           image_url, rating, buy_link, buy_links, more_details)
         VALUES (?, 'article', ?, NULL, ?, NULL, ?, NULL, NULL, NULL, NULL)`,
        [article.contentId, article.title, article.description, article.imageUrl],
      );
      added += 1;
    }

    await connection.commit();
    console.log(`Demo article seed complete: ${added} articles added, ${updated} existing articles updated.`);
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection?.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDemoArticles().catch((error) => {
    console.error("Could not seed demo articles:", error);
    process.exitCode = 1;
  });
}

module.exports = { demoArticles, seedDemoArticles };
