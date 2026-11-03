import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Grid2X2,
  List,
  Search,
  SlidersHorizontal,
  Star,
  Tag,
  X,
} from "lucide-react";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import ProductCard from "../Products/ProductCard";
import { fetchAllPublicProducts } from "../Products/publicProducts";

function getCategory(product) {
  return [product.cat_type, product.category].filter(Boolean).join(" · ") || "Other";
}

function getPrice(product) {
  return Number(product.offer_price ?? product.mrp) || 0;
}

function getDiscount(product) {
  const mrp = Number(product.mrp) || 0;
  const price = getPrice(product);
  return mrp > price ? Math.round(((mrp - price) / mrp) * 100) : 0;
}

function FilterSection({ title, icon: Icon, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="border-t border-[#eee8f5] py-3">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left text-[13px] font-bold text-[#211936]"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
      >
        <span className="flex items-center gap-2">
          {Icon && <Icon size={15} className="text-[#4b00c8]" aria-hidden="true" />}
          {title}
        </span>
        <ChevronDown
          size={15}
          className={`text-[#837a91] transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden="true"
        />
      </button>
      {open && <div className="pt-3">{children}</div>}
    </section>
  );
}

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const productsRef = useRef(null);
  const [searchParams] = useSearchParams();
  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const [localSearchState, setLocalSearchState] = useState(() => ({
    urlSearch,
    value: urlSearch,
  }));
  const localSearch = localSearchState.urlSearch === urlSearch ? localSearchState.value : urlSearch;
  const effectiveSearchQuery = localSearch.trim().toLowerCase();
  const [selectedCategories, setSelectedCategories] = useState(() => urlCategory ? [urlCategory] : []);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [brandSearch, setBrandSearch] = useState("");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(null);
  const [minRating, setMinRating] = useState(0);
  const [discountOnly, setDiscountOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [sortBy, setSortBy] = useState("popular");
  const [pagination, setPagination] = useState({ filterKey: "", page: 1 });
  const [listView, setListView] = useState(false);
  const [isDesktop, setIsDesktop] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const [filtersOpen, setFiltersOpen] = useState(
    () => typeof window !== "undefined" && window.innerWidth >= 1024,
  );
  const [showAllCategories, setShowAllCategories] = useState(() => Boolean(urlCategory));
  const [showAllBrands, setShowAllBrands] = useState(false);
  const productsPerPage = isDesktop && filtersOpen ? 8 : 10;

  useEffect(() => {
    const desktopQuery = window.matchMedia("(min-width: 1024px)");
    const handleBreakpointChange = (event) => {
      setIsDesktop(event.matches);
      setFiltersOpen(event.matches);
    };

    desktopQuery.addEventListener("change", handleBreakpointChange);
    return () => desktopQuery.removeEventListener("change", handleBreakpointChange);
  }, []);

  useEffect(() => {
    if (!filtersOpen || isDesktop) return undefined;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [filtersOpen, isDesktop]);

  useEffect(() => {
    let active = true;

    fetchAllPublicProducts()
      .then((allProducts) => {
        if (active) setProducts(allProducts);
      })
      .catch((error) => {
        console.error("Failed to fetch shop products:", error);
        if (active) setFetchFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const priceLimit = useMemo(
    () => Math.max(100, ...products.map(getPrice)),
    [products],
  );
  const currentMaxPrice = maxPrice ?? priceLimit;

  const categories = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      const category = getCategory(product);
      counts.set(category, (counts.get(category) || 0) + 1);
    });
    return [...counts.entries()].sort((first, second) => first[0].localeCompare(second[0]));
  }, [products]);

  const brands = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      if (product.brand) counts.set(product.brand, (counts.get(product.brand) || 0) + 1);
    });
    return [...counts.entries()].sort((first, second) => first[0].localeCompare(second[0]));
  }, [products]);

  const filteredProducts = useMemo(() => {
    const matching = products.filter((product) => {
      const category = getCategory(product);
      const price = getPrice(product);
      const rating = Number(product.rating) || 0;
      const available = Number(product.total_stock) > 0
        || String(product.stock_status || "").toLowerCase() === "in stock";
      const matchesSearch = !effectiveSearchQuery
        || [
          product.name,
          product.product_code,
          product.model_number,
          product.category,
          product.cat_type,
          product.subcategory,
          product.brand,
          product.description,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(effectiveSearchQuery));

      return matchesSearch
        && (!selectedCategories.length || selectedCategories.includes(category))
        && (!selectedBrands.length || selectedBrands.includes(product.brand))
        && price >= minPrice
        && price <= currentMaxPrice
        && (!minRating || rating >= minRating)
        && (!discountOnly || getDiscount(product) > 0)
        && (!inStockOnly || available);
    });

    if (sortBy === "price-low") matching.sort((first, second) => getPrice(first) - getPrice(second));
    if (sortBy === "price-high") matching.sort((first, second) => getPrice(second) - getPrice(first));
    if (sortBy === "rating") matching.sort((first, second) => (Number(second.rating) || 0) - (Number(first.rating) || 0));
    if (sortBy === "discount") matching.sort((first, second) => getDiscount(second) - getDiscount(first));

    return matching;
  }, [
    products,
    effectiveSearchQuery,
    selectedCategories,
    selectedBrands,
    minPrice,
    currentMaxPrice,
    minRating,
    discountOnly,
    inStockOnly,
    sortBy,
  ]);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / productsPerPage));
  const filterKey = JSON.stringify({
    effectiveSearchQuery,
    selectedCategories,
    selectedBrands,
    minPrice,
    currentMaxPrice,
    minRating,
    discountOnly,
    inStockOnly,
    sortBy,
    productsPerPage,
  });
  const page = pagination.filterKey === filterKey
    ? Math.min(pagination.page, totalPages)
    : 1;
  const visibleProducts = filteredProducts.slice((page - 1) * productsPerPage, page * productsPerPage);
  const activeFiltersCount = selectedCategories.length + selectedBrands.length
    + (minPrice > 0 || currentMaxPrice < priceLimit ? 1 : 0)
    + (minRating > 0 ? 1 : 0) + Number(discountOnly) + Number(inStockOnly);

  const toggleValue = (value, values, setValues) => {
    setValues(values.includes(value)
      ? values.filter((item) => item !== value)
      : [...values, value]);
  };

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setMinPrice(0);
    setMaxPrice(null);
    setMinRating(0);
    setDiscountOnly(false);
    setInStockOnly(false);
    setBrandSearch("");
  };

  const categoryOptions = showAllCategories ? categories : categories.slice(0, 5);
  const brandOptions = (showAllBrands ? brands : brands.slice(0, 5))
    .filter(([brand]) => brand.toLowerCase().includes(brandSearch.toLowerCase()));
  const firstProduct = filteredProducts.length ? (page - 1) * productsPerPage + 1 : 0;
  const lastProduct = Math.min(page * productsPerPage, filteredProducts.length);
  const changePage = (nextPage) => {
    setPagination({ filterKey, page: Math.max(1, Math.min(nextPage, totalPages)) });
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <PageHeader title="Shop" />
      <PageContainer className="!max-w-[1700px] px-3 py-5 sm:px-5 sm:py-7 lg:px-6">
        <section aria-labelledby="shop-heading" className="text-[#211936]">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 id="shop-heading" className="text-xl font-extrabold tracking-tight sm:text-2xl">
              {effectiveSearchQuery ? `Search Results for "${localSearch.trim()}"` : "Shop All Products"}
            </h1>
            {!loading && !fetchFailed && (
              <p className="mt-1 text-xs text-[#70677d] sm:text-[13px]">
                Showing {firstProduct}–{lastProduct} of {filteredProducts.length} products
              </p>
            )}
          </div>

          <div className="flex w-full items-center gap-2 sm:w-auto">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-[#e9e1f2] bg-white px-3 py-2 text-xs text-[#8a8198] shadow-sm sm:w-56 sm:flex-none">
              <Search size={14} aria-hidden="true" />
              <span className="sr-only">Search in this category</span>
              <input
                type="search"
                placeholder="Search in this category..."
                value={localSearch}
                onChange={(event) => setLocalSearchState({ urlSearch, value: event.target.value })}
                aria-label="Search in this category"
                className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-[#9b93a8]"
              />
              <Search size={13} className="text-[#a198af]" aria-hidden="true" />
            </label>
            <label className="flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-[#625970] sm:text-xs">
             
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="max-w-[116px] rounded-lg border border-[#e9e1f2] bg-white px-2.5 py-2 text-xs font-semibold text-[#33284a] outline-none focus:border-[#4b00c8]"
              >
                <option value="popular">Popular</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
                <option value="discount">Best Discount</option>
              </select>
            </label>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls={filtersOpen ? "shop-filters" : undefined}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-lg border px-2.5 py-2 text-xs font-semibold transition ${
                filtersOpen
                  ? "border-[#4b00c8] bg-[#f3eaff] text-[#4b00c8]"
                  : "border-[#e9e1f2] bg-white text-[#625970] hover:border-[#4b00c8] hover:text-[#4b00c8]"
              }`}
            >
              <SlidersHorizontal size={14} aria-hidden="true" />
              Filters
              {activeFiltersCount > 0 && (
                <span className="rounded-full bg-[#4b00c8] px-1.5 py-0.5 text-[10px] text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
            {/* <div className="hidden items-center rounded-lg border border-[#e9e1f2] bg-white p-1 sm:flex">
              <button
                type="button"
                aria-label="Grid view"
                aria-pressed={!listView}
                onClick={() => setListView(false)}
                className={`rounded-md p-1.5 ${!listView ? "bg-[#4b00c8] text-white" : "text-[#81778f] hover:text-[#4b00c8]"}`}
              >
                <Grid2X2 size={15} aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="List view"
                aria-pressed={listView}
                onClick={() => setListView(true)}
                className={`rounded-md p-1.5 ${listView ? "bg-[#4b00c8] text-white" : "text-[#81778f] hover:text-[#4b00c8]"}`}
              >
                <List size={15} aria-hidden="true" />
              </button>
            </div> */}
          </div>
        </div>

        <div className={`grid items-start gap-4 ${filtersOpen ? "lg:grid-cols-[230px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]" : "grid-cols-1"}`}>
          {filtersOpen && (
          <>
          {!isDesktop && (
            <button
              type="button"
              aria-label="Close filters"
              onClick={() => setFiltersOpen(false)}
              className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-[1px] lg:hidden"
            />
          )}
          <aside
            id="shop-filters"
            className={`rounded-xl border border-[#eee8f5] bg-white p-3 shadow-[0_4px_18px_rgba(54,22,93,0.06)] sm:p-4 ${
              isDesktop
                ? "lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto"
                : "fixed inset-x-3 top-28 z-50 max-h-[calc(100dvh-8rem)] overflow-y-auto"
            }`}
            role={isDesktop ? undefined : "dialog"}
            aria-modal={isDesktop ? undefined : true}
            aria-labelledby="shop-filters-heading"
          >
            <div className="mb-1 flex items-center justify-between gap-2 pb-2">
              <h2 className="flex items-center gap-2 text-sm font-extrabold">
                <span id="shop-filters-heading" className="flex items-center gap-2">
                <SlidersHorizontal size={15} className="text-[#4b00c8]" aria-hidden="true" />
                Filters
                </span>
                {activeFiltersCount > 0 && (
                  <span className="rounded-full bg-[#f0e8ff] px-1.5 py-0.5 text-[10px] text-[#4b00c8]">
                    {activeFiltersCount}
                  </span>
                )}
              </h2>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-[11px] font-bold text-[#4b00c8] hover:underline"
                >
                  Clear All
                </button>
                {!isDesktop && (
                  <button
                    type="button"
                    aria-label="Close filters"
                    onClick={() => setFiltersOpen(false)}
                    className="rounded-md p-1 text-[#625970] hover:bg-[#f3eaff] hover:text-[#4b00c8]"
                  >
                    <X size={17} aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>

            <FilterSection title="Categories" icon={Grid2X2}>
              <div className="space-y-2">
                {categoryOptions.map(([category, count]) => (
                  <label key={category} className="flex cursor-pointer items-center gap-2 text-[11px] text-[#504760]">
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => toggleValue(category, selectedCategories, setSelectedCategories)}
                      className="h-3.5 w-3.5 accent-[#4b00c8]"
                    />
                    <span className="min-w-0 flex-1 truncate">{category}</span>
                    <span className="text-[10px] text-[#8d8499]">({count})</span>
                  </label>
                ))}
                {categories.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllCategories((current) => !current)}
                    className="pt-0.5 text-[10px] font-bold text-[#4b00c8]"
                  >
                    {showAllCategories ? "Show Less" : "Show More"}
                  </button>
                )}
              </div>
            </FilterSection>

            <FilterSection title="Price Range" icon={Tag}>
              <div className="flex items-center justify-between text-[10px] font-semibold text-[#70677d]">
                <span>₹{minPrice.toLocaleString("en-IN")}</span>
                <span>₹{currentMaxPrice.toLocaleString("en-IN")}</span>
              </div>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-[10px] text-[#70677d]">
                  Min
                  <input
                    type="range"
                    min="0"
                    max={priceLimit}
                    value={Math.min(minPrice, currentMaxPrice)}
                    onChange={(event) => setMinPrice(Math.min(Number(event.target.value), currentMaxPrice))}
                    aria-label="Minimum price"
                    className="h-1 w-full cursor-pointer accent-[#4b00c8]"
                  />
                </label>
                <label className="flex items-center gap-2 text-[10px] text-[#70677d]">
                  Max
                  <input
                    type="range"
                    min="0"
                    max={priceLimit}
                    value={currentMaxPrice}
                    onChange={(event) => setMaxPrice(Math.max(Number(event.target.value), minPrice))}
                    aria-label="Maximum price"
                    className="h-1 w-full cursor-pointer accent-[#4b00c8]"
                  />
                </label>
              </div>
            </FilterSection>

            <FilterSection title="Brand" icon={Tag}>
              <label className="flex items-center gap-2 rounded-md border border-[#eee8f5] px-2 py-1.5 text-[#8a8198]">
                <Search size={12} aria-hidden="true" />
                <span className="sr-only">Search brands</span>
                <input
                  type="search"
                  placeholder="Search brand..."
                  value={brandSearch}
                  onChange={(event) => setBrandSearch(event.target.value)}
                  className="min-w-0 flex-1 text-[10px] outline-none placeholder:text-[#9b93a8]"
                />
              </label>
              <div className="mt-3 space-y-2">
                {brandOptions.map(([brand, count]) => (
                  <label key={brand} className="flex cursor-pointer items-center gap-2 text-[11px] text-[#504760]">
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => toggleValue(brand, selectedBrands, setSelectedBrands)}
                      className="h-3.5 w-3.5 accent-[#4b00c8]"
                    />
                    <span className="min-w-0 flex-1 truncate">{brand}</span>
                    <span className="text-[10px] text-[#8d8499]">({count})</span>
                  </label>
                ))}
                {brands.length > 5 && (
                  <button
                    type="button"
                    onClick={() => setShowAllBrands((current) => !current)}
                    className="pt-0.5 text-[10px] font-bold text-[#4b00c8]"
                  >
                    {showAllBrands ? "Show Less" : "Show More"}
                  </button>
                )}
                {brandOptions.length === 0 && (
                  <p className="text-[10px] text-[#8d8499]">No brands found.</p>
                )}
              </div>
            </FilterSection>

            <FilterSection title="Rating" icon={Star} defaultOpen={false}>
              <div className="space-y-2">
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="flex cursor-pointer items-center gap-2 text-[11px] text-[#504760]">
                    <input
                      type="radio"
                      name="shop-rating"
                      checked={minRating === rating}
                      onChange={() => setMinRating(rating)}
                      className="h-3.5 w-3.5 accent-[#4b00c8]"
                    />
                    <span className="flex items-center gap-1">{rating}+ <Star size={11} className="fill-[#f3b51b] text-[#f3b51b]" aria-hidden="true" /></span>
                  </label>
                ))}
                {minRating > 0 && (
                  <button type="button" onClick={() => setMinRating(0)} className="text-[10px] font-bold text-[#4b00c8]">
                    Clear rating
                  </button>
                )}
              </div>
            </FilterSection>

            <FilterSection title="Discount" icon={Tag} defaultOpen={false}>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#504760]">
                <input
                  type="checkbox"
                  checked={discountOnly}
                  onChange={(event) => setDiscountOnly(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#4b00c8]"
                />
                On sale
              </label>
            </FilterSection>

            <FilterSection title="Availability" icon={X} defaultOpen={false}>
              <label className="flex cursor-pointer items-center gap-2 text-[11px] text-[#504760]">
                <input
                  type="checkbox"
                  checked={inStockOnly}
                  onChange={(event) => setInStockOnly(event.target.checked)}
                  className="h-3.5 w-3.5 accent-[#4b00c8]"
                />
                In stock
              </label>
            </FilterSection>
          </aside>
          </>
          )}

          <div ref={productsRef} className="min-w-0 scroll-mt-24">
            {loading ? (
              <div className={`grid gap-3 sm:gap-4 ${filtersOpen ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"}`}>
                {Array.from({ length: 10 }, (_, index) => (
                  <div key={index} className="h-[270px] animate-pulse rounded-xl border border-[#eee8f5] bg-[#faf8ff]" aria-hidden="true" />
                ))}
              </div>
            ) : fetchFailed ? (
              <p className="rounded-xl border border-[#eee8f5] bg-white px-4 py-8 text-center text-sm text-[#70677d]">
                Products could not be loaded. Please try again later.
              </p>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-xl border border-[#eee8f5] bg-white px-4 py-10 text-center">
                <p className="text-sm font-bold text-[#33284a]">
                  {effectiveSearchQuery ? "No products matched your search." : "No products match these filters."}
                </p>
                <button type="button" onClick={clearFilters} className="mt-2 text-xs font-bold text-[#4b00c8] hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className={`grid gap-3 sm:gap-4 ${listView ? "grid-cols-1" : filtersOpen ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6"}`}>
                  {visibleProducts.map((product) => (
                    <ProductCard key={product.id} product={product} compact dense horizontal={listView} />
                  ))}
                </div>
                {totalPages > 1 && (
                  <nav aria-label="Product pages" className="mt-6 flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Previous page"
                      disabled={page === 1}
                      onClick={() => changePage(page - 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9e1f2] bg-white text-[#766c84] transition hover:border-[#4b00c8] hover:text-[#4b00c8] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronLeft size={15} aria-hidden="true" />
                    </button>
                    {Array.from({ length: totalPages }, (_, index) => index + 1)
                      .filter((pageNumber) => pageNumber === 1 || pageNumber === totalPages || Math.abs(pageNumber - page) <= 1)
                      .map((pageNumber, index, pages) => (
                        <span key={pageNumber} className="contents">
                          {index > 0 && pageNumber - pages[index - 1] > 1 && (
                            <span className="px-1 text-xs text-[#8a8198]" aria-hidden="true">…</span>
                          )}
                          <button
                            type="button"
                            aria-label={`Page ${pageNumber}`}
                            aria-current={pageNumber === page ? "page" : undefined}
                            onClick={() => changePage(pageNumber)}
                            className={`h-8 min-w-8 rounded-lg px-2 text-[11px] font-bold transition ${pageNumber === page ? "bg-[#4b00c8] text-white shadow-[0_3px_8px_rgba(75,0,200,0.2)]" : "border border-[#e9e1f2] bg-white text-[#70677d] hover:border-[#4b00c8] hover:text-[#4b00c8]"}`}
                          >
                            {pageNumber}
                          </button>
                        </span>
                      ))}
                    <button
                      type="button"
                      aria-label="Next page"
                      disabled={page === totalPages}
                      onClick={() => changePage(page + 1)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#e9e1f2] bg-white text-[#766c84] transition hover:border-[#4b00c8] hover:text-[#4b00c8] disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ChevronRight size={15} aria-hidden="true" />
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>
        </div>
        </section>
      </PageContainer>
    </>
  );
}

export default Shop;
