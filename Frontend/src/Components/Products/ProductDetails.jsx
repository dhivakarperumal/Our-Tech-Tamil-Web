import { useContext, useEffect, useState } from "react";
import { ArrowLeft, Package, ShoppingCart, Zap } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import { StoreContext } from "../../PrivateRouter/StoreContext";

function getImages(product) {
  const parseImages = (value) => {
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch {
        return [];
      }
    }
    return Array.isArray(value) ? value.filter((image) => typeof image === "string" && image) : [];
  };

  const variants = typeof product.variants === "string"
    ? (() => {
      try {
        return JSON.parse(product.variants);
      } catch {
        return [];
      }
    })()
    : product.variants;

  const variantImages = Array.isArray(variants)
    ? variants.flatMap((variant) => parseImages(variant?.images))
    : [];
  return [...new Set([...variantImages, ...parseImages(product.images)])];
}

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function ProductDetails() {
  const { id } = useParams();
  const { addToCart } = useContext(StoreContext);
  const navigate = useNavigate();
  const [isBuying, setIsBuying] = useState(false);
  const [productState, setProductState] = useState({
    id: null,
    product: null,
    failed: false,
  });
  const [activeImage, setActiveImage] = useState("");
  const loading = productState.id !== id;
  const product = loading ? null : productState.product;
  const fetchFailed = !loading && productState.failed;

  useEffect(() => {
    let active = true;

    api.get(`/products/public/${id}`)
      .then(({ data }) => {
        if (active) {
          setActiveImage(getImages(data)[0] || "");
          setProductState({ id, product: data, failed: false });
        }
      })
      .catch((error) => {
        console.error("Failed to fetch product details:", error);
        if (active) setProductState({ id, product: null, failed: true });
      })

    return () => {
      active = false;
    };
  }, [id]);

  if (loading) {
    return (
      <>
        <PageHeader title={product.name} />
        <PageContainer className="py-12">
          <div className="mx-auto h-80 max-w-5xl animate-pulse rounded-2xl bg-[#faf8ff]" />
        </PageContainer>
      </>
    );
  }

  if (fetchFailed || !product) {
    return (
      <>
        <PageHeader title="Product Details" />
        <PageContainer className="py-16 text-center">
          <p className="text-sm text-text-secondary">This product could not be found.</p>
          <Link to="/shop" className="mt-4 inline-flex items-center gap-2 font-bold text-primary">
            <ArrowLeft size={17} /> Back to shop
          </Link>
        </PageContainer>
      </>
    );
  }

  const images = getImages(product);
  const price = Number(product.offer_price ?? product.mrp) || 0;
  const mrp = Number(product.mrp) || 0;
  const inStock = Number(product.total_stock) > 0;
  const handleBuyNow = async () => {
    setIsBuying(true);
    try {
      if (await addToCart(product)) navigate("/checkout");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <>
      <PageHeader title="Product Details" />
      <PageContainer className="py-6 sm:py-10">
        <Link to="/shop" className="mb-5 inline-flex items-center gap-2 text-sm font-semibold text-text-secondary transition hover:text-primary">
          <ArrowLeft size={17} /> Back to shop
        </Link>
        <div className="grid gap-6 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#faf8ff] p-5 sm:aspect-[4/3]">
            {activeImage ? (
              <img src={getImageUrl(activeImage)} alt={product.name} className="h-full w-full object-contain" />
            ) : (
              <Package className="h-16 w-16 text-primary/35" strokeWidth={1.5} aria-hidden="true" />
            )}
          </div>
          {images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {images.map((image) => (
                <button
                  key={image}
                  type="button"
                  onClick={() => setActiveImage(image)}
                  aria-label={`Show product image ${images.indexOf(image) + 1}`}
                  aria-pressed={activeImage === image}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#faf8ff] p-1 ${
                    activeImage === image ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={getImageUrl(image)} alt="" className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col">
          {(product.cat_type || product.category) && (
            <p className="text-xs font-bold uppercase tracking-wider text-primary">
              {[product.cat_type, product.category].filter(Boolean).join(" · ")}
            </p>
          )}
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            {product.name}
          </h1>
          {product.brand && (
            <p className="mt-2 text-sm text-text-secondary">Brand: {product.brand}</p>
          )}
          <div className="mt-5 flex flex-wrap items-baseline gap-3">
            <span className="text-2xl font-black text-text-primary">
              ₹{price.toLocaleString("en-IN")}
            </span>
            {mrp > price && (
              <>
                <span className="text-base text-text-secondary line-through">
                  ₹{mrp.toLocaleString("en-IN")}
                </span>
                <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                  {Math.round(((mrp - price) / mrp) * 100)}% off
                </span>
              </>
            )}
          </div>
          <p className={`mt-3 text-sm font-semibold ${inStock ? "text-emerald-700" : "text-rose-600"}`}>
            {inStock ? `In stock (${product.total_stock} ${product.unit || "Piece"})` : "Out of stock"}
          </p>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => addToCart(product)}
              disabled={!inStock}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={17} aria-hidden="true" />
              Add to Cart
            </button>
            <button
              type="button"
              onClick={handleBuyNow}
              disabled={!inStock || isBuying}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Zap size={17} aria-hidden="true" />
              {isBuying ? "Please wait..." : "Buy Now"}
            </button>
          </div>

          <div className="mt-7 border-t border-border pt-5">
            <h2 className="text-base font-bold text-text-primary">Product details</h2>
            <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
              {product.description || "No description available."}
            </p>
          </div>
          {Array.isArray(product.specifications) && product.specifications.length > 0 && (
            <dl className="mt-5 divide-y divide-border border-y border-border">
              {product.specifications.map((specification, index) => (
                <div key={`${specification.key}-${index}`} className="flex justify-between gap-4 py-2.5 text-sm">
                  <dt className="font-semibold text-text-primary">{specification.key}</dt>
                  <dd className="text-right text-text-secondary">{specification.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        </div>
      </PageContainer>
    </>
  );
}

export default ProductDetails;
