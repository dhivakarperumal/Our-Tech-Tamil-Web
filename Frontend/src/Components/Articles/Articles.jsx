import { useMemo, useState } from "react";
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
import PageContainer from "../CommenComponents/PageContainer";

const mockContent = [
  {
    id: 1,
    type: "article",
    category: "ARTICLE",
    title: "Top 10 Laptops for Work and Study in 2026",
    description:
      "A detailed guide to the best laptops for professionals and students, with performance features and price comparisons.",
    date: "Oct 20, 2026",
    views: "2.4K Views",
    button: "Read Full Article",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 2,
    type: "product_review",
    category: "PRODUCT REVIEW",
    title: "Sony WH-1000XM5 Headphones Review",
    description:
      "A complete review of Sony’s flagship noise-cancelling headphones, covering sound, battery life and real-world performance.",
    rating: 4.8,
    date: "Oct 18, 2026",
    views: "3.1K Views",
    button: "Read Review",
    image:
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=900&q=80",
    features: [
      { label: "Battery", value: "30 Hrs" },
      { label: "Noise Cancel", value: "Yes" },
      { label: "Weight", value: "250 g" },
    ],
  },
  {
    id: 3,
    type: "article",
    category: "ARTICLE",
    title: "Smartphone Buying Guide: Things to Check Before You Buy",
    description:
      "Confused about which smartphone to buy? Here’s a simple guide covering the key features, specs, and tips.",
    date: "Oct 15, 2026",
    views: "4.7K Views",
    button: "Read Full Article",
    image:
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: 4,
    type: "product_review",
    category: "PRODUCT REVIEW",
    title: "boAt Wave Connect Smartwatch Review",
    description:
      "A budget-friendly smartwatch with great features for fitness and daily use. Here’s our detailed review.",
    rating: 4.6,
    date: "Oct 12, 2026",
    views: "1.9K Views",
    button: "Read Review",
    image:
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&w=900&q=80",
    features: [
      { label: "Health Tracking", value: "Yes" },
      { label: "Water", value: "IP67" },
      { label: "Battery", value: "7 Days" },
    ],
  },
];

const tabs = [
  { value: "all", label: "All Content" },
  { value: "article", label: "Articles" },
  { value: "product_review", label: "Product Reviews" },
];

