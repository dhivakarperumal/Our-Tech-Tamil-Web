import { useEffect, useState } from "react";
import {
  BookOpen,
  ExternalLink,
  Search,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

function getImageUrl(img) {
  if (!img) return null;
  if (img.startsWith("http")) return img;
  return backendUrl + (img.startsWith("/") ? img : "/" + img);
}

function StarRating({ value }) {
  const stars = Math.round(Number(value) || 0);
  return (
    <span className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= stars ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-1 text-xs font-semibold text-amber-600">
        {Number(value).toFixed(1)}
      </span>
    </span>
  );
}

function ArticleCard({ item }) {
  const imgUrl = getImageUrl(item.image_url);
  const links = Array.isArray(item.buy_links) ? item.buy_links.filter((l) => l.url) : [];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {imgUrl && (
        <div className="relative h-44 w-full overflow-hidden bg-[#f3eaff]">
          <img
            src={imgUrl}
            alt={item.title}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-block rounded-full bg-[#f0e7ff] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-primary">
          Article
        </span>
        <h3 className="mt-2 text-base font-extrabold leading-snug text-text-primary line-clamp-2">
          {item.title}
        </h3>
        {item.description && (
          <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary line-clamp-4">
            {item.description}
          </p>
        )}
        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                {link.name || "Read More"}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

function ReviewCard({ item }) {
  const imgUrl = getImageUrl(item.image_url);
  const links = Array.isArray(item.buy_links) ? item.buy_links.filter((l) => l.url) : [];
  const features = Array.isArray(item.product_features) ? item.product_features : [];

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      {imgUrl && (
        <div className="relative h-44 w-full overflow-hidden bg-[#f3eaff]">
          <img
            src={imgUrl}
            alt={item.product_name || item.title}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col p-5">
        <span className="inline-block rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-600">
          Product Review
        </span>
        <h3 className="mt-2 text-base font-extrabold leading-snug text-text-primary line-clamp-2">
          {item.product_name || item.title}
        </h3>
        {item.rating && (
          <div className="mt-1.5">
            <StarRating value={item.rating} />
          </div>
        )}
        {item.description && (
          <p className="mt-2 flex-1 text-sm leading-6 text-text-secondary line-clamp-3">
            {item.description}
          </p>
        )}
        {features.length > 0 && (
          <div className="mt-3 overflow-hidden rounded-lg border border-[#ede5ff]">
            <table className="w-full text-xs">
              <tbody>
                {features.slice(0, 4).map((f, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-[#faf7ff]" : "bg-white"}>
                    <td className="px-3 py-1.5 font-semibold text-text-primary">{f.name}</td>
                    <td className="px-3 py-1.5 text-text-secondary">{f.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {item.more_details && (
          <p className="mt-2 text-xs leading-5 text-text-secondary line-clamp-2">
            {item.more_details}
          </p>
        )}
        {links.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {links.map((link, i) => (
              <a
                key={i}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#3800a0]"
              >
                <ShoppingBag size={12} />
                {link.name || "Buy Now"}
              </a>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

const TABS = [
  { key: "all", label: "All" },
  { key: "article", label: "Articles" },
  { key: "product_review", label: "Product Reviews" },
];

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-[#e9def5] bg-white p-5">
      <div className="h-44 rounded-xl bg-[#f0e7ff]" />
      <div className="mt-4 h-3 w-20 rounded bg-[#f0e7ff]" />
      <div className="mt-3 h-5 rounded bg-[#ede5ff]" />
      <div className="mt-2 h-5 w-3/4 rounded bg-[#ede5ff]" />
      <div className="mt-2 h-3 rounded bg-gray-100" />
      <div className="mt-1 h-3 w-4/5 rounded bg-gray-100" />
    </div>
  );
}

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    api
      .get("/admin/content/articles")
      .then(({ data }) => {
        if (active) setArticles(Array.isArray(data.articles) ? data.articles : []);
      })
      .catch(() => {
        if (active) setError("Failed to load articles. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = articles.filter((a) => {
    const matchTab = tab === "all" || a.content_type === tab;
    const q = search.trim().toLowerCase();
    const matchSearch =
      !q ||
      (a.title || "").toLowerCase().includes(q) ||
      (a.product_name || "").toLowerCase().includes(q) ||
      (a.description || "").toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  return (
    <>
      <PageHeader title="Articles" />
      <main className="bg-[#faf9fc] py-8 sm:py-12">
        <PageContainer>
          {/* Header */}
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-[#f0e7ff] px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-primary">
              <BookOpen size={14} />
              Tech Knowledge Hub
            </span>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
              Articles & Product Reviews
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary">
              Explore expert guides and honest product reviews to help you make smarter tech decisions.
            </p>
          </div>

          {/* Filters */}
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            {/* Tabs */}
            <div className="flex rounded-xl bg-[#f0e7ff] p-1">
              {TABS.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                    tab === t.key
                      ? "bg-primary text-white shadow"
                      : "text-primary hover:bg-[#e4d3ff]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
              />
              <input
                type="text"
                placeholder="Search articles..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-[#e9def5] bg-white py-2 pl-9 pr-9 text-sm text-text-primary outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-primary"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Grid */}
          <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
              : filtered.map((item) =>
                  item.content_type === "product_review" ? (
                    <ReviewCard key={item.id || item.content_id} item={item} />
                  ) : (
                    <ArticleCard key={item.id || item.content_id} item={item} />
                  )
                )}
          </div>

          {/* States */}
          {!loading && !error && filtered.length === 0 && (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <BookOpen size={48} className="text-[#d4b8ff]" />
              <p className="text-lg font-bold text-text-primary">No results found</p>
              <p className="text-sm text-text-secondary">
                {search ? "Try a different search term." : "Check back soon for new content."}
              </p>
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="mt-2 rounded-lg border border-primary px-4 py-2 text-sm font-semibold text-primary hover:bg-primary hover:text-white transition"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}

          {!loading && error && (
            <div className="mt-16 flex flex-col items-center gap-3 text-center">
              <p className="text-base font-bold text-rose-600">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#3800a0] transition"
              >
                Retry
              </button>
            </div>
          )}
        </PageContainer>
      </main>
    </>
  );
}

export default Articles;