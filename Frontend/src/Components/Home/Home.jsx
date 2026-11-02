import HomeBanners from "./HomeBanners";
import HomeCategories from "./HomeCategories";
import TechBanner from './TechBanner'
import OfferBanner from './OfferBanner'

const Home = () => {
  return (
    <div>
      <HomeBanners/>
      <HomeCategories />
      <TechBanner />
      <OfferBanner />
    </div>
  );
};

export default Home;
