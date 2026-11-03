import { useContext, useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight, ImagePlus, MessageSquare, Minus, Package, Plus, ShoppingCart, Star, UserRound, X, Zap } from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import { toast } from "react-hot-toast";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";
import { AuthContext } from "../../PrivateRouter/AuthContext";
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
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const reviewsSwiper = useRef(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [productState, setProductState] = useState({
    id: null,
    product: null,
    failed: false,
  });
  const [activeImage, setActiveImage] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [isImageZoomOpen, setIsImageZoomOpen] = useState(false);
  const [isImageHovered, setIsImageHovered] = useState(false);
  const [imageZoomOrigin, setImageZoomOrigin] = useState("50% 50%");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [relatedProductState, setRelatedProductState] = useState({ productId: null, items: [] });
  const [reviewState, setReviewState] = useState({
    productId: null,
    reviews: [],
    loading: true,
    failed: false,
  });
  const [ownReviewState, setOwnReviewState] = useState({
    productId: null,
    userId: null,
    review: null,
    loading: false,
    failed: false,
  });
  const [reviewUserName, setReviewUserName] = useState(user?.username || user?.name || "");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewImagePreview, setReviewImagePreview] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const loading = productState.id !== id;
  const product = loading ? null : productState.product;
  const fetchFailed = !loading && productState.failed;
  const reviewsMatchProduct = reviewState.productId === id;
  const reviews = reviewsMatchProduct ? reviewState.reviews : [];
  const reviewsLoading = !reviewsMatchProduct || reviewState.loading;
  const reviewsFailed = reviewsMatchProduct && reviewState.failed;
  const reviewRatings = reviews
    .map((review) => Number(review.rating))
    .filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5);
  const reviewAverage = reviewRatings.length
    ? reviewRatings.reduce((total, rating) => total + rating, 0) / reviewRatings.length
    : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviewRatings.filter((value) => value === rating).length,
  }));
  const ownReviewMatchesUser = ownReviewState.productId === id && ownReviewState.userId === user?.user_id;
  const ownReview = ownReviewMatchesUser ? ownReviewState.review : null;
  const ownReviewLoading = Boolean(user?.user_id) && (!ownReviewMatchesUser || ownReviewState.loading);
  const ownReviewFailed = ownReviewMatchesUser && ownReviewState.failed;

  useEffect(() => {
    if (!isImageZoomOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsImageZoomOpen(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isImageZoomOpen]);

  useEffect(() => {
    return () => {
      if (reviewImagePreview) URL.revokeObjectURL(reviewImagePreview);
    };
  }, [reviewImagePreview]);

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

  useEffect(() => {
    if (productState.id !== id || !productState.product) return undefined;
    let active = true;
    api.get(`/reviews/product/${id}`)
      .then(({ data }) => {
        if (active) {
          setReviewState({
            productId: id,
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
            loading: false,
            failed: false,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load product reviews:", error);
        if (active) {
          setReviewState({ productId: id, reviews: [], loading: false, failed: true });
          toast.error(error.response?.data?.message || "Failed to load product reviews");
        }
      });
    return () => {
      active = false;
    };
  }, [id, productState.id, productState.product]);

  useEffect(() => {
    let active = true;
    if (!user?.user_id || productState.id !== id || !productState.product) {
      return () => {
        active = false;
      };
    }

    api.get(`/reviews/product/${id}/mine`)
      .then(({ data }) => {
        if (active) {
          setOwnReviewState({
            productId: id,
            userId: user.user_id,
            review: data.review || null,
            loading: false,
            failed: false,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to check existing product review:", error);
        if (active) {
          setOwnReviewState({
            productId: id,
            userId: user.user_id,
            review: null,
            loading: false,
            failed: true,
          });
          toast.error(error.response?.data?.message || "Could not check your existing review");
        }
      });
    return () => {
      active = false;
    };
  }, [id, productState.id, productState.product, user?.user_id]);

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!user?.user_id) {
      toast.error("Please sign in to leave a review.");
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (!reviewUserName.trim() || reviewUserName.trim().length > 160) {
      toast.error("Enter your name using 160 characters or fewer.");
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length > 5000) {
      toast.error("Write a review of 5,000 characters or fewer.");
      return;
    }
    if (reviewImage && reviewImage.size > 5 * 1024 * 1024) {
      toast.error("Review image must be 5 MB or smaller.");
      return;
    }

    setIsSubmittingReview(true);
    try {
      const formData = new FormData();
      formData.append("user_name", reviewUserName.trim());
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewComment.trim());
      if (reviewImage) formData.append("image", reviewImage);
      const { data } = await api.post(`/reviews/product/${id}`, formData);
      setOwnReviewState({
        productId: id,
        userId: user.user_id,
        review: data.review,
        loading: false,
        failed: false,
      });
      setReviewComment("");
      setReviewImage(null);
      setReviewImagePreview("");
      setIsReviewModalOpen(false);
      toast.success("Review submitted. It will appear after approval.");
    } catch (error) {
      if (error.response?.status === 409) {
        try {
          const { data } = await api.get(`/reviews/product/${id}/mine`);
          setOwnReviewState({
            productId: id,
            userId: user.user_id,
            review: data.review || null,
            loading: false,
            failed: false,
          });
        } catch (refreshError) {
          console.error("Failed to refresh existing product review:", refreshError);
        }
      }
      toast.error(error.response?.data?.message || "Failed to submit your review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  useEffect(() => {
    if (!isReviewModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmittingReview) setIsReviewModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isReviewModalOpen, isSubmittingReview]);

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
  const isNaturalProduct = /natural/i.test(
    `${product.cat_type || product.category_type || ""} ${product.category || ""}`,
  );
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
            aria-label={`View ${product.name} image enlarged`}
            className="group relative flex aspect-square w-full cursor-zoom-in items-center justify-center overflow-hidden rounded-xl bg-[#faf8ff] p-5 sm:aspect-[4/3]"
          >
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
                backgroundImage: `url("${getImageUrl(activeImage)}")`,
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
              aria-label={`Enlarged image of ${product.name}`}
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
              <img
                src={getImageUrl(activeImage)}
                alt={product.name}
                className="max-h-[90vh] max-w-full object-contain"
              />
            </div>
          )}
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

          {!isNaturalProduct && colorOptions.length > 0 && (
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

          {!isNaturalProduct && sizeOptions.length > 0 && (
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
          <div className="grid grid-cols-2 items-stretch gap-3 sm:gap-5 lg:grid-cols-3 2xl:grid-cols-4">
            {relatedProducts.map((relatedProduct) => (
              <ProductCard key={relatedProduct.id} product={relatedProduct} compact dense />
            ))}
          </div>
        </section>
      )}
      <section className="mt-10 border-t border-border pt-8 sm:mt-14" aria-labelledby="product-reviews-heading">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Customer feedback</p>
            <h2 id="product-reviews-heading" className="mt-1 text-xl font-extrabold text-text-primary sm:text-2xl">
              Reviews ({reviews.length})
            </h2>
          </div>
          {!reviewsLoading && !reviewsFailed && reviews.length > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => reviewsSwiper.current?.slidePrev()}
                aria-label="Previous product reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-white text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => reviewsSwiper.current?.slideNext()}
                aria-label="Next product reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-white text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
              >
                <ChevronRight size={18} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {!reviewsLoading && !reviewsFailed && (
          <div className="mb-6 grid gap-5 rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_8px_24px_rgba(75,0,200,0.04)] sm:grid-cols-[minmax(180px,0.7fr)_1.3fr] sm:items-center sm:p-6">
            <div className="text-center sm:border-r sm:border-border sm:pr-5">
              <p className="text-4xl font-extrabold text-text-primary">
                {reviewRatings.length ? reviewAverage.toFixed(1) : "—"}
                <span className="ml-1 text-base font-semibold text-text-secondary">/ 5</span>
              </p>
              <div className="mt-1 flex justify-center text-amber-500" aria-label={`${reviewAverage.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={19} fill={star <= Math.round(reviewAverage) ? "currentColor" : "none"} />
                ))}
              </div>
              <p className="mt-1 text-sm text-text-secondary">
                {reviewRatings.length} {reviewRatings.length === 1 ? "rating" : "ratings"}
              </p>
            </div>
            <div className="space-y-2.5">
              {ratingBreakdown.map(({ rating, count }) => (
                <div key={rating} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 text-xs text-text-secondary">
                  <span>{rating} {rating === 1 ? "star" : "stars"}</span>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label={`${rating} star ratings`}
                    aria-valuemin={0}
                    aria-valuemax={reviewRatings.length}
                    aria-valuenow={count}
                  >
                    <div
                      className="h-full rounded-full bg-amber-400 transition-[width]"
                      style={{ width: `${reviewRatings.length ? (count / reviewRatings.length) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ownReviewLoading ? (
          <p className="mb-6 text-sm text-text-secondary">Checking your review...</p>
        ) : ownReviewFailed ? (
          <p className="mb-6 text-sm text-rose-600">Could not verify your review status. Please refresh the page and try again.</p>
        ) : ownReview ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            You have already reviewed this product. Your review is {String(ownReview.status || "Pending").toLowerCase()}.
          </div>
        ) : user?.user_id ? (
          <div className="mb-8 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setReviewUserName(user.username || user.name || "");
                setIsReviewModalOpen(true);
              }}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark"
            >
              Write a review
            </button>
          </div>
        ) : (
          <p className="mb-6 text-sm text-text-secondary">
            <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="font-bold text-primary hover:underline">
              Sign in
            </Link>{" "}
            to write a review.
          </p>
        )}

        {reviewsLoading ? (
          <p className="text-sm text-text-secondary">Loading reviews...</p>
        ) : reviewsFailed ? (
          <p className="text-sm text-rose-600">Could not load reviews. Please refresh the page to try again.</p>
        ) : reviews.length ? (
          <div className="overflow-hidden py-1">
            <Swiper
              onSwiper={(swiper) => {
                reviewsSwiper.current = swiper;
              }}
              slidesPerView={1}
              spaceBetween={12}
              breakpoints={{
                640: { slidesPerView: 2, spaceBetween: 16 },
                1024: { slidesPerView: 3, spaceBetween: 18 },
              }}
              aria-label="Published product reviews"
            >
            {reviews.map((review) => (
              <SwiperSlide key={review.id} className="!h-auto">
              <article className="h-full rounded-2xl border border-violet-100 bg-white p-5 text-center shadow-[0_6px_20px_rgba(75,0,200,0.04)]">
                <div className="flex flex-col items-center gap-1">
                  <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-primary" aria-hidden="true">
                    <UserRound size={23} />
                  </span>
                  <h3 className="font-bold text-text-primary">{review.user_name}</h3>
                  <time className="text-xs text-text-secondary" dateTime={review.created_at}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </time>
                </div>
                <div className="mt-1 flex justify-center text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star key={star} size={15} fill={star <= Number(review.rating) ? "currentColor" : "none"} />
                  ))}
                </div>
                <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{review.comment}</p>
                {review.admin_reply && (
                  <div className="mt-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/70 p-3 text-left sm:p-4">
                    <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-800 sm:justify-start">
                      <MessageSquare size={14} aria-hidden="true" />
                      Response from our team
                    </p>
                    <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">
                      {review.admin_reply}
                    </p>
                  </div>
                )}
              </article>
              </SwiperSlide>
            ))}
            </Swiper>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No published reviews yet. Customer reviews appear here after admin approval.</p>
        )}
      </section>
      {isReviewModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close review form"
            onClick={() => {
              if (!isSubmittingReview) setIsReviewModalOpen(false);
            }}
            className="absolute inset-0 bg-black/50"
          />
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="write-review-heading"
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Customer feedback</p>
                <h2 id="write-review-heading" className="mt-1 text-xl font-extrabold text-text-primary">
                  Review {product.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsReviewModalOpen(false)}
                disabled={isSubmittingReview}
                aria-label="Close review form"
                className="rounded-lg p-2 text-text-secondary hover:bg-gray-100 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleReviewSubmit} className="mt-5">
              <label htmlFor="product-review-name" className="block text-sm font-semibold text-text-secondary">
                Your name
              </label>
              <input
                id="product-review-name"
                type="text"
                value={reviewUserName}
                onChange={(event) => setReviewUserName(event.target.value)}
                maxLength={160}
                required
                autoComplete="name"
                placeholder="Enter your name"
                className="mt-2 w-full rounded-lg border border-border p-3 text-sm text-text-primary outline-none focus:border-primary"
              />
              <fieldset>
                <legend className="mt-4 text-sm font-semibold text-text-secondary">Your rating</legend>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setReviewRating(rating)}
                      aria-label={`${rating} star${rating > 1 ? "s" : ""}`}
                      aria-pressed={reviewRating === rating}
                      className="rounded p-1 text-amber-500"
                    >
                      <Star size={24} fill={rating <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="product-review-comment" className="mt-4 block text-sm font-semibold text-text-secondary">
                Your review
              </label>
              <textarea
                id="product-review-comment"
                value={reviewComment}
                onChange={(event) => setReviewComment(event.target.value)}
                maxLength={5000}
                rows={5}
                required
                placeholder="Share your experience with this product"
                className="mt-2 w-full rounded-lg border border-border p-3 text-sm text-text-primary outline-none focus:border-primary"
              />
              <label htmlFor="product-review-image" className="mt-4 block text-sm font-semibold text-text-secondary">
                Add a photo <span className="font-normal">(optional, max 5 MB)</span>
              </label>
              <input
                id="product-review-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error("Review image must be 5 MB or smaller.");
                    event.target.value = "";
                    setReviewImage(null);
                    setReviewImagePreview("");
                    return;
                  }
                  setReviewImage(file);
                  setReviewImagePreview(file ? URL.createObjectURL(file) : "");
                }}
                className="mt-2 block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-4 file:py-2 file:font-semibold file:text-primary hover:file:bg-primary/15"
              />
              {reviewImagePreview && (
                <div className="mt-3 flex items-start gap-3">
                  <img
                    src={reviewImagePreview}
                    alt="Review upload preview"
                    className="h-24 w-24 rounded-lg border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setReviewImage(null);
                      setReviewImagePreview("");
                      const input = document.getElementById("product-review-image");
                      if (input) input.value = "";
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                  >
                    <X size={14} /> Remove photo
                  </button>
                </div>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary">
                <ImagePlus size={14} aria-hidden="true" />
                JPG, PNG, WEBP, or GIF
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsReviewModalOpen(false)}
                  disabled={isSubmittingReview}
                  className="rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !reviewUserName.trim() || !reviewComment.trim()}
                  className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isSubmittingReview ? "Submitting..." : "Submit review"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
      </PageContainer>
    </>
  );
}

export default ProductDetails;