const highlightCards = [
  {
    icon: BookOpenText,
    title: "Expert Articles",
    subtitle: "Guides, tips & tech insights",
  },
  {
    icon: Sparkles,
    title: "Honest Reviews",
    subtitle: "Real product experience",
  },
  {
    icon: ShieldCheck,
    title: "Compare & Choose",
    subtitle: "Find the best for your needs",
  },
  {
    icon: Bell,
    title: "Stay Updated",
    subtitle: "Latest tech trends & launches",
  },
];

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
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

  const filteredContent = useMemo(() => {
    const query = search.trim().toLowerCase();

    return mockContent.filter((item) => {
      const matchesTab = tab === "all" || item.type === tab;
      if (!matchesTab) return false;
      if (!query) return true;

      const searchable = [item.title, item.description, item.category].join(" ").toLowerCase();
      return searchable.includes(query);
    });
  }, [search, tab]);

  return (
    <main className="bg-[#f7f3fb] pb-14">
      <PageContainer>
        <section className="pt-6 sm:pt-8">
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#3d007d] via-[#6f1dc8] to-[#b84de2] px-6 py-7 shadow-[0_18px_60px_rgba(87,27,146,0.25)] sm:px-8 sm:py-9 lg:px-10 lg:py-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_32%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_28%)]" />
            <div className="absolute -right-12 top-0 h-72 w-72 rounded-full bg-[#d7b7ff]/20 blur-3xl" />
            <div className="absolute -left-10 bottom-0 h-52 w-52 rounded-full bg-[#f7e7ff]/10 blur-3xl" />

            <div className="relative grid items-center gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="max-w-[620px] text-white">
                <div className="mb-3 flex items-center gap-2 text-[11px] font-medium text-purple-100">
                  <span>Home</span>
                  <span className="opacity-70">&gt;</span>
                  <span>Articles &amp; Reviews</span>
                </div>
                <h1 className="text-4xl font-extrabold leading-[0.96] tracking-[-0.04em] sm:text-5xl lg:text-[4.1rem]">
                  Articles &amp; Reviews
                </h1>
                <p className="mt-4 max-w-xl text-base text-purple-100 sm:text-lg">
                  In-depth guides, product reviews and tech insights to help you make the right choice.
                </p>
              </div>

              <div className="relative mx-auto w-full max-w-[500px]">
                <div className="absolute left-8 top-10 h-20 w-20 rounded-full bg-[#f8d5ff]/30 blur-2xl" />
                <div className="absolute bottom-0 right-0 h-24 w-24 rounded-full bg-[#ffffff]/20 blur-2xl" />
                <img
                  src="https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=1200&q=80"
                  alt="Laptop and tech accessories"
                  className="relative h-[230px] w-full rounded-[26px] object-cover shadow-[0_25px_80px_rgba(19,6,38,0.35)] sm:h-[280px]"
                />
              </div>
            </div>
          </div>

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
                  className={`rounded-[12px] px-5 py-2 text-sm font-semibold transition ${
                    tab === value
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

          <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filteredContent.map((item) => (
              <article
                key={item.id}
                className="flex min-h-[480px] flex-col overflow-hidden rounded-[22px] border border-[#e9def5] bg-white shadow-[0_10px_24px_rgba(92,54,150,0.07)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(92,54,150,0.12)]"
              >
                <div className="relative h-[212px] overflow-hidden bg-[#f0e7ff]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover transition duration-300 hover:scale-[1.03]"
                  />
                  {item.type === "product_review" && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5a2db3] shadow-sm">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      Product Review
                    </div>
                  )}
                  {item.type === "article" && (
                    <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5a2db3] shadow-sm">
                      <BookOpenText size={12} />
                      Article
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col p-4 sm:p-5">
                  <div className="mb-2 flex items-center justify-between gap-2">
                    {item.type === "product_review" ? (
                      <div className="inline-flex items-center gap-2 rounded-full bg-[#fff4d8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#ae6a00]">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {item.category}
                      </div>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#f0e7ff] px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-[#5a2db3]">
                        {item.category}
                      </span>
                    )}

                    {item.type === "product_review" && (
                      <div className="inline-flex items-center gap-1 rounded-full bg-[#f6f1ff] px-2 py-1 text-[11px] font-bold text-[#6d2ad5]">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        {item.rating.toFixed(1)}
                      </div>
                    )}
                  </div>

                  <h3 className="text-[1.02rem] font-extrabold leading-tight text-[#1f1a2d] sm:text-[1.08rem]">
                    {item.title}
                  </h3>

                  {item.type === "product_review" && item.features && (
                    <div className="mt-3 flex items-center gap-2">
                      <StarRating value={item.rating} />
                    </div>
                  )}

                  <p className="mt-3 flex-1 text-sm leading-6 text-[#5d5a6d]">
                    {item.description}
                  </p>

                  {item.type === "product_review" && item.features && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {item.features.map((feature) => (
                        <div key={feature.label} className="rounded-xl bg-[#f7f2ff] px-2 py-2 text-center">
                          <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#716b83]">
                            {feature.label}
                          </div>
                          <div className="mt-1 text-xs font-bold text-[#1f1a2d]">{feature.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 flex items-center justify-between gap-3 text-xs text-[#5d5a6d]">
                    <span className="inline-flex items-center gap-2">
                      <span className="inline-block h-3.5 w-3.5 rounded-full border border-[#c6b7ee] bg-[#f0e7ff]" />
                      {item.date}
                    </span>
                    <span>{item.views}</span>
                  </div>

                  <button
                    type="button"
                    className={`mt-5 inline-flex items-center justify-center gap-2 rounded-[14px] border px-4 py-3 text-sm font-bold transition ${
                      item.type === "product_review"
                        ? "border-[#6d2ad5] bg-[#6d2ad5] text-white hover:bg-[#5d1fc0]"
                        : "border-[#7d4ae4] bg-white text-[#6d2ad5] hover:bg-[#f4ebff]"
                    }`}
                  >
                    {item.button}
                    <ArrowRight size={15} />
                  </button>
                </div>
              </article>
            ))}
          </div>

          {filteredContent.length === 0 && (
            <div className="mt-12 rounded-[22px] border border-dashed border-[#d8c8f0] bg-white px-6 py-12 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#f0e7ff] text-[#5a2db3]">
                <Search size={28} />
              </div>
              <h4 className="mt-4 text-xl font-bold text-[#1d1830]">No results found</h4>
              <p className="mt-2 text-sm text-[#5d5a6d]">Try another keyword or switch the content category.</p>
            </div>
          )}
        </section>
      </PageContainer>
    </main>
  );
}

export default Articles;