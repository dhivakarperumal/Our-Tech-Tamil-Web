import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import ProductCard from "../Products/ProductCard";
import PageContainer from "../CommenComponents/PageContainer";

function HomeProductCarousel({
  id,
  title,
  subtitle,
  products,
  loading,
  emptyMessage,
}) {
  const swiperRef = useRef(null);

  return (
    <PageContainer className="py-4 sm:py-5">
      <section aria-labelledby={`${id}-heading`} className="w-full">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h2
              id={`${id}-heading`}
              className="flex items-center gap-2 text-base font-extrabold tracking-tight text-text-primary sm:text-lg"
            >
              <span className="h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              {title}
            </h2>
            <p className="mt-1 text-xs text-text-secondary sm:text-sm">{subtitle}</p>
          </div>

          {!loading && products.length > 0 && (
            <div className="flex shrink-0 items-center gap-2">
              {products.length > 1 && (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slidePrev()}
                    aria-label={`Previous ${title.toLowerCase()}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-primary hover:text-primary"
                  >
                    <ChevronLeft size={17} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slideNext()}
                    aria-label={`Next ${title.toLowerCase()}`}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-primary hover:text-primary"
                  >
                    <ChevronRight size={17} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5" aria-label={`Loading ${title}`}>
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="h-[320px] animate-pulse rounded-2xl bg-[#faf8ff]"
                aria-hidden="true"
              />
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            {emptyMessage}
          </p>
        ) : (
          <div className="overflow-hidden py-2">
            <Swiper
              modules={[Autoplay]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              slidesPerView={1.15}
              spaceBetween={12}
              loop={products.length > 5}
              autoplay={
                products.length > 5
                  ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
                  : false
              }
              breakpoints={{
                480: { slidesPerView: 1.8, spaceBetween: 12 },
                640: { slidesPerView: 2.4, spaceBetween: 16 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
                1280: { slidesPerView: 5, spaceBetween: 16 },
              }}
              className="!overflow-visible"
              aria-label={title}
            >
              {products.map((product) => (
                <SwiperSlide key={product.id} className="!h-auto">
                  <ProductCard product={product} />
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default HomeProductCarousel;
