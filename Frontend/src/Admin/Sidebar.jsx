import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  MessageSquare,
  Megaphone,
  Wrench,
  CreditCard,
  X,
  ChevronDown,
  ChevronLeft,
  Home,
  PlusCircle,
  List,
  Layers,
  Truck,
  XCircle,
  Archive,
  Handshake,
  Video,
  Image
} from "lucide-react";

import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";

/* ================= NAV ITEMS ================= */
const navItems = [
  { path: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },


   {
    label: "Orders",
    icon: ShoppingCart,
    children: [

      { path: "/admin/orders/new", label: "New Orders", icon: List },
      { path: "/admin/orders/all", label: "All Orders", icon: Archive },
      { path: "/admin/orders/delivery", label: "Delivery Orders", icon: Truck },
      { path: "/admin/orders/cancelled", label: "Cancelled Orders", icon: XCircle },

    ],
  },

  {
    label: "Inventory",
    icon: Package,
    children: [
      { path: "/admin/products/all", label: "All Products", icon: List },
      { path: "/admin/products/add", label: "Add Product", icon: PlusCircle },
      { path: "/admin/products/category", label: "Categories", icon: Layers },
      { path: "/admin/products/stock", label: "Stock Details", icon: Archive },
    ],
  },
  

  { path: "/admin/service", label: "Service", icon: Wrench },
  { path: "/admin/youtube-videos", label: "Youtube Video", icon: Video },

  { path: "/admin/orders/billing", label: "Billing", icon: CreditCard },
  { path: "/admin/users/all", label: "Customers", icon: Users },
  {
    label: "Dealers",
    icon: Handshake,
    children: [
      { path: "/admin/dealers", label: "Dealers List", icon: List },
      { path: "/admin/invoices/add", label: "New Invoice", icon: PlusCircle },
    ],
  },
  {
    label: "Marketing Management",
    icon: Megaphone,
    children: [
      { path: "/admin/banners", label: "Promotion Banners", icon: Image },
      { path: "/admin/videos", label: "Showcase Videos", icon: Video },
      { path: "/admin/reviews", label: "Customer Reviews", icon: MessageSquare },
    ],
  },
  { path: "/", label: "Back Home", icon: Home },
];

const isPathActive = (currentPath, path) => {
  const normalizedPath = path.toLowerCase();
  const normalizedCurrentPath = currentPath.toLowerCase();
  return normalizedCurrentPath === normalizedPath
    || normalizedCurrentPath.startsWith(`${normalizedPath}/`);
};

