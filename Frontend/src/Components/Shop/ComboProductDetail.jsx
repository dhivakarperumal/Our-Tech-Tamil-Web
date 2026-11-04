import { useContext, useEffect, useState } from "react";
import { Boxes, Heart, Minus, Package, Plus, ShieldCheck, ShoppingCart, X, Zap } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import api from "../../api";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import ComboReviews from "./ComboReviews";

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
  const [relatedState, setRelatedState] = useState({ combos: [], loading: true, failed: false });
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [imageZoomOrigin, setImageZoomOrigin] = useState("50% 50%");
  const [imageFailed, setImageFailed] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ id: null, image: "" });
  const combo = detailState.id === id ? detailState.combo : null;
  const loading = detailState.id !== id || detailState.loading;

  useEffect(() => {
    let active = true;
    api.get(`/combos/public/${id}`)
      .then(({ data }) => {
        if (active) {
          setImageFailed(false);
          setSelectedImage({ id, image: "" });
          setDetailState({ id, combo: data.combo, loading: false, failed: false });
        }
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

  useEffect(() => {
    let active = true;
    api.get("/combos/public")
      .then(({ data }) => {
        if (active) {
          setRelatedState({
            combos: Array.isArray(data.combos) ? data.combos : [],
            loading: false,
            failed: false,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load related combos:", error);
        if (active) setRelatedState({ combos: [], loading: false, failed: true });
      });
    return () => { active = false; };
  }, []);

  const gallery = parseList(combo?.gallery_images).map(imageUrl).filter(Boolean);
  const products = parseList(combo?.products);
  const specifications = parseList(combo?.specifications);
  const comboCategoryType = String(combo?.category_type || "").trim().toLowerCase();
  const relatedCombos = comboCategoryType
    ? relatedState.combos.filter((relatedCombo) =>
      Number(relatedCombo.id) !== Number(combo.id) &&
      String(relatedCombo.category_type || "").trim().toLowerCase() === comboCategoryType
    ).slice(0, 4)
    : [];
  const activeImage = selectedImage.id === id && selectedImage.image
    ? selectedImage.image
    : gallery[0] || "";
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

  useEffect(() => {
    if (!isImageZoomOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsImageZoomOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImageZoomOpen]);

  const pageTitle = loading ? "Combo Offers" : combo?.name || "Combo Offers";

  return (
    <>
      <PageHeader title={pageTitle} />
      <main className="min-h-[60vh]">
        <PageContainer className="py-6 sm:py-10">
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
              <section className="grid gap-6 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8">
                <div className="relative lg:z-20">
                  <button
                    type="button"
                    onClick={() => activeImage && !imageFailed && setIsImageZoomOpen(true)}
                    onPointerMove={(event) => {
                      if (event.pointerType !== "mouse") return;
                      const bounds = event.currentTarget.getBoundingClientRect();
                      const x = ((event.clientX - bounds.left) / bounds.width) * 100;
                      const y = ((event.clientY - bounds.top) / bounds.height) * 100;
                      setImageZoomOrigin(`${x}% ${y}%`);
                    }}
                    onPointerEnter={(event) => {
                      if (event.pointerType === "mouse" && activeImage && !imageFailed) setIsImageHovered(true);
                    }}
                    onPointerLeave={() => setIsImageHovered(false)}
                    aria-label={`View ${combo.name} image enlarged`}
                    className="group relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-[#faf8ff] p-5 sm:aspect-[4/3]"
                  >
                    {activeImage && !imageFailed ? (
                      <img
                        src={activeImage}
                        alt={combo.name}
                        className="h-full w-full object-contain"
                        onError={() => setImageFailed(true)}
                      />
                    ) : (
                      <Boxes className="h-16 w-16 text-primary/35" strokeWidth={1.5} aria-hidden="true" />
                    )}
                    {Number(combo.mrp) > Number(combo.final_price ?? combo.offer_price) && (
                      <span className="pointer-events-none absolute left-4 top-4 rounded-full bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white">
                        Save {currency(Number(combo.mrp) - Number(combo.final_price ?? combo.offer_price))}
                      </span>
                    )}
                    {activeImage && !imageFailed && (
                      <span className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-600 opacity-0 shadow transition-opacity group-hover:opacity-100">
                        Move to zoom · click to enlarge
                      </span>
                    )}
                  </button>
                  {isImageHovered && activeImage && !imageFailed && (
                    <div
                      aria-hidden="true"
                      className="pointer-events-none absolute left-[calc(100%+2.5rem)] top-0 z-30 hidden aspect-[4/3] w-full rounded-xl border border-border bg-white shadow-xl lg:block"
                      style={{
                        backgroundImage: `url("${activeImage}")`,
                        backgroundPosition: imageZoomOrigin,
                        backgroundRepeat: "no-repeat",
                        backgroundSize: "200% 200%",
                      }}
                    />
                  )}
                  {isImageZoomOpen && activeImage && !imageFailed && (
                    <div
                      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 p-4 sm:p-8"
                      role="dialog"
                      aria-modal="true"
                      aria-label={`Enlarged image of ${combo.name}`}
                      onClick={(event) => {
                        if (event.target === event.currentTarget) setIsImageZoomOpen(false);
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setIsImageZoomOpen(false)}
                        aria-label="Close enlarged image"
                        className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
                      >
                        <X size={22} aria-hidden="true" />
                      </button>
                      <img src={activeImage} alt={combo.name} className="max-h-[90vh] max-w-full object-contain" />
                    </div>
                  )}
                  {gallery.length > 1 && (
                    <div className="mt-3 flex gap-2 overflow-x-auto">
                      {gallery.map((image, index) => (
                        <button
                          key={`${image}-${index}`}
                          type="button"
                          onClick={() => {
                            setImageFailed(false);
                            setSelectedImage({ id, image });
                          }}
                          aria-label={`Show combo image ${index + 1}`}
                          aria-pressed={activeImage === image}
                          className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#faf8ff] p-1 ${activeImage === image ? "border-primary" : "border-transparent"}`}
                        >
                          <img
                            src={image}
                            alt=""
                            className="h-full w-full object-contain"
                            onError={(event) => {
                              event.currentTarget.style.visibility = "hidden";
                            }}
                          />
                        </button>
                      ))}
                    </div>
                  )}
                  {combo.video && (
                    <video src={imageUrl(combo.video)} controls className="mt-3 max-h-80 w-full rounded-xl bg-black" aria-label={`${combo.name} product video`} />
                  )}
                </div>

                <div className="flex flex-col">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">{[combo.category_type || "Combo", combo.category, combo.subcategory].filter(Boolean).join(" · ")}</p>
                  <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">{combo.name}</h1>
                  <p className="mt-2 text-sm text-text-secondary">Combo code: {combo.code}</p>

                  <div className="mt-5 flex flex-wrap items-baseline gap-3">
                    <span className="text-2xl font-black text-text-primary">{currency(combo.final_price ?? combo.offer_price)}</span>
                    {Number(combo.mrp) > Number(combo.final_price ?? combo.offer_price) && (
                      <>
                        <span className="text-base text-text-secondary line-through">{currency(combo.mrp)}</span>
                        {Number(combo.offer) > 0 && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">{Number(combo.offer)}% off</span>}
                      </>
                    )}
                  </div>
                  <p className={`mt-3 text-sm font-semibold ${available ? "text-emerald-700" : "text-rose-600"}`}>
                    {available ? (tracksInventory ? `In stock (${combo.available_stock})` : "Available") : "Out of stock"}
                  </p>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <div className="inline-flex items-center rounded-lg border border-border">
                      <button
                        type="button"
                        aria-label="Decrease combo quantity"
                        onClick={() => setQuantityState({ id, value: Math.max(minimumQuantity, quantity - 1) })}
                        disabled={quantity <= minimumQuantity}
                        className="p-2 text-text-primary disabled:opacity-40"
                      ><Minus size={16} /></button>
                      <span className="min-w-9 text-center text-sm font-bold">{quantity}</span>
                      <button
                        type="button"
                        aria-label="Increase combo quantity"
                        onClick={() => setQuantityState({ id, value: Math.min(maximumQuantity, quantity + 1) })}
                        disabled={quantity >= maximumQuantity}
                        className="p-2 text-text-primary disabled:opacity-40"
                      ><Plus size={16} /></button>
                    </div>
                    <button
                      type="button"
                      onClick={() => addComboToCart(combo, quantity)}
                      disabled={!available}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
                    ><ShoppingCart size={17} /> Add to Cart</button>
                    <button
                      type="button"
                      onClick={handleBuyNow}
                      disabled={!available}
                      className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                    ><Zap size={17} /> Buy Now</button>
                    <button
                      type="button"
                      onClick={() => toggleComboWishlist(combo)}
                      aria-label={isFavorite ? "Remove combo from favorites" : "Add combo to favorites"}
                      className={`inline-flex h-11 w-11 items-center justify-center rounded-xl border transition ${isFavorite ? "border-rose-200 bg-rose-50 text-rose-600" : "border-border text-text-secondary hover:border-rose-200 hover:text-rose-600"}`}
                    ><Heart size={19} fill={isFavorite ? "currentColor" : "none"} /></button>
                  </div>
                  <p className="mt-2 text-xs text-text-secondary">
                    Order quantity: {minimumQuantity}{maximumQuantity < 10000 ? `–${maximumQuantity}` : "+"}
                  </p>

                  <div className="mt-7 border-t border-border pt-5">
                    <h2 className="text-base font-bold text-text-primary">Combo details</h2>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text-secondary">
                      {combo.description || "No description available."}
                    </p>
                  </div>
                  {specifications.length > 0 && (
                    <dl className="mt-5 divide-y divide-border border-y border-border">
                      {specifications.map((specification, index) => (
                        <div key={`${specification.key}-${index}`} className="flex justify-between gap-4 py-2.5 text-sm">
                          <dt className="font-semibold text-text-primary">{specification.key}</dt>
                          <dd className="text-right text-text-secondary">{specification.value}</dd>
                        </div>
                      ))}
                    </dl>
                  )}

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
                  {combo.warranty && <p className="mt-4 flex items-center gap-2 text-sm text-text-secondary"><ShieldCheck size={17} className="text-primary" />{combo.warranty}</p>}
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

              <section className="mt-8">
                <div className="mb-4">
                  <h2 className="text-xl font-black text-slate-900">Related combos</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    More bundles from the {combo.category_type} category type.
                  </p>
                </div>
                {relatedState.loading ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="aspect-[4/5] animate-pulse rounded-2xl bg-white" />
                    ))}
                  </div>
                ) : relatedState.failed ? (
                  <p className="rounded-xl border border-rose-100 bg-white p-4 text-sm text-rose-700">
                    Related combos could not be loaded.
                  </p>
                ) : relatedCombos.length ? (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-5">
                    {relatedCombos.map((relatedCombo) => {
                      const relatedImage = imageUrl(parseList(relatedCombo.gallery_images)[0]);
                      const relatedPrice = Number(relatedCombo.final_price ?? relatedCombo.offer_price ?? 0);
                      const relatedMrp = Number(relatedCombo.mrp ?? 0);
                      return (
                        <Link
                          key={relatedCombo.id}
                          to={`/combos/${relatedCombo.id}`}
                          className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
                        >
                          <div className="aspect-square overflow-hidden bg-violet-50">
                            {relatedImage ? (
                              <img
                                src={relatedImage}
                                alt={relatedCombo.name}
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full items-center justify-center text-violet-300">
                                <Boxes size={42} strokeWidth={1.5} aria-hidden="true" />
                              </div>
                            )}
                          </div>
                          <div className="p-3">
                            <h3 className="line-clamp-2 min-h-10 text-sm font-bold text-slate-800 group-hover:text-primary">
                              {relatedCombo.name}
                            </h3>
                            <div className="mt-2 flex flex-wrap items-baseline gap-2">
                              <span className="text-sm font-extrabold text-primary">{currency(relatedPrice)}</span>
                              {relatedMrp > relatedPrice && (
                                <span className="text-xs text-slate-400 line-through">{currency(relatedMrp)}</span>
                              )}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="rounded-xl border border-slate-100 bg-white p-4 text-sm text-slate-500">
                    No other active combos in this category yet.
                  </p>
                )}
              </section>

              {(combo.return_policy || combo.delivery_information) && (
                <section className="mt-6 grid gap-4 sm:grid-cols-2">
                  {combo.return_policy && <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-800">Return policy</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{combo.return_policy}</p></article>}
                  {combo.delivery_information && <article className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-slate-800">Delivery information</h2><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{combo.delivery_information}</p></article>}
                </section>
              )}
              <ComboReviews comboId={id} comboName={combo.name} />
            </>
          )}
        </PageContainer>
      </main>
    </>
  );
}

export default ComboProductDetail;
