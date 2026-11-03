import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  CalendarDays,
  ChevronDown,
  Clock3,
  Heart,
  House,
  Laptop,
  Layers3,
  Leaf,
  Search,
  Shirt,
  Sparkles,
  Utensils,
} from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

const categories = [
  { name: "All Articles", icon: Layers3 },
  { name: "Lifestyle", icon: Leaf },
  { name: "Health & Wellness", icon: Heart },
  { name: "Food & Nutrition", icon: Utensils },
  { name: "Fashion", icon: Shirt },
  { name: "Tech Tips", icon: Laptop },
  { name: "Home & Living", icon: House },
];

function getImageUrl(image) {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function getArticleCategory(article) {
  const content = `${article.title || ""} ${article.description || ""}`.toLowerCase();

  if (/shirt|fashion|wardrobe|clothing|dress|fabric|style/.test(content)) return "Fashion";
  if (/almond|food|nutrition|recipe|snack|ingredient|honey/.test(content)) return "Food & Nutrition";
  if (/health|wellness|fitness|skin|hair|coconut oil/.test(content)) return "Health & Wellness";
  if (/phone|laptop|gadget|technology|tech|device|software/.test(content)) return "Tech Tips";
  if (/home|kitchen|living|decor|household/.test(content)) return "Home & Living";
  return "Lifestyle";
}

function getReadTime(article) {
  const wordCount = `${article.title || ""} ${article.description || ""}`.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(wordCount / 200));
}

function formatArticleDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

function HomeArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Articles");
  const [search, setSearch] = useState("");
  const searchRef = useRef(null);

  useEffect(() => {
    let active = true;
    api.get("/articles")
      .then(({ data }) => {
        if (active) {
          setArticles(Array.isArray(data.articles) ? data.articles.slice(0, 4) : []);
        }
      })
      .catch((error) => {
        console.error("Failed to load homepage articles:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  useEffect(() => {
    const focusSearch = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };

    window.addEventListener("keydown", focusSearch);
    return () => window.removeEventListener("keydown", focusSearch);
  }, []);

  const filteredArticles = useMemo(() => {
    const query = search.trim().toLowerCase();
    return articles.filter((article) => {
      const matchesCategory = activeCategory === "All Articles" || getArticleCategory(article) === activeCategory;
      const matchesSearch = !query ||
        `${article.title || ""} ${article.description || ""}`.toLowerCase().includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, articles, search]);

  if (!loading && articles.length === 0) return null;

  return (
    <section aria-labelledby="home-articles-title" className="relative overflow-hidden bg-gradient-to-br from-[#faf8ff] via-white to-[#f3eaff] py-9 sm:py-12">
      <div aria-hidden="true" className="pointer-events-none absolute -right-32 top-12 h-80 w-80 rounded-full bg-violet-200/30 blur-3xl" />
      <PageContainer>
        <div className="relative">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-[0.16em] text-violet-700 sm:text-sm">
                <BookOpen size={18} strokeWidth={2.5} aria-hidden="true" />
                Tech Knowledge Hub
              </p>
              <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2">
                <h2 id="home-articles-title" className="relative text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
                  All Articles
                  <span aria-hidden="true" className="absolute -bottom-1 left-0 h-1 w-3/4 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500" />
                </h2>
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-3 sm:flex-row xl:w-[min(52%,680px)]">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-900" size={19} aria-hidden="true" />
                <input
                  ref={searchRef}
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search articles, topics or guides..."
                  aria-label="Search articles"
                  className="h-12 w-full rounded-full border border-violet-100 bg-white/90 pl-12 pr-20 text-sm text-slate-800 shadow-[0_8px_24px_rgba(74,38,130,0.08)] outline-none transition placeholder:text-slate-400 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
                />
                <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-500 sm:block">
                  Ctrl + K
                </span>
              </label>
              <Link
                to="/articles"
                className="inline-flex h-12 shrink-0 items-center justify-center gap-3 rounded-full bg-gradient-to-r from-violet-600 to-violet-800 px-6 text-sm font-extrabold text-white shadow-[0_10px_22px_rgba(109,42,213,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(109,42,213,0.32)]"
              >
                View All Articles
                <ArrowRight size={18} aria-hidden="true" />
              </Link>
            </div>
          </div>

          <div className="mt-7">
            <label className="relative block w-full sm:w-72">
              <Layers3 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-violet-700" size={19} aria-hidden="true" />
              <select
                value={activeCategory}
                onChange={(event) => setActiveCategory(event.target.value)}
                aria-label="Filter articles by category"
                className="h-12 w-full appearance-none rounded-full border border-violet-100 bg-white py-3 pl-12 pr-11 text-sm font-bold text-slate-800 shadow-[0_5px_16px_rgba(74,38,130,0.06)] outline-none transition hover:border-violet-200 focus:border-violet-400 focus:ring-4 focus:ring-violet-100"
              >
                {categories.map(({ name }) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-violet-700" size={18} aria-hidden="true" />
            </label>
          </div>

          {loading ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="animate-pulse overflow-hidden rounded-[24px] border border-violet-100 bg-white">
                  <div className="aspect-[1.35] bg-violet-100" />
                  <div className="space-y-3 p-5">
                    <div className="h-5 rounded bg-violet-100" />
                    <div className="h-4 rounded bg-violet-50" />
                    <div className="h-4 w-2/3 rounded bg-violet-50" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredArticles.length > 0 ? (
            <div className="mt-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
              {filteredArticles.map((article) => {
                const image = getImageUrl(article.image_url);
                const category = getArticleCategory(article);
                const articleDate = formatArticleDate(article.created_at);
                const readTime = getReadTime(article);
                const articleTitle = article.title || "Untitled article";

                return (
                  <article
                    key={article.id || article.content_id}
                    className="group flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-violet-100 bg-white shadow-[0_10px_26px_rgba(70,38,120,0.10)] transition duration-300 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(70,38,120,0.16)]"
                  >
                    <Link
                      to="/articles"
                      aria-label={`Read ${articleTitle}`}
                      className="relative block h-[220px] w-full shrink-0 overflow-hidden bg-gradient-to-br from-violet-100 to-fuchsia-100 sm:h-[240px]"
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={articleTitle}
                          loading="lazy"
                          className="absolute inset-0 block h-full min-h-full w-full min-w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-violet-400">
                          <BookOpen size={44} strokeWidth={1.5} aria-hidden="true" />
                        </div>
                      )}
                      <span className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 to-violet-800 px-3.5 py-2 text-xs font-bold text-white shadow-lg">
                        <Sparkles size={14} aria-hidden="true" />
                        {category}
                      </span>
                      <span className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-slate-700 shadow-sm backdrop-blur">
                        <Clock3 size={14} className="text-violet-700" aria-hidden="true" />
                        {readTime} min read
                      </span>
                    </Link>

                    <div className="flex flex-1 flex-col p-4 sm:p-5">
                      <h3 className="line-clamp-2 min-h-[3.5rem] text-lg font-extrabold leading-snug tracking-tight text-slate-950 sm:text-xl">
                        <Link to="/articles" className="transition hover:text-violet-800">{articleTitle}</Link>
                      </h3>
                      <p className="mt-2 line-clamp-2 min-h-12 text-sm leading-6 text-slate-600">
                        {article.description || "Explore this article for more tips and information."}
                      </p>

                      <div className="mt-4 flex items-center justify-between gap-2 border-t border-violet-50 pt-3">
                        <span className="inline-flex min-w-0 items-center gap-2 truncate text-[11px] font-bold text-slate-700 sm:text-xs">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-800">
                            <BookOpen size={14} aria-hidden="true" />
                          </span>
                          Our Tech Team
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-slate-500 sm:text-xs">
                          {articleDate && (
                            <>
                              <CalendarDays size={14} aria-hidden="true" />
                              {articleDate}
                            </>
                          )}
                        </span>
                        <Link
                          to="/articles"
                          aria-label={`View ${articleTitle}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white"
                        >
                          <ArrowRight size={20} aria-hidden="true" />
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="mt-7 rounded-[24px] border border-dashed border-violet-200 bg-white/80 px-5 py-12 text-center">
              <Search size={30} className="mx-auto text-violet-400" aria-hidden="true" />
              <h3 className="mt-3 text-lg font-bold text-slate-900">No articles found</h3>
              <p className="mt-1 text-sm text-slate-600">Try another search or choose a different category.</p>
            </div>
          )}
        </div>
      </PageContainer>
    </section>
  );
}

export default HomeArticles;
