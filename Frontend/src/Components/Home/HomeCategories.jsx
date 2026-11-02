import { useEffect, useRef, useState } from "react";
import { Boxes, ChevronLeft, ChevronRight } from "lucide-react";
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
      className="flex h-[92px] flex-col items-center justify-between rounded-xl border border-primary/5 bg-[#faf8ff] px-2 py-2.5 text-center transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md sm:h-[102px] sm:px-3"
      title={category.name}
    >
      <div className="flex h-12 w-full items-center justify-center sm:h-14">
        {image ? (
          <img
            src={image}
            alt=""
            loading="lazy"
            className="h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-primary">
            <Boxes size={25} strokeWidth={1.7} aria-hidden="true" />
          </div>
        )}
      </div>
      <span className="w-full truncate text-[11px] font-bold leading-tight text-text-primary sm:text-xs">
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
  const swiperRef = useRef(null);

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
        <div className="mr-20 flex shrink-0 items-center gap-2">
          {!loading && categories.length > 1 && !showAll && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous categories"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next categories"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-primary hover:text-primary"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          )}
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
        <div className="flex gap-2 overflow-hidden pr-20 sm:gap-3" aria-label="Loading categories">
          {Array.from({ length: 8 }, (_, index) => (
            <div
              key={index}
              className="h-[92px] w-[96px] shrink-0 animate-pulse rounded-xl bg-[#faf8ff] sm:h-[102px] sm:w-[112px]"
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
        <div className="grid grid-cols-3 gap-2 pr-20 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10">
          {categories.map((category) => (
            <CategoryCard
              key={category.catId || category.id || category.name}
              category={category}
            />
          ))}
        </div>
      ) : (
        <div style={{ paddingRight: "80px" }}>
          <Swiper
            modules={[Autoplay]}
            onSwiper={(swiper) => {
              swiperRef.current = swiper;
            }}
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
            className="home-category-swiper"
            aria-label="Shop by category"
          >
            {slides.map((category) => (
              <SwiperSlide
                key={category.slideKey}
                className="!w-[96px] sm:!w-[112px]"
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
