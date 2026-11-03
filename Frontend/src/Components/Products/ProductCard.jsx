import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { Package, ShoppingCart, Zap } from "lucide-react";
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

function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const { addToCart } = useContext(StoreContext);
  const image = getProductImage(product);
  const productDetailsPath = `/product/${product.id}`;
  const mrp = Number(product.mrp) || 0;
  const offerPrice = Number(product.offer_price ?? product.mrp) || 0;
  const hasDiscount = mrp > offerPrice;
  const discount = hasDiscount ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <Link
        to={productDetailsPath}
        aria-label={`View ${product.name} details`}
        className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#faf8ff] p-4"
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={product.name || "Product"}
            loading="lazy"
            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <Package className="h-12 w-12 text-primary/35" strokeWidth={1.5} aria-hidden="true" />
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold text-white">
            {discount}% OFF
          </span>
        )}
      </Link>
      <div className="p-3.5 sm:p-4">
        {(product.cat_type || product.category) && (
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary">
            {[product.cat_type, product.category].filter(Boolean).join(" · ")}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-text-primary">
          <Link to={productDetailsPath} className="transition hover:text-primary">
          {product.name}
          </Link>
        </h3>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <span className="text-base font-extrabold text-text-primary">
            ₹{offerPrice.toLocaleString("en-IN")}
          </span>
          {hasDiscount && (
            <span className="text-xs text-text-secondary line-through">
              ₹{mrp.toLocaleString("en-IN")}
            </span>
          )}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => addToCart(product)}
            disabled={Number(product.total_stock) < 1}
            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-primary px-2 py-2 text-[11px] font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50 sm:text-xs"
          >
            <ShoppingCart size={14} aria-hidden="true" />
            Add to Cart
          </button>
          <button
            type="button"
            className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-primary px-2 py-2 text-[11px] font-bold text-white transition hover:bg-primary-dark sm:text-xs"
          >
            <Zap size={14} aria-hidden="true" />
            Buy Now
          </button>
        </div>
      </div>
    </article>
  );
}

export default ProductCard;
