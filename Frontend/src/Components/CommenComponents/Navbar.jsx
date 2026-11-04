import { useContext, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  ChevronRight,
  Boxes,
  FileText,
  Grid2X2,
  Heart,
  House,
  LogOut,
  Mail,
  Menu,
  Search,
  ShoppingBag,
  ShoppingCart,
  UserRound,
  Users,
  Video,
  X,
  Phone,
} from "lucide-react";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import api from "../../api";
import { fetchAllPublicProducts } from "../Products/publicProducts";
import PageContainer from "./PageContainer";
import CartDrawer from "./CartDrawer";
import WishlistDrawer from "./WishlistDrawer";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const { cart, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [userMenu, setUserMenu] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [categories, setCategories] = useState([]);
  const [publicProducts, setPublicProducts] = useState([]);
  const [categoryMenu, setCategoryMenu] = useState(false);
  const [activeCategoryType, setActiveCategoryType] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState("");
  const [mobileCategory, setMobileCategory] = useState(false);
  const [pagesMenu, setPagesMenu] = useState(false);
  const [mobilePages, setMobilePages] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [wishlistOpen, setWishlistOpen] = useState(false);
  const [searchState, setSearchState] = useState({ route: "", value: "" });
  const [searchOpen, setSearchOpen] = useState(false);
  const [suggestions, setSuggestions] = useState({
    query: "",
    products: [],
    loading: false,
    error: false,
  });
  const urlSearch = location.pathname === "/shop"
    ? new URLSearchParams(location.search).get("search") || ""
    : "";
  const isCategoryRoute = location.pathname === "/shop"
    && new URLSearchParams(location.search).has("category");
  const isProductDetailsRoute = location.pathname.startsWith("/product/");
  const isPagesRoute = ["/articles", "/youtube-videos", "/about", "/contactus", "/termsandconditions"]
    .some((route) => location.pathname === route || location.pathname.startsWith(`${route}/`));
  const currentRoute = `${location.pathname}${location.search}`;
  const search = searchState.route === currentRoute ? searchState.value : urlSearch;

  const menuRef = useRef(null);
  const categoryRef = useRef(null);
  const pagesRef = useRef(null);
  const searchInputRef = useRef(null);
  const suggestionQuery = search.trim();
  const currentSuggestions = suggestions.query === suggestionQuery ? suggestions : null;
  const normalizeCategoryValue = (value) => String(value || "").trim().toLowerCase();
  const categoriesWithProducts = categories.filter((category) => publicProducts.some((product) => {
    const categoryName = normalizeCategoryValue(category.name);
    const categoryMatches = [product.category, product.subcategory]
      .some((value) => normalizeCategoryValue(value) === categoryName);
    const productType = product.cat_type || product.category_type || category.categoryType || category.category_type;
    const typeMatches = !productType
      || normalizeCategoryValue(productType) === normalizeCategoryValue(category.categoryType || category.category_type);
    return categoryMatches && typeMatches;
  }));
  const categoryTypes = [...new Set(categoriesWithProducts.map((category) => category.categoryType || category.category_type || "General"))];
  const visibleTypeCategories = categoriesWithProducts.filter(
    (category) => (category.categoryType || category.category_type || "General") === (activeCategoryType || categoryTypes[0]),
  );
  const activeCategory = visibleTypeCategories.find((category) => String(category.id) === String(activeCategoryId))
    || visibleTypeCategories[0];
  const activeCategorySubcategories = activeCategory?.subcategory || [];

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
      if (pagesRef.current && !pagesRef.current.contains(event.target)) setPagesMenu(false);
      if (!(event.target instanceof Element) || !event.target.closest("[data-navbar-search]")) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (searchOpen) searchInputRef.current?.focus();
  }, [searchOpen]);

  useEffect(() => {
    if (!searchOpen || suggestionQuery.length < 2) return undefined;

    const controller = new AbortController();
    const timeoutId = setTimeout(async () => {
      try {
        const response = await api.get("/products/public", {
          params: { search: suggestionQuery, limit: 6 },
          signal: controller.signal,
        });
        if (!controller.signal.aborted) {
          setSuggestions({
            query: suggestionQuery,
            products: Array.isArray(response.data?.products) ? response.data.products : [],
            loading: false,
            error: false,
          });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to fetch product search suggestions:", error);
          setSuggestions({
            query: suggestionQuery,
            products: [],
            loading: false,
            error: true,
          });
        }
      }
    }, 250);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [searchOpen, suggestionQuery]);

  useEffect(() => {
    let active = true;

    Promise.all([api.get("/categories"), fetchAllPublicProducts()])
      .then(([response, products]) => {
        if (active) {
          setCategories(Array.isArray(response.data) ? response.data : []);
          setPublicProducts(products);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch navigation categories and products:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSearchChange = (event) => {
    const value = event.target.value;
    const query = value.trim();
    setSearchState({ route: currentRoute, value });
    setSearchOpen(true);
    setSuggestions({
      query,
      products: [],
      loading: query.length >= 2,
      error: false,
    });
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setSearchOpen(true);
  };

  const renderSearchSuggestions = (id) => {
    if (!searchOpen || !search.trim()) return null;

    return (
      <div
        role="listbox"
        id={id}
        aria-label="Product search suggestions"
        className="absolute left-0 right-0 top-full z-[70] mt-2 overflow-hidden rounded-xl border border-[#e7dff0] bg-white py-1 shadow-[0_12px_30px_rgba(38,13,66,0.2)]"
      >
        {suggestionQuery.length < 2 ? (
          <p className="px-4 py-3 text-sm text-gray-500">Type at least 2 characters to search.</p>
        ) : currentSuggestions?.loading || !currentSuggestions ? (
          <p className="px-4 py-3 text-sm text-gray-500">Searching products...</p>
        ) : currentSuggestions.error ? (
          <p className="px-4 py-3 text-sm text-red-600">Could not load suggestions. Please try again.</p>
        ) : currentSuggestions.products.length ? (
          <>
            {currentSuggestions.products.map((product) => (
              <button
                key={product.id}
                type="button"
                role="option"
                aria-selected="false"
                onClick={() => {
                  setSearchOpen(false);
                  setMobileMenu(false);
                  navigate(`/product/${product.id}`);
                }}
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left transition hover:bg-[#faf7ff]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-gray-800">{product.name}</span>
                  <span className="mt-0.5 block truncate text-xs text-gray-500">
                    {[product.brand, product.category || product.cat_type].filter(Boolean).join(" · ") || "View product"}
                  </span>
                </span>
                <span className="shrink-0 text-sm font-bold text-primary">
                  ₹{Number(product.offer_price ?? product.mrp ?? 0).toLocaleString("en-IN")}
                </span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                setSearchOpen(true);
              }}
              className="w-full border-t border-[#eee8f5] px-4 py-2.5 text-left text-xs font-bold text-primary hover:bg-[#faf7ff]"
            >
              See all search results
            </button>
          </>
        ) : (
          <p className="px-4 py-3 text-sm text-gray-500">No matching products found.</p>
        )}
      </div>
    );
  };

  const renderDesktopNavigation = () => (
    <div className="hidden min-w-0 flex-1 items-center justify-center xl:flex">
      <div className="flex min-h-[58px] items-center justify-center gap-1 rounded-full border-2 border-[#e6bd3f] bg-gradient-to-r from-secondary-dark via-primary to-gradient-middle px-14 shadow-[0_8px_20px_rgba(30,8,50,0.2)]">
        <NavLink to="/" end className={navClass}><House size={18} aria-hidden="true" />Home</NavLink>
        <NavLink
          to="/shop"
          className={({ isActive }) => navClass({
            isActive: (isActive && !isCategoryRoute) || isProductDetailsRoute,
          })}
        >
          <ShoppingBag size={18} aria-hidden="true" />Shop
        </NavLink>
        <NavLink to="/combos" className={navClass}><Boxes size={18} aria-hidden="true" />Combos</NavLink>
        <div
          className="relative"
          ref={categoryRef}
          onMouseEnter={() => setCategoryMenu(true)}
          onMouseLeave={() => setCategoryMenu(false)}
        >
          <button
            type="button"
            onClick={() => {
              setCategoryMenu(true);
              setActiveCategoryType(categoryTypes[0] || "");
              setActiveCategoryId("");
            }}
            aria-expanded={categoryMenu}
            className={`my-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold transition ${
              isCategoryRoute ? "bg-gradient-to-r from-accent to-[#ffe98a] text-[#29104b] shadow-sm" : "text-white hover:bg-white/10"
            }`}
          >
            <Grid2X2 size={18} aria-hidden="true" />
            Categories
            <ChevronDown size={14} className={`transition-transform ${categoryMenu ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {categoryMenu && (
            <div className="absolute right-0 mt-3 top-full z-[60] w-[680px] overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-[0_18px_45px_rgba(37,12,69,0.2)] ring-1 ring-black/5 xl:right-auto xl:left-1/2 xl:translate-x-[-34%]">
              <div className="bg-gradient-to-r from-secondary-dark via-primary to-gradient-middle px-4 py-3 text-white">
                <p className="text-sm font-bold">Shop by category</p>
                <p className="mt-0.5 text-[11px] text-white/75">Browse category types, categories, and subcategories</p>
              </div>
              <div className="grid min-h-64 grid-cols-3 divide-x divide-[#eee8f5]">
                <div className="max-h-80 overflow-y-auto p-2">
                  {categoryTypes.length ? categoryTypes.map((categoryType) => (
                    <button
                      key={categoryType}
                      type="button"
                      onMouseEnter={() => {
                        setActiveCategoryType(categoryType);
                        setActiveCategoryId("");
                      }}
                      onFocus={() => {
                        setActiveCategoryType(categoryType);
                        setActiveCategoryId("");
                      }}
                      className={`group flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        (activeCategoryType || categoryTypes[0]) === categoryType
                          ? "bg-[#f3eaff] font-semibold text-primary"
                          : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"
                      }`}
                    >
                      <span className="truncate">{categoryType}</span>
                      <ChevronRight size={15} className="shrink-0 text-gray-400 group-hover:text-primary" aria-hidden="true" />
                    </button>
                  )) : <p className="px-3 py-5 text-center text-sm text-gray-500">No categories available</p>}
                </div>
                <div className="max-h-80 space-y-1 overflow-y-auto p-2">
                  {visibleTypeCategories.map((category) => (
                    <NavLink
                      key={category.id}
                      to={`/shop?category=${encodeURIComponent(category.name)}`}
                      onMouseEnter={() => setActiveCategoryId(String(category.id))}
                      onFocus={() => setActiveCategoryId(String(category.id))}
                      onClick={() => setCategoryMenu(false)}
                      className={({ isActive }) =>
                        `group flex items-center justify-between rounded-xl px-3 py-2.5 text-sm transition ${
                          isActive || String(activeCategory?.id) === String(category.id)
                            ? "bg-[#f3eaff] font-semibold text-primary"
                            : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"
                        }`
                      }
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f3eaff] text-primary transition group-hover:bg-primary group-hover:text-white">
                          <Grid2X2 size={15} aria-hidden="true" />
                        </span>
                        <span className="truncate">{category.name}</span>
                      </span>
                      <ChevronRight size={15} className="shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                    </NavLink>
                  ))}
                </div>
                <div className="max-h-80 overflow-y-auto p-2">
                  {activeCategorySubcategories.length ? activeCategorySubcategories.map((subcategory) => (
                    <NavLink
                      key={subcategory}
                      to={`/shop?category=${encodeURIComponent(activeCategory.name)}&subcategory=${encodeURIComponent(subcategory)}`}
                      onClick={() => setCategoryMenu(false)}
                      className="flex items-center justify-between rounded-xl px-3 py-2.5 text-sm text-gray-700 transition hover:bg-[#faf7ff] hover:text-primary"
                    >
                      <span className="truncate">{subcategory}</span>
                      <ChevronRight size={15} className="shrink-0 text-gray-400" aria-hidden="true" />
                    </NavLink>
                  )) : (
                    <p className="px-3 py-5 text-center text-sm text-gray-500">
                      {activeCategory ? "No subcategories available" : "Choose a category"}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
        <div className="relative" ref={pagesRef}>
          <button
            type="button"
            onClick={() => setPagesMenu((open) => !open)}
            aria-expanded={pagesMenu}
            className={`my-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-3 py-2.5 text-sm font-semibold transition ${
              isPagesRoute ? "bg-gradient-to-r from-accent to-[#ffe98a] text-[#29104b] shadow-sm" : "text-white hover:bg-white/10"
            }`}
          >
            <FileText size={18} aria-hidden="true" />
            Pages
            <ChevronDown size={14} className={`transition-transform ${pagesMenu ? "rotate-180" : ""}`} aria-hidden="true" />
          </button>
          {pagesMenu && (
            <div className="absolute right-0 top-full z-[60] mt-3 w-64 overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-[0_18px_45px_rgba(37,12,69,0.2)] ring-1 ring-black/5">
              <div className="bg-gradient-to-r from-secondary-dark via-primary to-gradient-middle px-4 py-3 text-white">
                <p className="text-sm font-bold">Explore Our Store</p>
                <p className="mt-0.5 text-[11px] text-white/75">More about us and what we offer</p>
              </div>
              <div className="space-y-1 p-2">
                <NavLink to="/articles" onClick={() => setPagesMenu(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-[#f3eaff] font-semibold text-primary" : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><FileText size={17} /></span>
                  <span className="flex-1">Articles</span><ChevronRight size={15} className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </NavLink>
                <NavLink to="/youtube-videos" onClick={() => setPagesMenu(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-[#f3eaff] font-semibold text-primary" : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><Video size={17} /></span>
                  <span className="flex-1">YouTube Videos</span><ChevronRight size={15} className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </NavLink>
                <NavLink to="/about" onClick={() => setPagesMenu(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-[#f3eaff] font-semibold text-primary" : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><Users size={17} /></span>
                  <span className="flex-1">About Us</span><ChevronRight size={15} className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </NavLink>
                <NavLink to="/contactus" onClick={() => setPagesMenu(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-[#f3eaff] font-semibold text-primary" : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><Mail size={17} /></span>
                  <span className="flex-1">Contact Us</span><ChevronRight size={15} className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </NavLink>
                <NavLink to="/termsandconditions" onClick={() => setPagesMenu(false)} className={({ isActive }) => `group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${isActive ? "bg-[#f3eaff] font-semibold text-primary" : "text-gray-700 hover:bg-[#faf7ff] hover:text-primary"}`}>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#f3eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><FileText size={17} /></span>
                  <span className="flex-1">Terms &amp; Conditions</span><ChevronRight size={15} className="text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary" />
                </NavLink>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const navClass = ({ isActive }) =>
    `my-1 inline-flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition ${
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
    <>
      <nav className="sticky top-0 z-50 bg-white shadow-[0_5px_18px_rgba(38,13,66,0.12)]">
      <PageContainer>
        <div className="flex min-h-[78px] items-center justify-between gap-3 py-2 lg:min-h-[82px]">
          <Link to="/" className="flex shrink-0 items-center" aria-label="Our Tech home">
            <img
              src="/images/logo.jpeg"
              alt=""
              className="h-9 w-9 rounded-full bg-white object-cover ring-2 ring-fuchsia-600 ring-offset-1 ring-offset-white sm:h-10 sm:w-10"
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

          {renderDesktopNavigation()}

          <span className="hidden h-12 w-px shrink-0 bg-[#d8cce4] xl:block" aria-hidden="true" />

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <div className="relative" data-navbar-search>
              <button
                type="button"
                onClick={() => setSearchOpen((open) => !open)}
                aria-label={searchOpen ? "Close product search" : "Open product search"}
                aria-expanded={searchOpen}
                aria-controls="navbar-product-search"
                className={`relative flex h-9 w-9 items-center justify-center rounded-full border border-[#eee7f5] bg-white shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 sm:h-9 sm:w-9 ${
                  searchOpen ? "text-primary" : "text-[#2b1745] hover:text-primary"
                }`}
              >
                <Search size={20} aria-hidden="true" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => setWishlistOpen(true)}
              aria-label="Open wishlist"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary sm:h-9 sm:w-9"
            >
              <Heart size={20} aria-hidden="true" />
              {wishlist.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">{wishlist.length > 9 ? "9+" : wishlist.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              aria-label="Open cart"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] transition hover:-translate-y-0.5 hover:text-primary sm:h-9 sm:w-9"
            >
              <ShoppingCart size={20} aria-hidden="true" />
              {cart.length > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-700 px-1 text-[9px] font-bold text-white">{cart.length > 9 ? "9+" : cart.length}</span>}
            </button>
            <div className="hidden sm:block">{renderUserMenu()}</div>
            <button
              type="button"
              onClick={() => setMobileMenu((open) => !open)}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-[#eee7f5] bg-white text-[#2b1745] shadow-[0_3px_10px_rgba(34,12,60,0.10)] xl:hidden"
              aria-label={mobileMenu ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenu}
            >
              {mobileMenu ? <X size={21} /> : <Menu size={21} />}
            </button>
          </div>
        </div>

        {searchOpen && (
          <form
            id="navbar-product-search"
            onSubmit={submitSearch}
            role="search"
            data-navbar-search
            className="relative mx-auto w-full max-w-[900px] pb-2 pt-1"
          >
            <label htmlFor="navbar-product-search-input" className="sr-only">Search products</label>
            <div className="flex items-center overflow-hidden rounded-full border border-[#e7dff0] bg-white shadow-inner focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
              <Search size={18} className="ml-4 shrink-0 text-[#4c3b64]" aria-hidden="true" />
              <input
                ref={searchInputRef}
                id="navbar-product-search-input"
                value={search}
                onChange={handleSearchChange}
                onKeyDown={(event) => {
                  if (event.key === "Escape") setSearchOpen(false);
                }}
                placeholder="Search for products, brands and more..."
                aria-autocomplete="list"
                aria-controls="navbar-product-suggestions"
                className="min-w-0 flex-1 bg-transparent px-3 py-2.5 text-sm text-gray-800 outline-none placeholder:text-gray-500"
              />
              <button
                type="submit"
                className="bg-gradient-to-r from-[#9d1db9] to-[#4b00c8] px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
              >
                Search
              </button>
            </div>
            {renderSearchSuggestions("navbar-product-suggestions")}
          </form>
        )}

      </PageContainer>

      {mobileMenu && (
        <div className="absolute inset-x-0 top-full z-[55] max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-[#eee7f5] bg-gradient-to-b from-white to-[#faf8ff] shadow-[0_18px_35px_rgba(38,13,66,0.14)] xl:hidden">
          {!mobileCategory && !mobilePages ? (
            <div className="space-y-2.5 p-4">
              <NavLink to="/" end onClick={() => setMobileMenu(false)} className={({ isActive }) => `flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? "border-violet-200 bg-violet-50 text-primary" : "border-[#eee7f5] bg-white text-gray-800 hover:border-violet-200 hover:bg-violet-50"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-primary"><House size={18} /></span>Home</NavLink>
              <NavLink to="/shop" onClick={() => setMobileMenu(false)} className={({ isActive }) => `flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${(isActive || isProductDetailsRoute) ? "border-violet-200 bg-violet-50 text-primary" : "border-[#eee7f5] bg-white text-gray-800 hover:border-violet-200 hover:bg-violet-50"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-primary"><ShoppingBag size={18} /></span>Shop</NavLink>
              <NavLink to="/combos" onClick={() => setMobileMenu(false)} className={({ isActive }) => `flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${isActive ? "border-violet-200 bg-violet-50 text-primary" : "border-[#eee7f5] bg-white text-gray-800 hover:border-violet-200 hover:bg-violet-50"}`}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-primary"><Boxes size={18} /></span>Combo Offers</NavLink>
              <button type="button" onClick={() => setMobileCategory(true)} className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:border-violet-200 hover:bg-violet-50 ${isCategoryRoute ? "border-violet-200 bg-violet-50 text-primary" : "border-[#eee7f5] bg-white text-gray-800"}`}>
                <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-primary"><Grid2X2 size={18} /></span>Categories</span><ChevronRight size={18} className="text-violet-500" />
              </button>
              <button type="button" onClick={() => setMobilePages(true)} className={`flex min-h-14 w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-semibold transition hover:border-violet-200 hover:bg-violet-50 ${isPagesRoute ? "border-violet-200 bg-violet-50 text-primary" : "border-[#eee7f5] bg-white text-gray-800"}`}>
                <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-primary"><FileText size={18} /></span>Pages</span><ChevronRight size={18} className="text-violet-500" />
              </button>
              <div className="mt-1 flex flex-col items-center gap-2 rounded-2xl border border-[#eee7f5] bg-white px-4 py-3 sm:hidden">
                {user ? (
                  <>
                    <Link to="/account" onClick={() => setMobileMenu(false)} className="flex min-h-10 w-full items-center gap-3 text-sm font-semibold text-gray-700"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><UserRound size={18} /></span>My Account</Link>
                    <button type="button" onClick={() => setLogoutConfirm(true)} className="rounded-full bg-rose-50 px-4 py-2 text-xs font-bold text-rose-600 transition hover:bg-rose-100">Logout</button>
                  </>
                ) : <Link to="/login" onClick={() => setMobileMenu(false)} className="flex min-h-10 w-full items-center gap-3 text-sm font-semibold text-primary"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100"><UserRound size={18} /></span>Sign in</Link>}
              </div>
            </div>
          ) : mobileCategory ? (
            <div className="p-4">
              <button type="button" onClick={() => setMobileCategory(false)} className="mb-3 flex items-center gap-2 px-2 py-2 text-sm font-semibold text-primary"><ChevronRight size={17} className="rotate-180" />Back to menu</button>
              <div className="space-y-2">
                {categoriesWithProducts.map((category) => (
                  <NavLink
                    key={category.id}
                    to={`/shop?category=${encodeURIComponent(category.name)}`}
                    onClick={() => { setMobileCategory(false); setMobileMenu(false); }}
                    className="flex items-center justify-between rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"
                  >
                    <span className="flex items-center gap-3"><Grid2X2 size={17} />{category.name}</span><ChevronRight size={16} />
                  </NavLink>
                ))}
                {!categoriesWithProducts.length && <p className="px-3 py-5 text-center text-sm text-gray-500">No categories with available products</p>}
              </div>
            </div>
          ) : (
            <div className="p-4">
              <button type="button" onClick={() => setMobilePages(false)} className="mb-3 flex items-center gap-2 px-2 py-2 text-sm font-semibold text-primary"><ChevronRight size={17} className="rotate-180" />Back to menu</button>
              <div className="space-y-2">
                <NavLink to="/articles" onClick={() => { setMobilePages(false); setMobileMenu(false); }} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><FileText size={18} />Articles</NavLink>
                <NavLink to="/youtube-videos" onClick={() => { setMobilePages(false); setMobileMenu(false); }} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><Video size={18} />YouTube Videos</NavLink>
                <NavLink to="/about" onClick={() => { setMobilePages(false); setMobileMenu(false); }} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><Users size={18} />About Us</NavLink>
                <NavLink to="/contactus" onClick={() => { setMobilePages(false); setMobileMenu(false); }} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><Phone size={18} />Contact Us</NavLink>
                <NavLink to="/termsandconditions" onClick={() => { setMobilePages(false); setMobileMenu(false); }} className="flex items-center gap-3 rounded-xl bg-[#faf7ff] px-4 py-3 text-sm font-semibold text-gray-800 hover:text-primary"><FileText size={18} />Terms &amp; Conditions</NavLink>
              </div>
            </div>
          )}
        </div>
      )}
      </nav>

      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-[#150528]/55 p-4 backdrop-blur-sm"
          onClick={(event) => {
            if (event.target === event.currentTarget) setLogoutConfirm(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="navbar-logout-dialog-title"
            className="w-full max-w-md overflow-hidden rounded-3xl border border-[#ead8ff] bg-white shadow-[0_30px_100px_rgba(27,4,53,0.35)]"
          >
            <header className="bg-white px-6 pb-5 pt-6 text-center sm:px-8">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#8509c9] to-[#5900a8] text-white shadow-md shadow-purple-200">
                <LogOut size={23} />
              </span>
              <h2 id="navbar-logout-dialog-title" className="mt-4 text-xl font-extrabold text-[#1a0745]">Sign out of your account?</h2>
              <p className="mt-1 text-sm text-slate-500">You can sign back in anytime to access your account.</p>
            </header>
            <div className="flex flex-col-reverse justify-center gap-3 bg-[#fdfbff] p-5 sm:flex-row sm:p-6">
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="cursor-pointer rounded-xl border border-[#e4d7f1] bg-white px-5 py-2.5 text-sm font-bold text-[#51446a] transition hover:border-[#caa8e8] hover:bg-[#f8f2ff]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLogout}
                className="cursor-pointer rounded-xl bg-gradient-to-r from-[#8509c9] to-[#5900a8] px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-200 transition hover:brightness-110"
              >
                Logout
              </button>
            </div>
          </section>
        </div>
      )}

      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <WishlistDrawer isOpen={wishlistOpen} onClose={() => setWishlistOpen(false)} />
    </>
  );
};

export default Navbar;
