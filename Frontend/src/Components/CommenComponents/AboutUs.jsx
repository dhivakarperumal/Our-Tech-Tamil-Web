import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Box,
  ChevronDown,
  Eye,
  Headphones,
  HeartHandshake,
  Laptop,
  Leaf,
  PackageCheck,
  Rocket,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  UsersRound,
  Watch,
  Zap,
} from "lucide-react";
import api from "../../api";
import PageContainer from "./PageContainer";

const milestones = [
  { year: "2020", title: "The Beginning", detail: "Launched with a vision to make great technology more accessible.", Icon: Rocket },
  { year: "2021", title: "Expanded Catalog", detail: "Added a wider range of gadgets and accessories.", Icon: Box },
  { year: "2022", title: "Experience Store", detail: "Opened our first experience store.", Icon: Star },
  { year: "2023", title: "Growing Community", detail: "Welcomed more customers into the OurTech community.", Icon: UsersRound },
  { year: "2025", title: "Bigger & Better", detail: "Continuing to expand with more products and better service.", Icon: BadgeCheck },
];

const values = [
  { title: "Innovation", detail: "Bringing the latest tech to you.", Icon: Zap },
  { title: "Trust", detail: "Genuine products with reliable service.", Icon: ShieldCheck },
  { title: "Customer First", detail: "Your satisfaction is our priority.", Icon: HeartHandshake },
  { title: "Sustainability", detail: "Promoting thoughtful choices.", Icon: Leaf },
  { title: "Integrity", detail: "Honest, fair and long-term relationships.", Icon: BadgeCheck },
];

const categoryIcons = [Smartphone, Laptop, Headphones, ShoppingBag, Watch];

