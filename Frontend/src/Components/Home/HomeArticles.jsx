import { useEffect, useState } from "react";
import { ArrowRight, BookOpen, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

function getImageUrl(image) {
  if (!image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function HomeArticles() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/articles")
      .then(({ data }) => {
        if (active) setArticles(Array.isArray(data.articles) ? data.articles : []);
      })
      .catch((error) => {
        console.error("Failed to load homepage articles:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  if (!loading && articles.length === 0) return null;

  return (
    <section aria-labelledby="home-articles-title" className="bg-[#faf8fc] py-8 sm:py-12">
      <PageContainer>
        <div className="mb-5 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">Tech Knowledge Hub</p>
            <h2 id="home-articles-title" className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
              All Articles
            </h2>
          </div>
          <Link
            to="/articles"
            className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-violet-700 transition hover:text-violet-900"
          >
            View all <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? [1, 2, 3, 4].map((item) => (
            <div key={item} className="animate-pulse overflow-hidden rounded-2xl border border-violet-100 bg-white p-3">
              <div className="aspect-[4/3] rounded-xl bg-violet-50" />
              <div className="mt-4 h-4 rounded bg-violet-50" />
              <div className="mt-2 h-4 w-2/3 rounded bg-violet-50" />
            </div>
          )) : articles.map((article) => {
            const image = getImageUrl(article.image_url);
            const links = Array.isArray(article.buy_links) ? article.buy_links.filter((link) => link?.url) : [];
            return (
              <article key={article.id || article.content_id} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-[#e9def5] bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                {image ? (
                  <img src={image} alt={article.title} loading="lazy" className="aspect-[4/3] w-full bg-[#f3eaff] object-cover" />
                ) : (
                  <div className="flex aspect-[4/3] items-center justify-center bg-[#f3eaff] text-violet-400">
                    <BookOpen size={42} aria-hidden="true" />
                  </div>
                )}
                <div className="flex flex-1 flex-col p-4">
                  <span className="w-fit rounded-full bg-[#f0e7ff] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary">
                    Article
                  </span>
                  <h3 className="mt-2 line-clamp-2 text-base font-extrabold leading-snug text-slate-900">{article.title}</h3>
                  {article.description && <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{article.description}</p>}
                  {links.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {links.map((link, index) => (
                        <a
                          key={`${link.url}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-3 py-1.5 text-xs font-bold text-primary transition hover:bg-primary hover:text-white"
                        >
                          {link.name || "Read More"}
                          <ExternalLink size={12} aria-hidden="true" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
}

export default HomeArticles;
