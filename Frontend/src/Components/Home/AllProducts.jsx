import HomeProductCarousel from "./HomeProductCarousel";

function AllProducts({ products, loading }) {
  return (
    <HomeProductCarousel
      id="all-products"
      title="All Products"
      subtitle="Explore everything available in our store."
      products={products}
      loading={loading}
      emptyMessage="No products are available right now."
    />
  );
}

export default AllProducts;
