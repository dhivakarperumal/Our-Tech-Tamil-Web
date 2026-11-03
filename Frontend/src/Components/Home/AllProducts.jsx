import { useMemo, useState } from "react";
import HomeProductCarousel from "./HomeProductCarousel";

function AllProducts({ products, loading }) {
  const [activeCategory, setActiveCategory] = useState("All Products");

  const categories = useMemo(() => [
    "All Products",
    ...new Set(products.map((product) => product.cat_type || product.category).filter(Boolean)),
  ], [products]);

  const visibleProducts = useMemo(() => {
    if (activeCategory === "All Products") return products;
    return products.filter((product) => (product.cat_type || product.category) === activeCategory);
  }, [products, activeCategory]);

  return (
    <HomeProductCarousel
      id="all-products"
      title="All Products"
      subtitle=""
      products={visibleProducts}
      allProductsCount={products.length}
      loading={loading}
      emptyMessage="No products are available in this category."
      presentation="allProducts"
      categories={categories}
      activeCategory={activeCategory}
      onCategoryChange={setActiveCategory}
      resultCount={visibleProducts.length}
    />
  );
}

export default AllProducts;