/* ================= SIDEBAR ================= */
const Sidebar = ({ isOpen, onClose, collapsed, onToggleCollapse }) => {
  const { profileName } = useAuth();
  const location = useLocation();
  const [orderCounts, setOrderCounts] = useState({
    all: 0,
    new: 0,
    delivery: 0,
    cancelled: 0,
  });

  /* ================= FETCH ORDER COUNTS ================= */
  useEffect(() => {
    const fetchOrderCounts = async () => {
      try {
        const response = await api.get("/orders");
        const orders = response.data.data || [];

        const counts = {
          all: orders.length,
          new: orders.filter(o => o.status === "New Order" || o.status === "Order Placed").length,
          delivery: orders.filter(o => o.status === "Delivery" || o.status === "Shipped").length,
          cancelled: orders.filter(o => o.status === "Cancelled").length,
        };

        setOrderCounts(counts);
      } catch (error) {
        console.error("Error fetching order counts:", error);
      }
    };

    fetchOrderCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchOrderCounts, 30000);
    return () => clearInterval(interval);
  }, []);

  /* ================= HELPERS & LOGIC ================= */
  const isActiveRoute = (item) => {
    if (item.path === "/" || item.path === "/admin" || item.exact) {
      return location.pathname.toLowerCase() === item.path.toLowerCase();
    }

    if (item.children) {
      return item.children.some(child => isPathActive(location.pathname, child.path));
    }

    return item.path ? isPathActive(location.pathname, item.path) : false;
  };

  const [openMenu, setOpenMenu] = useState(() => {
    const activeItem = navItems.find(item => item.children && isActiveRoute(item));
    return activeItem ? activeItem.label : null;
  });

  useEffect(() => {
    const activeItem = navItems.find(item =>
      item.children?.some(child => isPathActive(location.pathname, child.path))
    );
    setOpenMenu(activeItem ? activeItem.label : null);
  }, [location.pathname]);

  /* Dropdown logic - only one open at a time */
  const toggleMenu = (label) => {
    setOpenMenu(prev => prev === label ? null : label);
  };

  return (
    <>
      {/* ========== MOBILE OVERLAY ========== */}
      <div
        onClick={onClose}
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden
        transition-opacity ${isOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
      />

      {/* ========== SIDEBAR ========== */}
      <aside
        className={`
        fixed top-0 left-0 z-50 h-full
        admin-sidebar border-r border-white/5
        font-sans
        
        flex flex-col transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "lg:w-20 w-full" : "w-full lg:w-80"}
      `}
      >
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(ellipse_at_10%_0%,rgba(168,85,247,0.16),transparent_38%),radial-gradient(ellipse_at_100%_100%,rgba(126,34,206,0.14),transparent_35%)]" />
        {/* ========== LOGO ========== */}
       <div className="relative overflow-hidden px-4 pt-5 pb-5 border-b border-white/10">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-br from-emerald-500/15 via-transparent to-cyan-500/5" />
          <div className="relative flex items-center gap-3">
            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary-light via-secondary-light to-accent p-[2px] shadow-lg shadow-primary/30">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-white">
                <img
                  src="/images/logo.jpeg"
                  alt="Our Tech Tamil"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="whitespace-nowrap text-sm font-extrabold tracking-tight text-white">
                  Our Tech <span className="text-accent">Tamil</span>
                </p>
                <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-white/60">
                  Admin Panel
                </p>
              </div>
            )}
            <button
              onClick={onClose}
              aria-label="Close admin navigation"
              className="ml-auto rounded-xl border border-transparent p-2 text-white/60 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD52E] lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav aria-label="Admin navigation" className="relative z-10 min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-5 hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ITEM ===== */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;
              const isAnyChildActive = isActiveRoute(item);

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    onClick={() => toggleMenu(item.label)}
                    aria-label={item.label}
                    aria-expanded={isMenuOpen}
                    title={collapsed ? item.label : undefined}
                    className={`
                      group w-full flex items-center gap-3 rounded-xl px-3 py-1.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                      ${isMenuOpen || isAnyChildActive
                        ? "bg-white/[0.09] text-white"
                        : "text-white/75 hover:text-white"
                      }
                    `}
                  >
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isMenuOpen || isAnyChildActive ? "bg-fuchsia-400/15 text-[#FFD52E]" : "bg-white/[0.07] text-violet-200 group-hover:bg-fuchsia-400/15 group-hover:text-white"}`}>
                      <Icon className="h-4 w-4" />
                    </span>

                    {!collapsed && (
                      <>
                        <span className="flex-1 text-left text-sm font-semibold tracking-wide">
                          {item.label}
                          {item.label === "Orders" && orderCounts.all > 0 && (
                            <span className="ml-2 inline-flex min-w-5 items-center justify-center rounded-full bg-[#FFD52E] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#210839]">
                              {orderCounts.all}
                            </span>
                          )}
                        </span>
                        <ChevronDown
                          className={`h-4 w-4 text-white/55 transition-transform duration-200 ${isMenuOpen ? "rotate-180 text-[#FFD52E]" : ""
                            }`}
                        />
                      </>
                    )}
                  </button>

                  {/* ===== SUB MENU ===== */}
                  {!collapsed && (
                    <div
                      className={`ml-4 space-y-1 overflow-y-auto pl-3 hide-scrollbar transition-all duration-300
                      ${isMenuOpen ? "max-h-60 py-1 opacity-100" : "max-h-0 opacity-0"}`}
                    >
                      {item.children.map((sub) => {
                        const SubIcon = sub.icon;
                        const isActive = isPathActive(location.pathname, sub.path);

                        // Get count badge for this item
                        let badgeCount = 0;
                        if (sub.label === "New Orders") badgeCount = orderCounts.new;
                        else if (sub.label === "All Orders") badgeCount = orderCounts.all;
                        else if (sub.label === "Delivery Orders") badgeCount = orderCounts.delivery;
                        else if (sub.label === "Cancelled Orders") badgeCount = orderCounts.cancelled;

                        return (
                          <NavLink
                            key={sub.path}
                            to={sub.path}
                            onClick={() => isOpen && onClose()}
                            aria-current={isActive ? "page" : undefined}
                            className={`
                              flex items-center gap-3 rounded-lg px-3 py-1.5 text-xs font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                              ${isActive
                                ? "bg-[#FFC928] text-[#210839]"
                                : "text-white/65 hover:text-white"
                              }
                            `}
                          >
                            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${isActive ? "bg-[#1F0A3C]/10 text-[#1F0A3C]" : "bg-white/[0.07] text-violet-200"}`}>
                              <SubIcon className="h-4 w-4" />
                            </span>
                            <span className="flex-1">{sub.label}</span>
                            {badgeCount > 0 && (
                              <span className="ml-auto inline-flex min-w-5 items-center justify-center rounded-full bg-[#FFD52E] px-1.5 py-0.5 text-[10px] font-bold leading-none text-[#210839]">
                                {badgeCount}
                              </span>
                            )}
                          </NavLink>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            /* ===== NORMAL ITEM ===== */
            const isActive = isActiveRoute(item);

            const sectionLabel = item.path === "/" ? "Navigation" : null;

            return (
              <div key={item.path} className="space-y-2">
                {sectionLabel && !collapsed && (
                  <div className={`flex items-center gap-3 px-3 ${item.path === "/" ? "pt-5" : "pb-1"}`}>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-violet-300/80">
                      {sectionLabel}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-fuchsia-300/35 to-transparent" />
                  </div>
                )}
                <NavLink
                  to={item.path}
                  end={item.exact}
                  title={collapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setOpenMenu(null);
                    if (isOpen) onClose();
                  }}
                  className={`
                    group flex items-center gap-3 rounded-xl transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                    ${collapsed ? "justify-center px-0 py-1.5" : "px-3 py-1.5"}
                    ${isActive
                      ? "bg-gradient-to-r from-[#FFD52E] via-[#FFC928] to-[#FFB900] text-[#210839]"
                      : "text-white/75 hover:text-white"
                    }
                  `}
                >
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-[#1F0A3C]/10 text-[#1F0A3C]" : "bg-white/[0.07] text-violet-200 group-hover:bg-fuchsia-400/15 group-hover:text-white"}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  {!collapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* ========== FOOTER / PROFILE ========== */}
        {!collapsed && (
          <div className="relative z-10 mx-3 mb-4 shrink-0 rounded-2xl border border-fuchsia-300/20 bg-[#260A4D]/95 p-4 shadow-lg shadow-black/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF4BE] to-[#FFD52E] ring-1 ring-white/20">
                <p className="text-lg font-bold text-[#24103E]">{(profileName || "Admin User").charAt(0).toUpperCase()}</p>
              </div>
              <div className="overflow-hidden flex-1">
                <p className="text-sm font-semibold text-white truncate">{(profileName || "Admin User")}</p>
                <p className="text-[10px] font-medium text-white/55 truncate">Super Admin</p>
              </div>
              <ChevronDown className="h-4 w-4 text-white/55" />
            </div>
          </div>
        )}

        {/* ========== COLLAPSE BUTTON ========== */}
        <button
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
          className="
            hidden lg:flex absolute -right-3 top-1/2 -translate-y-1/2
            w-6 h-6 rounded-full
            bg-[#FFF4BE] border border-amber-300/70
            shadow-[0_4px_14px_rgba(15,0,35,0.24)]
            items-center justify-center
            text-[#3D1762] hover:bg-[#FFD52E] hover:scale-110 transition-all z-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD52E]
          "
        >
          <ChevronLeft
            className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""
              }`}
          />
        </button>
      </aside>
    </>
  );
};

export default Sidebar;
