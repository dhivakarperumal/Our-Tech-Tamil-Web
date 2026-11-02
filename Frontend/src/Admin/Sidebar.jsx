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
  { path: "/admin/Youtube", label: "Youtube Video", icon: Video },

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
        bg-[#1D0738]
        border-r border-white/10 shadow-[12px_0_40px_rgba(15,0,35,0.22)]
        font-sans
        
        flex flex-col transition-all duration-300
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
        ${collapsed ? "lg:w-20 w-full" : "w-full lg:w-72"}
      `}
      >
        {/* ========== LOGO ========== */}
        <div className="relative overflow-hidden border-b border-white/10 bg-[#2A1048] px-4 py-5">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-fuchsia-500/10 via-transparent to-amber-400/[0.06]" />
          <div className="relative flex min-h-11 items-center gap-3">
            <div className="w-11 h-11 shrink-0 overflow-hidden rounded-full bg-[#21094E] ring-1 ring-white/15 shadow-lg shadow-fuchsia-950/30">
              <img
                src="/images/logo1.png"
                alt="Our Tech Tamil"
                className="h-full w-full object-cover"
              />
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="mb-1 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#FFD52E]">
                  Our Tech Tamil
                </p>
                <p className="text-sm font-semibold tracking-wide text-white">
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
        <nav aria-label="Admin navigation" className="min-h-0 flex-1 space-y-1.5 overflow-y-auto px-3 py-5 hide-scrollbar">
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
                      w-full flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                      ${isMenuOpen || isAnyChildActive
                        ? "bg-white/[0.09] text-white ring-1 ring-inset ring-white/[0.1]"
                        : "text-white/65 hover:-translate-y-px hover:bg-white/[0.07] hover:text-white"
                      }
                    `}
                  >
                    <Icon className={`h-5 w-5 shrink-0 ${isMenuOpen || isAnyChildActive ? "text-[#FFD52E]" : ""}`} />

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
                          className={`h-4 w-4 transition-transform duration-200 ${isMenuOpen ? "rotate-180 text-[#FFD52E]" : ""
                            }`}
                        />
                      </>
                    )}
                  </button>

                  {/* ===== SUB MENU ===== */}
                  {!collapsed && (
                    <div
                      className={`ml-4 space-y-1 overflow-y-auto border-l border-white/10 pl-3 hide-scrollbar transition-all duration-300
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
                              flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium tracking-wide transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                              ${isActive
                                ? "bg-[#FFC928] text-[#210839] shadow-md shadow-amber-400/20"
                                : "text-white/65 hover:bg-white/[0.07] hover:text-white"
                              }
                            `}
                          >
                            <SubIcon className={`h-4 w-4 shrink-0 ${isActive ? "text-[#210839]" : ""}`} />
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

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.exact}
                title={collapsed ? item.label : undefined}
                aria-current={isActive ? "page" : undefined}
                onClick={() => {
                  setOpenMenu(null);
                  if (isOpen) onClose();
                }}
                className={`
                  flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#FFD52E]
                  ${isActive
                    ? "bg-[#FFC928] text-[#210839] shadow-lg shadow-amber-400/20 ring-1 ring-inset ring-amber-100/25"
                    : "text-white/65 hover:-translate-y-px hover:bg-white/[0.07] hover:text-white"
                  }
                `}
              >
                <Icon className={`h-5 w-5 shrink-0 ${isActive ? "text-[#210839]" : ""}`} />
                {!collapsed && <span className="text-sm font-semibold tracking-wide">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* ========== FOOTER / PROFILE ========== */}
        {!collapsed && (
          <div className="relative mx-3 mb-4 shrink-0 rounded-2xl border border-fuchsia-300/15 bg-[#260A4D] p-4 shadow-lg shadow-black/10">
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
