import HomeBanners from "./HomeBanners";
import HomeCategories from "./HomeCategories";
import HomeProducts from "./HomeProducts";
import TechBanner from "./TechBanner";
import OfferBanner from "./OfferBanner";

const Home = () => {
  return (
    <div>
      <HomeBanners />
      <HomeCategories />
      <HomeProducts />
      <TechBanner />
      <OfferBanner />
    </div>
  );
};

export default Home;
