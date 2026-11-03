import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, MessageSquare, Star } from "lucide-react";
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
              onSwiper={(swiper) => {
                swiperRef.current = swiper;
              }}
              slidesPerView={1.1}
              spaceBetween={12}
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
                    <article className="h-full rounded-2xl border border-border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {review.review_image && (
                          <img
                            src={getReviewImageUrl(review.review_image)}
                            alt=""
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-text-primary">{review.user_name}</p>
                          <p className="mt-1 text-[11px] text-text-secondary">
                            {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-0.5" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            size={14}
                            className={index < Number(review.rating)
                              ? "fill-amber-400 text-amber-400"
                              : "text-gray-200"}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                    </div>

                {review.product_name && (
                  <Link
                    to={review.product_id ? `/product/${review.product_id}` : "/shop"}
                    className="mt-3 block truncate text-xs font-semibold text-primary hover:underline"
                  >
                    {review.product_name}
                  </Link>
                )}
                <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-text-secondary">
                  {review.comment}
                </p>
                {hasStoreReply && (
                  <div className="mt-4 rounded-xl bg-[#faf7ff] p-3">
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
                      className="flex w-full items-center gap-1.5 text-left text-[11px] font-bold text-primary"
                    >
                      <MessageSquare size={13} aria-hidden="true" />
                      Store reply
                    </button>
                    <p
                      id={storeReplyId}
                      hidden={!isStoreReplyOpen}
                      className="mt-2 whitespace-pre-line break-words text-xs leading-5 text-text-secondary"
                    >
                      {review.admin_reply}
                    </p>
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
