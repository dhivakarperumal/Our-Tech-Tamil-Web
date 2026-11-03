import { useEffect, useRef, useState } from "react";
import { Boxes, ChevronRight } from "lucide-react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import "swiper/css/navigation";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

function getCategoryImage(images) {
  let parsedImages = images;
  if (typeof images === "string") {
    try {
      parsedImages = JSON.parse(images);
    } catch {
      parsedImages = images;
    }
  }

  const image = Array.isArray(parsedImages)
    ? parsedImages[0]
    : typeof parsedImages === "string"
      ? parsedImages
      : "";
  if (!image || typeof image !== "string") return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function CategoryCard({ category }) {
  const image = getCategoryImage(category.images);

  return (
    <div
      className="group flex h-[112px] cursor-pointer flex-col items-center justify-between rounded-xl border border-primary/10 bg-[#faf8ff] px-3 py-3 text-center transition duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:bg-[#f1e8ff] hover:shadow-[0_8px_20px_rgba(75,0,200,0.18)] sm:h-[124px] sm:px-4"
      title={category.name}
    >
      <div className="flex h-14 w-full items-center justify-center sm:h-[68px]">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary sm:h-14 sm:w-14">
            <Boxes size={29} strokeWidth={1.7} aria-hidden="true" />
          </div>
        )}
      </div>
      <span className="w-full truncate text-xs font-bold leading-tight text-text-primary transition-colors group-hover:text-primary sm:text-[13px]">
        {category.name}
      </span>
    </div>
  );
}

function HomeCategories() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [carouselLayout, setCarouselLayout] = useState({ slideWidth: 128 });
  const carouselContainerRef = useRef(null);

  useEffect(() => {
    let active = true;

    const fetchCategories = async () => {
      try {
        const response = await api.get("/categories");
        if (active) {
          const activeCategories = Array.isArray(response.data)
            ? response.data.filter((category) => (category.status || "Active") === "Active")
              .sort((first, second) => Number(first.id) - Number(second.id))
            : [];
          setCategories(activeCategories);
        }
      } catch (error) {
        console.error("Failed to fetch home page categories:", error);
        if (active) setFetchFailed(true);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading || showAll || !carouselContainerRef.current) return undefined;

    const container = carouselContainerRef.current;
    const updateSlidesPerView = () => {
      const availableWidth = container.clientWidth;
      const minimumSlideWidth = window.matchMedia("(min-width: 640px)").matches ? 144 : 128;
      const slidesPerView = Math.max(
        1,
        Math.floor((availableWidth + 8) / (minimumSlideWidth + 8)),
      );
      const slideWidth = (availableWidth - (slidesPerView - 1) * 8) / slidesPerView;

      setCarouselLayout({
        slideWidth,
      });
    };

    updateSlidesPerView();
    const observer = new ResizeObserver(updateSlidesPerView);
    observer.observe(container);
    return () => observer.disconnect();
  }, [loading, showAll]);

  const slideCopies = categories.length > 1
    ? Math.max(2, Math.ceil(16 / categories.length))
    : 1;
  const slides = Array.from({ length: slideCopies }, (_, copy) =>
    categories.map((category) => ({
      ...category,
      slideKey: `${category.catId || category.id || category.name}-${copy}`,
    })),
  ).flat();

  return (
    <PageContainer className="py-3 sm:py-4">
      <section
        id="shop-by-category"
        aria-labelledby="shop-by-category-heading"
        className="w-full"
      >
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2
            id="shop-by-category-heading"
            className="flex items-center gap-2 text-base font-extrabold tracking-tight text-text-primary sm:text-lg"
          >
            <span className="h-5 w-1 rounded-full bg-primary" aria-hidden="true" />
            Shop by Category
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {!loading && categories.length > 0 && (
              <button
                type="button"
                onClick={() => setShowAll((current) => !current)}
                className="flex items-center gap-1 whitespace-nowrap text-[11px] font-bold text-primary transition hover:text-primary-light sm:text-xs"
              >
                {showAll ? "Show carousel" : "View All Categories"}
                <ChevronRight size={15} aria-hidden="true" />
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex gap-2 overflow-hidden sm:gap-3" aria-label="Loading categories">
            {Array.from({ length: 8 }, (_, index) => (
              <div
                key={index}
                className="h-[112px] w-[128px] shrink-0 animate-pulse rounded-xl bg-[#faf8ff] sm:h-[124px] sm:w-[144px]"
              />
            ))}
          </div>
        ) : fetchFailed ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            Categories could not be loaded. Please try again later.
          </p>
        ) : categories.length === 0 ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            No categories are available right now.
          </p>
        ) : showAll ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
            {categories.map((category) => (
              <CategoryCard
                key={category.catId || category.id || category.name}
                category={category}
              />
            ))}
          </div>
        ) : (
          <div ref={carouselContainerRef} className="overflow-hidden py-2">
            <Swiper
              modules={[Autoplay]}
              slidesPerView="auto"
              slidesPerGroup={1}
              spaceBetween={8}
              loop={categories.length > 1}
              loopAddBlankSlides={false}
              speed={550}
              autoplay={
                categories.length > 1
                  ? { delay: 2200, disableOnInteraction: false, pauseOnMouseEnter: true }
                  : false
              }
              navigation={false}
              className="home-category-swiper !ml-0 !mr-auto !overflow-visible"
              style={{ width: "100%" }}
              aria-label="Shop by category"
            >
              {slides.map((category) => (
                <SwiperSlide
                  key={category.slideKey}
                  style={{ width: `${carouselLayout.slideWidth}px` }}
                >
                  <CategoryCard category={category} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default HomeCategories;
