import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import PageContainer from "../CommenComponents/PageContainer";
import ProductCard from "../Products/ProductCard";
import { fetchAllPublicProducts } from "../Products/publicProducts";
const INITIAL_PRODUCT_COUNT = 8;


function HomeProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let active = true;

    fetchAllPublicProducts()
      .then((allProducts) => {
        if (active) setProducts(allProducts);
      })
      .catch((error) => {
        console.error("Failed to fetch home page products:", error);
        if (active) setFetchFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

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
          <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-x-8 gap-y-12 justify-items-center sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
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
