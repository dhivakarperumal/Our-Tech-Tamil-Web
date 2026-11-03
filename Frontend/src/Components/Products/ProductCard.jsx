import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Heart, Leaf, Package, Shirt, ShoppingCart, Sparkles, Zap } from "lucide-react";
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
    return Sparkles;
  }

  if (normalized.includes("health") || normalized.includes("wellness") || normalized.includes("oil") || normalized.includes("natural")) {
    return Leaf;
  }

  if (normalized.includes("shirt") || normalized.includes("cloth") || normalized.includes("wear")) {
    return Shirt;
  }

  return Package;
}

function ProductCard({ product }) {
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
  const CategoryIcon = getCategoryIcon(categoryLabel);
  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      if (await addToCart(product)) navigate("/checkout");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <article className="group w-full min-w-0 rounded-[28px] border border-[#e2d3f5] bg-[#f7f0fb] p-3 shadow-[0_12px_28px_rgba(75,0,200,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_32px_rgba(75,0,200,0.12)]">
      <div className="relative">
        {discount > 0 && (
          <span className="absolute left-3 top-3 z-10 rounded-full bg-[#4B00C8] px-2.5 py-1 text-[10px] font-extrabold tracking-tight text-white shadow-sm">
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
          className="relative block overflow-hidden rounded-[26px] bg-[#f2ebf8]"
        >
          <div className="relative flex h-[250px] items-center justify-center overflow-hidden rounded-[26px]">
            {image && !imageFailed ? (
              <img
                src={image}
                alt={product.name || "Product"}
                loading="lazy"
                className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                onError={() => setImageFailed(true)}
              />
            ) : (
              <Package className="h-14 w-14 text-[#4B00C8]/30" strokeWidth={1.5} aria-hidden="true" />
            )}
          </div>
        </Link>
      </div>

      <div className="px-1 pb-1 pt-4">
        <div className="flex items-center gap-2 text-[#4B00C8]">
          <CategoryIcon size={18} strokeWidth={2.3} aria-hidden="true" />
          <span className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-[#4B00C8]">
            {categoryLabel}
          </span>
        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[2.4rem] text-[0.95rem] font-bold leading-[1.2] tracking-[-0.02em] text-[#111027] sm:text-[0.88rem]">
          <Link to={productDetailsPath} className="transition hover:text-[#4B00C8]">
            {product.name}
          </Link>
        </h3>

        <div className="mt-3 flex items-end justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-[0.95rem] font-bold tracking-[-0.02em] text-[#4B00C8] sm:text-[0.88rem]">
              ₹{offerPrice.toLocaleString("en-IN")}
            </span>
            {hasDiscount && (
              <span className="text-[0.76rem] font-medium text-[#6B6478] line-through">
                ₹{mrp.toLocaleString("en-IN")}
              </span>
            )}
          </div>

          {hasDiscount && (
            <span className="rounded-full bg-[#efe0ff] px-2 py-1 text-[8px] font-bold text-[#4B00C8]">
              Save ₹{savedAmount.toLocaleString("en-IN")}
            </span>
          )}
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={Number(product.total_stock) < 1}
            className="inline-flex items-center justify-center gap-1.5 rounded-[12px] border border-[#4B00C8] bg-white px-2 py-2.5 text-[0.7rem] font-extrabold text-[#4B00C8] shadow-sm transition hover:bg-[#f1ebff] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ShoppingCart size={14} aria-hidden="true" />
            Add to Cart
          </button>
          <button
            type="button"
            onClick={handleBuyNow}
            disabled={isBuying || Number(product.total_stock) < 1}
            className="inline-flex items-center justify-center gap-1.5 rounded-[12px] bg-[#4B00C8] px-2 py-2.5 text-[0.7rem] font-extrabold text-white shadow-[0_8px_18px_rgba(75,0,200,0.25)] transition hover:bg-[#3d00a9] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap size={14} aria-hidden="true" />
            {isBuying ? "Please wait..." : "Buy Now"}
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
