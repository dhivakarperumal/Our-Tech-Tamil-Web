import HomeBanners from "./HomeBanners";
import HomeCategories from "./HomeCategories";
import HomeProducts from "./HomeProducts";
import TechBanner from "./TechBanner";

const Home = () => {
  return (
    <div>
      <HomeBanners />
      <TechBanner />
      <HomeCategories />
      <HomeProducts />
    </div>
  );
};

export default Home;
