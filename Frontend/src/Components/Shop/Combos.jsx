import { useContext, useEffect, useState } from "react";
import { Boxes, Heart, Package, ShoppingCart, Star, Zap } from "lucide-react";
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
          <div className="mb-5 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Shop our bundles</p>
              <h2 className="mt-1 text-xl font-black text-slate-900 sm:text-2xl">Featured combos</h2>
            </div>
            {!loading && !failed && <span className="text-sm font-medium text-slate-500">{combos.length} {combos.length === 1 ? "combo" : "combos"}</span>}
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {[1, 2, 3].map((item) => <div key={item} className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />)}
            </div>
          ) : failed ? (
            <div className="rounded-2xl border border-rose-100 bg-white px-5 py-14 text-center">
              <p className="font-bold text-slate-800">Combo offers could not be loaded.</p>
              <p className="mt-1 text-sm text-slate-500">Please refresh the page and try again.</p>
            </div>
          ) : combos.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {combos.map((combo) => {
                const image = imageUrl(combo.gallery_images?.[0]);
                const price = Number(combo.final_price ?? combo.offer_price ?? 0);
                const mrp = Number(combo.mrp ?? 0);
                const count = Array.isArray(combo.products) ? combo.products.length : 0;
                const rating = Math.min(5, Math.max(0, Number(combo.rating) || 0));
                const minQuantity = Math.max(1, Number(combo.minimum_order_quantity) || 1);
                const trackInventory = Number(combo.track_inventory) === 1;
                const allowBackorders = Number(combo.allow_backorders) === 1;
                const available = !trackInventory || allowBackorders ||
                  Number(combo.available_stock) >= minQuantity;
                const isFavorite = wishlist.some((item) => Number(item.combo_id) === Number(combo.id));
                return (
                  <article key={combo.id} className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
                    <div className="relative h-56 overflow-hidden bg-violet-50">
                      <Link to={`/combos/${combo.id}`} aria-label={`View ${combo.name}`}>
                        {image ? (
                        <img src={image} alt={combo.name} loading="lazy" className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-violet-300"><Boxes size={56} /></div>
                        )}
                      </Link>
                      {mrp > price && <span className="absolute left-3 top-3 rounded-full bg-emerald-600 px-3 py-1 text-xs font-bold text-white">Save ₹{(mrp - price).toLocaleString("en-IN")}</span>}
                    </div>
                    <div className="p-5">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-violet-700">{combo.category_type || "Combo"}{combo.category ? ` · ${combo.category}` : ""}</p>
                      <h3 className="mt-1 truncate text-lg font-bold text-slate-900"><Link to={`/combos/${combo.id}`} className="hover:text-violet-700">{combo.name}</Link></h3>
                      <div className="mt-2 flex items-center gap-1" role="img" aria-label={`Rating ${rating.toFixed(1)} out of 5`}>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={15}
                            aria-hidden="true"
                            className={star <= rating ? "fill-amber-400 text-amber-400" : "fill-slate-100 text-slate-300"}
                          />
                        ))}
                        <span className="ml-1 text-xs font-semibold text-slate-600">{rating.toFixed(1)} / 5</span>
                      </div>
                      {combo.description && <p className="mt-2 line-clamp-2 text-sm leading-5 text-slate-500">{combo.description}</p>}
                      <div className="mt-4 flex items-end justify-between border-t border-slate-100 pt-4">
                        <div className="flex flex-wrap items-baseline gap-x-2">
                          <p className="text-2xl font-black text-slate-900">₹{price.toLocaleString("en-IN")}</p>
                          {mrp > price && <p className="text-sm text-slate-400 line-through">₹{mrp.toLocaleString("en-IN")}</p>}
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700"><Package size={14} />{count} items</span>
                      </div>
                      {!available && <p className="mt-3 text-xs font-semibold text-rose-600">Out of stock</p>}
                      <div className="mt-4 grid grid-cols-[1fr_1fr_auto] gap-2">
                        <button
                          type="button"
                          disabled={!available}
                          onClick={() => addComboToCart(combo, minQuantity)}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-violet-700 px-2.5 text-xs font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                        ><ShoppingCart size={15} /> Add to Cart</button>
                        <button
                          type="button"
                          disabled={!available}
                          onClick={() => buyNow(combo)}
                          className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-2.5 text-xs font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50 sm:text-sm"
                        ><Zap size={15} /> Buy Now</button>
                        <button
                          type="button"
                          onClick={() => toggleComboWishlist(combo)}
                          aria-label={isFavorite ? `Remove ${combo.name} from favorites` : `Add ${combo.name} to favorites`}
                          aria-pressed={isFavorite}
                          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border transition ${isFavorite ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600"}`}
                        ><Heart size={17} fill={isFavorite ? "currentColor" : "none"} /></button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-100 bg-white px-5 py-16 text-center shadow-sm">
              <Boxes className="mx-auto text-violet-300" size={42} />
              <h3 className="mt-3 font-bold text-slate-800">Combo offers coming soon</h3>
              <p className="mt-1 text-sm text-slate-500">There are no active combos at the moment. Please check back soon.</p>
            </div>
          )}
          </section>
        </PageContainer>
      </main>
    </>
  );
}

export default Combos;
