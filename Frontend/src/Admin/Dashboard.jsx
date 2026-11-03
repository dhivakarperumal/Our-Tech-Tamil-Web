import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../PrivateRouter/AuthContext";
import { useAdmin } from "../PrivateRouter/AdminContext";
import api from "../api";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {
    FiShoppingBag,
    FiUsers,
    FiBox,
    FiClock,
    FiCheckCircle,
    FiAlertTriangle,
    FiTrendingUp,
    FiTrendingDown,
    FiTag,
} from "react-icons/fi";
import { FaRupeeSign, FaTshirt, FaTruck } from "react-icons/fa";
import { Bar, Doughnut } from 'react-chartjs-2';
import { ArrowRight, CalendarDays, RefreshCw, Sparkles, Video } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
    BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
} from 'chart.js';

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const getDashboardImageUrl = (image) => {
    if (typeof image !== "string" || !image.trim()) return "/images/logo.jpeg";
    if (/^(https?:|data:|blob:)/i.test(image)) return image;
    const imagePath = image.startsWith("/") ? image : `/${image}`;
    return imagePath.startsWith("/uploads/") ? `${backendUrl}${imagePath}` : imagePath;
};

const formatOrderDate = (value) => {
    if (!value) return "Date unavailable";

    let date = new Date(value);
    if (Number.isNaN(date.getTime()) && typeof value === "string") {
        date = new Date(value.replace(" ", "T"));
    }

    return Number.isNaN(date.getTime())
        ? "Date unavailable"
        : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const sampleDashboardData = {
    stats: [
        { label: "Products", value: "1,248", icon: "bag", trend: "+12.4%", trendUp: true, sparkline: [12, 18, 15, 25, 22, 32, 38] },
        { label: "Active products", value: "1,186", icon: "saree", trend: "+8.2%", trendUp: true, sparkline: [18, 16, 22, 21, 28, 30, 36] },
        { label: "Customers", value: "3,642", icon: "users", trend: "+16.8%", trendUp: true, sparkline: [10, 14, 12, 24, 21, 30, 39] },
        { label: "Low stock items", value: "12", icon: "lowstock", trend: "3.2%", trendUp: false, sparkline: [34, 29, 31, 24, 21, 18, 14] },
    ],
    recentOrders: [
        { id: "#ORD-01042", customer: "Kavitha R.", date: "2026-11-02", amount: "₹4,250", status: "Order Placed" },
        { id: "#ORD-01041", customer: "Arun Kumar", date: "2026-11-02", amount: "₹1,890", status: "Confirmed" },
        { id: "#ORD-01040", customer: "Meena S.", date: "2026-11-01", amount: "₹6,400", status: "Packed" },
        { id: "#ORD-01039", customer: "Pradeep N.", date: "2026-10-31", amount: "₹2,150", status: "Shipped" },
        { id: "#ORD-01038", customer: "Divya M.", date: "2026-10-30", amount: "₹3,780", status: "Delivered" },
    ],
    topProducts: [
        { id: "demo-1", name: "Kanchipuram silk saree", cat: "Sarees", sales: 186, img: "/images/logo.jpeg" },
        { id: "demo-2", name: "Cotton daily-wear saree", cat: "Sarees", sales: 142, img: "/images/logo.jpeg" },
        { id: "demo-3", name: "Designer festive saree", cat: "Sarees", sales: 98, img: "/images/logo.jpeg" },
        { id: "demo-4", name: "Printed cotton kurti", cat: "Women", sales: 76, img: "/images/logo.jpeg" },
    ],
    lowStockAlerts: [
        { id: "demo-5", name: "Soft silk saree - Maroon", stock: 2, img: "/images/logo.jpeg" },
        { id: "demo-6", name: "Cotton kurti - Blue", stock: 4, img: "/images/logo.jpeg" },
        { id: "demo-7", name: "Designer dupatta - Gold", stock: 1, img: "/images/logo.jpeg" },
        { id: "demo-8", name: "Linen saree - Green", stock: 3, img: "/images/logo.jpeg" },
    ],
    revenueTrends: [
        { month: "Mon", revenue: 18000 },
        { month: "Tue", revenue: 24500 },
        { month: "Wed", revenue: 21000 },
        { month: "Thu", revenue: 32000 },
        { month: "Fri", revenue: 27800 },
        { month: "Sat", revenue: 39500 },
        { month: "Sun", revenue: 34600 },
    ],
    orderStatusCounts: {
        "Order Placed": 18,
        Confirmed: 24,
        Packed: 12,
        Shipped: 31,
        Delivered: 86,
        Cancelled: 7,
    },
    orderSummary: {
        total: 178,
        today: 2,
        cancelled: 7,
        delivery: 31,
    },
    revenueSummary: {
        total: 485000,
        today: 12500,
    },
    contentSummary: {
        services: 0,
        youtubeVideos: 0,
    },
    dataAvailability: { orders: true, sales: true },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
    BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler
);

const Dashboard = () => {
    const navigate = useNavigate();
    const { user } = useContext(AuthContext);
    const { dashboardData, setDashboardCached } = useAdmin();
    const previewFromUrl = import.meta.env.DEV
        && new URLSearchParams(window.location.search).get("dashboardPreview") === "demo";
    const [showDemoData, setShowDemoData] = useState(previewFromUrl);
    const [loading, setLoading] = useState(!dashboardData && !previewFromUrl);
    const [refreshing, setRefreshing] = useState(false);
    const [loadError, setLoadError] = useState("");
    const [salesRange, setSalesRange] = useState("week");
    const [updatedAt, setUpdatedAt] = useState(null);

    useEffect(() => {
        fetchDashboardData("week");
    }, []);

    const fetchDashboardData = async (range = salesRange) => {
        if (dashboardData) setRefreshing(true);
        else setLoading(true);
        setLoadError("");
        try {
            const response = await api.get('/dashboard', { params: { range } });
            setDashboardCached(response.data);
            setUpdatedAt(new Date());
        } catch (error) {
            console.error("Fetch Dashboard Error:", error);
            setLoadError("We couldn't load the latest dashboard data. Check your connection and try again.");
            toast.error("Failed to load dashboard data");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case "Delivered": return "bg-green-100 text-green-700";
            case "Confirmed": return "bg-blue-100 text-blue-700";
            case "Shipped": return "bg-orange-100 text-orange-700";
            case "Packed": return "bg-purple-100 text-purple-700";
            case "Order Placed":
            case "Pending": return "bg-yellow-100 text-yellow-700";
            case "Cancelled": return "bg-red-100 text-red-700";
            default: return "bg-gray-100 text-gray-700";
        }
    };

    const getStatIcon = (iconStr) => {
        switch (iconStr) {
            case "saree": return <FaTshirt size={22} />;
            case "bag": return <FiShoppingBag size={22} />;
            case "rupee": return <FaRupeeSign size={22} />;
            case "pending": return <FiClock size={22} />;
            case "truck": return <FaTruck size={22} />;
            case "users": return <FiUsers size={22} />;
            case "lowstock": return <FiBox size={22} />;
            case "offer": return <FiTag size={22} />;
            default: return <FiBox size={22} />;
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24">
                <div className="h-11 w-11 animate-spin rounded-full border-4 border-violet-100 border-t-violet-700" />
                <p className="text-sm font-semibold text-slate-500">Loading your dashboard...</p>
            </div>
        )
    }

    const visibleDashboardData = import.meta.env.DEV && showDemoData
        ? sampleDashboardData
        : dashboardData;

    if (!visibleDashboardData) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-5">
                <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
                        <FiAlertTriangle size={24} />
                    </div>
                    <h2 className="mt-4 text-lg font-bold text-slate-900">Dashboard unavailable</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-500">
                        {loadError || "Dashboard data is not available right now."}
                    </p>
                    <button
                        type="button"
                        onClick={() => fetchDashboardData(salesRange)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#4B00C8] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3D01B1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2"
                    >
                        <RefreshCw size={15} />
                        Try again
                    </button>
                </div>
            </div>
        )
    }

    const {
        stats = [],
        recentOrders = [],
        topProducts = [],
        lowStockAlerts = [],
        revenueTrends = [],
        orderStatusCounts = {},
        dataAvailability = {},
    } = visibleDashboardData;
    const dashboardStats = Array.isArray(stats) ? stats : [];
    const dashboardOrders = Array.isArray(recentOrders) ? recentOrders : [];
    const dashboardProducts = Array.isArray(topProducts) ? topProducts : [];
    const dashboardLowStock = Array.isArray(lowStockAlerts) ? lowStockAlerts : [];
    const dashboardRevenue = Array.isArray(revenueTrends) ? revenueTrends : [];
    const dashboardOrderCounts = orderStatusCounts && typeof orderStatusCounts === "object" ? orderStatusCounts : {};
    const ordersAvailable = dataAvailability.orders !== false;
    const salesAvailable = dataAvailability.sales !== false;
    const orderSummary = visibleDashboardData.orderSummary || { total: 0, today: 0, cancelled: 0, delivery: 0 };
    const revenueSummary = visibleDashboardData.revenueSummary || { total: 0, today: 0 };
    const contentSummary = visibleDashboardData.contentSummary || sampleDashboardData.contentSummary;

    // ── Bar Chart: Real Revenue Trends ──────────────────────────────
    const barChartData = {
        labels: dashboardRevenue.length > 0
            ? dashboardRevenue.map(t => t.month)
            : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [{
            label: 'Revenue',
            data: dashboardRevenue.length > 0
                ? dashboardRevenue.map(t => t.revenue)
                : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
            backgroundColor: (context) => {
                const { chart } = context;
                const { ctx, chartArea } = chart;
                if (!chartArea) return "#7C3AED";

                const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                gradient.addColorStop(0, "#A78BFA");
                gradient.addColorStop(1, "#4B00C8");
                return gradient;
            },
            borderColor: '#6D28D9',
            borderWidth: 0,
            borderRadius: 8,
            borderSkipped: false,
            categoryPercentage: 0.7,
            barPercentage: 0.8,
        }]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#210839',
                titleColor: '#fff',
                bodyColor: '#fff',
                borderColor: '#4B00C8',
                borderWidth: 1,
                padding: 12,
                cornerRadius: 10,
                callbacks: {
                    label: (context) => `Revenue: ₹${context.parsed.y.toLocaleString('en-IN')}`
                }
            }
        },
        scales: {
            y: {
                beginAtZero: true,
                ticks: {
                    callback: (value) => `₹${new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 1 }).format(Number(value))}`,
                    color: '#9ca3af',
                    font: { size: 10 }
                },
                grid: { color: '#f1edf7', drawBorder: false }
            },
            x: {
                ticks: { color: '#9ca3af', font: { size: 10 } },
                grid: { display: false, drawBorder: false }
            }
        }
    };

    const salesRangeOptions = [
        { value: "week", label: "This Week" },
        { value: "month", label: "This Month" },
        { value: "all", label: "All Time" },
    ];

    // ── Doughnut Chart: Real Order Status Counts ─────────────────────
    const statusLabels  = ['Order Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
    const statusColors  = ['#fbbf24', '#3b82f6', '#a855f7', '#f97316', '#10b981', '#ef4444'];
    const statusBgCols  = ['bg-yellow-400', 'bg-blue-500', 'bg-purple-500', 'bg-orange-500', 'bg-emerald-500', 'bg-red-500'];

    const statusCounts  = statusLabels.map(s => Number(dashboardOrderCounts[s]) || 0);
    const totalOrders   = statusCounts.reduce((a, b) => a + b, 0);

    const doughnutData = {
        labels: statusLabels,
        datasets: [{
            data: statusCounts,
            backgroundColor: statusColors,
            borderColor: "#ffffff",
            borderWidth: 3,
            cutout: '70%',
        }]
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: "#210839",
                padding: 10,
                cornerRadius: 9,
                titleFont: { weight: "bold" },
            },
        },
    };

    const orderStats = statusLabels.map((label, i) => ({
        label,
        count: statusCounts[i],
        pct: totalOrders > 0 ? `${((statusCounts[i] / totalOrders) * 100).toFixed(1)}%` : '0%',
        color: statusBgCols[i]
    }));

    const cardStyles = [
        { surface: "bg-violet-50/90", icon_bg: "bg-gradient-to-br from-violet-100 to-fuchsia-100", icon_color: "text-violet-700", accent: "bg-gradient-to-b from-fuchsia-500 to-violet-700", stroke: "#7c3aed", glow: "from-violet-200/70" },
        { surface: "bg-amber-50/90", icon_bg: "bg-gradient-to-br from-amber-100 to-orange-100", icon_color: "text-amber-700", accent: "bg-gradient-to-b from-yellow-400 to-orange-500", stroke: "#d97706", glow: "from-amber-200/70" },
        { surface: "bg-emerald-50/90", icon_bg: "bg-gradient-to-br from-emerald-100 to-teal-100", icon_color: "text-emerald-700", accent: "bg-gradient-to-b from-emerald-400 to-teal-600", stroke: "#059669", glow: "from-emerald-200/70" },
        { surface: "bg-rose-50/90", icon_bg: "bg-gradient-to-br from-rose-100 to-pink-100", icon_color: "text-rose-700", accent: "bg-gradient-to-b from-rose-400 to-pink-600", stroke: "#e11d48", glow: "from-rose-200/70" },
    ];
    const orderCardStyles = [
        { surface: "bg-blue-50/90", icon_bg: "bg-gradient-to-br from-blue-100 to-indigo-100", icon_color: "text-blue-700", accent: "bg-gradient-to-b from-blue-400 to-indigo-600", glow: "from-blue-200/70" },
        { surface: "bg-lime-50/90", icon_bg: "bg-gradient-to-br from-lime-100 to-yellow-100", icon_color: "text-lime-800", accent: "bg-gradient-to-b from-lime-400 to-yellow-500", glow: "from-lime-200/70" },
        { surface: "bg-slate-50/90", icon_bg: "bg-gradient-to-br from-slate-100 to-gray-200", icon_color: "text-slate-700", accent: "bg-gradient-to-b from-slate-400 to-gray-600", glow: "from-slate-200/70" },
        { surface: "bg-teal-50/90", icon_bg: "bg-gradient-to-br from-teal-100 to-cyan-100", icon_color: "text-teal-700", accent: "bg-gradient-to-b from-teal-400 to-cyan-600", glow: "from-teal-200/70" },
    ];

    return (
        <div className="ott-dashboard-motion relative isolate -mx-4 -my-4 min-h-screen space-y-5 bg-gradient-to-br from-[#f3edff] via-[#f2f8ff] to-[#fff4e6] px-4 py-4 pb-10 sm:-mx-5 sm:-my-5 sm:space-y-6 sm:px-5 sm:py-5 lg:-mx-6 lg:-my-6 lg:px-6 lg:py-6">
            <style>{`
                @keyframes ottDashboardEnter {
                    from { opacity: 0; transform: translate3d(0, 16px, 0) scale(.99); }
                    to { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
                }
                @keyframes ottDashboardDrift {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                @keyframes ottDashboardFloat {
                    0%, 100% { transform: translate3d(0, 0, 0) rotate(0deg); }
                    50% { transform: translate3d(-10px, 8px, 0) rotate(5deg); }
                }
                @keyframes ottDashboardGlow {
                    0%, 100% { opacity: .35; }
                    50% { opacity: .7; }
                }
                @keyframes ottDashboardAmbient {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1); }
                    50% { transform: translate3d(34px, 24px, 0) scale(1.12); }
                }
                @keyframes ottDashboardAmbientReverse {
                    0%, 100% { transform: translate3d(0, 0, 0) scale(1.08); }
                    50% { transform: translate3d(-28px, -22px, 0) scale(.94); }
                }
                @keyframes ottDashboardGridDrift {
                    from { background-position: 0 0; }
                    to { background-position: 36px 36px; }
                }
                .ott-dashboard-backdrop {
                    position: absolute;
                    z-index: -1;
                    inset: 0;
                    overflow: hidden;
                    border-radius: inherit;
                    pointer-events: none;
                    isolation: isolate;
                    contain: paint;
                }
                .ott-dashboard-backdrop::before {
                    content: "";
                    position: absolute;
                    inset: 0;
                    opacity: .94;
                    background:
                        radial-gradient(ellipse at 9% 12%, rgb(196 181 253 / .76), transparent 30%),
                        radial-gradient(ellipse at 88% 22%, rgb(251 207 232 / .76), transparent 28%),
                        radial-gradient(ellipse at 75% 72%, rgb(253 230 138 / .62), transparent 30%),
                        radial-gradient(ellipse at 18% 82%, rgb(165 243 252 / .66), transparent 32%);
                }
                .ott-dashboard-backdrop::after {
                    content: "";
                    position: absolute;
                    inset: 0;
                    opacity: .18;
                    background-image: radial-gradient(rgb(109 40 217 / .55) .75px, transparent .75px);
                    background-size: 36px 36px;
                    mask-image: linear-gradient(to bottom, black, transparent 94%);
                    animation: ottDashboardGridDrift 24s linear infinite;
                }
                .ott-dashboard-ambient {
                    position: absolute;
                    width: clamp(15rem, 34vw, 34rem);
                    aspect-ratio: 1;
                    border-radius: 9999px;
                    filter: blur(72px);
                    opacity: .38;
                    will-change: transform;
                }
                .ott-dashboard-ambient-violet {
                    top: 12rem;
                    left: -12rem;
                    background: radial-gradient(circle, #a78bfa 0%, #c4b5fd 38%, transparent 72%);
                    animation: ottDashboardAmbient 20s ease-in-out infinite;
                }
                .ott-dashboard-ambient-pink {
                    top: 35%;
                    right: -14rem;
                    background: radial-gradient(circle, #f9a8d4 0%, #fbcfe8 38%, transparent 72%);
                    animation: ottDashboardAmbientReverse 23s ease-in-out infinite;
                }
                .ott-dashboard-ambient-gold {
                    bottom: -13rem;
                    left: 30%;
                    background: radial-gradient(circle, #fcd34d 0%, #fde68a 35%, transparent 72%);
                    animation: ottDashboardAmbient 26s ease-in-out infinite reverse;
                }
                .ott-dashboard-enter {
                    opacity: 0;
                    animation: ottDashboardEnter .58s cubic-bezier(.2, .75, .25, 1) forwards;
                    animation-delay: var(--dashboard-delay, 0ms);
                }
                .ott-dashboard-hero {
                    background-size: 180% 180%;
                    animation: ottDashboardEnter .58s cubic-bezier(.2, .75, .25, 1) forwards, ottDashboardDrift 18s ease-in-out infinite;
                }
                .ott-dashboard-orb { animation: ottDashboardFloat 9s ease-in-out infinite; }
                .ott-dashboard-orb-glow { animation: ottDashboardGlow 7s ease-in-out infinite; }
                .ott-dashboard-panel {
                    position: relative;
                    isolation: isolate;
                    transition: border-color .25s ease, box-shadow .25s ease, transform .25s ease;
                }
                .ott-dashboard-panel::before {
                    content: "";
                    position: absolute;
                    z-index: 1;
                    inset: 0 0 auto;
                    height: 3px;
                    border-radius: 999px;
                    background: linear-gradient(90deg, #7c3aed, #ec4899, #f59e0b, #10b981);
                    transform: scaleX(.22);
                    transform-origin: left;
                    transition: transform .35s ease;
                    pointer-events: none;
                }
                .ott-dashboard-panel:hover {
                    transform: translateY(-2px);
                    border-color: rgb(196 181 253 / .7);
                    box-shadow: 0 18px 38px -28px rgb(76 29 149 / .45);
                }
                .ott-dashboard-panel:hover::before { transform: scaleX(1); }
                @media (prefers-reduced-motion: reduce) {
                    .ott-dashboard-motion *,
                    .ott-dashboard-motion *::before,
                    .ott-dashboard-motion *::after {
                        animation: none !important;
                        scroll-behavior: auto !important;
                        transition-duration: .01ms !important;
                    }
                    .ott-dashboard-motion .ott-dashboard-enter { opacity: 1; transform: none; }
                    .ott-dashboard-panel:hover { transform: none; }
                    .ott-dashboard-ambient { will-change: auto; }
                }
            `}</style>
            <div aria-hidden="true" className="ott-dashboard-backdrop absolute inset-0 -z-10 overflow-hidden">
                <span className="ott-dashboard-ambient ott-dashboard-ambient-violet" />
                <span className="ott-dashboard-ambient ott-dashboard-ambient-pink" />
                <span className="ott-dashboard-ambient ott-dashboard-ambient-gold" />
            </div>
            <section className="ott-dashboard-enter ott-dashboard-hero relative isolate flex flex-col gap-6 overflow-hidden rounded-[1.75rem] border border-violet-400/20 bg-gradient-to-br from-[#210839] via-[#3D01B1] to-[#7C3AED] p-5 text-white shadow-[0_20px_50px_-28px_rgba(61,1,177,0.65)] sm:p-7 xl:flex-row xl:items-center xl:justify-between">
                <div aria-hidden="true" className="ott-dashboard-orb pointer-events-none absolute -right-14 -top-32 h-72 w-72 rounded-full border border-white/15 bg-white/[0.05]" />
                <div aria-hidden="true" className="ott-dashboard-orb-glow pointer-events-none absolute -bottom-48 right-[22%] h-72 w-72 rounded-full border-[24px] border-fuchsia-200/[0.08]" />
                <div className="relative z-10">
                    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-violet-200">
                        <Sparkles size={14} />
                        {import.meta.env.DEV && showDemoData ? "Design preview · sample data" : "Store overview"}
                    </p>
                    <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                        Welcome back, {user?.username || user?.name || "Admin"}
                    </h1>
                    <p className="mt-2 text-sm text-white/75">
                        Here is what is happening with your store today.
                    </p>
                </div>
                <div className="relative z-10 flex flex-wrap items-center gap-2.5 xl:max-w-[56%] xl:justify-end">
                    {import.meta.env.DEV && (
                        <button
                            type="button"
                            onClick={() => setShowDemoData((showingDemo) => !showingDemo)}
                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 px-3 py-2.5 text-xs font-bold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD52E]"
                        >
                            {showDemoData ? "Show live data" : "Preview sample data"}
                        </button>
                    )}
                    <span className="inline-flex min-h-10 items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/85">
                        <CalendarDays size={14} className="text-violet-200" />
                        {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
                    </span>
                    <span className={`inline-flex min-h-10 items-center gap-2 rounded-xl border px-3 py-2 text-xs font-semibold ${import.meta.env.DEV && showDemoData ? "border-amber-200/20 bg-amber-200/10 text-amber-50" : "border-emerald-300/20 bg-emerald-300/10 text-emerald-50"}`}>
                        <span className="relative flex h-2 w-2">
                            <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-60 ${import.meta.env.DEV && showDemoData ? "bg-amber-300" : "bg-emerald-300"}`} />
                            <span className={`relative inline-flex h-2 w-2 rounded-full ${import.meta.env.DEV && showDemoData ? "bg-amber-300" : "bg-emerald-300"}`} />
                        </span>
                        {import.meta.env.DEV && showDemoData
                            ? "Sample data"
                            : updatedAt
                            ? `Updated ${updatedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`
                            : "Connected"}
                    </span>
                    <button
                        type="button"
                        onClick={() => fetchDashboardData(salesRange)}
                        disabled={refreshing}
                        className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-bold text-white backdrop-blur transition hover:border-white/35 hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD52E] disabled:cursor-wait disabled:opacity-70"
                    >
                        <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                        Refresh
                    </button>

                </div>
            </section>

            {loadError && dashboardData && !showDemoData && (
                <div role="status" className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-2.5 text-amber-900">
                        <FiAlertTriangle className="mt-0.5 shrink-0 text-amber-600" />
                        <p>
                            <span className="font-bold">Showing saved dashboard data.</span>{" "}
                            The latest refresh failed, so these numbers may be out of date.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => fetchDashboardData(salesRange)}
                        disabled={refreshing}
                        className="inline-flex min-h-9 shrink-0 items-center justify-center gap-2 self-start rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-900 transition hover:bg-amber-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 disabled:opacity-60 sm:self-auto"
                    >
                        <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
                        Retry refresh
                    </button>
                </div>
            )}

            <section className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Total Revenue", value: `₹${Number(revenueSummary.total || 0).toLocaleString("en-IN")}`, note: "Delivered orders only", icon: <FaRupeeSign size={21} />, style: { surface: "bg-orange-50/90", icon_bg: "bg-gradient-to-br from-amber-100 to-orange-100", icon_color: "text-amber-700", accent: "bg-gradient-to-b from-amber-400 to-orange-600", glow: "from-amber-200/70" } },
                        { label: "Today Revenue", value: `₹${Number(revenueSummary.today || 0).toLocaleString("en-IN")}`, note: "Delivered orders today", icon: <CalendarDays size={21} />, style: { surface: "bg-cyan-50/90", icon_bg: "bg-gradient-to-br from-cyan-100 to-sky-100", icon_color: "text-cyan-700", accent: "bg-gradient-to-b from-cyan-400 to-sky-600", glow: "from-cyan-200/70" } },
                        { label: "Services", value: Number(contentSummary.services || 0).toLocaleString("en-IN"), icon: <FiCheckCircle size={21} />, style: { surface: "bg-indigo-50/90", icon_bg: "bg-gradient-to-br from-indigo-100 to-violet-100", icon_color: "text-indigo-700", accent: "bg-gradient-to-b from-indigo-400 to-violet-600", glow: "from-indigo-200/70" } },
                        { label: "YouTube Videos", value: Number(contentSummary.youtubeVideos || 0).toLocaleString("en-IN"), icon: <Video size={21} />, style: { surface: "bg-red-50/90", icon_bg: "bg-gradient-to-br from-red-100 to-rose-100", icon_color: "text-red-700", accent: "bg-gradient-to-b from-red-400 to-rose-600", glow: "from-rose-200/70" } },
                    ].map((stat) => (
                        <article key={stat.label} className={`group relative overflow-hidden rounded-2xl border border-white/80 ${stat.style.surface} p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.45)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgba(76,29,149,0.3)]`}>
                            <div aria-hidden="true" className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${stat.style.glow} to-transparent opacity-60 transition duration-500 group-hover:scale-150 group-hover:opacity-100`} />
                            <div className={`absolute inset-y-0 left-0 w-1.5 ${stat.style.accent}`} />
                            <div className="relative flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-[2rem]">{stat.value}</p>
                                </div>
                                <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${stat.style.icon_bg} ${stat.style.icon_color} shadow-sm ring-1 ring-white/80`}>
                                    {stat.icon}
                                </div>
                            </div>
                            <div className="relative mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                                {stat.note || "Current total"}
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {/* Top Stats Grid */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboardStats.map((stat, i) => {
                    const style = cardStyles[i % cardStyles.length];
                    const trend = String(stat.trend || "");
                    return (
                        <article key={stat.label || i} style={{ animationDelay: `${i * 90}ms` }} className={`ott-dashboard-enter group relative overflow-hidden rounded-2xl border border-white/80 ${style.surface} p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.45)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_36px_-22px_rgba(76,29,149,0.3)]`}>
                            <div aria-hidden="true" className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${style.glow} to-transparent opacity-60 transition duration-500 group-hover:scale-150 group-hover:opacity-100`} />
                            <div className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} />
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                                    <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-[2rem]">{stat.value ?? "—"}</p>
                                </div>
                                <div className={`relative flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.icon_bg} ${style.icon_color} shadow-sm ring-1 ring-white/80 transition duration-300 group-hover:rotate-3 group-hover:scale-110`}>
                                    {getStatIcon(stat.icon)}
                                </div>
                            </div>
                            <div className="mt-4 flex min-h-8 items-end justify-between gap-2 border-t border-slate-100 pt-3">
                                <div className="min-w-0 text-xs">
                                    {trend ? (
                                        <span className={`inline-flex flex-wrap items-center gap-1 font-bold ${stat.trendUp ? "text-emerald-600" : "text-rose-600"}`}>
                                            {stat.trendUp ? <FiTrendingUp size={13} /> : <FiTrendingDown size={13} />}
                                            {trend.replace("+", "").replace("↓", "").trim()}
                                            <span className="font-medium text-slate-400">vs last month</span>
                                        </span>
                                    ) : <span className="font-medium text-slate-400">Current total</span>}
                                </div>
                                {Array.isArray(stat.sparkline) && stat.sparkline.length > 1 && (
                                    <svg viewBox="0 0 100 36" role="img" aria-label={`${stat.label} recent trend`} className="h-9 w-20 shrink-0 overflow-visible transition-transform duration-300 group-hover:scale-110">
                                        <polyline
                                            points={stat.sparkline.map((value, index) => {
                                                const x = (index / (stat.sparkline.length - 1)) * 100;
                                                const min = Math.min(...stat.sparkline);
                                                const max = Math.max(...stat.sparkline);
                                                const y = 32 - ((value - min) / (max - min || 1)) * 26;
                                                return `${x},${y}`;
                                            }).join(" ")}
                                            fill="none"
                                            stroke={style.stroke}
                                            strokeWidth="3"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="opacity-60 transition-opacity group-hover:opacity-100"
                                        />
                                    </svg>
                                )}
                            </div>
                        </article>
                    );
                })}
            </div>

            <section className="space-y-3">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {[
                        { label: "Total Orders", value: orderSummary.total, icon: <FiShoppingBag size={21} /> },
                        { label: "Today Orders", value: orderSummary.today, icon: <CalendarDays size={21} /> },
                        { label: "Cancelled Orders", value: orderSummary.cancelled, icon: <FiAlertTriangle size={21} /> },
                        { label: "Delivery Orders", value: orderSummary.delivery, icon: <FaTruck size={21} /> },
                    ].map((stat, index) => {
                        const style = orderCardStyles[index];
                        return (
                            <article key={stat.label} className={`group relative overflow-hidden rounded-2xl border border-white/80 ${style.surface} p-5 shadow-[0_8px_24px_-20px_rgba(15,23,42,0.45)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_36px_-22px_rgba(76,29,149,0.3)]`}>
                                <div aria-hidden="true" className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${style.glow} to-transparent opacity-60 transition duration-500 group-hover:scale-150 group-hover:opacity-100`} />
                                <div className={`absolute inset-y-0 left-0 w-1.5 ${style.accent}`} />
                                <div className="relative flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
                                        <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-[2rem]">
                                            {Number(stat.value || 0).toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                    <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ${style.icon_bg} ${style.icon_color} shadow-sm ring-1 ring-white/80`}>
                                        {stat.icon}
                                    </div>
                                </div>
                                <div className="relative mt-4 border-t border-slate-100 pt-3 text-xs font-medium text-slate-400">
                                    Current total
                                </div>
                            </article>
                        );
                    })}
                </div>
            </section>

            {/* Quick Actions */}
            <section style={{ animationDelay: "390ms" }} className="ott-dashboard-enter ott-dashboard-panel rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_-8px_rgba(15,23,42,0.3)]">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Quick access</h2>
                        <p className="mt-1 text-xs text-slate-500">Jump to the tools you use most.</p>
                    </div>
                    <span className="hidden rounded-full bg-violet-50 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-violet-700 sm:inline-flex">Shortcuts</span>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
                    {[
                        { label: "Add product", icon: <FiBox size={19} />, path: "/admin/products/add", tone: "from-violet-100 to-fuchsia-100 text-violet-700 group-hover:from-violet-600 group-hover:to-fuchsia-600" },
                        { label: "Products", icon: <FaTshirt size={19} />, path: "/admin/products/all", tone: "from-amber-100 to-orange-100 text-amber-700 group-hover:from-amber-500 group-hover:to-orange-500" },
                        { label: "Categories", icon: <FiTag size={19} />, path: "/admin/products/category", tone: "from-sky-100 to-cyan-100 text-sky-700 group-hover:from-sky-500 group-hover:to-cyan-500" },
                        { label: "Stock", icon: <FiAlertTriangle size={19} />, path: "/admin/products/stock", tone: "from-rose-100 to-pink-100 text-rose-700 group-hover:from-rose-500 group-hover:to-pink-500" },
                        { label: "Customers", icon: <FiUsers size={19} />, path: "/admin/users/all", tone: "from-emerald-100 to-teal-100 text-emerald-700 group-hover:from-emerald-500 group-hover:to-teal-500" },
                        { label: "YouTube videos", icon: <Video size={19} />, path: "/admin/youtube-videos", tone: "from-red-100 to-orange-100 text-red-700 group-hover:from-red-500 group-hover:to-orange-500" },
                    ].map((action, i) => (
                        <button
                            key={i}
                            onClick={() => navigate(action.path)}
                            style={{ animationDelay: `${430 + i * 65}ms` }}
                            className="ott-dashboard-enter group flex min-h-24 items-center gap-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-3 text-left shadow-sm transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-900/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 sm:flex-col sm:justify-center sm:text-center"
                        >
                            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${action.tone} shadow-sm transition duration-300 group-hover:rotate-3 group-hover:scale-110 group-hover:text-white`}>
                                {action.icon}
                            </div>
                            <span className="text-xs font-bold leading-tight text-slate-700 group-hover:text-violet-800">{action.label}</span>
                        </button>
                    ))}
                </div>
            </section>

            {/* Middle Section: Charts & Low Stock */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                {/* Sales Overview Bar Chart */}
                <section style={{ animationDelay: "850ms" }} className="ott-dashboard-enter ott-dashboard-panel flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_-8px_rgba(15,23,42,0.3)] xl:col-span-6">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Sales overview</h2>
                            <p className="mt-1 text-xs text-slate-500">Revenue performance for the selected period.</p>
                        </div>
                        <label className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600 focus-within:border-violet-400">
                            <FiClock className="text-violet-700" />
                            <select
                                value={salesRange}
                                onChange={(event) => {
                                    const range = event.target.value;
                                    setSalesRange(range);
                                    fetchDashboardData(range);
                                }}
                                aria-label="Select sales overview date range"
                                className="cursor-pointer bg-transparent text-xs text-slate-700 outline-none"
                            >
                                {salesRangeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>{option.label}</option>
                                ))}
                            </select>
                        </label>
                    </div>
                    {salesAvailable ? (
                        <div className="min-h-[250px] flex-1">
                            <Bar data={barChartData} options={barChartOptions} />
                        </div>
                    ) : (
                        <div className="flex min-h-[250px] flex-1 flex-col items-center justify-center rounded-xl bg-gradient-to-br from-slate-50 to-violet-50/60 px-5 text-center">
                            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-violet-100">
                                <FiTrendingUp size={20} />
                            </div>
                            <p className="mt-3 text-sm font-bold text-slate-700">Sales data is not connected</p>
                            <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                                Revenue trends will appear here when order tracking becomes available.
                            </p>
                        </div>
                    )}
                </section>

                {/* Orders Overview Pie Chart */}
                <section style={{ animationDelay: "940ms" }} className="ott-dashboard-enter ott-dashboard-panel flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_-8px_rgba(15,23,42,0.3)] xl:col-span-3">
                    <div className="mb-4">
                        <h2 className="text-base font-bold text-slate-900">Orders overview</h2>
                        <p className="mt-1 text-xs text-slate-500">Current order status mix.</p>
                    </div>
                    {ordersAvailable ? <div className="flex flex-col flex-1">
                        <div className="relative mb-5 flex h-40 items-center justify-center">
                            <Doughnut data={doughnutData} options={doughnutOptions} />
                            <div className="absolute flex flex-col items-center">
                                <span className="text-xl font-black text-slate-900">{totalOrders.toLocaleString('en-IN')}</span>
                                <span className="text-[11px] font-medium text-slate-500">Total orders</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {orderStats.map((item, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 text-xs">
                                    <div className="flex min-w-0 items-center gap-2 text-slate-600">
                                        <div className={`h-2 w-2 shrink-0 rounded-full ${item.color}`} />
                                        {item.label}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <span className="font-bold text-slate-800">{item.count}</span>
                                        <span className="text-slate-400">({item.pct})</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div> : (
                        <div className="flex min-h-56 flex-1 flex-col items-center justify-center rounded-xl bg-slate-50 px-4 text-center">
                            <FiShoppingBag className="text-slate-400" size={24} />
                            <p className="mt-3 text-sm font-bold text-slate-700">Order tracking unavailable</p>
                            <p className="mt-1 text-xs leading-5 text-slate-500">Order status data will show when order tracking is connected.</p>
                        </div>
                    )}
                </section>

                {/* Low Stock Alert */}
                <section style={{ animationDelay: "1030ms" }} className="ott-dashboard-enter ott-dashboard-panel flex flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_-8px_rgba(15,23,42,0.3)] xl:col-span-3">
                    <div className="mb-4 flex items-start justify-between gap-2">
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900">Low stock</h2>
                                {dashboardLowStock.length > 0 && (
                                    <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600">
                                        {dashboardLowStock.length}
                                    </span>
                                )}
                            </div>
                            <p className="mt-1 text-xs text-slate-500">Products that need attention.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/products/stock")}
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900"
                        >
                            View <ArrowRight size={13} />
                        </button>
                    </div>
                    <div className="max-h-[300px] flex-1 space-y-3 overflow-y-auto">
                        {dashboardLowStock.length ? dashboardLowStock.map((item, i) => (
                            <div key={i} style={{ animationDelay: `${1080 + i * 70}ms` }} className="ott-dashboard-enter group flex items-center gap-3 rounded-xl p-1.5 transition-colors hover:bg-rose-50/70">
                                <img
                                    src={getDashboardImageUrl(item.img)}
                                    alt={item.name}
                                    className="h-10 w-10 rounded-lg border border-slate-200 object-cover"
                                    onError={(event) => {
                                        event.currentTarget.onerror = null;
                                        event.currentTarget.src = "/images/logo.jpeg";
                                    }}
                                />
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs font-bold text-slate-800">{item.name}</p>
                                    <p className="mt-0.5 text-[11px] text-slate-500">Stock: <span className="font-bold text-rose-600">{item.stock}</span></p>
                                </div>
                                <span className={`whitespace-nowrap rounded-full px-2 py-1 text-[10px] font-bold ${Number(item.stock) === 0 ? "bg-rose-100 text-rose-700" : "bg-amber-50 text-amber-700"}`}>
                                    {Number(item.stock) === 0 ? "Out of stock" : "Low stock"}
                                </span>
                            </div>
                        )) : (
                            <div className="flex h-full min-h-32 flex-col items-center justify-center rounded-xl bg-emerald-50/70 px-4 text-center">
                                <FiCheckCircle className="text-emerald-600" size={22} />
                                <p className="mt-2 text-xs font-bold text-emerald-800">Stock looks good</p>
                                <p className="mt-1 text-[11px] text-emerald-700/80">No low-stock products to show.</p>
                            </div>
                        )}
                    </div>
                </section>
            </div>

            {/* Bottom Section: Recent Orders & Top Selling */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
                {/* Recent Orders */}
                <section style={{ animationDelay: "1140ms" }} className="ott-dashboard-enter ott-dashboard-panel rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_-8px_rgba(15,23,42,0.3)] xl:col-span-8">
                    <div className="mb-5">
                        <h2 className="text-base font-bold text-slate-900">Recent orders</h2>
                        <p className="mt-1 text-xs text-slate-500">The latest orders recorded in your store.</p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[620px] text-left text-sm">
                            <thead>
                                <tr className="admin-table-header text-[10px] uppercase tracking-[0.12em]">
                                    <th className="pb-3 font-bold">Order</th>
                                    <th className="pb-3 font-bold">Customer</th>
                                    <th className="pb-3 font-bold">Date</th>
                                    <th className="pb-3 font-bold">Amount</th>
                                    <th className="pb-3 font-bold">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {dashboardOrders.length > 0 ? dashboardOrders.map((order, i) => (
                                    <tr key={order.id || i} className="transition-colors hover:bg-violet-50/40">
                                        <td className="py-3 font-bold text-violet-700 text-xs">{order.id}</td>
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-100 text-[10px] font-black text-violet-700">
                                                    {String(order.customer || "Guest").charAt(0).toUpperCase()}
                                                </div>
                                                <span className="max-w-[140px] truncate text-xs font-semibold text-slate-800">{order.customer || "Guest"}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 text-xs text-slate-500">{formatOrderDate(order.date)}</td>
                                        <td className="py-3 text-xs font-bold text-slate-800">{order.amount ?? "—"}</td>
                                        <td className="py-3">
                                            <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${getStatusStyle(order.status)}`}>
                                                {order.status}
                                            </span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="py-10 text-center text-sm font-medium text-slate-400">
                                            {ordersAvailable ? "No recent orders found." : "Order tracking is not connected yet."}
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </section>

                {/* Top Selling Sarees */}
                <section style={{ animationDelay: "1230ms" }} className="ott-dashboard-enter ott-dashboard-panel rounded-2xl border border-slate-200/80 bg-white p-5 shadow-[0_3px_12px_-8px_rgba(15,23,42,0.3)] xl:col-span-4">
                    <div className="mb-5 flex items-start justify-between gap-3">
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Top selling products</h2>
                            <p className="mt-1 text-xs text-slate-500">Your most popular items.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => navigate("/admin/products/all")}
                            className="inline-flex shrink-0 items-center gap-1 text-xs font-bold text-violet-700 hover:text-violet-900"
                        >
                            View <ArrowRight size={13} />
                        </button>
                    </div>
                    <div className="space-y-3">
                        {dashboardProducts.length > 0 ? dashboardProducts.map((item, i) => (
                            <div key={item.id || i} className="group flex items-center gap-3 rounded-xl p-2 transition-colors hover:bg-violet-50/50">
                                <div className="relative shrink-0">
                                    <img
                                        src={getDashboardImageUrl(item.img)}
                                        alt={item.name}
                                        className="h-12 w-12 rounded-xl border border-slate-200 object-cover"
                                        onError={(event) => {
                                            event.currentTarget.onerror = null;
                                            event.currentTarget.src = "/images/logo.jpeg";
                                        }}
                                    />
                                    <span className={`absolute -left-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-black text-white shadow ${i === 0 ? "bg-gradient-to-br from-amber-400 to-orange-500" : i === 1 ? "bg-gradient-to-br from-slate-400 to-slate-500" : "bg-gradient-to-br from-violet-600 to-fuchsia-600"}`}>
                                        {i + 1}
                                    </span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="truncate text-xs font-bold text-slate-800">{item.name}</p>
                                    <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">{item.cat || "Uncategorized"}</p>
                                </div>
                                <div className="shrink-0 text-right">
                                    <p className="text-sm font-black text-violet-700">{item.sales ?? 0}</p>
                                    <p className="text-[10px] text-slate-400">sold</p>
                                </div>
                            </div>
                        )) : (
                            <p className="py-8 text-center text-sm font-medium text-slate-400">
                                {salesAvailable ? "No product sales data yet." : "Sales data will appear when order tracking is connected."}
                            </p>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default Dashboard;
