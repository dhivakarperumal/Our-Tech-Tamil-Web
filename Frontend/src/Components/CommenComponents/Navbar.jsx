import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Grid2X2,
  Heart,
  House,
  Mail,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  Users,
  X,
  Phone,
} from "lucide-react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import api from "../../api";
import PageContainer from "./PageContainer";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [categoryMenu, setCategoryMenu] = useState(false);
  const [mobileCategory, setMobileCategory] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [orderCount, setOrderCount] = useState(0);
  const [search, setSearch] = useState("");

  const menuRef = useRef(null);
  const categoryRef = useRef(null);

  const confirmLogout = () => {
    logout();
    setLogoutConfirm(false);
    setUserMenu(false);
    navigate("/login");
  };

  useEffect(() => {
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setUserMenu(false);
      if (categoryRef.current && !categoryRef.current.contains(event.target)) setCategoryMenu(false);
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    let active = true;

    api.get("/categories")
      .then((response) => {
        if (active) setCategories(Array.isArray(response.data) ? response.data : []);
      })
      .catch((error) => {
        console.error("Failed to fetch navigation categories:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchOrderCount = async () => {
      if (!user) {
        setOrderCount(0);
        return;
      }

      try {
        const response = await api.get("/orders");
        const orders = Array.isArray(response.data) ? response.data : (response.data.data || []);
        const userOrders = orders.filter(
          (order) => (order.user_id === user.user_id || order.user_id === user.id) && order.status !== "Delivered",
        );
        if (active) setOrderCount(userOrders.length);
      } catch (error) {
        console.error("Error fetching order count:", error);
      }
    };

    fetchOrderCount();
    const interval = setInterval(fetchOrderCount, 30000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [user]);

  const submitSearch = (event) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (search.trim()) params.set("search", search.trim());
    navigate(`/shop${params.size ? `?${params.toString()}` : ""}`);
    setMobileMenu(false);
  };

  const navClass = ({ isActive }) =>
    `my-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold transition ${
      isActive ? "bg-gradient-to-r from-accent to-[#ffe98a] text-[#29104b] shadow-sm" : "text-white hover:bg-white/10"
    }`;

  const renderUserMenu = () => (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => {
          if (user) setUserMenu((open) => !open);
          else navigate("/login");
        }}
        aria-label={user ? "Open account menu" : "Sign in"}
        aria-expanded={userMenu}
        className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary"
      >
        {user ? (
          <span className="text-sm font-bold">{user.username?.charAt(0).toUpperCase() || <UserRound size={19} />}</span>
        ) : (
          <UserRound size={19} aria-hidden="true" />
        )}
      </button>
      {userMenu && user && (
        <div className="absolute right-0 top-full z-[60] mt-3 w-48 overflow-hidden rounded-xl border border-border bg-white py-1 shadow-xl">
          <Link to="/account" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#faf7ff] hover:text-primary">
            My Account
          </Link>
          <Link to="/ordersmain" onClick={() => setUserMenu(false)} className="flex items-center justify-between px-4 py-2.5 text-sm text-gray-700 hover:bg-[#faf7ff] hover:text-primary">
            Track Orders
            {orderCount > 0 && <span className="rounded-full bg-primary px-1.5 py-0.5 text-[10px] text-white">{orderCount}</span>}
          </Link>
          {user.role === "admin" && (
            <Link to="/admin" onClick={() => setUserMenu(false)} className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-[#faf7ff] hover:text-primary">
              Admin Panel
            </Link>
          )}
          <button type="button" onClick={() => setLogoutConfirm(true)} className="w-full px-4 py-2.5 text-left text-sm text-red-500 hover:bg-red-50">
            Logout
          </button>
        </div>
      )}
    </div>
  );

  return (
    <nav className="relative bg-white shadow-[0_5px_18px_rgba(38,13,66,0.12)]">
      <PageContainer>
        <div className="flex min-h-[60px] items-center justify-between gap-3 py-1.5 lg:min-h-[64px]">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Our Tech home">
            <img
              src="/images/logo.jpeg"
              alt=""
              className="h-8 w-8 rounded-full bg-white object-cover ring-2 ring-fuchsia-600 ring-offset-1 ring-offset-white sm:h-10 sm:w-10"
            />
            <span className="ml-3 flex flex-col leading-none">
              <span className="text-base font-extrabold tracking-tight text-gray-900 sm:text-lg">
                Our <span className="text-fuchsia-600">Tech</span>
              </span>
              <span className="mt-0.5 text-[6px] font-bold uppercase tracking-[0.34em] text-gray-600 sm:text-[7px]">
                Gadgets Store
              </span>
            </span>
          </Link>

          <span className="hidden h-12 w-px shrink-0 bg-[#d8cce4] xl:block" aria-hidden="true" />

          <form onSubmit={submitSearch} role="search" className="hidden min-w-0 max-w-[680px] flex-1 xl:flex">
            <label htmlFor="desktop-product-search" className="sr-only">Search products</label>
            <div className="flex w-full items-center overflow-hidden rounded-full border border-[#e7dff0] bg-white shadow-inner focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
              <Search size={19} className="ml-4 shrink-0 text-[#4c3b64]" aria-hidden="true" />
              <input
                id="desktop-product-search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search for products, brands and more..."
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-500"
              />
              <button type="submit" className="bg-gradient-to-r from-[#9d1db9] to-[#4b00c8] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110">
                Search
              </button>
            </div>
          </form>

          <span className="hidden h-12 w-px shrink-0 bg-[#d8cce4] xl:block" aria-hidden="true" />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setWishlistOpen(true)}
              aria-label="Open wishlist"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary sm:h-9 sm:w-9"
            >
              <Heart size={20} aria-hidden="true" />
              {wishlist.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{wishlist.length > 9 ? "9+" : wishlist.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative flex h-8 w-8 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary sm:h-9 sm:w-9"
            >
              <ShoppingCart size={20} aria-hidden="true" />
              {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-700 px-1 text-[9px] font-bold text-white">{cart.length > 9 ? "9+" : cart.length}</span>}
            </button>
            <div className="hidden sm:block">{renderUserMenu()}</div>
            <button
              type="button"
              onClick={() => setMobileMenu((open) => !open)}
              className="flex h-8 w-8 items-center justify-center rounded-full border border-[#eee7f5] text-[#2b1745] xl:hidden"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        <form onSubmit={submitSearch} role="search" className="pb-1.5 xl:hidden">
          <label htmlFor="mobile-product-search" className="sr-only">Search products</label>
          <div className="flex items-center overflow-hidden rounded-full border border-[#e7dff0] bg-white">
            <Search size={17} className="ml-3 shrink-0 text-[#4c3b64]" aria-hidden="true" />
            <input
              id="mobile-product-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search products, brands and more..."
              className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-xs text-gray-800 outline-none placeholder:text-gray-500"
            />
            <button type="submit" aria-label="Search" className="bg-gradient-to-r from-[#9d1db9] to-[#4b00c8] px-4 py-2.5 text-white">
              <Search size={15} aria-hidden="true" />
            </button>
          </div>
        </form>
      </PageContainer>

      <div className="sticky top-0 z-50 isolate hidden h-[58px] items-center justify-center xl:flex">
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[58px] w-full"
          viewBox="0 0 2000 80"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="nav-wave-fill" x1="0" x2="1">
              <stop offset="0%" stopColor="#7415a1" />
              <stop offset="48%" stopColor="#350751" />
              <stop offset="100%" stopColor="#7415a1" />
            </linearGradient>
            <linearGradient id="nav-wave-line" x1="0" x2="1">
              <stop offset="0%" stopColor="#f4c844" />
              <stop offset="50%" stopColor="#ffe77a" />
              <stop offset="100%" stopColor="#f4c844" />
            </linearGradient>
          </defs>
          <path
            d="M0 8 C110 8 100 48 220 55 C350 64 470 50 620 50 H1380 C1530 50 1650 64 1780 55 C1900 48 1890 8 2000 8 V80 H0 Z"
            fill="url(#nav-wave-fill)"
          />
          <path
            d="M0 8 C110 8 100 48 220 55 C350 64 470 50 620 50 H1380 C1530 50 1650 64 1780 55 C1900 48 1890 8 2000 8"
            fill="none"
            stroke="url(#nav-wave-line)"
            strokeWidth="2"
          />
        </svg>
        <div className="mx-auto w-full max-w-[980px] px-8">
          <div className="flex min-h-[42px] items-center justify-center gap-3 rounded-full border-2 border-[#e6bd3f] bg-gradient-to-r from-[#45156a] via-[#32134f] to-[#45156a] px-4 shadow-[0_12px_26px_rgba(30,8,50,0.28)]">
            <NavLink to="/" end className={navClass}><House size={19} aria-hidden="true" />Home</NavLink>
            <NavLink to="/shop" className={navClass}><ShoppingBag size={19} aria-hidden="true" />Shop</NavLink>
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setCategoryMenu((open) => !open)}
                aria-expanded={categoryMenu}
                className="my-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Grid2X2 size={19} aria-hidden="true" />
                Categories
                <ChevronDown size={14} className={`transition-transform ${categoryMenu ? "rotate-180" : ""}`} aria-hidden="true" />
              </button>
              {categoryMenu && (
                <div className="absolute left-0 top-full z-[60] mt-3 max-h-80 w-60 overflow-y-auto rounded-xl border border-border bg-white py-2 shadow-xl">
                  {categories.length ? categories.map((category) => (
                    <NavLink
                      key={category.id}
                      to={`/category/${category.slug || category.name}`}
                      onClick={() => setCategoryMenu(false)}
                      className="block px-4 py-2.5 text-sm text-gray-700 transition hover:bg-[#faf7ff] hover:text-primary"
                    >
                      {category.name}
                    </NavLink>
                  )) : <p className="px-4 py-3 text-sm text-gray-500">No categories available</p>}
                </div>
              )}
            </div>
            <NavLink to="/articles" className={navClass}><FileText size={19} aria-hidden="true" />Articles</NavLink>
            <NavLink to="/about" className={navClass}><Users size={19} aria-hidden="true" />About Us</NavLink>
            <NavLink to="/contactus" className={navClass}><Mail size={19} aria-hidden="true" />Contact Us</NavLink>
          </div>
        </div>
      </div>

      {mobileMenu && (
        <div className="absolute inset-x-0 top-full z-[55] max-h-[calc(100dvh-120px)] overflow-y-auto border-t border-[#eee7f5] bg-white shadow-xl lg:hidden">
          {!mobileCategory ? (
            <div className="space-y-2 p-4">
              <NavLink to="/" end onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><House size={18} />Home</NavLink>
              <NavLink to="/shop" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><ShoppingBag size={18} />Shop</NavLink>
              <button type="button" onClick={() => setMobileCategory(true)} className="flex w-full items-center justify-between rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary">
                <span className="flex items-center gap-3"><Grid2X2 size={18} />Categories</span><ChevronRight size={17} />
              </button>
              <NavLink to="/articles" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><FileText size={18} />Articles</NavLink>
              <NavLink to="/about" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><Users size={18} />About Us</NavLink>
              <NavLink to="/contactus" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><Phone size={18} />Contact Us</NavLink>
              <NavLink to="/termsandconditions" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><FileText size={18} />Terms &amp; Conditions</NavLink>
              <Link to="/ordersmain" onClick={() => setMobileMenu(false)} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><ShoppingCart size={18} />Track Order</Link>
              <div className="flex items-center justify-between border-t border-gray-100 pt-3 sm:hidden">
                {user ? (
                  <>
                    <Link to="/account" onClick={() => setMobileMenu(false)} className="flex items-center gap-2 text-sm font-semibold text-gray-700"><UserRound size={18} />My Account</Link>
                    <button type="button" onClick={() => setLogoutConfirm(true)} className="text-sm font-semibold text-red-500">Logout</button>
                  </>
                ) : <Link to="/login" onClick={() => setMobileMenu(false)} className="flex items-center gap-2 text-sm font-semibold text-primary"><UserRound size={18} />Sign in</Link>}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <button type="button" onClick={() => setMobileCategory(false)} className="mb-3 flex items-center gap-2 px-2 py-2 text-sm font-semibold text-primary"><ChevronRight size={17} className="rotate-180" />Back to menu</button>
              <div className="space-y-2">
                {categories.map((category) => (
                  <NavLink
                    key={category.id}
                    to={`/category/${category.slug || category.name}`}
                    onClick={() => { setMobileCategory(false); setMobileMenu(false); }}
                    className="flex items-center justify-between rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"
                  >
                    <span className="flex items-center gap-3"><Grid2X2 size={17} />{category.name}</span><ChevronRight size={16} />
                  </NavLink>
                ))}
                {!categories.length && <p className="px-3 py-5 text-center text-sm text-gray-500">No categories available</p>}
              </div>
            </div>
          )}
        </div>
      )}

      {logoutConfirm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-[320px] rounded-xl bg-white p-6 text-center shadow-xl">
            <h2 className="mb-2 text-lg font-semibold text-gray-800">Confirm Logout</h2>
            <p className="mb-6 text-sm text-gray-500">Are you sure you want to logout?</p>
            <div className="flex justify-center gap-4">
              <button type="button" onClick={() => setLogoutConfirm(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-100">Cancel</button>
              <button type="button" onClick={confirmLogout} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">Logout</button>
            </div>
          </div>
        </div>
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </nav>
  );
};

export default Navbar;
