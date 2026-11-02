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
        name: "USB-C Fast Charger",
        product_code: "DEMO-GADGET-001",
        slug: "demo-usb-c-fast-charger",
        subcategory: "Chargers",
        description: "Compact fast charger for compatible USB-C phones and devices.",
        mrp: 1299,
        offer: 15,
        total_stock: 24,
        quantity: 24,
        color: "White",
        colorHex: "#FFFFFF",
        specifications: [{ key: "Connector", value: "USB-C" }, { key: "Output", value: "Fast charging" }],
      },
      {
        name: "Wireless Bluetooth Earbuds",
        product_code: "DEMO-GADGET-002",
        slug: "demo-wireless-bluetooth-earbuds",
        subcategory: "Audio",
        description: "Lightweight wireless earbuds for calls, music, and everyday listening.",
        mrp: 2499,
        offer: 20,
        total_stock: 18,
        quantity: 18,
        color: "Black",
        colorHex: "#171717",
        specifications: [{ key: "Connectivity", value: "Bluetooth" }, { key: "Use", value: "Calls and music" }],
      },
      {
        name: "Smart LED Bulb",
        product_code: "DEMO-GADGET-003",
        slug: "demo-smart-led-bulb",
        subcategory: "Lighting",
        description: "Energy-saving smart LED bulb for convenient home lighting.",
        mrp: 999,
        offer: 10,
        total_stock: 30,
        quantity: 30,
        color: "Warm White",
        colorHex: "#FFF1C1",
        specifications: [{ key: "Type", value: "LED bulb" }, { key: "Usage", value: "Home lighting" }],
      },
    ],
  },
  {
    catId: "DEMO-NATURAL",
    category: "Demo Natural Products",
    categoryType: "Natural Products",
    products: [
      {
        name: "Cold-Pressed Sesame Oil",
        product_code: "DEMO-NATURAL-001",
        slug: "demo-cold-pressed-sesame-oil",
        subcategory: "Oils",
        description: "Traditional cold-pressed sesame oil for everyday cooking.",
        mrp: 450,
        offer: 10,
        total_stock: 20,
        unit: "Bottle",
        naturalProductType: "Oil",
        ingredients: "100% sesame oil",
        netQuantity: 1,
        quantityUnit: "L",
        specifications: [{ key: "Ingredients", value: "100% sesame oil" }, { key: "Origin", value: "India" }],
      },
      {
        name: "Raw Forest Honey",
        product_code: "DEMO-NATURAL-002",
        slug: "demo-raw-forest-honey",
        subcategory: "Honey",
        description: "Naturally sourced raw forest honey, packed for freshness.",
        mrp: 550,
        offer: 5,
        total_stock: 16,
        unit: "Bottle",
        naturalProductType: "Honey",
        ingredients: "100% honey",
        netQuantity: 500,
        quantityUnit: "g",
        specifications: [{ key: "Ingredients", value: "100% honey" }, { key: "Storage", value: "Store in a cool, dry place" }],
      },
      {
        name: "Turmeric Powder",
        product_code: "DEMO-NATURAL-003",
        slug: "demo-turmeric-powder",
        subcategory: "Spices",
        description: "Aromatic ground turmeric for cooking and seasoning.",
        mrp: 180,
        offer: 10,
        total_stock: 40,
        unit: "Pack",
        naturalProductType: "Spice",
        ingredients: "100% turmeric",
        netQuantity: 200,
        quantityUnit: "g",
        specifications: [{ key: "Ingredients", value: "100% turmeric" }, { key: "Country of Origin", value: "India" }],
      },
    ],
  },
  {
    catId: "DEMO-CLOTHING",
    category: "Demo Clothing & Fashion",
    categoryType: "Clothing & Fashion",
    products: [
      {
        name: "Everyday Cotton Kurta",
        product_code: "DEMO-CLOTHING-001",
        slug: "demo-everyday-cotton-kurta",
        subcategory: "Kurtas",
        description: "Comfortable cotton kurta designed for everyday wear.",
        mrp: 1499,
        offer: 15,
        total_stock: 18,
        color: "Navy Blue",
        colorHex: "#172554",
        sizesStock: { S: 4, M: 5, L: 5, XL: 4 },
        sizes: ["S", "M", "L", "XL"],
        material: "Cotton",
        gender: "Unisex",
        specifications: [{ key: "Material", value: "Cotton" }, { key: "Fit", value: "Regular" }],
      },
      {
        name: "Classic Printed Saree",
        product_code: "DEMO-CLOTHING-002",
        slug: "demo-classic-printed-saree",
        subcategory: "Sarees",
        description: "A versatile printed saree for celebrations and daily occasions.",
        mrp: 2199,
        offer: 20,
        total_stock: 12,
        color: "Maroon",
        colorHex: "#7F1D1D",
        sizesStock: { "Free Size": 12 },
        sizes: ["Free Size"],
        material: "Polyester",
        gender: "Women",
        specifications: [{ key: "Material", value: "Polyester" }, { key: "Size", value: "Free Size" }],
      },
      {
        name: "Soft Cotton T-Shirt",
        product_code: "DEMO-CLOTHING-003",
        slug: "demo-soft-cotton-t-shirt",
        subcategory: "T-Shirts",
        description: "Soft cotton T-shirt with a comfortable regular fit.",
        mrp: 799,
        offer: 10,
        total_stock: 20,
        color: "Forest Green",
        colorHex: "#166534",
        sizesStock: { S: 5, M: 5, L: 5, XL: 5 },
        sizes: ["S", "M", "L", "XL"],
        material: "Cotton",
        gender: "Unisex",
        specifications: [{ key: "Material", value: "Cotton" }, { key: "Fit", value: "Regular" }],
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
    throw new Error(`Category ID ${category.catId} already belongs to a different category.`);
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
      JSON.stringify([...new Set(category.products.map(product => product.subcategory))]),
      JSON.stringify([]),
    ],
  );
}

function productValues(product, category) {
  const offerPrice = Number((product.mrp * (1 - product.offer / 100)).toFixed(2));
  const variants = product.sizesStock
    ? [{
        color: product.colorHex,
        colorName: product.color,
        images: [],
        selectedSizes: product.sizes,
        sizesStock: product.sizesStock,
      }]
    : product.quantity
      ? [{
          color: product.colorHex,
          colorName: product.color,
          images: [],
          quantity: product.quantity,
        }]
      : [];
  const stockStatus = product.total_stock < 10
    ? "Low Stock"
    : "In Stock";

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
  let skipped = 0;

  try {
    connection = await pool.getConnection();
    await connection.beginTransaction();
    transactionStarted = true;
    for (const category of demoCatalog) {
      await ensureCategory(connection, category);
      for (const product of category.products) {
        const [existingProducts] = await connection.execute(
          "SELECT id FROM products WHERE slug = ? LIMIT 1",
          [product.slug],
        );
        if (existingProducts.length) {
          skipped += 1;
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
    console.log(`Demo seed complete: ${inserted} products added, ${skipped} existing products skipped.`);
  } catch (error) {
    if (transactionStarted) await connection.rollback();
    throw error;
  } finally {
    connection?.release();
    await pool.end();
  }
}

if (require.main === module) {
  seedDemoProducts().catch(error => {
    console.error("Could not seed demo products:", error);
    process.exitCode = 1;
  });
}

module.exports = { demoCatalog, productValues, seedDemoProducts };
