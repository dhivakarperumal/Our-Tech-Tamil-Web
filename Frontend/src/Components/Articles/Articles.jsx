import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Bell,
  BookOpenText,
  ChevronDown,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const tabs = [
  { value: "all", label: "All Content" },
  { value: "article", label: "Articles" },
  { value: "product_review", label: "Product Reviews" },
];

const highlightCards = [
  { icon: BookOpenText, title: "Expert Articles", subtitle: "Guides, tips & tech insights" },
  { icon: Sparkles, title: "Honest Reviews", subtitle: "Real product experience" },
  { icon: ShieldCheck, title: "Compare & Choose", subtitle: "Find the best for your needs" },
  { icon: Bell, title: "Stay Updated", subtitle: "Latest tech trends & launches" },
];

function getImageUrl(value) {
  if (!value) return "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80";
  if (value.startsWith("http")) return value;
  return backendUrl + (value.startsWith("/") ? value : `/${value}`);
}

function formatDate(value) {
  if (!value) return "Recently";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function StarRating({ value }) {
  const rounded = Math.round(Number(value || 0));

  return (
    <div className="flex items-center gap-1 text-amber-500">
      {[1, 2, 3, 4, 5].map((tick) => (
        <Star
          key={tick}
          size={14}
          className={tick <= rounded ? "fill-amber-400 text-amber-400" : "text-gray-300"}
        />
      ))}
      <span className="ml-1 text-xs font-bold text-amber-600">{Number(value || 0).toFixed(1)}</span>
    </div>
  );
}

function Articles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    api
      .get("/admin/content/articles")
      .then(({ data }) => {
        if (!active) return;
        setArticles(Array.isArray(data.articles) ? data.articles : []);
      })
      .catch(() => {
        if (active) {
          setError("Unable to load articles right now.");
          setArticles([]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const filteredContent = useMemo(() => {
    const query = search.trim().toLowerCase();

    return articles.filter((item) => {
      const itemType = item.content_type || "article";
      const title = item.content_type === "product_review" ? item.product_name || item.title : item.title || "";
      const matchesTab = tab === "all" || itemType === tab;
      if (!matchesTab) return false;
      if (!query) return true;

      const searchable = [title, item.description || "", item.content_type || ""].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [articles, search, tab]);

  return (
    <main className="bg-[#f7f3fb] pb-14">
      <PageHeader title = "Articles & Reviews" />
      <PageContainer>
        <section className="pt-6 sm:pt-8">

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {highlightCards.map(({ icon: Icon, title, subtitle }) => (
              <div
                key={title}
                className="flex items-center gap-4 rounded-[20px] border border-[#e8dff6] bg-white px-4 py-4 shadow-[0_8px_24px_rgba(96,56,155,0.06)]"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e9ff] text-[#5c1bc7]">
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="text-[1.05rem] font-bold text-[#1d1830]">{title}</h3>
                  <p className="text-sm text-[#5d5a6d]">{subtitle}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2 rounded-[18px] bg-[#f0e5ff] p-1.5">
              {tabs.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setTab(value)}
                  className={`rounded-[12px] px-5 py-2 text-sm font-semibold transition ${tab === value
                      ? "bg-[#6d2ad5] text-white shadow-[0_10px_20px_rgba(109,42,213,0.22)]"
                      : "bg-transparent text-[#4b4070] hover:bg-white/70"
                    }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center xl:max-w-[560px]">
              <label className="relative block flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6a6477]" size={18} />
                <input
                  type="text"
                  placeholder="Search articles or reviews..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  className="w-full rounded-[16px] border border-[#e7dff6] bg-white py-3.5 pl-11 pr-4 text-sm text-[#1d1830] outline-none transition focus:border-[#7a3fd6] focus:ring-2 focus:ring-[#7a3fd6]/15"
                />
              </label>

              <div className="relative min-w-[170px]">
                <select
                  defaultValue="latest"
                  className="w-full appearance-none rounded-[16px] border border-[#e7dff6] bg-white px-4 py-3.5 pr-10 text-sm font-medium text-[#2f2a3d] outline-none transition focus:border-[#7a3fd6] focus:ring-2 focus:ring-[#7a3fd6]/15"
                >
                  <option value="latest">Latest First</option>
                  <option value="popular">Most Popular</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#6a6477]" size={16} />
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-[22px] border border-[#e9def5] bg-white p-4">
                  <div className="h-[212px] rounded-[16px] bg-[#f0e7ff]" />
                  <div className="mt-4 h-4 w-20 rounded bg-[#f0e7ff]" />
                  <div className="mt-3 h-5 rounded bg-[#f0e7ff]" />
                  <div className="mt-2 h-3 rounded bg-[#f4f0fa]" />
                  <div className="mt-1 h-3 w-2/3 rounded bg-[#f4f0fa]" />
                </div>
              ))}
            </div>
          )}

          {!loading && !error && filteredContent.length > 0 && (
            <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
              {filteredContent.map((item) => {
                const itemType = item.content_type || "article";
                const title = itemType === "product_review" ? item.product_name || item.title : item.title || "Untitled";
                const category = itemType === "product_review" ? "PRODUCT REVIEW" : "ARTICLE";
                const image = getImageUrl(item.image_url);
                const features = Array.isArray(item.product_features) ? item.product_features : [];
                const links = Array.isArray(item.buy_links) ? item.buy_links.filter((link) => link && link.url) : [];
                const buttonLabel = itemType === "product_review" ? "Read Review" : "Read Full Article";

                return (
                  <article
                    key={item.id || item.content_id}
                    className="flex min-h-[480px] flex-col overflow-hidden rounded-[22px] border border-[#e9def5] bg-white shadow-[0_10px_24px_rgba(92,54,150,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(92,54,150,0.12)]"
                  >
                    <div className="relative h-[212px] overflow-hidden bg-[#f0e7ff]">
                      <img src={image} alt={title} className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]" />
                      <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5a2db3] shadow-sm">
                        {itemType === "product_review" ? <Star size={12} className="fill-amber-400 text-amber-400" /> : <BookOpenText size={12} />}
                        {itemType === "product_review" ? "Product Review" : "Article"}
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${itemType === "product_review" ? "bg-[#fff4d8] text-[#ae6a00]" : "bg-[#f0e7ff] text-[#5a2db3]"}`}>
                          {category}
                        </span>

                        {itemType === "product_review" && (
                          <div className="inline-flex items-center gap-1 rounded-full bg-[#f6f1ff] px-2 py-1 text-[11px] font-bold text-[#6d2ad5]">
                            <Star size={12} className="fill-amber-400 text-amber-400" />
                            {Number(item.rating || 0).toFixed(1)}
                          </div>
                        )}
                      </div>

                      <h3 className="text-[1.02rem] font-extrabold leading-tight text-[#1f1a2d] sm:text-[1.08rem]">
                        {title}
                      </h3>

                      {itemType === "product_review" && item.rating && (
                        <div className="mt-3 flex items-center gap-2">
                          <StarRating value={item.rating} />
                        </div>
                      )}

                      <p className="mt-3 flex-1 text-sm leading-6 text-[#5d5a6d]">
                        {item.description || "No description available yet."}
                      </p>

                      {itemType === "product_review" && features.length > 0 && (
                        <div className="mt-4 grid grid-cols-3 gap-2">
                          {features.slice(0, 3).map((feature, index) => (
                            <div key={`${feature.name || "feature"}-${index}`} className="rounded-xl bg-[#f7f2ff] px-2 py-2 text-center">
                              <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#716b83]">
                                {feature.name || "Feature"}
                              </div>
                              <div className="mt-1 text-xs font-bold text-[#1f1a2d]">{feature.value || "-"}</div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#5d5a6d]">
                        <span className="inline-flex items-center gap-2">
                          <span className="inline-block h-3.5 w-3.5 rounded-full border border-[#c6b7ee] bg-[#f0e7ff]" />
                          {formatDate(item.created_at)}
                        </span>
                        <span>{links.length > 0 ? `${links.length} link${links.length > 1 ? "s" : ""}` : "View"}</span>
                      </div>

                      <button
                        type="button"
                        className={`mt-5 inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-bold transition ${itemType === "product_review"
                            ? "border-[#6d2ad5] bg-[#6d2ad5] text-white hover:bg-[#5d1fc0]"
                            : "border-[#7d4ae4] bg-white text-[#6d2ad5] hover:bg-[#f4ebff]"
                          }`}
                      >
                        {buttonLabel}
                        <ArrowRight size={15} />
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          {!loading && !error && filteredContent.length === 0 && (
            <div className="mt-12 rounded-[22px] border border-dashed border-[#d8c8f0] bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0e7ff] text-[#5a2db3]">
                <Search size={28} />
              </div>
              <h4 className="mt-4 text-xl font-bold text-[#1d1830]">No results found</h4>
              <p className="mt-2 text-sm text-[#5d5a6d]">Try another keyword or switch the content category.</p>
            </div>
          )}

          {!loading && error && (
            <div className="mt-12 rounded-[22px] border border-dashed border-[#d8c8f0] bg-white px-6 py-12 text-center">
              <p className="text-base font-bold text-rose-600">{error}</p>
            </div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}

export default Articles;