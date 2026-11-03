import { useEffect, useState } from "react";
import PageContainer from "../CommenComponents/PageContainer";
import { fetchAllPublicProducts } from "../Products/publicProducts";
import AllProducts from "./AllProducts";
import OfferBanner from "./OfferBanner";
import TechBanner from "./TechBanner";
import TopOfferProducts from "./TopOfferProducts";
import TopRatedProducts from "./TopRatedProducts";

function HomeProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);

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

  return (
    <div className="py-2">
      {fetchFailed ? (
        <PageContainer className="py-5 sm:py-7">
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            Products could not be loaded. Please try again later.
          </p>
        </PageContainer>
      ) : !loading && products.length === 0 ? (
        <PageContainer className="py-5 sm:py-7">
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            No products are available right now.
          </p>
        </PageContainer>
      ) : (
        <AllProducts products={products} loading={loading} />
      )}
      <TechBanner />
      {!fetchFailed && products.length > 0 && (
        <TopOfferProducts products={products} loading={loading} />
      )}
      <OfferBanner />
      {!fetchFailed && products.length > 0 && (
        <TopRatedProducts products={products} loading={loading} />
      )}
    </div>
  );
}

export default HomeProducts;
