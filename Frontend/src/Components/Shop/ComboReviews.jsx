import { useContext, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, MessageSquare, Star, UserRound, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { toast } from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import "swiper/css";

function ComboReviews({ comboId, comboName }) {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const reviewsSwiper = useRef(null);
  const [reviewState, setReviewState] = useState({ id: null, reviews: [], loading: true, failed: false });
  const [ownReviewState, setOwnReviewState] = useState({
    comboId: null,
    userId: null,
    review: null,
    loading: false,
    failed: false,
  });
  const [reviewUserName, setReviewUserName] = useState(user?.username || user?.name || "");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [reviewImagePreview, setReviewImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const reviewMatchesCombo = reviewState.id === comboId;
  const reviews = reviewMatchesCombo ? reviewState.reviews : [];
  const reviewsLoading = !reviewMatchesCombo || reviewState.loading;
  const reviewsFailed = reviewMatchesCombo && reviewState.failed;
  const reviewRatings = reviews
    .map((review) => Number(review.rating))
    .filter((rating) => Number.isInteger(rating) && rating >= 1 && rating <= 5);
  const reviewAverage = reviewRatings.length
    ? reviewRatings.reduce((total, rating) => total + rating, 0) / reviewRatings.length
    : 0;
  const ratingBreakdown = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviewRatings.filter((value) => value === rating).length,
  }));
  const ownReviewMatches = ownReviewState.comboId === comboId && ownReviewState.userId === user?.user_id;
  const ownReview = ownReviewMatches ? ownReviewState.review : null;
  const ownReviewLoading = Boolean(user?.user_id) && (!ownReviewMatches || ownReviewState.loading);
  const ownReviewFailed = ownReviewMatches && ownReviewState.failed;

  useEffect(() => () => {
    if (reviewImagePreview) URL.revokeObjectURL(reviewImagePreview);
  }, [reviewImagePreview]);

  useEffect(() => {
    let active = true;
    api.get(`/reviews/combo/${comboId}`)
      .then(({ data }) => {
        if (active) {
          setReviewState({
            id: comboId,
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
            loading: false,
            failed: false,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load combo reviews:", error);
        if (active) {
          setReviewState({ id: comboId, reviews: [], loading: false, failed: true });
          toast.error(error.response?.data?.message || "Failed to load combo reviews");
        }
      });
    return () => { active = false; };
  }, [comboId]);

  useEffect(() => {
    let active = true;
    if (!user?.user_id) return () => { active = false; };

    api.get(`/reviews/combo/${comboId}/mine`)
      .then(({ data }) => {
        if (active) {
          setOwnReviewState({
            comboId,
            userId: user.user_id,
            review: data.review || null,
            loading: false,
            failed: false,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to check existing combo review:", error);
        if (active) {
          setOwnReviewState({
            comboId,
            userId: user.user_id,
            review: null,
            loading: false,
            failed: true,
          });
          toast.error(error.response?.data?.message || "Could not check your existing review");
        }
      });
    return () => { active = false; };
  }, [comboId, user?.user_id]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!user?.user_id) {
      toast.error("Please sign in to leave a review.");
      navigate("/login", { state: { from: `${location.pathname}${location.search}` } });
      return;
    }
    if (!reviewUserName.trim() || reviewUserName.trim().length > 160) {
      toast.error("Enter your name using 160 characters or fewer.");
      return;
    }
    if (!reviewComment.trim() || reviewComment.trim().length > 5000) {
      toast.error("Write a review of 5,000 characters or fewer.");
      return;
    }
    if (reviewImage && reviewImage.size > 5 * 1024 * 1024) {
      toast.error("Review image must be 5 MB or smaller.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("user_name", reviewUserName.trim());
      formData.append("rating", String(reviewRating));
      formData.append("comment", reviewComment.trim());
      if (reviewImage) formData.append("image", reviewImage);
      const { data } = await api.post(`/reviews/combo/${comboId}`, formData);
      setOwnReviewState({
        comboId,
        userId: user.user_id,
        review: data.review,
        loading: false,
        failed: false,
      });
      setReviewComment("");
      setReviewImage(null);
      setReviewImagePreview("");
      setIsModalOpen(false);
      toast.success("Review submitted. It will appear after approval.");
    } catch (error) {
      if (error.response?.status === 409) {
        try {
          const { data } = await api.get(`/reviews/combo/${comboId}/mine`);
          setOwnReviewState({
            comboId,
            userId: user.user_id,
            review: data.review || null,
            loading: false,
            failed: false,
          });
        } catch (refreshError) {
          console.error("Failed to refresh existing combo review:", refreshError);
        }
      }
      toast.error(error.response?.data?.message || "Failed to submit your review");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!isModalOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isSubmitting) setIsModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isModalOpen, isSubmitting]);

  return (
    <>
      <section className="mt-10 border-t border-border pt-8 sm:mt-14" aria-labelledby="combo-reviews-heading">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Customer feedback</p>
            <h2 id="combo-reviews-heading" className="mt-1 text-xl font-extrabold text-text-primary sm:text-2xl">
              Reviews ({reviews.length})
            </h2>
          </div>
          {!reviewsLoading && !reviewsFailed && reviews.length > 1 && (
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => reviewsSwiper.current?.slidePrev()}
                aria-label="Previous combo reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-white text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
              ><ChevronLeft size={18} aria-hidden="true" /></button>
              <button
                type="button"
                onClick={() => reviewsSwiper.current?.slideNext()}
                aria-label="Next combo reviews"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-violet-100 bg-white text-text-secondary shadow-sm transition hover:border-primary hover:text-primary"
              ><ChevronRight size={18} aria-hidden="true" /></button>
            </div>
          )}
        </div>

        {!reviewsLoading && !reviewsFailed && (
          <div className="mb-6 grid gap-5 rounded-2xl border border-violet-100 bg-white p-5 shadow-[0_8px_24px_rgba(75,0,200,0.04)] sm:grid-cols-[minmax(180px,0.7fr)_1.3fr] sm:items-center sm:p-6">
            <div className="text-center sm:border-r sm:border-border sm:pr-5">
              <p className="text-4xl font-extrabold text-text-primary">
                {reviewRatings.length ? reviewAverage.toFixed(1) : "—"}
                <span className="ml-1 text-base font-semibold text-text-secondary">/ 5</span>
              </p>
              <div className="mt-1 flex justify-center text-amber-500" aria-label={`${reviewAverage.toFixed(1)} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={19} fill={star <= Math.round(reviewAverage) ? "currentColor" : "none"} />)}
              </div>
              <p className="mt-1 text-sm text-text-secondary">{reviewRatings.length} {reviewRatings.length === 1 ? "rating" : "ratings"}</p>
            </div>
            <div className="space-y-2.5">
              {ratingBreakdown.map(({ rating, count }) => (
                <div key={rating} className="grid grid-cols-[3rem_1fr_2rem] items-center gap-2 text-xs text-text-secondary">
                  <span>{rating} {rating === 1 ? "star" : "stars"}</span>
                  <div
                    className="h-2.5 overflow-hidden rounded-full bg-gray-100"
                    role="progressbar"
                    aria-label={`${rating} star ratings`}
                    aria-valuemin={0}
                    aria-valuemax={reviewRatings.length}
                    aria-valuenow={count}
                  >
                    <div className="h-full rounded-full bg-amber-400 transition-[width]" style={{ width: `${reviewRatings.length ? (count / reviewRatings.length) * 100 : 0}%` }} />
                  </div>
                  <span className="text-right">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {ownReviewLoading ? (
          <p className="mb-6 text-sm text-text-secondary">Checking your review...</p>
        ) : ownReviewFailed ? (
          <p className="mb-6 text-sm text-rose-600">Could not verify your review status. Please refresh the page and try again.</p>
        ) : ownReview ? (
          <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            You have already reviewed this combo. Your review is {String(ownReview.status || "Pending").toLowerCase()}.
          </div>
        ) : user?.user_id ? (
          <div className="mb-8 flex justify-end">
            <button
              type="button"
              onClick={() => {
                setReviewUserName(user.username || user.name || "");
                setIsModalOpen(true);
              }}
              className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-primary-dark"
            >Write a review</button>
          </div>
        ) : (
          <p className="mb-6 text-sm text-text-secondary">
            <Link to="/login" state={{ from: `${location.pathname}${location.search}` }} className="font-bold text-primary hover:underline">Sign in</Link>{" "}
            to write a review.
          </p>
        )}

        {reviewsLoading ? (
          <p className="text-sm text-text-secondary">Loading reviews...</p>
        ) : reviewsFailed ? (
          <p className="text-sm text-rose-600">Could not load reviews. Please refresh the page to try again.</p>
        ) : reviews.length ? (
          <div className="overflow-hidden py-1">
            <Swiper
              onSwiper={(swiper) => { reviewsSwiper.current = swiper; }}
              slidesPerView={1}
              spaceBetween={12}
              breakpoints={{ 640: { slidesPerView: 2, spaceBetween: 16 }, 1024: { slidesPerView: 3, spaceBetween: 18 } }}
              aria-label="Published combo reviews"
            >
              {reviews.map((review) => (
                <SwiperSlide key={review.id} className="!h-auto">
                  <article className="h-full rounded-2xl border border-violet-100 bg-white p-5 text-center shadow-[0_6px_20px_rgba(75,0,200,0.04)]">
                    <div className="flex flex-col items-center gap-1">
                      <span className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-violet-100 text-primary" aria-hidden="true"><UserRound size={23} /></span>
                      <h3 className="font-bold text-text-primary">{review.user_name}</h3>
                      <time className="text-xs text-text-secondary" dateTime={review.created_at}>{new Date(review.created_at).toLocaleDateString()}</time>
                    </div>
                    <div className="mt-1 flex justify-center text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                      {[1, 2, 3, 4, 5].map((star) => <Star key={star} size={15} fill={star <= Number(review.rating) ? "currentColor" : "none"} />)}
                    </div>
                    <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{review.comment}</p>
                    {review.admin_reply && (
                      <div className="mt-4 rounded-xl border border-violet-100 bg-gradient-to-br from-violet-50/90 to-fuchsia-50/70 p-3 text-left sm:p-4">
                        <p className="flex items-center justify-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-violet-800 sm:justify-start"><MessageSquare size={14} aria-hidden="true" />Response from our team</p>
                        <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-relaxed text-slate-700">{review.admin_reply}</p>
                      </div>
                    )}
                  </article>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        ) : (
          <p className="text-sm text-text-secondary">No published reviews yet. Customer reviews appear here after admin approval.</p>
        )}
      </section>

      {isModalOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
          <button type="button" aria-label="Close review form" onClick={() => !isSubmitting && setIsModalOpen(false)} className="absolute inset-0 bg-black/50" />
          <section role="dialog" aria-modal="true" aria-labelledby="write-combo-review-heading" className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">Customer feedback</p>
                <h2 id="write-combo-review-heading" className="mt-1 text-xl font-extrabold text-text-primary">Review {comboName}</h2>
              </div>
              <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} aria-label="Close review form" className="rounded-lg p-2 text-text-secondary hover:bg-gray-100 disabled:opacity-50"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="mt-5">
              <label htmlFor="combo-review-name" className="block text-sm font-semibold text-text-secondary">Your name</label>
              <input id="combo-review-name" type="text" value={reviewUserName} onChange={(event) => setReviewUserName(event.target.value)} maxLength={160} required autoComplete="name" placeholder="Enter your name" className="mt-2 w-full rounded-lg border border-border p-3 text-sm text-text-primary outline-none focus:border-primary" />
              <fieldset>
                <legend className="mt-4 text-sm font-semibold text-text-secondary">Your rating</legend>
                <div className="mt-1 flex gap-1">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button key={rating} type="button" onClick={() => setReviewRating(rating)} aria-label={`${rating} star${rating > 1 ? "s" : ""}`} aria-pressed={reviewRating === rating} className="rounded p-1 text-amber-500">
                      <Star size={24} fill={rating <= reviewRating ? "currentColor" : "none"} />
                    </button>
                  ))}
                </div>
              </fieldset>
              <label htmlFor="combo-review-comment" className="mt-4 block text-sm font-semibold text-text-secondary">Your review</label>
              <textarea id="combo-review-comment" value={reviewComment} onChange={(event) => setReviewComment(event.target.value)} maxLength={5000} rows={5} required placeholder="Share your experience with this combo" className="mt-2 w-full rounded-lg border border-border p-3 text-sm text-text-primary outline-none focus:border-primary" />
              <label htmlFor="combo-review-image" className="mt-4 block text-sm font-semibold text-text-secondary">Add a photo <span className="font-normal">(optional, max 5 MB)</span></label>
              <input
                id="combo-review-image"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => {
                  const file = event.target.files?.[0] || null;
                  if (file && file.size > 5 * 1024 * 1024) {
                    toast.error("Review image must be 5 MB or smaller.");
                    event.target.value = "";
                    setReviewImage(null);
                    setReviewImagePreview("");
                    return;
                  }
                  setReviewImage(file);
                  setReviewImagePreview(file ? URL.createObjectURL(file) : "");
                }}
                className="mt-2 block w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary"
              />
              {reviewImagePreview && (
                <div className="mt-3 flex items-start gap-3">
                  <img src={reviewImagePreview} alt="Review upload preview" className="h-24 w-24 rounded-lg border border-border object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setReviewImage(null);
                      setReviewImagePreview("");
                      const input = document.getElementById("combo-review-image");
                      if (input) input.value = "";
                    }}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:underline"
                  ><X size={14} />Remove photo</button>
                </div>
              )}
              <p className="mt-2 flex items-center gap-1.5 text-xs text-text-secondary"><ImagePlus size={14} aria-hidden="true" />JPG, PNG, WEBP, or GIF</p>
              <div className="mt-6 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} disabled={isSubmitting} className="rounded-xl border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white transition hover:bg-primary-dark disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Submitting..." : "Submit review"}</button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}

export default ComboReviews;
