import { useEffect, useState } from "react";
import { ArrowRight, Package } from "lucide-react";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

const PRODUCTS_PER_PAGE = 100;
const INITIAL_PRODUCT_COUNT = 8;

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
  const firstVariant = Array.isArray(product.variants) ? product.variants[0] : null;
  const image = getFirstImage(firstVariant?.images) || getFirstImage(product.images);
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function ProductCard({ product }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getProductImage(product);
  const mrp = Number(product.mrp) || 0;
  const offerPrice = Number(product.offer_price ?? product.mrp) || 0;
  const hasDiscount = mrp > offerPrice;
  const discount = hasDiscount ? Math.round(((mrp - offerPrice) / mrp) * 100) : 0;

  return (
    <article className="group overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-[#faf8ff] p-4">
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
      </div>
      <div className="p-3.5 sm:p-4">
        {(product.cat_type || product.category) && (
          <p className="truncate text-[10px] font-bold uppercase tracking-wider text-primary">
            {[product.cat_type, product.category].filter(Boolean).join(" · ")}
          </p>
        )}
        <h3 className="mt-1 line-clamp-2 min-h-10 text-sm font-bold text-text-primary">
          {product.name}
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
      </div>
    </article>
  );
}

function HomeProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchProducts = async () => {
      try {
        const firstResponse = await api.get("/products/public", {
          params: { page: 1, limit: PRODUCTS_PER_PAGE },
        });
        const firstPage = firstResponse.data;
        const allProducts = Array.isArray(firstPage?.products) ? firstPage.products : [];
        const totalPages = Math.max(1, Number(firstPage?.pagination?.totalPages) || 1);

        const remainingPages = await Promise.all(
          Array.from({ length: totalPages - 1 }, (_, index) =>
            api.get("/products/public", {
              params: { page: index + 2, limit: PRODUCTS_PER_PAGE },
            }),
          ),
        );
        allProducts.push(
          ...remainingPages.flatMap((response) =>
            Array.isArray(response.data?.products) ? response.data.products : [],
          ),
        );

        if (active) setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch home page products:", error);
        if (active) setFetchFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProducts();
    return () => {
      active = false;
    };
  }, []);

  const visibleProducts = showAll ? products : products.slice(0, INITIAL_PRODUCT_COUNT);

  return (
    <PageContainer className="py-5 sm:py-7">
      <section aria-labelledby="home-products-heading" className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2
              id="home-products-heading"
              className="flex items-center gap-2 text-base font-extrabold tracking-tight text-text-primary sm:text-lg"
            >
              <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
              Our Products
            </h2>
            <p className="mt-1 text-xs text-text-secondary sm:text-sm">
              Explore products available in our store.
            </p>
          </div>
          {!loading && !fetchFailed && products.length > INITIAL_PRODUCT_COUNT && (
            <button
              type="button"
              onClick={() => setShowAll((current) => !current)}
              className="flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-bold text-primary transition hover:text-primary-light sm:text-xs"
            >
              {showAll ? "Show Less" : "View All Products"}
              <ArrowRight size={15} aria-hidden="true" />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="aspect-[4/3] animate-pulse rounded-2xl bg-[#faf8ff]"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : fetchFailed ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            Products could not be loaded. Please try again later.
          </p>
        ) : products.length === 0 ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            No products are available right now.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default HomeProducts;
