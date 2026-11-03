import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Leaf, Package, Shirt, ShoppingCart, Sparkles, Star, Zap } from "lucide-react";
import { StoreContext } from "../../PrivateRouter/StoreContext";

function getFirstImage(images) {
  if (!images) return "";

  let parsedImages = images;
  if (typeof images === "string") {
    try {
      parsedImages = JSON.parse(images);
    } catch {
      parsedImages = images;
    }
  }

  return Array.isArray(parsedImages)
    ? parsedImages.find((image) => typeof image === "string" && image)
    : typeof parsedImages === "string"
      ? parsedImages
      : "";
}

function getProductImage(product) {
  let variants = product.variants;
  if (typeof variants === "string") {
    try {
      variants = JSON.parse(variants);
    } catch {
      variants = [];
    }
  }

  const firstVariant = Array.isArray(variants) ? variants[0] : null;
  const image = getFirstImage(firstVariant?.images) || getFirstImage(product.images);
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function getCategoryIcon(category) {
  const normalized = String(category || "").toLowerCase();

  if (normalized.includes("women") || normalized.includes("ethnic") || normalized.includes("print")) {
    return "sparkles";
  }

  if (normalized.includes("health") || normalized.includes("wellness") || normalized.includes("oil") || normalized.includes("natural")) {
    return "leaf";
  }

  if (normalized.includes("shirt") || normalized.includes("cloth") || normalized.includes("wear")) {
    return "shirt";
  }

  return "package";
}

function ProductCard({ product, compact = false, dense = false, offer = false }) {
  const [imageFailed, setImageFailed] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const { addToCart, toggleWishlist, wishlist } = useContext(StoreContext);
  const navigate = useNavigate();
  const image = getProductImage(product);
  const isWishlisted = wishlist.some((item) => Number(item.product_id ?? item.productId ?? item.id) === Number(product.id));
  const productDetailsPath = `/product/${product.id}`;
  const mrp = Number(product.mrp) || 0;
  const offerPrice = Number(product.offer_price ?? product.mrp) || 0;
  const hasDiscount = mrp > offerPrice;
  const discount = hasDiscount ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;
  const savedAmount = hasDiscount ? Math.max(0, mrp - offerPrice) : 0;
  const categoryLabel = [product.cat_type, product.category].filter(Boolean).join(" ") || "Product";
  const categoryIcon = getCategoryIcon(categoryLabel);
  const rating = Number(product.rating) || 0;
  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      if (await addToCart(product)) navigate("/checkout");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <article className={`group w-full min-w-0 border shadow-[0_12px_28px_rgba(75,0,200,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(75,0,200,0.12)] ${offer ? "rounded-[22px] border-violet-200 bg-white p-2.5" : `border-[#e2d3f5] bg-[#f7f0fb] ${compact ? "rounded-[22px] p-2.5" : "rounded-[28px] p-3"}`}`}>
      <div className="relative">
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-[#4B00C8] px-2.5 py-1 text-[10px] font-extrabold tracking-tight text-white shadow-md">
            {discount}% OFF
          </span>
        )}

        <button
          type="button"
          onClick={() => toggleWishlist(product)}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          className={`absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#e6d8f7] bg-white/90 shadow-sm transition hover:scale-105 hover:bg-white ${isWishlisted ? "text-rose-600" : "text-[#4B00C8]"}`}
        >
          <Heart size={16} strokeWidth={2.2} fill={isWishlisted ? "currentColor" : "none"} aria-hidden="true" />
        </button>

        <Link
          to={productDetailsPath}
          aria-label={`View ${product.name} details`}
          className={`relative block overflow-hidden ${offer ? "rounded-[18px] bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white" : `bg-[#f2ebf8] ${compact ? "rounded-[18px]" : "rounded-[26px]"}`}`}
        >
          <div className={`relative flex w-full items-center justify-center overflow-hidden ${compact ? "aspect-square rounded-[18px]" : "h-[250px] rounded-[26px]"}`}>
            {image && !imageFailed ? (
              <img
                src={image}
                alt={product.name || "Product"}
                loading="lazy"
                className={`h-full w-full transition duration-300 group-hover:scale-105 ${compact ? "object-cover" : "object-contain"}`}
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Package className="h-14 w-14 text-[#4B00C8]/30" strokeWidth={1.5} aria-hidden="true" />
            )}
          </div>
        </Link>
      </div>

      <div className={`px-1 pb-1 ${compact ? "pt-3" : "pt-4"}`}>
        <div className="flex items-center gap-2 text-[#4B00C8]">
          {categoryIcon === "sparkles" && <Sparkles size={compact ? 14 : 18} strokeWidth={2.3} aria-hidden="true" />}
          {categoryIcon === "leaf" && <Leaf size={compact ? 14 : 18} strokeWidth={2.3} aria-hidden="true" />}
          {categoryIcon === "shirt" && <Shirt size={compact ? 14 : 18} strokeWidth={2.3} aria-hidden="true" />}
          {categoryIcon === "package" && <Package size={compact ? 14 : 18} strokeWidth={2.3} aria-hidden="true" />}
          <span className={`truncate font-extrabold uppercase tracking-[0.14em] text-[#4B00C8] ${compact ? "text-[9px]" : "text-[11px] tracking-[0.18em]"}`}>
            {categoryLabel}
          </span>
        </div>

        <h3 className={`line-clamp-2 font-extrabold leading-[1.2] tracking-[-0.035em] text-[#111027] ${compact ? "mt-1.5 min-h-[2rem] text-sm" : "mt-2 min-h-[2.4rem] text-[1.2rem] sm:text-[1.08rem]"}`}>
          <Link to={productDetailsPath} className="transition hover:text-[#4B00C8]">
            {product.name}
          </Link>
        </h3>

        {compact && (
          <div className="mt-1.5 flex items-center gap-1 text-[10px]" aria-label={`${Number(product.rating) || 0} out of 5 stars`}>
            <span className="flex items-center gap-0.5 text-amber-500">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} size={11} fill={index < Math.round(Number(product.rating) || 0) ? "currentColor" : "none"} className={index < Math.round(Number(product.rating) || 0) ? "text-amber-400" : "text-slate-300"} aria-hidden="true" />
              ))}
            </span>
            <span className="font-bold text-slate-700">{rating ? rating.toFixed(1) : "New"}</span>
            {rating > 0 && <span className="text-slate-400">/ 5</span>}
          </div>
        )}

        <div className={`${compact ? "mt-2.5" : "mt-3"} flex items-end justify-between gap-2`}>
          <div className="flex min-w-0 items-baseline gap-2">
            <span className={`shrink-0 font-extrabold tracking-[-0.04em] text-[#4B00C8] ${offer ? "text-lg" : compact ? "text-base" : "text-[1.2rem] sm:text-[1.08rem]"}`}>
              ₹{offerPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className={`truncate font-medium text-[#6B6478] line-through ${compact ? "text-[10px]" : "text-[0.76rem]"}`}>
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {hasDiscount && (
            <span className={`shrink-0 rounded-full bg-[#efe0ff] px-2 py-1 font-bold text-[#4B00C8] ${offer ? "text-[9px]" : compact ? "text-[7px]" : "text-[8px]"}`}>
              Save ₹{savedAmount.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className={`grid gap-2 ${dense ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-2"} ${compact ? "mt-3" : "mt-4"}`}>
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={Number(product.total_stock) < 1}
            className={`inline-flex min-w-0 items-center justify-center rounded-[12px] border border-[#4B00C8] bg-white font-extrabold text-[#4B00C8] shadow-sm transition hover:bg-[#f1ebff] disabled:cursor-not-allowed disabled:opacity-50 ${dense ? "min-h-10 gap-1 px-1 py-1.5 text-[10px] leading-tight" : offer ? "gap-1.5 px-2 py-2.5 text-[0.7rem]" : compact ? "gap-1.5 px-2 py-2 text-[0.62rem]" : "gap-1.5 px-2 py-2.5 text-[0.7rem]"}`}
          >
            <ShoppingCart className="shrink-0" size={14} aria-hidden="true" />
            <span className="min-w-0 whitespace-nowrap text-center leading-tight">Add to Cart</span>
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isBuying || Number(product.total_stock) < 1}
            className={`inline-flex min-w-0 items-center justify-center rounded-[12px] bg-[#4B00C8] font-extrabold text-white shadow-[0_8px_18px_rgba(75,0,200,0.25)] transition hover:bg-[#3d00a9] disabled:cursor-not-allowed disabled:opacity-50 ${dense ? "min-h-10 gap-1 px-1 py-1.5 text-[10px] leading-tight" : offer ? "gap-1.5 px-2 py-2.5 text-[0.7rem]" : compact ? "gap-1.5 px-2 py-2 text-[0.62rem]" : "gap-1.5 px-2 py-2.5 text-[0.7rem]"}`}
          >
            <Zap className="shrink-0" size={14} aria-hidden="true" />
            <span className="min-w-0 whitespace-nowrap text-center leading-tight">{isBuying ? "Please wait..." : "Buy Now"}</span>
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
