import { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Star, UserRound } from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";
import { AuthContext } from "../../PrivateRouter/AuthContext";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

function getReviewImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function Account() {
  const { user } = useContext(AuthContext);
  const [reviewState, setReviewState] = useState({ userId: null, reviews: [], loading: true, failed: false });

  useEffect(() => {
    let active = true;
    if (!user?.user_id) {
      return () => {
        active = false;
      };
    }

    api.get("/reviews/mine")
      .then(({ data }) => {
        if (active) {
          setReviewState({
            userId: user.user_id,
            reviews: Array.isArray(data.reviews) ? data.reviews : [],
            loading: false,
            failed: false,
          });
        }
      })
      .catch((error) => {
        console.error("Failed to load customer reviews:", error);
        if (active) {
          setReviewState({ userId: user.user_id, reviews: [], loading: false, failed: true });
          toast.error(error.response?.data?.message || "Failed to load your reviews");
        }
      });

    return () => {
      active = false;
    };
  }, [user?.user_id]);

  const reviewsMatchUser = reviewState.userId === user?.user_id;
  const reviews = reviewsMatchUser ? reviewState.reviews : [];
  const reviewsLoading = Boolean(user?.user_id) && (!reviewsMatchUser || reviewState.loading);
  const reviewsFailed = reviewsMatchUser && reviewState.failed;

  return (
    <>
      <PageHeader title="My Account" align="left" />
      <PageContainer className="py-8 sm:py-12">
        {!user ? (
          <div className="mx-auto max-w-xl rounded-2xl border border-border bg-white p-8 text-center">
            <UserRound className="mx-auto mb-4 text-primary" size={40} />
            <h1 className="text-xl font-bold text-text-primary">Sign in to view your account</h1>
            <Link to="/login" className="mt-6 inline-flex rounded-lg bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary-dark">
              Sign in
            </Link>
          </div>
        ) : (
          <>
            <section className="rounded-2xl border border-border bg-white p-5 sm:p-7" aria-labelledby="account-details-heading">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound size={27} aria-hidden="true" />
                </div>
                <div>
                  <h1 id="account-details-heading" className="text-xl font-extrabold text-text-primary">
                    {user.username || user.name || "Customer"}
                  </h1>
                  <p className="mt-1 text-sm text-text-secondary">{user.email}</p>
                </div>
              </div>
            </section>

            <section className="mt-8" aria-labelledby="my-reviews-heading">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Your feedback</p>
                <h2 id="my-reviews-heading" className="mt-1 text-xl font-extrabold text-text-primary sm:text-2xl">
                  My Reviews
                </h2>
              </div>

              {reviewsLoading ? (
                <p className="rounded-xl border border-border bg-white p-6 text-sm text-text-secondary">Loading your reviews...</p>
              ) : reviewsFailed ? (
                <p className="rounded-xl border border-rose-200 bg-white p-6 text-sm text-rose-600">
                  Could not load your reviews. Please refresh the page to try again.
                </p>
              ) : reviews.length === 0 ? (
                <div className="rounded-xl border border-border bg-white p-6 text-sm text-text-secondary">
                  You have not submitted any reviews yet. Visit a product page to share your feedback.
                  <div className="mt-4">
                    <Link to="/shop" className="font-bold text-primary hover:underline">Browse products</Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <article key={review.id} className="rounded-xl border border-border bg-white p-4 sm:p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <Link
                            to={`/product/${review.product_id}`}
                            className="font-bold text-text-primary hover:text-primary hover:underline"
                          >
                            {review.product_name || "Product"}
                          </Link>
                          <time className="mt-1 block text-xs text-text-secondary" dateTime={review.created_at}>
                            {new Date(review.created_at).toLocaleDateString()}
                          </time>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          review.status === "Published"
                            ? "bg-emerald-50 text-emerald-700"
                            : review.status === "Flagged"
                              ? "bg-rose-50 text-rose-700"
                              : "bg-amber-50 text-amber-700"
                        }`}>
                          {review.status}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => (
                          <Star
                            key={index}
                            size={15}
                            fill={index < Number(review.rating) ? "currentColor" : "none"}
                            aria-hidden="true"
                          />
                        ))}
                      </div>
                      <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">{review.comment}</p>
                      {review.review_image && (
                        <img
                          src={getReviewImageUrl(review.review_image)}
                          alt={`Review image for ${review.product_name || "product"}`}
                          loading="lazy"
                          className="mx-auto mt-3 block h-56 max-w-full rounded-lg border border-border object-contain sm:h-64"
                        />
                      )}
                      {review.admin_reply && (
                        <p className="mt-3 rounded-lg bg-[#faf8ff] p-3 text-sm text-text-secondary">
                          <span className="font-bold text-text-primary">Store reply: </span>{review.admin_reply}
                        </p>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </PageContainer>
    </>
  );
}

export default Account;
