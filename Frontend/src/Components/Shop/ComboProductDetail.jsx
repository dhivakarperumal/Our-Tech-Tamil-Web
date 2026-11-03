import { useContext, useEffect, useState } from "react";
import { Boxes, Heart, Minus, Package, Plus, ShieldCheck, ShoppingCart, Zap } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const parseList = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const imageUrl = (image) => {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

const currency = (amount) => `₹${Number(amount || 0).toLocaleString("en-IN", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

function ComboProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { wishlist, addComboToCart, toggleComboWishlist } = useContext(StoreContext);
  const [quantityState, setQuantityState] = useState({ id: null, value: 1 });
  const [detailState, setDetailState] = useState({ id: null, combo: null, loading: true, failed: false });
  const combo = detailState.id === id ? detailState.combo : null;
  const loading = detailState.id !== id || detailState.loading;

  useEffect(() => {
    let active = true;
    api.get(`/combos/public/${id}`)
      .then(({ data }) => {
        if (active) setDetailState({ id, combo: data.combo, loading: false, failed: false });
      })
      .catch((error) => {
        console.error("Failed to load combo details:", error);
        if (active) {
          setDetailState({ id, combo: null, loading: false, failed: true });
          toast.error(error.response?.data?.message || "Unable to load combo details.");
        }
      });
    return () => { active = false; };
  }, [id]);

  const gallery = parseList(combo?.gallery_images).map(imageUrl).filter(Boolean);
  const products = parseList(combo?.products);
  const specifications = parseList(combo?.specifications);
  const [selectedImage, setSelectedImage] = useState({ id: null, image: "" });
  const activeImage = selectedImage.id === id ? selectedImage.image : gallery[0] || "";
  const minimumQuantity = Math.max(1, Number(combo?.minimum_order_quantity) || 1);
  const maximumQuantity = Number(combo?.maximum_order_quantity) || 10000;
  const quantity = quantityState.id === id ? quantityState.value : minimumQuantity;
  const tracksInventory = Number(combo?.track_inventory) === 1;
  const allowsBackorders = Number(combo?.allow_backorders) === 1;
  const available = !tracksInventory || allowsBackorders ||
    Number(combo?.available_stock) >= minimumQuantity;
  const isFavorite = wishlist.some((item) => Number(item.combo_id) === Number(combo?.id));

  const handleBuyNow = async () => {
    if (!available) {
      toast.error("This combo is out of stock.");
      return;
    }
    if (await addComboToCart(combo, quantity)) navigate("/checkout");
  };

  const pageTitle = loading ? "Combo Offers" : combo?.name || "Combo Offers";

  return (
    <>
      <PageHeader title={pageTitle} />
      <main className="min-h-[60vh] bg-[#faf8fc] py-6 sm:py-9">
        <PageContainer className="!max-w-[1500px] px-3 sm:px-5 lg:px-6">
          {loading ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="aspect-square animate-pulse rounded-2xl bg-white" />
              <div className="h-96 animate-pulse rounded-2xl bg-white" />
            </div>
          ) : !combo ? (
            <section className="rounded-2xl border border-slate-100 bg-white px-5 py-16 text-center shadow-sm">
              <Boxes className="mx-auto text-violet-300" size={44} />
              <h1 className="mt-3 text-xl font-black text-slate-800">{detailState.failed ? "Combo could not be loaded" : "Combo not found"}</h1>
              <p className="mt-1 text-sm text-slate-500">This combo may be unavailable or no longer active.</p>
              <Link to="/combos" className="mt-5 inline-flex rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800">Browse combo offers</Link>
            </section>
          ) : (
            <>
              <div className="mb-5 text-sm text-slate-500">
                <Link to="/" className="transition hover:text-violet-700">Home</Link>
                <span className="mx-2">/</span>
                <Link to="/combos" className="transition hover:text-violet-700">Combo Offers</Link>
                <span className="mx-2">/</span>
                <span className="font-semibold text-slate-700">{combo.name}</span>
              </div>

              <section className="grid items-start gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                    {activeImage ? <img src={activeImage} alt={combo.name} className="h-full w-full object-contain p-4" /> : <Boxes className="text-violet-200" size={72} />}
                    {Number(combo.mrp) > Number(combo.final_price ?? combo.offer_price) && (
                      <span className="absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                        Save {currency(Number(combo.mrp) - Number(combo.final_price ?? combo.offer_price))}
                      </span>
                    )}
                  </div>
                  {gallery.length > 1 && (
                    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
                      {gallery.map((image, index) => (
                        <button key={`${image}-${index}`} type="button" onClick={() => setSelectedImage({ id, image })} aria-label={`View combo image ${index + 1}`} className={`aspect-square overflow-hidden rounded-xl border-2 bg-white p-1 ${activeImage === image ? "border-violet-600" : "border-transparent"}`}>
                          <img src={image} alt="" className="h-full w-full object-contain" />
                        </button>
                      ))}
                    </div>
                  )}
                  {combo.video && (
                    <video src={imageUrl(combo.video)} controls className="max-h-80 w-full rounded-2xl bg-black" aria-label={`${combo.name} product video`} />
                  )}
                </div>

                <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-7">
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">{combo.category_type || "Combo"}{combo.category ? ` · ${combo.category}` : ""}{combo.subcategory ? ` · ${combo.subcategory}` : ""}</p>
                  <h1 className="mt-2 text-2xl font-black leading-tight text-slate-900 sm:text-3xl">{combo.name}</h1>
                  <p className="mt-2 text-sm text-slate-400">Combo code: {combo.code}</p>

                  <div className="mt-5 flex flex-wrap items-end gap-x-3 gap-y-1">
                    <span className="text-3xl font-black text-slate-900">{currency(combo.final_price ?? combo.offer_price)}</span>
                    {Number(combo.mrp) > Number(combo.final_price ?? combo.offer_price) && <span className="text-base text-slate-400 line-through">{currency(combo.mrp)}</span>}
                    {Number(combo.offer) > 0 && <span className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">{Number(combo.offer)}% off</span>}
                  </div>
                  <p className={`mt-3 inline-flex rounded-lg px-2.5 py-1 text-xs font-bold ${
                    Number(combo.available_stock) > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"
                  }`}>{available ? (tracksInventory ? `In stock (${combo.available_stock})` : "Available") : "Out of stock"}</p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="inline-flex h-11 items-center overflow-hidden rounded-xl border border-slate-200">
                      <button
                        type="button"
                        aria-label="Decrease combo quantity"
                        onClick={() => setQuantityState({ id, value: Math.max(minimumQuantity, quantity - 1) })}
                        disabled={quantity <= minimumQuantity}
                        className="h-full px-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                      ><Minus size={16} /></button>
                      <span className="min-w-10 text-center text-sm font-bold text-slate-800">{quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase combo quantity"
                        onClick={() => setQuantityState({ id, value: Math.min(maximumQuantity, quantity + 1) })}
                        disabled={quantity >= maximumQuantity}
                        className="h-full px-3 text-slate-600 transition hover:bg-slate-50 disabled:opacity-40"
                      ><Plus size={16} /></button>
                    </div>
                    <button
                      type="button"
                      onClick={() => addComboToCart(combo, quantity)}
                      disabled={!available}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-violet-700 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                    ><ShoppingCart size={17} /> Add to Cart</button>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={!available}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-amber-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
                    ><Zap size={17} /> Buy Now</button>
                    <button
                      type="button"
                      onClick={() => toggleComboWishlist(combo)}
                      aria-label={isFavorite ? "Remove combo from favorites" : "Add combo to favorites"}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${isFavorite ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-200 text-slate-500 hover:border-rose-200 hover:text-rose-600"}`}
                    ><Heart size={19} fill={isFavorite ? "currentColor" : "none"} /></button>
                  </div>
                  <p className="mt-2 text-xs text-slate-400">
                    Order quantity: {minimumQuantity}{maximumQuantity < 10000 ? `–${maximumQuantity}` : "+"}
                  </p>

                  {combo.description && <p className="mt-5 whitespace-pre-wrap border-t border-slate-100 pt-4 text-sm leading-6 text-slate-600">{combo.description}</p>}

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-violet-50 p-3">
                      <p className="text-xs text-violet-600">Bundle contents</p>
                      <p className="mt-1 font-bold text-slate-800">{products.length} {products.length === 1 ? "product" : "products"}</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-700">You save</p>
                      <p className="mt-1 font-bold text-slate-800">{currency(combo.total_savings || (Number(combo.mrp) - Number(combo.final_price ?? combo.offer_price)))}</p>
                    </div>
                  </div>
                  {combo.warranty && <p className="mt-4 flex items-center gap-2 text-sm text-slate-600"><ShieldCheck size={17} className="text-violet-700" />{combo.warranty}</p>}
                </div>
              </section>

              <section className="mt-8 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
                  <h2 className="text-lg font-black text-slate-900">Products included in this combo</h2>
                  <p className="mt-1 text-sm text-slate-500">Everything you get in this bundle.</p>
                </div>
                {products.length ? (
                  <div className="divide-y divide-slate-100">
                    {products.map((product) => {
                      const productImage = imageUrl(parseList(product.images)[0]);
                      return (
                        <div key={product.id} className="flex items-center gap-3 p-4 sm:gap-4 sm:px-6">
                          {productImage ? <img src={productImage} alt="" className="h-16 w-16 rounded-xl border border-slate-100 bg-slate-50 object-contain p-1" /> : <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-violet-50 text-violet-300"><Package size={24} /></div>}
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-slate-800 sm:text-base">{product.name}</p>
                            <p className="mt-0.5 text-xs text-slate-400">{product.product_code || "Product"}{product.category ? ` · ${product.category}` : ""}</p>
                            <p className="mt-1 text-xs font-semibold text-slate-600">Quantity: {product.quantity}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-slate-800">{currency(product.offer_price ?? product.mrp)}</p>
                            {Number(product.mrp) > Number(product.offer_price) && <p className="text-xs text-slate-400 line-through">{currency(product.mrp)}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : <p className="p-5 text-sm text-slate-500">Product details are currently unavailable.</p>}
              </section>

              {specifications.length > 0 && (
                <section className="mt-6 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm sm:p-6">
                  <h2 className="text-lg font-black text-slate-900">Combo specifications</h2>
                  <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {specifications.map((specification, index) => (
                      <div key={`${specification.key}-${index}`} className="rounded-xl bg-slate-50 p-3">
                        <dt className="text-xs font-bold text-slate-500">{specification.key}</dt>
                        <dd className="mt-1 text-sm text-slate-800">{specification.value}</dd>
                      </div>
                    ))}
                  </dl>
                </section>
              )}

              {(combo.return_policy || combo.delivery_information) && (
                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                  {combo.return_policy && <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-800">Return policy</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{combo.return_policy}</p></article>}
                  {combo.delivery_information && <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-800">Delivery information</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{combo.delivery_information}</p></article>}
                </section>
              )}
            </>
          )}
        </PageContainer>
      </main>
    </>
  );
}

export default ComboProductDetail;
