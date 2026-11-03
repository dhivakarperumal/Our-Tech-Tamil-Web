import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import PageContainer from "../CommenComponents/PageContainer";
import ProductCard from "../Products/ProductCard";
import { fetchAllPublicProducts } from "../Products/publicProducts";

function Shop() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [searchParams] = useSearchParams();
  const searchQuery = searchParams.get("search")?.trim().toLowerCase() || "";

  useEffect(() => {
    let active = true;

    fetchAllPublicProducts()
      .then((allProducts) => {
        if (active) setProducts(allProducts);
      })
      .catch((error) => {
        console.error("Failed to fetch shop products:", error);
        if (active) setFetchFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredProducts = searchQuery
    ? products.filter((product) =>
        [product.name, product.category, product.cat_type, product.description]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(searchQuery)),
      )
    : products;

  return (
    <PageContainer className="py-6 sm:py-9">
      <section aria-labelledby="shop-heading">
        <div className="mb-5">
          <h1 id="shop-heading" className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
            {searchQuery ? `Search Results for "${searchParams.get("search")?.trim()}"` : "Shop All Products"}
          </h1>
          {!loading && !fetchFailed && (
            <p className="mt-1 text-sm text-text-secondary">
              {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} available
            </p>
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
        ) : filteredProducts.length === 0 ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            {searchQuery ? "No products matched your search." : "No products are available right now."}
          </p>
        ) : (
          <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default Shop;
