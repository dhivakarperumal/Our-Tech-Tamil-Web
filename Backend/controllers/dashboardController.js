function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function firstProductImage(value) {
  const images = parseJsonArray(value);
  return typeof images[0] === "string" ? images[0] : "";
}

function createDashboardController(pool) {
  return async function getDashboard(request, response, next) {
    try {
      const [[productRows], [customerRows], [lowStockRows]] = await Promise.all([
        pool.execute(`
          SELECT
            COUNT(*) AS total,
            COALESCE(SUM(status = 'Active'), 0) AS active,
            COALESCE(SUM(total_stock < 10), 0) AS lowStock
          FROM products
        `),
        pool.execute(`
          SELECT COUNT(*) AS total
          FROM users
          WHERE role IN ('customer', 'user') AND status = 'active'
        `),
        pool.execute(`
          SELECT id, name, total_stock, images
          FROM products
          WHERE total_stock < 10
          ORDER BY total_stock ASC, name ASC
          LIMIT 8
        `),
      ]);

      const products = productRows[0] || {};
      const customers = customerRows[0] || {};
      const toCount = (value) => Number(value) || 0;
      const productCount = toCount(products.total);
      const activeProductCount = toCount(products.active);
      const lowStockCount = toCount(products.lowStock);
      const customerCount = toCount(customers.total);

      return response.json({
        stats: [
          { label: "Products", value: productCount.toLocaleString("en-IN"), icon: "bag", trend: "", trendUp: true },
          { label: "Active products", value: activeProductCount.toLocaleString("en-IN"), icon: "saree", trend: "", trendUp: true },
          { label: "Customers", value: customerCount.toLocaleString("en-IN"), icon: "users", trend: "", trendUp: true },
          { label: "Low stock items", value: lowStockCount.toLocaleString("en-IN"), icon: "lowstock", trend: "", trendUp: false },
        ],
        recentOrders: [],
        topProducts: [],
        lowStockAlerts: lowStockRows.map((product) => ({
          id: product.id,
          name: product.name,
          stock: toCount(product.total_stock),
          img: firstProductImage(product.images),
        })),
        revenueTrends: [],
        orderStatusCounts: {},
        dataAvailability: {
          orders: false,
          sales: false,
        },
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { createDashboardController };
