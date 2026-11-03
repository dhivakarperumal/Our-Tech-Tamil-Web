import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, BadgeCheck, ChevronLeft, ChevronRight, MessageSquare, Quote, Star } from "lucide-react";
import { Autoplay } from "swiper/modules";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

function getReviewImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function ReviewAvatar({ name, image }) {
  const [imageFailed, setImageFailed] = useState(false);
  const initials = (name || "Customer")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (image && !imageFailed) {
    return (
      <img
        src={getReviewImageUrl(image)}
        alt=""
        loading="lazy"
        onError={() => setImageFailed(true)}
        className="h-9 w-9 shrink-0 rounded-xl border border-white object-cover shadow-sm ring-1 ring-violet-100"
      />
    );
  }

  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white text-xs font-black text-violet-800 shadow-sm ring-1 ring-violet-100">
      {initials}
    </span>
  );
}

function formatReviewDate(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat(undefined, { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function HomeReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const swiperRef = useRef(null);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length
    : 0;

  useEffect(() => {
    let active = true;

    api.get("/reviews/public")
      .then((response) => {
        if (active) setReviews(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
      })
      .catch((error) => {
        console.error("Failed to fetch published reviews:", error);
        if (active) setFetchFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <PageContainer className="py-3 sm:py-4">
      <section aria-labelledby="customer-reviews-heading" className="relative overflow-hidden rounded-2xl border border-violet-100/80 bg-gradient-to-br from-white via-white to-violet-50/60 p-3 shadow-[0_8px_24px_rgba(54,24,91,0.05)] sm:p-4">
        <div aria-hidden="true" className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full border-[22px] border-violet-100/30" />
        <div className="relative mb-3 flex items-center justify-between gap-3">
          <div>
            <h2
              id="customer-reviews-heading"
              className="flex items-center gap-2 text-base font-extrabold tracking-tight text-text-primary sm:text-lg"
            >
              <span className="h-5 w-1 shrink-0 rounded-full bg-gradient-to-b from-violet-700 to-fuchsia-500" aria-hidden="true" />
              Customer Reviews
            </h2>
            <p className="mt-1 text-[11px] text-text-secondary sm:text-xs">
              See what customers are saying about our products.
            </p>
            {!loading && !fetchFailed && reviews.length > 0 && (
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-100 bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  <Star size={11} className="fill-amber-400 text-amber-400" aria-hidden="true" />
                  {averageRating.toFixed(1)} average rating
                </span>
                <span className="rounded-full border border-violet-100 bg-white/80 px-2 py-0.5 text-[10px] font-semibold text-text-secondary">
                  {reviews.length} {reviews.length === 1 ? "customer review" : "customer reviews"}
                </span>
              </div>
            )}
          </div>
          {!loading && reviews.length > 1 && (
            <div className="flex shrink-0 items-center gap-1.5">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous customer reviews"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
              >
                <ChevronLeft size={16} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next customer reviews"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-800 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100"
              >
                <ChevronRight size={16} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading customer reviews">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-40 animate-pulse rounded-2xl border border-violet-100 bg-gradient-to-br from-white to-violet-50 p-3" aria-hidden="true">
                <div className="flex items-center gap-3">
                  <span className="h-12 w-12 rounded-2xl bg-violet-100" />
                  <span className="space-y-2"><span className="block h-3 w-24 rounded bg-violet-100" /><span className="block h-2.5 w-16 rounded bg-slate-100" /></span>
                </div>
                <span className="mt-7 block h-3 w-28 rounded bg-violet-100" />
                <span className="mt-4 block h-3 w-full rounded bg-slate-100" />
                <span className="mt-2 block h-3 w-4/5 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : fetchFailed ? (
          <p className="rounded-2xl border border-violet-100 bg-white/80 px-4 py-6 text-center text-sm text-text-secondary">
            Customer reviews could not be loaded. Please try again later.
          </p>
        ) : reviews.length === 0 ? (
          <p className="rounded-2xl border border-violet-100 bg-white/80 px-4 py-6 text-center text-sm text-text-secondary">
            No published reviews yet.
          </p>
        ) : (
          <div className="relative overflow-hidden">
            <Swiper
              modules={[Autoplay]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              slidesPerView={1.1}
              spaceBetween={16}
              breakpoints={{
                480: { slidesPerView: 1.5, spaceBetween: 12 },
                640: { slidesPerView: 2, spaceBetween: 14 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
              }}
              aria-label="Customer reviews"
            >
              {reviews.map((review) => (
                <SwiperSlide key={review.id} className="!h-auto">
                  <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white p-3 shadow-[0_4px_14px_rgba(54,24,91,0.05)] transition duration-200 hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-[0_10px_24px_rgba(54,24,91,0.1)] sm:p-3.5">
                    <span className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-violet-700 via-fuchsia-500 to-amber-300" aria-hidden="true" />
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ReviewAvatar name={review.user_name} image={review.review_image} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-xs font-extrabold text-text-primary">
                            <span className="truncate">{review.user_name || "Customer"}</span>
                            <BadgeCheck size={14} className="shrink-0 text-violet-600" aria-label="Published customer review" />
                          </p>
                          <p className="mt-0.5 text-[10px] font-medium text-text-secondary">{formatReviewDate(review.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-50 px-1.5 py-1" aria-label={`${review.rating} out of 5 stars`}>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              size={11}
                              className={index < Math.round(Number(review.rating) || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-amber-200"}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="text-[9px] font-extrabold text-amber-800">{(Number(review.rating) || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    {review.product_name && (
                      <Link
                        to={review.product_id ? `/product/${review.product_id}` : "/shop"}
                        className="mt-2 inline-flex max-w-full items-center gap-1 self-start rounded-full border border-violet-100 bg-violet-50/70 px-2 py-0.5 text-[10px] font-bold text-primary transition hover:border-violet-200 hover:bg-violet-100"
                      >
                        <span className="truncate">{review.product_name}</span>
                        <ArrowUpRight size={13} className="shrink-0" aria-hidden="true" />
                      </Link>
                    )}
                    <div className="relative mt-2">
                      <Quote size={15} className="absolute -left-0.5 top-0 fill-violet-100 text-violet-100" aria-hidden="true" />
                      <p className="relative line-clamp-2 whitespace-pre-line break-words pl-4 text-xs leading-[1.15rem] text-text-secondary">
                        {review.comment}
                      </p>
                    </div>
                    {review.admin_reply && (
                      <div className="mt-2 flex items-center gap-2 rounded-lg border border-violet-100 bg-gradient-to-br from-violet-50 to-fuchsia-50/50 px-2.5 py-1.5">
                        <p className="flex shrink-0 items-center gap-1 text-[9px] font-extrabold text-primary">
                          <MessageSquare size={13} aria-hidden="true" />
                          Store reply
                        </p>
                        <p className="line-clamp-1 min-w-0 whitespace-pre-line break-words text-[10px] leading-4 text-text-secondary">
                          {review.admin_reply}
                        </p>
                      </div>
                    )}
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default HomeReviews;
