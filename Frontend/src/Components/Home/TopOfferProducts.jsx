import HomeProductCarousel from "./HomeProductCarousel";

function getDiscountPercent(product) {
  const mrp = Number(product.mrp) || 0;
  const offerPrice = Number(product.offer_price ?? product.mrp) || 0;
  return mrp > 0 && offerPrice < mrp ? ((mrp - offerPrice) / mrp) * 100 : 0;
}

function TopOfferProducts({ products, loading }) {
  const discountedProducts = [...products]
    .filter((product) => getDiscountPercent(product) > 0)
    .sort((first, second) => getDiscountPercent(second) - getDiscountPercent(first))
    .slice(0, 12);

  return (
    <HomeProductCarousel
      id="top-offers"
      title="Top Offers"
      subtitle="Biggest discounts, ordered from highest offer."
      products={discountedProducts}
      loading={loading}
      emptyMessage="There are no discounted products at the moment."
    />
  );
}

export default TopOfferProducts;
