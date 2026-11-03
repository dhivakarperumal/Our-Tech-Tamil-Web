import { useMemo, useState } from "react";
import HomeProductCarousel from "./HomeProductCarousel";

function getDiscountPercent(product) {
  const mrp = Number(product.mrp) || 0;
  const offerPrice = Number(product.offer_price ?? product.mrp) || 0;
  return mrp > 0 && offerPrice < mrp ? ((mrp - offerPrice) / mrp) * 100 : 0;
}

function TopOfferProducts({ products, loading }) {
  const discountedProducts = useMemo(() => [...products]
    .filter((product) => getDiscountPercent(product) > 0)
    .sort((first, second) => getDiscountPercent(second) - getDiscountPercent(first))
    .slice(0, 12), [products]);
  const [activeCategory, setActiveCategory] = useState("All Offers");
  const categories = useMemo(() => [
    "All Offers",
    ...new Set(discountedProducts.map((product) => product.cat_type || product.category).filter(Boolean)),
  ].slice(0, 6), [discountedProducts]);
  const visibleProducts = activeCategory === "All Offers"
    ? discountedProducts
    : discountedProducts.filter((product) => (product.cat_type || product.category) === activeCategory);
  const maxDiscount = discountedProducts.length
    ? Math.max(...discountedProducts.map(getDiscountPercent))
    : 0;

  return (
    <HomeProductCarousel
      id="top-offers"
      title="Top Offers"
      subtitle=""
      products={visibleProducts}
      allProductsCount={discountedProducts.length}
      loading={loading}
      emptyMessage="There are no discounted products at the moment."
      presentation="topOffers"
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      maxDiscount={maxDiscount}
    />
  );
}

export default TopOfferProducts;
