import { useContext, useEffect, useState } from "react";
import { ArrowRight, Boxes, Heart, ShoppingCart, Star, Zap } from "lucide-react";
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

  const buyNow = async (combo) => {
    const quantity = Math.max(1, Number(combo.minimum_order_quantity) || 1);
    if (await addComboToCart(combo, quantity)) navigate("/checkout");
  };

  useEffect(() => {
    let active = true;
    api.get("/combos/public")
      .then(({ data }) => {
        if (active) setCombos(Array.isArray(data.combos) ? data.combos.slice(0, 4) : []);
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
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Bundle and save</p>
            <h2 id="home-combos-title" className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              Combo Offers
            </h2>
          </div>
          <Link
            to="/combos"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-violet-700 transition hover:text-violet-900"
          >
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? [1, 2, 3, 4].map((item) => (
            <div key={item} className="aspect-[4/5] animate-pulse rounded-[26px] border border-violet-100 bg-white p-2.5 shadow-sm" />
          )) : combos.map((combo) => {
            const image = getImageUrl(combo.gallery_images?.[0]);
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
                className="group w-full min-w-0 rounded-[26px] border border-[#e2d3f5] bg-[#f7f0fb] p-2.5 shadow-[0_12px_28px_rgba(75,0,200,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(75,0,200,0.12)]"
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
                    className="relative block aspect-square overflow-hidden rounded-[18px] bg-[#f2ebf8]"
                  >
                    {image ? (
                      <img
                        src={image}
                        alt={combo.name}
                        loading="lazy"
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[#4B00C8]/30">
                        <Boxes size={56} strokeWidth={1.5} aria-hidden="true" />
                      </div>
                    )}
                  </Link>
                </div>
                <div className="px-1 pb-1 pt-3">
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
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => addComboToCart(combo, minQuantity)}
                      disabled={!available}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#4B00C8] bg-white px-2 py-2 text-[10px] font-extrabold text-[#4B00C8] shadow-sm transition hover:bg-[#f1ebff] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      <ShoppingCart className="shrink-0" size={14} aria-hidden="true" />
                      <span className="whitespace-nowrap">Add to Cart</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => buyNow(combo)}
                      disabled={!available}
                      className="inline-flex min-w-0 items-center justify-center gap-1.5 rounded-[12px] bg-[#4B00C8] px-2 py-2 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(75,0,200,0.25)] transition hover:bg-[#3d00a9] disabled:cursor-not-allowed disabled:opacity-50"
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
      </PageContainer>
    </section>
  );
}

export default HomeCombos;
