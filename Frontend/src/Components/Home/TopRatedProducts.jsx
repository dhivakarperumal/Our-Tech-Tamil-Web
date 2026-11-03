import HomeProductCarousel from "./HomeProductCarousel";

function getRating(product) {
  const rating = Number(product.rating);
  return Number.isFinite(rating) ? rating : 0;
}

function TopRatedProducts({ products, loading }) {
  const ratedProducts = [...products]
    .filter((product) => getRating(product) > 0)
    .sort((first, second) => getRating(second) - getRating(first))
    .slice(0, 12);

  return (
    <HomeProductCarousel
      id="top-rated"
      title="Top Rated"
      subtitle="Discover products with the highest ratings."
      products={ratedProducts}
      loading={loading}
      emptyMessage="No rated products are available yet."
    />
  );
}

export default TopRatedProducts;
