import { useEffect, useRef, useState } from "react";
import { ArrowRight, BadgePercent, ChevronDown, ChevronLeft, ChevronRight, Crown, LayoutGrid, ShieldCheck, Sparkles, Star, Zap } from "lucide-react";
import { Link } from "react-router-dom";
import { createPortal } from "react-dom";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import ProductCard from "../Products/ProductCard";
import PageContainer from "../CommenComponents/PageContainer";

function CategoryDropdown({ id, label, categories, activeCategory, onCategoryChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const listId = `${id}-category-options`;

  useEffect(() => {
    if (!isOpen) return undefined;

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const width = Math.min(Math.max(rect.width, 240), window.innerWidth - 24);
      setPosition({
        top: rect.bottom + 8,
        left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
        width,
      });
    };
    const closeOnOutsideClick = (event) => {
      if (!triggerRef.current?.contains(event.target) && !menuRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", closeOnOutsideClick);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", closeOnOutsideClick);
    };
  }, [isOpen]);

  const handleMenuKeyDown = (event) => {
    const options = Array.from(menuRef.current?.querySelectorAll('[role="option"]') || []);
    const currentIndex = options.indexOf(document.activeElement);
    let nextIndex = currentIndex;

    if (event.key === "ArrowDown") nextIndex = (currentIndex + 1 + options.length) % options.length;
    else if (event.key === "ArrowUp") nextIndex = (currentIndex - 1 + options.length) % options.length;
    else if (event.key === "Home") nextIndex = 0;
    else if (event.key === "End") nextIndex = options.length - 1;
    else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    } else {
      return;
    }

    event.preventDefault();
    options[nextIndex]?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={listId}
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setIsOpen(true);
            requestAnimationFrame(() => menuRef.current?.querySelector('[aria-selected="true"]')?.focus());
          }
        }}
        className="flex w-full min-w-0 items-center gap-2 rounded-full border border-violet-200 bg-white px-3.5 py-2.5 text-left text-violet-800 shadow-sm transition hover:border-violet-300 hover:bg-violet-50/40 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 sm:w-auto sm:min-w-64"
      >
        <LayoutGrid size={16} className="shrink-0" aria-hidden="true" />
        <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-700">{activeCategory}</span>
        <ChevronDown size={16} className={`shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {isOpen && position && createPortal(
        <div
          ref={menuRef}
          id={listId}
          role="listbox"
          aria-label={label}
          onKeyDown={handleMenuKeyDown}
          style={{ position: "fixed", top: position.top, left: position.left, width: position.width, zIndex: 1000 }}
          className="max-h-64 overflow-y-auto rounded-2xl border border-violet-100 bg-white p-1.5 shadow-[0_16px_40px_rgba(54,24,91,0.2)]"
        >
          {categories.map((category) => {
            const isSelected = category === activeCategory;
            return (
              <button
                key={category}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                onClick={() => {
                  onCategoryChange?.(category);
                  setIsOpen(false);
                  triggerRef.current?.focus();
                }}
                className={`flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-semibold transition ${
                  isSelected
                    ? "bg-gradient-to-r from-violet-800 to-fuchsia-700 text-white shadow-sm"
                    : "text-slate-700 hover:bg-violet-50 hover:text-violet-800"
                }`}
              >
                <LayoutGrid size={15} className={isSelected ? "text-white" : "text-violet-700"} aria-hidden="true" />
                <span className="truncate">{category}</span>
              </button>
            );
          })}
        </div>,
        document.body,
      )}
    </>
  );
}

function HomeProductCarousel({
  id,
  title,
  subtitle,
  products,
  loading,
  emptyMessage,
  allProductsCount,
  presentation,
  categories = [],
  activeCategory,
  onCategoryChange,
  averageRating = 0,
  maxDiscount = 0,
  resultCount,
}) {
  const swiperRef = useRef(null);
  const isTopRated = presentation === "topRated";
  const isTopOffers = presentation === "topOffers";
  const isAllProducts = presentation === "allProducts";
  const isFeatured = isTopRated || isTopOffers || isAllProducts;

  return (
    <PageContainer className={isFeatured ? "py-3 sm:py-4" : "py-4 sm:py-5"}>
      <section
        aria-labelledby={`${id}-heading`}
        className={`w-full ${isTopRated ? "relative overflow-hidden rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/80 p-4 shadow-[0_16px_44px_rgba(54,24,91,0.07)] sm:p-6" : ""} ${isTopOffers ? "relative overflow-hidden rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-[#faf7ff] via-white to-[#f4eaff] p-4 shadow-[0_16px_44px_rgba(75,0,200,0.10)] sm:p-6" : ""} ${isAllProducts ? "relative overflow-hidden rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-white via-[#fdfbff] to-violet-50/80 p-4 shadow-[0_16px_44px_rgba(75,0,200,0.08)] sm:p-6" : ""}`}
      >
        {isAllProducts && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full border-[38px] border-violet-100/30" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/4 h-56 w-56 rounded-full bg-fuchsia-100/25 blur-3xl" />
          </>
        )}
        {isTopRated && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full border-[34px] border-violet-100/35" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/4 h-56 w-56 rounded-full bg-fuchsia-100/25 blur-3xl" />
          </>
        )}
        {isTopOffers && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full border-[38px] border-violet-100/35" />
            <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/4 h-56 w-56 rounded-full bg-fuchsia-200/20 blur-3xl" />
          </>
        )}
        <div className={`relative mb-4 flex flex-wrap items-center justify-between gap-3 ${isFeatured ? "sm:mb-5" : ""}`}>
          <div className={`min-w-0 ${isTopOffers || isAllProducts ? "flex items-center gap-3" : ""}`}>
            <h2
              id={`${id}-heading`}
              className={`flex items-center gap-2 text-base font-extrabold tracking-tight text-text-primary sm:text-lg ${isTopRated ? "sm:text-xl" : ""} ${isTopOffers ? "text-2xl sm:text-3xl lg:text-4xl" : ""} ${isAllProducts ? "text-2xl sm:text-3xl lg:text-4xl" : ""}`}
            >
              {isTopRated ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white shadow-md shadow-violet-900/20">
                  <Crown size={18} aria-hidden="true" />
                </span>
              ) : isTopOffers ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white shadow-lg shadow-violet-900/20 sm:h-12 sm:w-12">
                  <BadgePercent size={23} aria-hidden="true" />
                </span>
              ) : isAllProducts ? (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white shadow-lg shadow-violet-900/20 sm:h-12 sm:w-12">
                  <LayoutGrid size={22} aria-hidden="true" />
                </span>
              ) : <span className="h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />}
              <span className={isTopOffers || isAllProducts ? "bg-gradient-to-r from-violet-950 via-violet-800 to-fuchsia-700 bg-clip-text text-transparent" : ""}>{title}</span>
              {isAllProducts && <Sparkles size={16} className="text-fuchsia-500" aria-hidden="true" />}
              {isTopRated && <Sparkles size={16} className="text-fuchsia-500" aria-hidden="true" />}
            </h2>
            <p className={`mt-1 text-xs text-text-secondary sm:text-sm ${isTopOffers || isAllProducts ? "sm:pl-[3.75rem]" : ""}`}>{subtitle}</p>
          </div>

          {!loading && allProductsCount > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {isAllProducts && (
                <div className="hidden items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-2 shadow-sm sm:flex">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-800"><ShieldCheck size={19} /></span>
                  <span><span className="block text-sm font-extrabold leading-tight text-slate-900">Secure</span><span className="block text-[10px] font-medium text-slate-500">Shopping experience</span></span>
                </div>
              )}
              {isTopOffers && (
                <div className="flex items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-3 py-2 shadow-sm">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-violet-700"><Zap size={15} fill="currentColor" /></span>
                  <span><span className="block text-[10px] font-semibold leading-tight text-slate-600">Up to</span><span className="block text-sm font-black leading-tight text-violet-800">{Math.round(maxDiscount)}% OFF</span></span>
                </div>
              )}
              {isTopRated && (
                <div className="hidden items-center gap-2 sm:flex">
                  <div className="flex items-center gap-2 rounded-full border border-amber-100 bg-white/90 px-3 py-2 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-50 text-amber-500"><Star size={15} fill="currentColor" /></span>
                    <span><span className="block text-xs font-extrabold leading-tight text-slate-900">{averageRating.toFixed(1)}/5</span><span className="block text-[9px] font-medium text-slate-500">Average rating</span></span>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-violet-100 bg-white/90 px-3 py-2 shadow-sm">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-50 text-violet-700"><ShieldCheck size={15} /></span>
                    <span><span className="block text-xs font-extrabold leading-tight text-slate-900">{allProductsCount}</span><span className="block text-[9px] font-medium text-slate-500">Rated products</span></span>
                  </div>
                </div>
              )}
              {!isAllProducts && <Link
                to="/shop"
                className={`hidden items-center gap-1 whitespace-nowrap text-[11px] font-bold text-primary transition hover:text-primary-light sm:flex sm:text-xs ${isFeatured ? "rounded-full px-2 py-2 hover:bg-violet-50" : ""}`}
              >
                {isTopOffers ? "View All Offers" : "View All Products"}
                <ArrowRight size={15} aria-hidden="true" />
              </Link>}
              {products.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slidePrev()}
                    aria-label={`Previous ${title.toLowerCase()}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-text-secondary transition hover:border-primary hover:text-primary ${isFeatured ? "border-violet-100 bg-white shadow-sm" : "border-border"}`}
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slideNext()}
                    aria-label={`Next ${title.toLowerCase()}`}
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-text-secondary transition hover:border-primary hover:text-primary ${isFeatured ? "border-violet-100 bg-white shadow-sm" : "border-border"}`}
                  >
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {isFeatured && !loading && (products.length > 0 || isAllProducts) && (
          <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
            <CategoryDropdown
              id={id}
              label={`Filter ${isTopOffers ? "offers" : isTopRated ? "top-rated products" : "products"} by category`}
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={onCategoryChange}
            />
            {isAllProducts ? (
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                {typeof resultCount === "number" && <span className="text-[11px] font-semibold text-slate-500">{resultCount} {resultCount === 1 ? "product" : "products"}</span>}
              </div>
            ) : (
              <Link to="/shop" className="inline-flex shrink-0 items-center gap-1 text-[11px] font-bold text-primary hover:underline sm:hidden">
                {isTopOffers ? "View offers" : "View all"} <ArrowRight size={13} aria-hidden="true" />
              </Link>
            )}
          </div>
        )}

        {loading ? (
          <div className={`grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 ${isTopRated ? "xl:grid-cols-5" : "xl:grid-cols-5"}`} aria-label={`Loading ${title}`}>
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className={`${isTopRated ? "h-[270px]" : "h-[320px]"} animate-pulse rounded-2xl bg-[#faf8ff]`}
                aria-hidden="true"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            {emptyMessage}
          </p>
        ) : (
          <div className={`relative overflow-hidden ${isFeatured ? "px-0.5 py-2" : "py-2"}`}>
            <Swiper
              modules={[Autoplay]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              slidesPerView={isFeatured ? 2 : 1.15}
              spaceBetween={isFeatured ? 12 : 12}
              loop={products.length > 5}
              autoplay={
                products.length > 5
                  ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
                  : false
              }
              breakpoints={{
                480: { slidesPerView: isFeatured ? 2 : 1.8, spaceBetween: 12 },
                640: { slidesPerView: 2.4, spaceBetween: 16 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
                1280: { slidesPerView: 5, spaceBetween: 16 },
              }}
              className={isFeatured ? "!overflow-visible" : ""}
              aria-label={title}
            >
              {products.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto">
                  <ProductCard product={product} compact={isFeatured} dense={isFeatured} offer={isTopOffers} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default HomeProductCarousel;