function getCategoryImage(images) {
  let parsed = images;
  if (typeof images === "string") {
    try {
      parsed = JSON.parse(images);
    } catch {
      parsed = images;
    }
  }
  const image = Array.isArray(parsed) ? parsed[0] : parsed;
  if (typeof image !== "string" || !image) return "";
  if (/^(https?:|data:|blob:)/i.test(image)) return image;

  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function AboutUs() {
  const [categories, setCategories] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [openReview, setOpenReview] = useState(null);
  const [categoryFailed, setCategoryFailed] = useState(false);
  const [reviewsFailed, setReviewsFailed] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);

  useEffect(() => {
    let active = true;
    api.get("/categories")
      .then(({ data }) => {
        if (active) {
          setCategories(
            (Array.isArray(data) ? data : [])
              .filter((category) => (category.status || "Active") === "Active")
              .slice(0, 5),
          );
        }
      })
      .catch((error) => {
        console.error("Failed to fetch About page categories:", error);
        if (active) setCategoryFailed(true);
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    api.get("/reviews/public")
      .then(({ data }) => {
        if (active) setReviews(Array.isArray(data?.reviews) ? data.reviews : []);
      })
      .catch((error) => {
        console.error("Failed to fetch About page reviews:", error);
        if (active) setReviewsFailed(true);
      })
      .finally(() => {
        if (active) setLoadingReviews(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const averageRating = reviews.length
    ? reviews.reduce((sum, review) => sum + (Number(review.rating) || 0), 0) / reviews.length
    : null;

  return (
    <main className="overflow-hidden bg-[#fbf9ff] pb-10">
      <PageContainer className="!px-4 sm:!px-6 lg:!px-[3%]">
        <section aria-labelledby="about-story-heading" className="grid items-center gap-5 pt-5 sm:pt-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div className="order-2 space-y-3 lg:order-1">
            <p className="flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-5 bg-primary" aria-hidden="true" /> Our Story
            </p>
            <h1 id="about-story-heading" className="text-2xl font-black leading-tight tracking-tight text-[#17123b] sm:text-[28px]">
              More Than Just a Store
            </h1>
            <p className="max-w-xl text-xs leading-5 text-[#5b566b] sm:text-sm sm:leading-6">
              OurTech started with a simple goal — to make the latest technology accessible to everyone. What began as a small passion project has now grown into a trusted online store for thousands of happy customers across India.
            </p>
            <p className="max-w-xl text-xs leading-5 text-[#5b566b] sm:text-sm sm:leading-6">
              We bring together the best brands, genuine products, competitive prices and a seamless shopping experience — all in one place.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4b00c8] to-[#a000d8] px-4 py-2 text-[11px] font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              Our Journey <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl border border-[#eee2f9] bg-[#200745] [filter:drop-shadow(0_0_9px_rgba(54,22,93,0.3))] lg:rounded-l-none lg:rounded-r-2xl lg:border-l-0 lg:[clip-path:polygon(5%_0,100%_0,100%_96%,98%_100%,0_100%)]">
              <img src="/images/loginbanner.png" alt="OurTech collection of laptops, phones, headphones and smart devices" className="aspect-[2.15/1] w-full object-cover object-[62%_center]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#210747]/35 via-transparent to-transparent" aria-hidden="true" />
            </div>
            <div className="absolute -bottom-2 right-2.5 z-10 flex items-center gap-2 rounded-xl border border-white/90 bg-white px-2.5 py-2 shadow-[0_10px_24px_rgba(54,22,93,0.24)] sm:-bottom-2.5 sm:right-3 sm:gap-2.5 sm:px-3 sm:py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f0e2ff] text-primary sm:h-9 sm:w-9">
                <PackageCheck size={19} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-[9px] font-semibold text-[#514a61]">Trusted by</span>
                <span className="block text-xs font-black leading-tight text-primary sm:text-sm">50,000+</span>
                <span className="block text-[9px] text-[#615a70]">Happy Customers</span>
              </span>
            </div>
          </div>
        </section>

        <section aria-label="OurTech at a glance" className="mt-5 grid grid-cols-2 divide-x divide-y divide-[#d9c7ee] overflow-hidden rounded-2xl border border-[#eee2f9] bg-[#f4efff] sm:grid-cols-4 sm:divide-y-0">
          {[
            { value: "50,000+", label: "Happy Customers", Icon: UsersRound },
            { value: "10,000+", label: "Products", Icon: Box },
            { value: "100+", label: "Top Brands", Icon: BadgeCheck },
            { value: averageRating ? `${averageRating.toFixed(1)} / 5` : "—", label: "Customer Rating", Icon: Star },
          ].map(({ value, label, Icon }) => (
            <div key={label} className="flex items-center justify-center gap-3 px-2 py-3 sm:py-4">
              <Icon size={25} strokeWidth={1.8} className="shrink-0 text-primary sm:h-7 sm:w-7" aria-hidden="true" />
              <span><span className="block text-sm font-black text-primary sm:text-base">{value}</span><span className="block text-[9px] text-[#615a70] sm:text-[10px]">{label}</span></span>
            </div>
          ))}
        </section>

        <section aria-label="Our mission and vision" className="mt-4 grid overflow-hidden rounded-2xl border border-[#eee2f9] shadow-sm md:grid-cols-2">
          <article className="relative isolate overflow-hidden bg-gradient-to-br from-[#21064b] via-[#3c0871] to-[#170333] p-5 text-white sm:p-7">
            <div className="absolute -right-8 -top-10 -z-10 h-40 w-40 rounded-full border-[24px] border-white/5" aria-hidden="true" />
            <Target size={27} className="mb-3 text-fuchsia-300" aria-hidden="true" />
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-fuchsia-200">Driven by purpose</p>
            <h2 className="mt-1 text-lg font-extrabold">Our Mission</h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-white/80">
              To make the latest technology easily accessible by bringing together genuine products, thoughtful recommendations and dependable customer service.
            </p>
            <Link to="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-fuchsia-600 to-violet-600 px-3.5 py-2 text-[10px] font-bold text-white transition hover:brightness-110">
              Explore Our Products <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </article>
          <article className="relative isolate overflow-hidden bg-gradient-to-br from-[#f2e7ff] via-[#fff] to-[#f7f0ff] p-5 sm:p-7">
            <div className="absolute -bottom-12 -right-8 -z-10 h-40 w-40 rounded-full bg-fuchsia-100/70 blur-2xl" aria-hidden="true" />
            <Eye size={27} className="mb-3 text-primary" aria-hidden="true" />
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">A brighter tomorrow</p>
            <h2 className="mt-1 text-lg font-extrabold text-[#17123b]">Our Vision</h2>
            <p className="mt-2 max-w-md text-xs leading-5 text-[#5b566b]">
              To be a trusted technology destination, helping more people discover useful innovation and enjoy a confident, seamless shopping experience.
            </p>
          </article>
        </section>

        <section aria-labelledby="values-heading" className="mt-6 grid items-stretch gap-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="flex flex-col justify-center py-1">
            <p className="flex items-center gap-2 text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary"><span className="h-px w-5 bg-primary" aria-hidden="true" /> Our Core Values</p>
            <h2 id="values-heading" className="mt-1 text-xl font-black text-[#17123b]">What Drives Us</h2>
            <p className="mt-2 max-w-sm text-xs leading-5 text-[#5b566b]">Our values guide everything we do — from the products we select to the support we provide.</p>
            <Link to="/contactus" className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4b00c8] to-[#a000d8] px-4 py-2 text-[10px] font-bold text-white transition hover:shadow-md">
              Learn More <ArrowRight size={13} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {values.map(({ title, detail, Icon }) => (
              <article key={title} className="flex items-start gap-2.5 rounded-xl border border-[#eee6f6] bg-white p-3 shadow-sm">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f2e8ff] text-primary"><Icon size={17} aria-hidden="true" /></span>
                <span><h3 className="text-[11px] font-extrabold text-[#211936]">{title}</h3><p className="mt-0.5 text-[9px] leading-4 text-[#625b70]">{detail}</p></span>
              </article>
            ))}
          </div>
        </section>

        <section aria-labelledby="journey-heading" className="relative mt-7 overflow-hidden rounded-2xl border border-[#eee3f8] bg-gradient-to-r from-[#faf6ff] via-white to-[#f3eaff] px-4 py-5 sm:px-6 sm:py-6">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-violet-100/60 blur-3xl" aria-hidden="true" />
          <div className="relative mb-5 text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">— Our Journey —</p>
            <h2 id="journey-heading" className="mt-1 text-lg font-black text-[#17123b] sm:text-xl">A Journey of Growth &amp; Innovation</h2>
            <p className="mt-1 text-[10px] text-[#625b70]">A quick look at how OurTech has grown over the years.</p>
          </div>
          <div className="relative grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-5 sm:gap-3">
            <div className="absolute left-[10%] right-[10%] top-5 hidden h-px bg-gradient-to-r from-fuchsia-400 via-primary to-fuchsia-400 sm:block" aria-hidden="true" />
            {milestones.map(({ year, title, detail, Icon }) => (
              <article key={year} className="relative flex flex-col items-center text-center">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-[0_2px_12px_rgba(75,0,200,0.15)] ring-1 ring-[#eaddf7]"><Icon size={18} aria-hidden="true" /></span>
                <p className="mt-1.5 text-xs font-black text-primary">{year}</p>
                <h3 className="mt-0.5 text-[10px] font-extrabold text-[#211936]">{title}</h3>
                <p className="mt-1 max-w-[150px] text-[9px] leading-4 text-[#625b70]">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-label="Shop categories and our promise" className="mt-5 grid gap-3 lg:grid-cols-[2.4fr_1fr]">
          <div className="grid overflow-hidden rounded-2xl border border-[#eee3f8] bg-[#f4eaff] sm:grid-cols-[0.9fr_2.6fr]">
            <div className="flex flex-col justify-center p-4 sm:p-5">
              <h2 className="text-base font-black leading-tight text-[#211936]">Explore Our Top Categories</h2>
              <p className="mt-1.5 text-[10px] leading-4 text-[#625b70]">Discover the latest in tech, from everyday essentials to your next big upgrade.</p>
              <Link to="/shop" className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4b00c8] to-[#a000d8] px-3.5 py-2 text-[10px] font-bold text-white">
                Shop Now <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
              {loadingCategories ? (
                Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-white/70" />)
              ) : categoryFailed ? (
                <p className="col-span-full self-center text-center text-xs text-[#625b70]">Categories could not be loaded. Please try again later.</p>
              ) : categories.length ? categories.map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];
                const image = getCategoryImage(category.images);
                return (
                  <Link key={category.catId || category.id || category.name} to={`/shop?category=${encodeURIComponent(category.name)}`} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#eee6f6] bg-white px-2 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="flex h-12 w-full items-center justify-center">
                      {image ? <img src={image} alt="" loading="lazy" className="h-full max-w-full object-contain" /> : <Icon size={31} className="text-primary" aria-hidden="true" />}
                    </span>
                    <span className="max-w-full truncate text-[10px] font-bold text-[#211936] group-hover:text-primary">{category.name}</span>
                  </Link>
                );
              }) : (
                <p className="col-span-full self-center text-center text-xs text-[#625b70]">No categories are available right now.</p>
              )}
            </div>
          </div>
          <aside className="relative isolate flex min-h-40 flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#200644] via-[#5100a8] to-[#9300cf] p-5 text-white">
            <div className="absolute -bottom-8 -right-5 -z-10 text-white/10"><ShieldCheck size={128} strokeWidth={1} aria-hidden="true" /></div>
            <h2 className="text-base font-extrabold">Why Shop with OurTech?</h2>
            <ul className="mt-3 space-y-2 text-[10px] font-medium text-white/90">
              <li className="flex items-center gap-2"><PackageCheck size={14} className="text-fuchsia-200" aria-hidden="true" /> Fast &amp; secure delivery</li>
              <li className="flex items-center gap-2"><BadgeCheck size={14} className="text-fuchsia-200" aria-hidden="true" /> Genuine products</li>
              <li className="flex items-center gap-2"><ArrowRight size={14} className="text-fuchsia-200" aria-hidden="true" /> Easy returns</li>
              <li className="flex items-center gap-2"><Headphones size={14} className="text-fuchsia-200" aria-hidden="true" /> Dedicated support</li>
            </ul>
          </aside>
        </section>

        <section aria-labelledby="customer-stories-heading" className="mt-7">
          <div className="mb-3 text-center">
            <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-primary">— Our Customers&apos; Stories —</p>
            <h2 id="customer-stories-heading" className="mt-1 text-xl font-black text-[#17123b]">What Our Customers Say</h2>
          </div>
          {loadingReviews ? (
            <div className="grid gap-3 sm:grid-cols-3" aria-label="Loading customer stories">
              {Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-[#f3eaff]" />)}
            </div>
          ) : reviewsFailed ? (
            <p className="rounded-xl border border-[#eee3f8] bg-white px-4 py-5 text-center text-xs text-[#625b70]">Customer stories could not be loaded. Please try again later.</p>
          ) : reviews.length ? (
            <div className="grid gap-3 sm:grid-cols-3">
              {reviews.slice(0, 3).map((review) => {
                const isOpen = openReview === review.id;
                return (
                  <article key={review.id} className="rounded-xl border border-[#e8d8f6] bg-white p-3 shadow-sm sm:p-4">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-[10px] font-extrabold text-[#211936]">{review.user_name || "OurTech Customer"} <BadgeCheck size={12} className="inline text-primary" aria-label="Published review" /></p>
                      <div className="flex shrink-0 items-center gap-0.5 text-amber-500" aria-label={`${review.rating} out of 5 stars`}>
                        {Array.from({ length: 5 }, (_, index) => <Star key={index} size={11} className={index < Math.round(Number(review.rating) || 0) ? "fill-amber-400 text-amber-400" : "text-amber-200"} aria-hidden="true" />)}
                      </div>
                    </div>
                    {review.product_name && <p className="mt-1 text-[9px] font-semibold text-primary">{review.product_name}</p>}
                    <p className={`mt-2 whitespace-pre-line text-[10px] leading-4 text-[#514b5d] ${isOpen ? "" : "line-clamp-3"}`}>{review.comment}</p>
                    {(review.comment || "").length > 120 && (
                      <button type="button" onClick={() => setOpenReview(isOpen ? null : review.id)} className="mt-1 inline-flex items-center gap-1 text-[9px] font-bold text-primary">
                        {isOpen ? "Show less" : "Read more"} <ChevronDown size={11} className={isOpen ? "rotate-180" : ""} aria-hidden="true" />
                      </button>
                    )}
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="rounded-xl border border-[#eee3f8] bg-white px-4 py-5 text-center text-xs text-[#625b70]">Customer stories will appear here as reviews are published.</p>
          )}
        </section>

        <section aria-label="Shop with OurTech" className="relative isolate mt-6 flex min-h-36 items-center overflow-hidden rounded-2xl bg-[#1d0645] px-5 py-6 text-white sm:min-h-40 sm:px-8">
          <img src="/images/pageheader.png" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#220747]/95 via-[#360575]/90 to-[#360575]/35" aria-hidden="true" />
          <div className="max-w-lg">
            <h2 className="text-xl font-black sm:text-2xl">Be a Part of <span className="text-fuchsia-300">OurTech Family</span></h2>
            <p className="mt-1.5 max-w-md text-[10px] leading-5 text-white/85 sm:text-xs">Explore the latest gadgets, discover helpful technology and find what fits your everyday life.</p>
          </div>
          <Link to="/shop" className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-[10px] font-extrabold text-primary shadow-lg transition hover:-translate-y-0.5 sm:px-5">
            Shop Now <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>
      </PageContainer>
    </main>
  );
}

export default AboutUs;
