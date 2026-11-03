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
  Image,
  FilePlus2
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
  { path: "/admin/articles", label: "Create Article", icon: FilePlus2 },
  { path: "/admin/youtube-videos", label: "Youtube Video", icon: Video },
  

  { path: "/admin/orders/billing", label: "Billing", icon: CreditCard },
  
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
      { path: "/admin/reviews", label: "Customer Reviews", icon: MessageSquare },
      { path: "/admin/users/all", label: "Customers", icon: Users },
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
  const isCollapsed = collapsed && !isOpen;
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
        fixed left-0 top-0 z-50 flex h-dvh flex-col overflow-hidden
        admin-sidebar border-r border-white/10 font-sans shadow-[12px_0_40px_rgba(19,3,44,0.18)]
        transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "lg:w-20 w-full" : "w-full lg:w-80"}
      `}
      >
        {/* ========== LOGO ========== */}
        <div className="relative shrink-0 overflow-hidden border-b border-white/10 px-4 py-5">
          <div className="relative flex items-center gap-3">
            <div className="h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-fuchsia-400 via-violet-500 to-[#FFD52E] p-[2px] shadow-lg shadow-fuchsia-950/30">
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[14px] bg-[#1C0739]">
                <img
                  src="/images/logo.jpeg"
                  alt="Our Tech Tamil"
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
            <div className={`min-w-0 overflow-hidden ${isCollapsed ? "lg:hidden" : ""}`}>
                <p className="whitespace-nowrap text-base font-extrabold tracking-tight text-white">
                  Our Tech <span className="text-accent">Tamil</span>
                </p>
                <p className="mt-0.5 whitespace-nowrap text-xs font-medium text-violet-100/75">
                  Admin Dashboard
                </p>
            </div>
            <button
              onClick={onClose}
              aria-label="Close admin navigation"
              className="ml-auto rounded-xl border border-transparent p-2 text-white/60 transition-colors hover:border-white/10 hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD52E] lg:hidden"
            >
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? "Expand admin navigation" : "Collapse admin navigation"}
              title={collapsed ? "Expand menu" : "Collapse menu"}
              className={`hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/30 bg-white/[0.06] text-white/80 transition hover:border-fuchsia-200/70 hover:bg-fuchsia-400/15 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFD52E] lg:flex ${isCollapsed ? "absolute -right-1 top-1/2 -translate-y-1/2" : "ml-auto"}`}
            >
              <ChevronLeft className={`h-5 w-5 transition-transform ${collapsed ? "rotate-180" : ""}`} />
            </button>
          </div>
        </div>

        {/* ========== NAVIGATION ========== */}
        <nav aria-label="Admin navigation" className="relative z-10 min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-5 hide-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;

            /* ===== DROPDOWN ITEM ===== */
            if (item.children) {
              const isMenuOpen = openMenu === item.label;
              const isAnyChildActive = isActiveRoute(item);

              return (
                <div key={item.label} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.label)}
                    aria-label={item.label}
                    aria-expanded={isMenuOpen}
                    title={isCollapsed ? item.label : undefined}
                    className={`
                      group w-full flex items-center gap-3 rounded-2xl border px-3 py-2.5 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                      ${isMenuOpen || isAnyChildActive
                        ? "border-fuchsia-300/45 bg-transparent text-white"
                        : "border-white/[0.10] bg-transparent text-white/80 hover:border-fuchsia-300/35 hover:text-white"
                      }
                    `}
                  >
                    <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isMenuOpen || isAnyChildActive ? "bg-fuchsia-400/20 text-[#FFD52E]" : "bg-white/[0.08] text-violet-100 group-hover:bg-fuchsia-400/15 group-hover:text-white"}`}>
                      <Icon className="h-5 w-5" />
                    </span>

                    {!isCollapsed && (
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
                  {!isCollapsed && (
                    <div
                      className={`ml-4 space-y-1 overflow-y-auto  pl-3 hide-scrollbar transition-all duration-300
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
                              flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
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
                {sectionLabel && !isCollapsed && (
                  <div className={`flex items-center gap-3 px-3 ${item.path === "/" ? "pt-5" : "pb-1"}`}>
                    <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-violet-200/80">
                      {sectionLabel}
                    </span>
                    <span className="h-px flex-1 bg-gradient-to-r from-fuchsia-300/35 to-transparent" />
                  </div>
                )}
                <NavLink
                  to={item.path}
                  end={item.exact}
                  title={isCollapsed ? item.label : undefined}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => {
                    setOpenMenu(null);
                    if (isOpen) onClose();
                  }}
                  className={`
                    group flex items-center gap-3 rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                    ${isCollapsed ? "justify-center px-0 py-2.5" : "px-3 py-2.5"}
                    ${isActive
                      ? "relative border-amber-100/80 bg-gradient-to-r from-[#FFE45C] via-[#FFD52E] to-[#FFBA00] text-[#210839] shadow-[0_8px_24px_rgba(255,185,0,0.22)] before:absolute before:-left-2 before:h-8 before:w-1.5 before:rounded-full before:bg-[#FFD52E] before:shadow-[0_0_14px_rgba(255,213,46,0.75)]"
                      : "border-white/[0.10] bg-transparent text-white/80 hover:border-fuchsia-300/35 hover:text-white"
                    }
                  `}
                >
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${isActive ? "bg-white/30 text-[#210839]" : "bg-white/[0.08] text-violet-100 group-hover:bg-fuchsia-400/15 group-hover:text-white"}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  {!isCollapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
                </NavLink>
              </div>
            );
          })}
        </nav>

        {/* ========== FOOTER / PROFILE ========== */}
        <div className={`relative z-10 mx-3 mb-4 mt-2 shrink-0 rounded-2xl border border-fuchsia-300/35 bg-[#210839] p-3 ${isCollapsed ? "flex justify-center" : ""}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"}`} title={isCollapsed ? `${profileName || "Admin User"} - Super Admin` : undefined}>
              <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#FFF4BE] to-[#FFD52E] ring-2 ring-white/15 shadow-md shadow-amber-500/20">
                <p className="text-lg font-bold text-[#24103E]">{(profileName || "Admin User").charAt(0).toUpperCase()}</p>
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-[#2A0A4F] bg-emerald-400" />
              </div>
              {!isCollapsed && <div className="min-w-0 flex-1 overflow-hidden">
                <p className="text-sm font-semibold text-white truncate">{(profileName || "Admin User")}</p>
                <p className="mt-0.5 text-xs font-medium text-violet-100/65 truncate">Super Admin</p>
              </div>}
              {!isCollapsed && <ChevronDown className="h-4 w-4 shrink-0 text-white/65" />}
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
