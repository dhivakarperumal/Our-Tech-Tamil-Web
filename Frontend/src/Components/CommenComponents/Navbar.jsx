import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Grid2X2,
  Heart,
  House,
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
    `inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition ${
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
    <nav className="sticky top-0 z-50 bg-white shadow-[0_5px_18px_rgba(38,13,66,0.12)]">
      <PageContainer>
        <div className="flex min-h-[76px] items-center justify-between gap-4 py-3 lg:min-h-[82px]">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Our Tech home">
            <img
              src="/images/logo.jpeg"
              alt=""
              className="h-10 w-10 rounded-full bg-white object-cover ring-2 ring-fuchsia-600 ring-offset-2 ring-offset-white sm:h-12 sm:w-12"
            />
            <span className="ml-3 flex flex-col leading-none">
              <span className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
                Our <span className="text-fuchsia-600">Tech</span>
              </span>
              <span className="mt-1 text-[8px] font-bold uppercase tracking-[0.34em] text-gray-600 sm:text-[9px]">
                Gadgets Store
              </span>
            </span>
          </Link>

          <form onSubmit={submitSearch} role="search" className="hidden min-w-0 max-w-[600px] flex-1 lg:flex">
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

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={() => setWishlistOpen(true)}
              aria-label="Open wishlist"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary sm:h-11 sm:w-11"
            >
              <Heart size={20} aria-hidden="true" />
              {wishlist.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{wishlist.length > 9 ? "9+" : wishlist.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative flex h-10 w-10 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary sm:h-11 sm:w-11"
            >
              <ShoppingCart size={20} aria-hidden="true" />
              {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-700 px-1 text-[9px] font-bold text-white">{cart.length > 9 ? "9+" : cart.length}</span>}
            </button>
            <div className="hidden sm:block">{renderUserMenu()}</div>
            <button
              type="button"
              onClick={() => setMobileMenu((open) => !open)}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#eee7f5] text-[#2b1745] lg:hidden"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        <form onSubmit={submitSearch} role="search" className="pb-3 lg:hidden">
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

      <div className="relative hidden bg-gradient-to-r from-[#3d075d] via-[#220b3d] to-[#3d075d] py-2.5 lg:block">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-accent to-transparent" aria-hidden="true" />
        <div className="mx-auto max-w-[1050px] px-6">
          <div className="flex items-center justify-center gap-1 rounded-full border border-accent/70 bg-gradient-to-r from-[#32114e] via-[#200b38] to-[#32114e] px-4 py-1.5 shadow-[0_8px_18px_rgba(30,8,50,0.28)]">
            <NavLink to="/" end className={navClass}><House size={17} aria-hidden="true" />Home</NavLink>
            <NavLink to="/shop" className={navClass}><ShoppingBag size={17} aria-hidden="true" />Shop</NavLink>
            <div className="relative" ref={categoryRef}>
              <button
                type="button"
                onClick={() => setCategoryMenu((open) => !open)}
                aria-expanded={categoryMenu}
                className="inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Grid2X2 size={17} aria-hidden="true" />
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
            <NavLink to="/about" className={navClass}><Users size={17} aria-hidden="true" />About Us</NavLink>
            <NavLink to="/contactus" className={navClass}><Phone size={16} aria-hidden="true" />Contact Us</NavLink>
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
