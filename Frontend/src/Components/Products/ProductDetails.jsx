import { useContext, useEffect, useState } from "react";
import { ArrowLeft, Minus, Package, Plus, ShoppingCart, Zap } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import { StoreContext } from "../../PrivateRouter/StoreContext";
import { getProductStock } from "../../utils/stock";
import ProductCard from "./ProductCard";

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getColorSwatch(name, value) {
  const rawColor = typeof value === "string" ? value.trim() : "";
  if (/^#(?:[\da-f]{3,4}|[\da-f]{6}|[\da-f]{8})$/i.test(rawColor) ||
      /^(?:rgb|hsl)a?\([\d.%\s,/+-]+\)$/i.test(rawColor)) {
    return rawColor;
  }

  const normalizedName = String(name || "").trim().toLowerCase();
  const namedColors = {
    "jet black": "#0a0a0a",
    "space black": "#1c1c1e",
    black: "#000000",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#3b82f6",
    green: "#22c55e",
    yellow: "#eab308",
    orange: "#f97316",
    pink: "#ec4899",
    purple: "#8b5cf6",
    brown: "#92400e",
    grey: "#9ca3af",
    gray: "#9ca3af",
    silver: "#c0c0c0",
    gold: "#d4af37",
  };
  return namedColors[normalizedName] || namedColors[rawColor.toLowerCase()] || "#d1d5db";
}

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
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [productState, setProductState] = useState({
    id: null,
    product: null,
    failed: false,
  });
  const [activeImage, setActiveImage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [relatedProductState, setRelatedProductState] = useState({ productId: null, items: [] });
  const loading = productState.id !== id;
  const product = loading ? null : productState.product;
  const fetchFailed = !loading && productState.failed;

  useEffect(() => {
    let active = true;

    api.get(`/products/public/${id}`)
      .then(({ data }) => {
        if (active) {
          const variants = parseList(data.variants);
          const firstVariant = variants[0];
          setSelectedColor(firstVariant?.colorName || firstVariant?.color || parseList(data.available_colors)[0] || "");
          setSelectedSize(
            firstVariant?.selectedSizes?.[0] ||
            Object.keys(firstVariant?.sizesStock || {})[0] ||
            parseList(data.available_sizes)[0] ||
            "",
          );
          setQuantity(1);
          setImageFailed(false);
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

  useEffect(() => {
    const currentProduct = productState.id === id ? productState.product : null;
    if (!currentProduct) return undefined;

    let active = true;
    const loadRelatedProducts = async () => {
      try {
        const searchTerm = currentProduct.cat_type || currentProduct.category;
        const { data } = await api.get("/products/public", {
          params: { limit: 100, ...(searchTerm ? { search: searchTerm } : {}) },
        });
        const products = Array.isArray(data.products) ? data.products : [];
        const exactCategory = String(currentProduct.category || "").trim().toLowerCase();
        const productType = String(currentProduct.cat_type || "").trim().toLowerCase();
        const related = products
          .filter((item) => Number(item.id) !== Number(currentProduct.id))
          .filter((item) => {
            const sameCategory = exactCategory &&
              String(item.category || "").trim().toLowerCase() === exactCategory;
            const sameType = productType &&
              String(item.cat_type || "").trim().toLowerCase() === productType;
            return sameCategory || sameType;
          })
          .sort((left, right) => {
            const leftExact = String(left.category || "").trim().toLowerCase() === exactCategory;
            const rightExact = String(right.category || "").trim().toLowerCase() === exactCategory;
            return Number(rightExact) - Number(leftExact);
          })
          .slice(0, 4);
        if (active) setRelatedProductState({ productId: id, items: related });
      } catch (error) {
        console.error("Failed to load related products:", error);
        if (active) setRelatedProductState({ productId: id, items: [] });
      }
    };

    loadRelatedProducts();
    return () => {
      active = false;
    };
  }, [id, productState]);

  if (loading) {
    return (
      <>
        <PageHeader title="Product" align="left" />
        <PageContainer className="py-12">
          <div className="mx-auto h-80 max-w-5xl animate-pulse rounded-2xl bg-[#faf8ff]" />
        </PageContainer>
      </>
    );
  }

  if (fetchFailed || !product) {
    return (
      <>
        <PageHeader title="Product" align="left" />
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
  const variants = parseList(product.variants);
  const selectedVariant = variants.find((variant) =>
    (variant.colorName || variant.color || "") === selectedColor,
  ) || null;
  const colorOptions = variants.length
    ? variants.map((variant) => ({
      name: variant.colorName || variant.color || "",
      variant,
    })).filter((color) => color.name)
    : parseList(product.available_colors).map((name) => ({ name, variant: null }));
  const sizeOptions = selectedVariant?.selectedSizes?.length
    ? selectedVariant.selectedSizes
    : Object.keys(selectedVariant?.sizesStock || {}).length
      ? Object.keys(selectedVariant.sizesStock)
      : parseList(product.available_sizes);
  const selectedStock = getProductStock(product, selectedVariant, selectedSize);
  const relatedProducts = relatedProductState.productId === id ? relatedProductState.items : [];
  const price = Number(product.offer_price ?? product.mrp) || 0;
  const mrp = Number(product.mrp) || 0;
  const inStock = selectedStock > 0;
  const handleAddToCart = async (buyNow = false) => {
    if (buyNow) setIsBuying(true);
    else setIsAddingToCart(true);
    try {
      const added = await addToCart(product, selectedVariant, selectedSize || null, quantity);
      if (added && buyNow) navigate("/checkout");
    } finally {
      setIsBuying(false);
      setIsAddingToCart(false);
    }
  };
  return (
    <>
      <PageHeader title={product.name} align="left" />
      <PageContainer className="py-6 sm:py-10">
      <div className="grid gap-6 rounded-2xl border border-border bg-white p-4 shadow-sm sm:p-6 lg:grid-cols-2 lg:gap-10 lg:p-8">
        <div>
          <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl bg-[#faf8ff] p-5 sm:aspect-[4/3]">
            {activeImage && !imageFailed ? (
              <img
                src={getImageUrl(activeImage)}
                alt={product.name}
                className="h-full w-full object-contain"
                onError={() => setImageFailed(true)}
              />
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
                  onClick={() => {
                    setImageFailed(false);
                    setActiveImage(image);
                  }}
                  aria-label={`Show product image ${images.indexOf(image) + 1}`}
                  aria-pressed={activeImage === image}
                  className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 bg-[#faf8ff] p-1 ${
                    activeImage === image ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img
                    src={getImageUrl(image)}
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
            {inStock ? `In stock (${selectedStock} ${product.unit || "Piece"})` : "Out of stock"}
          </p>

          {colorOptions.length > 0 && (
            <fieldset className="mt-5">
              <legend className="text-sm font-bold text-text-primary">Color</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {colorOptions.map(({ name, variant }) => (
                  <button
                    key={name}
                    type="button"
                    title={name}
                    onClick={() => {
                      setSelectedColor(name);
                      setSelectedSize(
                        variant?.selectedSizes?.[0] ||
                        Object.keys(variant?.sizesStock || {})[0] ||
                        "",
                      );
                      setQuantity(1);
                      const nextImage = getImages({
                        ...product,
                        variants: variant ? [variant] : [],
                      })[0];
                      if (nextImage) {
                        setImageFailed(false);
                        setActiveImage(nextImage);
                      }
                      }}
                      aria-label={`Select color ${name}`}
                      aria-pressed={selectedColor === name}
                      className={`h-9 w-9 rounded-full border-2 p-1 transition ${
                        selectedColor === name
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary"
                      }`}
                  >
                      <span
                      aria-hidden="true"
                        className="block h-full w-full rounded-full border border-black/10"
                        style={{ backgroundColor: getColorSwatch(name, variant?.color) }}
                      />
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {sizeOptions.length > 0 && (
            <fieldset className="mt-4">
              <legend className="text-sm font-bold text-text-primary">Size</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {sizeOptions.map((size) => {
                  const sizeStock = getProductStock(product, selectedVariant, size);
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => {
                        setSelectedSize(size);
                        setQuantity(1);
                      }}
                      disabled={sizeStock < 1}
                      aria-pressed={selectedSize === size}
                      className={`min-w-10 rounded-lg border px-3 py-1.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        selectedSize === size
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-text-secondary hover:border-primary"
                      }`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          )}

          <div className="mt-5 flex items-center gap-3">
            <span className="text-sm font-bold text-text-primary">Quantity</span>
            <div className="inline-flex items-center rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.max(1, current - 1))}
                disabled={quantity <= 1}
                aria-label="Decrease quantity"
                className="p-2 text-text-primary disabled:opacity-40"
              >
                <Minus size={16} />
              </button>
              <span className="min-w-9 text-center text-sm font-bold">{quantity}</span>
              <button
                type="button"
                onClick={() => setQuantity((current) => Math.min(selectedStock, current + 1))}
                disabled={quantity >= selectedStock}
                aria-label="Increase quantity"
                className="p-2 text-text-primary disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleAddToCart()}
              disabled={!inStock || isAddingToCart || isBuying}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-primary px-4 py-3 text-sm font-bold text-primary transition hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ShoppingCart size={17} aria-hidden="true" />
              {isAddingToCart ? "Adding..." : "Add to Cart"}
            </button>
            <button
              type="button"
              onClick={() => handleAddToCart(true)}
              disabled={!inStock || isBuying || isAddingToCart}
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
      {relatedProducts.length > 0 && (
        <section className="mt-10 sm:mt-14" aria-labelledby="related-products-heading">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">More to explore</p>
            <h2 id="related-products-heading" className="mt-1 text-xl font-extrabold text-text-primary sm:text-2xl">
              Related Products
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} />
            ))}
          </div>
        </section>
      )}
      </PageContainer>
    </>
  );
}

export default ProductDetails;
