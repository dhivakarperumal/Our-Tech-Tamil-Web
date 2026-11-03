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

function getRevenuePeriod(range) {
  if (range === "month") {
    return {
      labelFormat: "%d %b",
      condition: "AND created_at >= DATE_FORMAT(CURDATE(), '%Y-%m-01')",
    };
  }
  if (range === "all") {
    return { labelFormat: "%b %Y", condition: "" };
  }
  return {
    labelFormat: "%a",
    condition: "AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)",
  };
}

function normalizeOrderStatus(status) {
  const normalized = {
    New: "Order Placed",
    Processing: "Confirmed",
    Packing: "Packed",
    Shipping: "Shipped",
    "Out for Delivery": "Shipped",
  }[status] || status;
  return ["Order Placed", "Confirmed", "Packed", "Shipped", "Delivered", "Cancelled"].includes(normalized)
    ? normalized
    : null;
}

function createDashboardController(pool) {
  return async function getDashboard(request, response, next) {
    try {
      const requestedRange = request.query?.range;
      const range = ["week", "month", "all"].includes(requestedRange) ? requestedRange : "week";
      const revenuePeriod = getRevenuePeriod(range);
      const [
        [productRows],
        [customerRows],
        [lowStockRows],
        [serviceRows],
        [youtubeRows],
        [orderSummaryRows],
        [recentOrderRows],
        [orderStatusRows],
        [revenueRows],
        [revenueSummaryRows],
        [topProductRows],
      ] = await Promise.all([
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
        pool.execute("SELECT COUNT(*) AS total FROM admin_services"),
        pool.execute("SELECT COUNT(*) AS total FROM admin_youtube_videos"),
        pool.execute(`
          SELECT
            COUNT(*) AS total,
            COALESCE(SUM(DATE(created_at) = CURDATE()), 0) AS today,
            COALESCE(SUM(status = 'Cancelled'), 0) AS cancelled,
            COALESCE(SUM(status = 'Delivered'), 0) AS delivery
          FROM orders
        `),
        pool.execute(`
          SELECT
            o.id,
            COALESCE(o.order_id, CONCAT('ORD', LPAD(o.id, 5, '0'))) AS order_number,
            COALESCE(a.recipient_name, 'Guest') AS customer,
            o.created_at AS date,
            o.total_amount AS amount,
            o.status
          FROM orders o
          LEFT JOIN addresses a ON a.id = o.address_id
          ORDER BY o.created_at DESC, o.id DESC
          LIMIT 8
        `),
        pool.execute("SELECT status, COUNT(*) AS count FROM orders GROUP BY status"),
        pool.execute(`
          SELECT DATE_FORMAT(created_at, ?) AS period, COALESCE(SUM(total_amount), 0) AS revenue
          FROM orders
          WHERE status = 'Delivered' ${revenuePeriod.condition}
          GROUP BY period
          ORDER BY MIN(created_at)
        `, [revenuePeriod.labelFormat]),
        pool.execute(`
          SELECT
            COALESCE(SUM(CASE WHEN status = 'Delivered' THEN total_amount ELSE 0 END), 0) AS total,
            COALESCE(SUM(CASE WHEN status = 'Delivered' AND DATE(created_at) = CURDATE() THEN total_amount ELSE 0 END), 0) AS today
          FROM orders
        `),
        pool.execute(`
          SELECT oi.product_id AS id, oi.product_name AS name,
                 SUM(oi.quantity) AS sales, MAX(oi.image) AS img
          FROM order_items oi
          INNER JOIN orders o ON o.id = oi.order_id
          WHERE oi.product_id IS NOT NULL AND o.status <> 'Cancelled'
          GROUP BY oi.product_id, oi.product_name
          ORDER BY sales DESC, oi.product_name ASC
          LIMIT 4
        `),
      ]);

      const products = productRows[0] || {};
      const customers = customerRows[0] || {};
      const services = serviceRows[0] || {};
      const youtubeVideos = youtubeRows[0] || {};
      const toCount = (value) => Number(value) || 0;
      const productCount = toCount(products.total);
      const activeProductCount = toCount(products.active);
      const lowStockCount = toCount(products.lowStock);
      const customerCount = toCount(customers.total);
      const orderSummary = orderSummaryRows[0] || {};
      const revenueSummary = revenueSummaryRows[0] || {};
      const orderStatusCounts = {
        "Order Placed": 0,
        Confirmed: 0,
        Packed: 0,
        Shipped: 0,
        Delivered: 0,
        Cancelled: 0,
      };
      for (const row of orderStatusRows) {
        const status = normalizeOrderStatus(row.status);
        if (status) orderStatusCounts[status] += toCount(row.count);
      }

      return response.json({
        stats: [
          { label: "Products", value: productCount.toLocaleString("en-IN"), icon: "bag", trend: "", trendUp: true },
          { label: "Active products", value: activeProductCount.toLocaleString("en-IN"), icon: "saree", trend: "", trendUp: true },
          { label: "Customers", value: customerCount.toLocaleString("en-IN"), icon: "users", trend: "", trendUp: true },
          { label: "Low stock items", value: lowStockCount.toLocaleString("en-IN"), icon: "lowstock", trend: "", trendUp: false },
        ],
        recentOrders: recentOrderRows.map((order) => ({
          id: order.order_number,
          customer: order.customer,
          date: order.date,
          amount: `₹${toCount(order.amount).toLocaleString("en-IN")}`,
          status: normalizeOrderStatus(order.status) || order.status,
        })),
        topProducts: topProductRows.map((product) => ({
          ...product,
          sales: toCount(product.sales),
          img: product.img || "",
        })),
        lowStockAlerts: lowStockRows.map((product) => ({
          id: product.id,
          name: product.name,
          stock: toCount(product.total_stock),
          img: firstProductImage(product.images),
        })),
        revenueTrends: revenueRows.map((row) => ({
          month: row.period,
          revenue: Number(row.revenue) || 0,
        })),
        orderStatusCounts,
        orderSummary: {
          total: toCount(orderSummary.total),
          today: toCount(orderSummary.today),
          cancelled: toCount(orderSummary.cancelled),
          delivery: toCount(orderSummary.delivery),
        },
        revenueSummary: {
          total: Number(revenueSummary.total) || 0,
          today: Number(revenueSummary.today) || 0,
        },
        contentSummary: {
          services: toCount(services.total),
          youtubeVideos: toCount(youtubeVideos.total),
        },
        dataAvailability: {
          orders: true,
          sales: true,
        },
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = { createDashboardController };
