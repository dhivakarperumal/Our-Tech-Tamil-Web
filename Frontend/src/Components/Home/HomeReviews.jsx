import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Quote,
  ShieldCheck,
  Sparkles,
  Star,
  UsersRound,
} from "lucide-react";
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
        className="h-14 w-14 shrink-0 rounded-2xl border-2 border-white object-cover shadow-sm ring-2 ring-violet-200 sm:h-16 sm:w-16"
      />
    );
  }

  return (
    <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 via-fuchsia-50 to-white text-sm font-black text-violet-800 shadow-sm ring-2 ring-violet-200 sm:h-16 sm:w-16">
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

function HomeReviews({
  reviews: providedReviews,
  loading: providedLoading,
  fetchFailed: providedFetchFailed,
} = {}) {
  const [fetchedReviews, setFetchedReviews] = useState([]);
  const [fetchedLoading, setFetchedLoading] = useState(true);
  const [fetchedFailed, setFetchedFailed] = useState(false);
  const reviews = providedReviews ?? fetchedReviews;
  const loading = providedReviews === undefined ? fetchedLoading : providedLoading;
  const fetchFailed = providedReviews === undefined ? fetchedFailed : providedFetchFailed;
  const swiperRef = useRef(null);
  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length
    : 0;
  const reviewedProducts = new Set(reviews.map((review) => review.product_id).filter(Boolean)).size;

  useEffect(() => {
    if (providedReviews !== undefined) return undefined;

    let active = true;

    api.get("/reviews/public")
      .then((response) => {
        if (active) setFetchedReviews(Array.isArray(response.data?.reviews) ? response.data.reviews : []);
      })
      .catch((error) => {
        console.error("Failed to fetch published reviews:", error);
        if (active) setFetchedFailed(true);
      })
      .finally(() => {
        if (active) setFetchedLoading(false);
      });

    return () => {
      active = false;
    };
  }, [providedReviews]);

  return (
    <PageContainer className="py-5 sm:py-8">
      <section aria-labelledby="customer-reviews-heading" className="relative overflow-hidden rounded-[30px] border border-violet-100 bg-gradient-to-br from-[#faf7ff] via-white to-[#f1e7ff] px-4 py-6 shadow-[0_18px_48px_rgba(75,0,200,0.09)] sm:px-7 sm:py-8">
        <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border-[34px] border-violet-100/40" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-28 left-1/4 h-56 w-56 rounded-full bg-fuchsia-100/40 blur-3xl" />
        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2
                id="customer-reviews-heading"
                className="flex items-center gap-3 text-2xl font-black tracking-tight text-[#17123b] sm:text-3xl lg:text-4xl"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-700/25 sm:h-14 sm:w-14">
                  <Star size={26} fill="currentColor" aria-hidden="true" />
                </span>
                <span className="relative">
                  Customer Reviews
                  <span aria-hidden="true" className="absolute -bottom-1 left-0 h-1 w-3/4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
                </span>
              </h2>
              <p className="mt-3 pl-1 text-sm font-medium text-slate-700 sm:text-base">
                See what our customers are saying about our products.
              </p>

              {!loading && !fetchFailed && reviews.length > 0 && (
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="flex items-center gap-3 rounded-2xl border border-violet-200 bg-white/80 px-4 py-3 shadow-[0_8px_22px_rgba(75,0,200,0.08)]">
                    <span className="text-3xl font-black tracking-tight text-violet-800">{averageRating.toFixed(1)}</span>
                    <div>
                      <div className="flex items-center gap-0.5 text-amber-400" aria-label={`${averageRating.toFixed(1)} out of 5 average rating`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star key={index} size={16} className={index < Math.round(averageRating) ? "fill-amber-400 text-amber-400" : "text-amber-200"} aria-hidden="true" />
                        ))}
                      </div>
                      <span className="mt-0.5 block text-xs font-semibold text-slate-700">Average Rating / 5</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-violet-100 bg-white/75 px-4 py-3 shadow-[0_8px_22px_rgba(75,0,200,0.06)]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                      <UsersRound size={23} aria-hidden="true" />
                    </span>
                    <div>
                      <span className="block text-xl font-black leading-tight text-[#17123b]">{reviews.length.toLocaleString("en-IN")}</span>
                      <span className="text-xs font-medium text-slate-700">Published Reviews</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-white/75 px-4 py-3 shadow-[0_8px_22px_rgba(75,0,200,0.06)]">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                      <ShieldCheck size={25} aria-hidden="true" />
                    </span>
                    <div>
                      <span className="block text-xl font-black leading-tight text-[#17123b]">{reviewedProducts.toLocaleString("en-IN")}</span>
                      <span className="text-xs font-medium text-slate-700">Products Reviewed</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between gap-5 xl:justify-end">
              <div aria-hidden="true" className="relative hidden h-36 w-52 items-center justify-center sm:flex">
                <Sparkles className="absolute left-3 top-5 text-amber-400" size={25} fill="currentColor" />
                <Sparkles className="absolute right-2 top-10 text-amber-300" size={18} fill="currentColor" />
                <div className="relative flex h-28 w-40 -rotate-3 flex-col items-center justify-center rounded-[28px] bg-gradient-to-br from-violet-600 to-violet-800 shadow-[0_16px_30px_rgba(75,0,200,0.3)] after:absolute after:-bottom-3 after:left-5 after:h-7 after:w-7 after:rotate-45 after:rounded-sm after:bg-violet-700">
                  <div className="relative z-10 flex gap-1 text-amber-300">
                    {Array.from({ length: 5 }, (_, index) => <Star key={index} size={22} fill="currentColor" aria-hidden="true" />)}
                  </div>
                  <span className="relative z-10 mt-3 h-2 w-28 rounded-full bg-white" />
                  <span className="relative z-10 mt-2 h-2 w-20 self-start ml-6 rounded-full bg-white/90" />
                </div>
              </div>
              {!loading && reviews.length > 1 && (
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slidePrev()}
                    aria-label="Previous customer reviews"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-violet-100 bg-white text-violet-700 shadow-sm transition hover:-translate-y-0.5 hover:bg-violet-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-100 sm:h-14 sm:w-14"
                  >
                    <ChevronLeft size={23} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => swiperRef.current?.slideNext()}
                    aria-label="Next customer reviews"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-violet-800 text-white shadow-[0_8px_18px_rgba(75,0,200,0.25)] transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-violet-200 sm:h-14 sm:w-14"
                  >
                    <ChevronRight size={23} aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          </div>
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
              slidesPerView={1}
              spaceBetween={14}
              autoplay={reviews.length > 4 ? { delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true } : false}
              loop={reviews.length > 4}
              breakpoints={{
                480: { slidesPerView: 1.2, spaceBetween: 14 },
                640: { slidesPerView: 2, spaceBetween: 16 },
                900: { slidesPerView: 3, spaceBetween: 18 },
                1200: { slidesPerView: 4, spaceBetween: 18 },
              }}
              aria-label="Customer reviews"
            >
              {reviews.map((review) => (
                <SwiperSlide key={review.id} className="!h-auto">
                  <article className="group relative flex h-full min-h-[230px] flex-col overflow-hidden rounded-[24px] border border-violet-100 bg-white/90 p-4 shadow-[0_10px_26px_rgba(75,0,200,0.08)] transition duration-300 hover:-translate-y-1 hover:border-violet-200 hover:shadow-[0_18px_36px_rgba(75,0,200,0.14)] sm:p-5">
                    <span className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-violet-700 via-fuchsia-500 to-violet-300" aria-hidden="true" />
                    <div className="flex items-center justify-between gap-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        <ReviewAvatar name={review.user_name} image={review.review_image} />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1 truncate text-sm font-extrabold text-[#17123b]">
                            <span className="truncate">{review.user_name || "Customer"}</span>
                            <BadgeCheck size={15} className="shrink-0 fill-violet-600 text-white" aria-label="Published customer review" />
                          </p>
                          <p className="mt-0.5 text-xs font-medium text-slate-500">{formatReviewDate(review.created_at)}</p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1.5" aria-label={`${review.rating} out of 5 stars`}>
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              size={13}
                              className={index < Math.round(Number(review.rating) || 0)
                                ? "fill-amber-400 text-amber-400"
                                : "text-amber-200"}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-extrabold text-amber-800">{(Number(review.rating) || 0).toFixed(1)}</span>
                      </div>
                    </div>

                    {(review.product_name || review.combo_name) && (
                      <Link
                        to={review.product_id ? `/product/${review.product_id}` : "/shop"}
                        className="mt-4 inline-flex max-w-full items-center gap-2 self-start rounded-full border border-violet-100 bg-violet-50 px-3.5 py-2 text-xs font-extrabold text-violet-800 transition hover:border-violet-200 hover:bg-violet-100"
                      >
                        <span className="truncate">{review.product_name || review.combo_name}</span>
                        <ArrowUpRight size={13} className="shrink-0" aria-hidden="true" />
                      </Link>
                    )}
                    <div className="relative mt-4">
                      <Quote size={25} className="absolute -left-1 -top-1 fill-violet-200 text-violet-200" aria-hidden="true" />
                      <p className="relative line-clamp-3 whitespace-pre-line break-words pl-7 text-sm italic leading-6 text-slate-700">
                        {review.comment}
                      </p>
                    </div>
                    {review.admin_reply && (
                      <div className="mt-3 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/70 p-3 sm:p-3.5">
                        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-800">
                          <MessageSquare size={14} aria-hidden="true" />
                          Response from our team
                        </p>
                        <p className="mt-1.5 whitespace-pre-line break-words text-xs leading-relaxed text-slate-700">
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
