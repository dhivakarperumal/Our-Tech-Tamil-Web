import { useMemo, useState } from "react";
import HomeProductCarousel from "./HomeProductCarousel";

function getRating(product) {
  const rating = Number(product.rating);
  return Number.isFinite(rating) ? rating : 0;
}

function TopRatedProducts({ products, loading }) {
  const ratedProducts = useMemo(() => [...products]
    .filter((product) => getRating(product) > 0)
    .sort((first, second) => getRating(second) - getRating(first))
    .slice(0, 12), [products]);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const categories = useMemo(() => [
    "All Products",
    ...new Set(ratedProducts.map((product) => product.cat_type || product.category).filter(Boolean)),
  ].slice(0, 6), [ratedProducts]);
  const visibleProducts = activeCategory === "All Products"
    ? ratedProducts
    : ratedProducts.filter((product) => (product.cat_type || product.category) === activeCategory);
  const averageRating = ratedProducts.length
    ? ratedProducts.reduce((sum, product) => sum + getRating(product), 0) / ratedProducts.length
    : 0;

  return (
    <HomeProductCarousel
      id="top-rated"
      title="Top Rated"
      subtitle="Discover products with the highest ratings."
      products={visibleProducts}
      allProductsCount={ratedProducts.length}
      loading={loading}
      emptyMessage="No rated products are available yet."
      presentation="topRated"
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      averageRating={averageRating}
    />
  );
}

export default TopRatedProducts;
