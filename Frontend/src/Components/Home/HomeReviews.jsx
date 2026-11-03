import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, ChevronLeft, ChevronRight, ExternalLink, MessageSquare, Quote, Star } from "lucide-react";
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

function HomeReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchFailed, setFetchFailed] = useState(false);
  const swiperRef = useRef(null);
  const [openStoreReplies, setOpenStoreReplies] = useState(() => new Set());

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
    <PageContainer className="py-4 sm:py-5">
      <section aria-labelledby="customer-reviews-heading">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2
              id="customer-reviews-heading"
              className="flex items-center gap-2 text-base font-extrabold tracking-tight text-text-primary sm:text-lg"
            >
              <span className="h-5 w-1 shrink-0 rounded-full bg-primary" aria-hidden="true" />
              Customer Reviews
            </h2>
            <p className="mt-1 text-xs text-text-secondary sm:text-sm">
              See what customers are saying about our products.
            </p>
          </div>
          {!loading && reviews.length > 1 && (
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={() => swiperRef.current?.slidePrev()}
                aria-label="Previous customer reviews"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-primary hover:text-primary"
              >
                <ChevronLeft size={17} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => swiperRef.current?.slideNext()}
                aria-label="Next customer reviews"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-text-secondary transition hover:border-primary hover:text-primary"
              >
                <ChevronRight size={17} aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Loading customer reviews">
            {Array.from({ length: 4 }, (_, index) => (
              <div key={index} className="h-48 animate-pulse rounded-2xl bg-[#faf8ff]" aria-hidden="true" />
            ))}
          </div>
        ) : fetchFailed ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            Customer reviews could not be loaded. Please try again later.
          </p>
        ) : reviews.length === 0 ? (
          <p className="rounded-xl bg-[#faf8ff] px-4 py-5 text-center text-sm text-text-secondary">
            No published reviews yet.
          </p>
        ) : (
          <div className="overflow-hidden py-2">
            <Swiper
              modules={[Autoplay]}
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              slidesPerView={1.1}
              spaceBetween={12}
              loop={reviews.length > 4}
              autoplay={reviews.length > 4
                ? { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }
                : false}
              breakpoints={{
                480: { slidesPerView: 1.5, spaceBetween: 12 },
                640: { slidesPerView: 2, spaceBetween: 14 },
                768: { slidesPerView: 3, spaceBetween: 16 },
                1024: { slidesPerView: 4, spaceBetween: 16 },
              }}
              aria-label="Customer reviews"
            >
              {reviews.map((review) => {
                const hasStoreReply = typeof review.admin_reply === "string" && review.admin_reply.trim().length > 0;
                const isStoreReplyOpen = openStoreReplies.has(review.id);
                const storeReplyId = `store-reply-${review.id}`;

                return (
                  <SwiperSlide key={review.id} className="!h-auto">
                    <article className="flex h-full flex-col rounded-2xl border border-[#eadcf6] bg-white p-4 shadow-[0_8px_18px_rgba(47,20,78,0.08)]">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex min-w-0 items-center gap-3">
                          {review.review_image && (
                            <img
                              src={getReviewImageUrl(review.review_image)}
                              alt=""
                              loading="lazy"
                              className="h-16 w-16 shrink-0 rounded-xl bg-[#f3e8fb] object-cover"
                            />
                          )}
                          <div className="min-w-0">
                            <p className="truncate text-sm font-extrabold text-[#101832]">{review.user_name}</p>
                            <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-[#64708a]">
                              <CalendarDays size={14} aria-hidden="true" />
                              {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-0.5 pt-1" aria-label={`${review.rating} out of 5 stars`}>
                          {Array.from({ length: 5 }, (_, index) => (
                            <Star
                              key={index}
                              size={14}
                              className={index < Number(review.rating)
                                ? "fill-amber-400 text-amber-400"
                                : "fill-[#e5e7eb] text-[#e5e7eb]"}
                              aria-hidden="true"
                            />
                          ))}
                        </div>
                      </div>

                      {review.product_name && (
                        <Link
                          to={review.product_id ? `/product/${review.product_id}` : "/shop"}
                          className="mt-4 flex min-w-0 items-center gap-1.5 border-b border-[#eee5f5] pb-3 text-sm font-bold text-[#5b0db5] hover:text-primary"
                        >
                          <span className="truncate underline underline-offset-2">{review.product_name}</span>
                          <ExternalLink size={15} className="shrink-0" aria-hidden="true" />
                        </Link>
                      )}

                      <div className="mt-4 flex items-start gap-2">
                        <Quote size={22} className="mt-0.5 shrink-0 fill-[#5b0db5] text-[#5b0db5]" aria-hidden="true" />
                        <p className="whitespace-pre-line break-words text-sm leading-6 text-[#202b46]">
                          {review.comment}
                        </p>
                      </div>

                      {hasStoreReply && (
                        <div className="mt-auto pt-5">
                          <div className="rounded-2xl bg-[#f7effc] p-3.5">
                            <button
                              type="button"
                              aria-expanded={isStoreReplyOpen}
                              aria-controls={storeReplyId}
                              onClick={() => {
                                setOpenStoreReplies((current) => {
                                  const next = new Set(current);
                                  if (next.has(review.id)) next.delete(review.id);
                                  else next.add(review.id);
                                  return next;
                                });
                              }}
                              className="flex w-full items-center gap-2 text-left text-sm font-extrabold text-[#5b0db5]"
                            >
                              <MessageSquare size={18} aria-hidden="true" />
                              Store reply
                            </button>
                            <p
                              id={storeReplyId}
                              hidden={!isStoreReplyOpen}
                              className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-[#202b46]"
                            >
                              {review.admin_reply}
                            </p>
                          </div>
                        </div>
                      )}
                    </article>
                  </SwiperSlide>
                );
              })}
            </Swiper>
          </div>
        )}
      </section>
    </PageContainer>
  );
}

export default HomeReviews;
