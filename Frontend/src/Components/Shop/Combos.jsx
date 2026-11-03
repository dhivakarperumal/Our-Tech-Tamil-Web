import { useContext, useEffect, useState } from "react";
import { Boxes, Heart, Search, ShoppingCart, Star, Zap } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const imageUrl = (image) => {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

function Combos() {
  const navigate = useNavigate();
  const { wishlist, addComboToCart, toggleComboWishlist } = useContext(StoreContext);
  const [combos, setCombos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredCombos = combos.filter((combo) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || [combo.name, combo.category, combo.category_type, combo.description]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

  const buyNow = async (combo) => {
    const quantity = Math.max(1, Number(combo.minimum_order_quantity) || 1);
    if (await addComboToCart(combo, quantity)) navigate("/checkout");
  };

  useEffect(() => {
    let active = true;
    api.get("/combos/public")
      .then(({ data }) => {
        if (active) setCombos(Array.isArray(data.combos) ? data.combos : []);
      })
      .catch((error) => {
        console.error("Failed to load combo products:", error);
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHeader title="Combo Offers" />
      <main className="min-h-[60vh] bg-[#faf8fc]">
        <PageContainer className="!max-w-[1700px] px-3 py-5 sm:px-5 sm:py-7 lg:px-6">
          <section>
          <div className="mb-5 flex flex-col items-center justify-center gap-2 text-center">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Shop our bundles</p>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Featured combos</h2>
            </div>
          </div>

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search combos..."
                aria-label="Search combos"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 2xl:grid-cols-5">
              {[1, 2, 3, 4].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />)}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border border-rose-100 bg-white px-5 py-14 text-center">
              <p className="font-bold text-slate-800">Combo offers could not be loaded.</p>
              <p className="mt-1 text-sm text-slate-500">Please refresh the page and try again.</p>
            </div>
          ) : filteredCombos.length ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4 2xl:grid-cols-5">
              {filteredCombos.map((combo) => {
                const image = imageUrl(combo.gallery_images?.[0]);
                const price = Number(combo.final_price ?? combo.offer_price ?? 0);
                const mrp = Number(combo.mrp ?? 0);
                const count = Array.isArray(combo.products) ? combo.products.length : 0;
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
                  <article key={combo.id} className="group flex h-full min-w-0 flex-col rounded-[26px] border border-violet-200 bg-white p-2.5 shadow-[0_12px_28px_rgba(75,0,200,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(75,0,200,0.12)]">
                    <div className="relative">
                      {hasDiscount && (
                        <span className="absolute left-3 top-3 z-10 rounded-full bg-[#4B00C8] px-2.5 py-1 text-[10px] font-extrabold tracking-tight text-white shadow-md">
                          {discount}% OFF
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => toggleComboWishlist(combo)}
                        aria-label={isFavorite ? `Remove ${combo.name} from favorites` : `Add ${combo.name} to favorites`}
                        aria-pressed={isFavorite}
                        className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d8f7] bg-white/90 shadow-sm transition hover:scale-105 hover:bg-white ${isFavorite ? "text-rose-600" : "text-[#4B00C8]"}`}
                      >
                        <Heart size={16} strokeWidth={2.2} fill={isFavorite ? "currentColor" : "none"} aria-hidden="true" />
                      </button>
                      <Link
                        to={`/combos/${combo.id}`}
                        aria-label={`View ${combo.name}`}
                        className="block aspect-square overflow-hidden rounded-[20px] bg-[#f2ebf8]"
                      >
                        {image ? (
                          <img src={image} alt={combo.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-[#4B00C8]/30"><Boxes size={56} strokeWidth={1.5} /></div>
                        )}
                      </Link>
                    </div>
                    <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
                      <div className="flex min-w-0 items-center gap-2 text-[#4B00C8]">
                        <Boxes size={14} strokeWidth={2.3} aria-hidden="true" />
                        <span className="min-w-0 flex-1 truncate text-[9px] font-extrabold uppercase tracking-[0.14em]">
                          {[combo.category_type, combo.category].filter(Boolean).join(" · ") || "Combo"}
                        </span>
                        <span className="shrink-0 rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                          {count} {count === 1 ? "item" : "items"}
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
                              aria-hidden="true"
                              className={star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                            />
                          ))}
                        </span>
                        <span className="font-bold text-slate-700">{rating ? rating.toFixed(1) : "New"}</span>
                        {rating > 0 && <span className="text-slate-400">/ 5</span>}
                      </div>
                      <div className="mt-2.5 flex items-end justify-between gap-2">
                        <div className="flex min-w-0 items-baseline gap-2">
                          <span className="shrink-0 text-base font-extrabold tracking-[-0.04em] text-[#4B00C8]">₹{price.toLocaleString("en-IN")}</span>
                          {hasDiscount && <span className="truncate text-[10px] font-medium text-[#6B6478] line-through">₹{mrp.toLocaleString("en-IN")}</span>}
                        </div>
                        {hasDiscount && <span className="shrink-0 rounded-full bg-[#efe0ff] px-2 py-1 text-[8px] font-bold text-[#4B00C8]">Save ₹{(mrp - price).toLocaleString("en-IN")}</span>}
                      </div>
                      {!available && <p className="mt-1 text-[10px] font-semibold text-rose-600">Out of stock</p>}
                      <div className="mt-auto grid grid-cols-1 gap-2 pt-3 sm:grid-cols-2">
                        <button
                          type="button"
                          disabled={!available}
                          onClick={() => addComboToCart(combo, minQuantity)}
                          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-[12px] border border-[#4B00C8] bg-white px-2 py-2 text-[10px] font-extrabold text-[#4B00C8] shadow-sm transition hover:bg-[#f1ebff] disabled:cursor-not-allowed disabled:opacity-50"
                        ><ShoppingCart className="shrink-0" size={14} aria-hidden="true" /><span className="whitespace-nowrap">Add to Cart</span></button>
                        <button
                          type="button"
                          disabled={!available}
                          onClick={() => buyNow(combo)}
                          className="inline-flex min-h-10 min-w-0 items-center justify-center gap-1.5 rounded-[12px] bg-[#4B00C8] px-2 py-2 text-[10px] font-extrabold text-white shadow-[0_8px_18px_rgba(75,0,200,0.25)] transition hover:bg-[#3d00a9] disabled:cursor-not-allowed disabled:opacity-50"
                        ><Zap className="shrink-0" size={14} aria-hidden="true" /><span className="whitespace-nowrap">Buy Now</span></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-16 text-center shadow-sm">
              <Boxes className="mx-auto text-violet-300" size={42} />
              <h3 className="mt-3 font-bold text-slate-800">{searchQuery.trim() ? "No combos found" : "Combo offers coming soon"}</h3>
              <p className="mt-1 text-sm text-slate-500">{searchQuery.trim() ? "Try a different search term." : "There are no active combos at the moment. Please check back soon."}</p>
            </div>
          )}
          </section>
        </PageContainer>
      </main>
    </>
  );
}

export default Combos;
