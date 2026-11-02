const path = require("node:path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const { createPool } = require("../modules/db");

const demoCatalog = [
  {
    catId: "DEMO-GADGETS",
    category: "Demo Gadgets & Electronics",
    categoryType: "Gadgets & Electronics",
    products: [
      {
        name: "Nova X5 5G Smartphone",
        product_code: "DEMO-GADGET-001",
        slug: "demo-nova-x5-5g-smartphone",
        subcategory: "Smartphones",
        description: "A stylish 5G smartphone with a vibrant display, reliable performance, and a long-lasting battery.",
        mrp: 24999,
        offer: 10,
        total_stock: 25,
        quantity: 25,
        color: "Jet Black",
        colorHex: "#000000",
        specifications: [
          { key: "Display", value: "6.6-inch FHD+" },
          { key: "Storage", value: "128 GB" },
          { key: "RAM", value: "8 GB" },
        ],
      },
      {
        name: "AeroBook 15 Laptop",
        product_code: "DEMO-GADGET-002",
        slug: "demo-aerobook-15-laptop",
        subcategory: "Laptops & Computers",
        description: "A lightweight everyday laptop designed for office tasks, online learning, browsing, and productivity.",
        mrp: 58999,
        offer: 8,
        total_stock: 12,
        quantity: 12,
        color: "Silver",
        colorHex: "#C0C0C0",
        specifications: [
          { key: "Processor", value: "Intel Core i5" },
          { key: "RAM", value: "16 GB" },
          { key: "Storage", value: "512 GB SSD" },
        ],
      },
      {
        name: "SonicBeat Wireless Headphones",
        product_code: "DEMO-GADGET-003",
        slug: "demo-sonicbeat-wireless-headphones",
        subcategory: "Headphones & Speakers",
        description: "Comfortable wireless headphones with clear audio, cushioned ear cups, and Bluetooth connectivity.",
        mrp: 3999,
        offer: 15,
        total_stock: 40,
        quantity: 40,
        color: "Jet Black",
        colorHex: "#000000",
        specifications: [
          { key: "Driver Size", value: "40 mm" },
          { key: "Connectivity", value: "Bluetooth 5.3" },
          { key: "Battery", value: "Up to 30 Hours Playback" },
        ],
      },
    ],
  },
  {
    catId: "DEMO-NATURAL",
    category: "Demo Natural Products",
    categoryType: "Natural Products",
    products: [
      {
        name: "Premium California Almonds",
        product_code: "DEMO-NATURAL-001",
        slug: "demo-premium-california-almonds",
        subcategory: "Dry Fruits & Nuts",
        description: "Carefully selected whole almonds with a naturally rich, nutty taste for snacking and cooking.",
        mrp: 499,
        offer: 10,
        total_stock: 60,
        unit: "Pack",
        naturalProductType: "Dry Fruit",
        ingredients: "100% Almonds",
        netQuantity: 500,
        quantityUnit: "g",
        specifications: [
          { key: "Net Weight", value: "500 g" },
          { key: "Form", value: "Whole almonds" },
          { key: "Origin", value: "United States" },
        ],
      },
      {
        name: "Wild Forest Honey",
        product_code: "DEMO-NATURAL-002",
        slug: "demo-wild-forest-honey",
        subcategory: "Organic Honey",
        description: "Naturally rich forest honey with a distinctive floral taste for drinks and everyday recipes.",
        mrp: 349,
        offer: 5,
        total_stock: 35,
        unit: "Bottle",
        naturalProductType: "Honey",
        ingredients: "100% Honey",
        netQuantity: 500,
        quantityUnit: "g",
        specifications: [
          { key: "Net Quantity", value: "500 g" },
          { key: "Texture", value: "Thick and smooth" },
          { key: "Origin", value: "India" },
        ],
      },
      {
        name: "Cold Pressed Coconut Oil",
        product_code: "DEMO-NATURAL-003",
        slug: "demo-cold-pressed-coconut-oil",
        subcategory: "Natural Oils",
        description: "Coconut oil extracted using a traditional cold-press process for cooking and household use.",
        mrp: 599,
        offer: 12,
        total_stock: 28,
        unit: "Bottle",
        naturalProductType: "Edible Oil",
        ingredients: "100% Coconut Oil",
        netQuantity: 1,
        quantityUnit: "L",
        specifications: [
          { key: "Net Quantity", value: "1 L" },
          { key: "Extraction", value: "Cold Pressed" },
          { key: "Origin", value: "India" },
        ],
      },
    ],
  },
  {
    catId: "DEMO-CLOTHING",
    category: "Demo Clothing & Fashion",
    categoryType: "Clothing & Fashion",
    products: [
      {
        name: "Classic Men's Cotton Shirt",
        product_code: "DEMO-CLOTHING-001",
        slug: "demo-classic-mens-cotton-shirt",
        subcategory: "Men's Clothing",
        description: "A versatile cotton shirt with a comfortable regular fit for office wear and casual occasions.",
        mrp: 1499,
        offer: 20,
        total_stock: 18,
        color: "Navy Blue",
        colorHex: "#000080",
        sizesStock: { S: 3, M: 5, L: 6, XL: 4 },
        sizes: ["S", "M", "L", "XL"],
        material: "Cotton",
        gender: "Men",
        specifications: [
          { key: "Fabric", value: "100% Cotton" },
          { key: "Fit", value: "Regular Fit" },
          { key: "Sleeve", value: "Full Sleeve" },
        ],
      },
      {
        name: "Women's Printed Kurti",
        product_code: "DEMO-CLOTHING-002",
        slug: "demo-womens-printed-kurti",
        subcategory: "Women's Clothing",
        description: "A lightweight printed kurti with a flattering everyday silhouette and comfortable feel.",
        mrp: 1199,
        offer: 15,
        total_stock: 20,
        color: "Rose Pink",
        colorHex: "#FFC0CB",
        sizesStock: { S: 4, M: 6, L: 6, XL: 4 },
        sizes: ["S", "M", "L", "XL"],
        material: "Rayon",
        gender: "Women",
        specifications: [
          { key: "Fabric", value: "Rayon" },
          { key: "Pattern", value: "Printed" },
          { key: "Sleeve", value: "Three Quarter Sleeve" },
        ],
      },
      {
        name: "Kids Casual Wear Set",
        product_code: "DEMO-CLOTHING-003",
        slug: "demo-kids-casual-wear-set",
        subcategory: "Kids Clothing",
        description: "A soft and comfortable casual outfit set for kids, suitable for playtime and everyday wear.",
        mrp: 999,
        offer: 10,
        total_stock: 15,
        color: "Golden Yellow",
        colorHex: "#FFD700",
        sizesStock: { S: 2, M: 3, L: 2, XL: 2, "Free Size": 6 },
        sizes: ["S", "M", "L", "XL", "Free Size"],
        material: "Cotton Blend",
        gender: "Kids",
        specifications: [
          { key: "Fabric", value: "Cotton Blend" },
          { key: "Set Includes", value: "Top and Bottom" },
          { key: "Care", value: "Machine Wash" },
        ],
      },
    ],
  },
];

async function ensureCategory(connection, category) {
  const [existingCategories] = await connection.execute(
    "SELECT cat_id FROM categories WHERE name = ? AND category_type = ? LIMIT 1",
    [category.category, category.categoryType],
  );

  if (existingCategories.length) return;

  const [idMatches] = await connection.execute(
    "SELECT cat_id FROM categories WHERE cat_id = ? LIMIT 1",
    [category.catId],
  );

  if (idMatches.length) {
    throw new Error(
      `Category ID ${category.catId} already belongs to a different category.`,
    );
  }

  await connection.execute(
    `INSERT INTO categories
      (cat_id, name, category_type, description, subcategory, images, user_id)
     VALUES (?, ?, ?, ?, ?, ?, NULL)`,
    [
      category.catId,
      category.category,
      category.categoryType,
      "Demo category created by the demo product seed.",
      JSON.stringify([
        ...new Set(category.products.map((product) => product.subcategory)),
      ]),
      JSON.stringify([]),
    ],
  );
}

function productValues(product, category) {
  const offerPrice = Number(
    (product.mrp * (1 - product.offer / 100)).toFixed(2),
  );

  const variants = product.sizesStock
    ? [
        {
          color: product.colorHex,
          colorName: product.color,
          images: [],
          selectedSizes: product.sizes,
          sizesStock: product.sizesStock,
        },
      ]
    : product.quantity
      ? [
          {
            color: product.colorHex,
            colorName: product.color,
            images: [],
            quantity: product.quantity,
          },
        ]
      : [];

  const stockStatus = product.total_stock < 10 ? "Low Stock" : "In Stock";

  return [
    product.name,
    product.product_code,
    product.slug,
    category.categoryType,
    category.category,
    product.subcategory,
    product.description,
    product.mrp,
    product.offer,
    offerPrice,
    product.total_stock,
    product.unit || "Piece",
    stockStatus,
    JSON.stringify([]),
    JSON.stringify(product.specifications),
    product.naturalProductType || null,
    product.ingredients || null,
    product.netQuantity ?? null,
    product.quantityUnit || "g",
    product.material || null,
    product.gender || null,
    JSON.stringify(product.sizes || []),
    JSON.stringify(variants),
    5,
    "Active",
  ];
}

async function seedDemoProducts() {
  const pool = createPool();

  let connection;
  let transactionStarted = false;
  let inserted = 0;
  let updated = 0;

  try {
    connection = await pool.getConnection();

    await connection.beginTransaction();
    transactionStarted = true;

    for (const category of demoCatalog) {
      await ensureCategory(connection, category);

      for (const product of category.products) {
        const [existingProducts] = await connection.execute(
          "SELECT id FROM products WHERE product_code = ? LIMIT 1",
          [product.product_code],
        );

        if (existingProducts.length) {
          await connection.execute(
            `UPDATE products
             SET name = ?, product_code = ?, slug = ?, cat_type = ?, category = ?, subcategory = ?,
                 description = ?, mrp = ?, offer = ?, offer_price = ?, total_stock = ?, unit = ?,
                 stock_status = ?, images = ?, specifications = ?, natural_product_type = ?,
                 ingredients = ?, net_quantity = ?, quantity_unit = ?, material = ?, gender = ?,
                 available_sizes = ?, variants = ?, rating = ?, status = ?
             WHERE id = ?`,
            [...productValues(product, category), existingProducts[0].id],
          );
          updated += 1;
          continue;
        }

        await connection.execute(
          `INSERT INTO products
            (name, product_code, slug, cat_type, category, subcategory, description,
             mrp, offer, offer_price, total_stock, unit, stock_status, images, specifications,
             natural_product_type, ingredients, net_quantity, quantity_unit, material, gender,
             available_sizes, variants, rating, status)
           VALUES (${Array(25).fill("?").join(", ")})`,
          productValues(product, category),
        );

        inserted += 1;
      }
    }

    await connection.commit();
    console.log(
      `Demo seed complete: ${inserted} products added, ${updated} existing products updated.`,
    );
  } catch (error) {
    if (transactionStarted) {
      await connection.rollback();
    }

    throw error;
  } finally {
    connection?.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDemoProducts().catch((error) => {
    console.error("Could not seed demo products:", error);
    process.exitCode = 1;
  });
}

module.exports = {
  demoCatalog,
  productValues,
  seedDemoProducts,
};