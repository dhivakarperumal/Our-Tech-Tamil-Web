import { useContext, useEffect, useState } from "react";
import {
  ArrowRight, Boxes, ChevronDown, Heart, LayoutGrid, ShieldCheck,
  ShoppingCart, Sparkles, Star, Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageContainer from "../CommenComponents/PageContainer";

function getImageUrl(image) {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function HomeCombos() {
  const navigate = useNavigate();
  const { wishlist, addComboToCart, toggleComboWishlist } = useContext(StoreContext);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Combos");
  const categories = ["All Combos", ...new Set(combos.map((combo) => combo.category).filter(Boolean))];
  const visibleCombos = activeCategory === "All Combos"
    ? combos
    : combos.filter((combo) => combo.category === activeCategory);

  const buyNow = async (combo) => {
    const quantity = Math.max(1, Number(combo.minimum_order_quantity) || 1);
    if (await addComboToCart(combo, quantity)) navigate("/checkout");
  };

  useEffect(() => {
    let active = true;
    api.get("/combos/public")
      .then(({ data }) => {
        const featuredCombos = Array.isArray(data.combos) ? data.combos.slice(0, 5) : [];
        if (active) setCombos(featuredCombos);

        return Promise.all(featuredCombos.map(async (combo) => {
          try {
            const { data: detailData } = await api.get(`/combos/public/${combo.id}`);
            const firstProduct = detailData.combo?.products?.[0];
            return { ...combo, firstProductImage: firstProduct?.images?.[0] || firstProduct?.image || "" };
          } catch (error) {
            console.error(`Failed to load the first product image for combo ${combo.id}:`, error);
            return combo;
          }
        }));
      })
      .then((featuredCombos) => {
        if (active && featuredCombos) setCombos(featuredCombos);
      })
      .catch((error) => {
        console.error("Failed to load home page combos:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  if (!loading && combos.length === 0) return null;

  return (
    <section aria-labelledby="home-combos-title" className="bg-[#faf8fc] py-8 sm:py-12">
      <PageContainer>
        <div className="relative overflow-hidden rounded-[1.75rem] border border-violet-100 bg-gradient-to-br from-white via-[#fdfbff] to-violet-50/80 p-4 shadow-[0_16px_44px_rgba(75,0,200,0.08)] sm:p-6">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-32 h-72 w-72 rounded-full border-[38px] border-violet-100/30" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-36 left-1/4 h-56 w-56 rounded-full bg-fuchsia-100/25 blur-3xl" />
          <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3 sm:mb-5">
            <h2 id="home-combos-title" className="flex items-center gap-2 text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-700 to-fuchsia-600 text-white shadow-lg shadow-violet-900/20 sm:h-12 sm:w-12">
                <LayoutGrid size={22} aria-hidden="true" />
              </span>
              <span className="bg-gradient-to-r from-violet-950 via-violet-800 to-fuchsia-700 bg-clip-text text-transparent">Combo Offers</span>
              <Sparkles size={16} className="text-fuchsia-500" aria-hidden="true" />
            </h2>
            <div className="flex shrink-0 items-center gap-2">
              <div className="hidden items-center gap-2 rounded-full border border-violet-200 bg-white/90 px-4 py-2 shadow-sm sm:flex">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-violet-50 text-violet-800"><ShieldCheck size={19} aria-hidden="true" /></span>
                <span><span className="block text-sm font-extrabold leading-tight text-slate-900">Secure</span><span className="block text-[10px] font-medium text-slate-500">Shopping experience</span></span>
              </div>
              <Link
                to="/combos"
                className="inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 hover:text-violet-900 sm:text-sm"
              >
                View all <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>

          {!loading && combos.length > 0 && (
            <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
              <label className="relative block w-2/5 min-w-0 sm:w-64">
                <LayoutGrid size={16} aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-700" />
                <select
                  value={activeCategory}
                  onChange={(event) => setActiveCategory(event.target.value)}
                  aria-label="Filter combos by category"
                  className="w-full appearance-none rounded-full border border-violet-200 bg-white py-3 pl-12 pr-10 text-sm font-bold text-slate-700 shadow-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                >
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
                <ChevronDown size={17} aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-violet-700" />
              </label>
              <span className="ml-auto text-right text-xs font-semibold text-slate-500">
                {visibleCombos.length} {visibleCombos.length === 1 ? "combo" : "combos"}
              </span>
            </div>
          )}

          <div className="relative grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {loading ? [1, 2, 3, 4, 5].map((item) => (
            <div key={item} className="aspect-[4/5] animate-pulse rounded-[26px] border border-violet-100 bg-white p-2.5 shadow-sm" />
          )) : visibleCombos.map((combo) => {
            const image = getImageUrl(
              combo.firstProductImage
              || combo.products?.[0]?.image
              || combo.products?.[0]?.images?.[0]
              || combo.gallery_images?.[0],
            );
            const price = Number(combo.final_price ?? combo.offer_price ?? 0);
            const mrp = Number(combo.mrp ?? 0);
            const hasDiscount = mrp > price;
            const discount = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
            const rating = Math.min(5, Math.max(0, Number(combo.rating) || 0));
            const minQuantity = Math.max(1, Number(combo.minimum_order_quantity) || 1);
            const trackInventory = Number(combo.track_inventory) === 1;
            const allowBackorders = Number(combo.allow_backorders) === 1;
            const available = !trackInventory || allowBackorders ||
              Number(combo.available_stock) >= minQuantity;
            const isFavorite = wishlist.some((item) => Number(item.combo_id) === Number(combo.id));

            return (
              <article
                key={combo.id}
                className="group flex h-full w-full min-w-0 flex-col rounded-[26px] border border-[#e2d3f5] bg-[#f7f0fb] p-2 shadow-[0_12px_28px_rgba(75,0,200,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(75,0,200,0.12)] sm:p-2.5"
              >
                <div className="relative">
                  {hasDiscount && (
                    <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#4B00C8] px-2.5 py-1 text-[10px] font-extrabold tracking-tight text-white shadow-md">
                      {discount}% OFF
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => toggleComboWishlist(combo)}
                    aria-label={isFavorite ? `Remove ${combo.name} from wishlist` : `Add ${combo.name} to wishlist`}
                    aria-pressed={isFavorite}
                    className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d8f7] bg-white/90 shadow-sm transition hover:scale-105 hover:bg-white ${isFavorite ? "text-rose-600" : "text-[#4B00C8]"}`}
                  >
                    <Heart size={16} strokeWidth={2.2} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
                  </button>
                  <Link
                    to={`/combos/${combo.id}`}
                    aria-label={`View ${combo.name} details`}
                    className="relative block aspect-square overflow-hidden rounded-[18px] bg-[#f7f3fb]"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={combo.name}
                        loading="lazy"
                        className="h-full w-full object-contain p-2 transition duration-300 group-hover:scale-105 sm:p-3"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#4B00C8]/30">
                        <Boxes size={56} strokeWidth={1.5} aria-hidden="true" />
                      </div>
                    )}
                  </Link>
                </div>
                <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                  <div className="flex min-w-0 items-center gap-2 text-[#4B00C8]">
                    <Boxes size={14} strokeWidth={2.3} aria-hidden="true" />
                    <span className="truncate text-[9px] font-extrabold uppercase tracking-[0.14em]">
                      {[combo.category_type, combo.category].filter(Boolean).join(" ") || "Combo"}
                    </span>
                  </div>
                  <h3 className="mt-1.5 min-h-[2rem] line-clamp-2 text-sm font-extrabold leading-[1.2] tracking-[-0.035em] text-[#111027]">
                    <Link to={`/combos/${combo.id}`} className="transition hover:text-[#4B00C8]">{combo.name}</Link>
                  </h3>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px]" role="img" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
                    <span className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={11}
                          fill={star <= Math.round(rating) ? "currentColor" : "none"}
                          className={star <= Math.round(rating) ? "text-amber-400" : "text-slate-300"}
                          aria-hidden="true"
                        />
                      ))}
                    </span>
                    <span className="font-bold text-slate-700">{rating ? rating.toFixed(1) : "New"}</span>
                    {rating > 0 && <span className="text-slate-400">/ 5</span>}
                  </div>
                  <div className="mt-2.5 flex items-end justify-between gap-2">
                    <div className="flex min-w-0 items-baseline gap-2">
                      <span className="shrink-0 text-base font-extrabold tracking-[-0.04em] text-[#4B00C8]">
                        ₹{price.toLocaleString("en-IN")}
                      </span>
                      {hasDiscount && (
                        <span className="truncate text-[10px] font-medium text-[#6B6478] line-through">
                          ₹{mrp.toLocaleString("en-IN")}
                        </span>
                      )}
                    </div>
                    {hasDiscount && (
                      <span className="shrink-0 rounded-full bg-[#efe0ff] px-2 py-1 text-[7px] font-bold text-[#4B00C8]">
                        Save ₹{(mrp - price).toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  <div className="mt-auto grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => addComboToCart(combo, minQuantity)}
                      disabled={!available}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] border border-[#4B00C8] bg-white px-2 py-2.5 text-[10px] font-extrabold text-[#4B00C8] shadow-sm transition hover:bg-[#f1ebff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart className="shrink-0" size={14} aria-hidden="true" />
                      <span className="whitespace-nowrap">Add to Cart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => buyNow(combo)}
                      disabled={!available}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-[12px] bg-[#4B00C8] px-2 py-2.5 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(75,0,200,0.25)] transition hover:bg-[#3d00a9] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <Zap className="shrink-0" size={14} aria-hidden="true" />
                      <span className="whitespace-nowrap">Buy Now</span>
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
          </div>
        </div>
      </PageContainer>
    </section>
  );
}

export default HomeCombos;
