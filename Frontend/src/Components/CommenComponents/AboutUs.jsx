import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Award,
  BadgeCheck,
  Box,
  CalendarDays,
  Eye,
  Flag,
  Headphones,
  HeartHandshake,
  Laptop,
  Leaf,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Star,
  Target,
  Trophy,
  UsersRound,
  Watch,
  Zap,
} from "lucide-react";
import api from "../../api";
import HomeReviews from "../Home/HomeReviews";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

const milestones = [
  { year: "2020", title: "The Beginning", detail: "Launched OurTech with a vision to make tech more accessible.", Icon: Flag },
  { year: "2021", title: "Expanded Catalog", detail: "Added a wider range of gadgets and accessories.", Icon: Box },
  { year: "2022", title: "Experience Store", detail: "Opened our first experience store for hands-on tech.", Icon: CalendarDays },
  { year: "2023", title: "Growing Community", detail: "Reached 25,000+ happy customers across India.", Icon: UsersRound },
  { year: "2024", title: "Trusted by More", detail: "Crossed 50,000+ customers with 100+ leading brands.", Icon: Trophy },
  { year: "2025", title: "Bigger & Better", detail: "Continuing to expand with more products, services and innovations.", Icon: Award },
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
      <PageHeader title="About Us" />
      <PageContainer className="!px-4 sm:!px-6 lg:!px-[3%]">
        <section aria-labelledby="about-story-heading" className="grid items-center gap-5 pt-5 sm:pt-7 lg:grid-cols-[0.8fr_1.2fr] lg:gap-8">
          <div className="order-2 space-y-3 lg:order-1">
            <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.18em] text-primary">
              <span className="h-px w-5 bg-primary" aria-hidden="true" /> Our Story
            </p>
            <h1 id="about-story-heading" className="text-2xl font-black leading-tight tracking-tight text-[#17123b] sm:text-[28px]">
              More Than Just a Store
            </h1>
            <p className="max-w-xl text-justify text-sm leading-6 text-[#5b566b]">
              OurTech started with a simple goal — to make the latest technology accessible to everyone. What began as a small passion project has now grown into a trusted online store for thousands of happy customers across India.
            </p>
            <p className="max-w-xl text-justify text-sm leading-6 text-[#5b566b]">
              We bring together the best brands, genuine products, competitive prices and a seamless shopping experience — all in one place.
            </p>
            <Link to="/shop" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#4b00c8] to-[#a000d8] px-4 py-2 text-sm font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg">
              Our Journey <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="relative order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-2xl border-2 border-[#cdb6e8] bg-[#200745] [filter:drop-shadow(0_0_2px_rgba(255,255,255,0.95))_drop-shadow(0_3px_9px_rgba(54,22,93,0.2))] lg:rounded-l-none lg:rounded-r-2xl lg:[clip-path:polygon(5%_0,100%_0,100%_96%,98%_100%,0_100%)]">
              <img src="/images/loginbanner.png" alt="OurTech collection of laptops, phones, headphones and smart devices" className="aspect-[2.15/1] w-full object-cover object-[62%_center]" />
              <div className="absolute inset-0 bg-gradient-to-r from-[#210747]/35 via-transparent to-transparent" aria-hidden="true" />
              <svg
                viewBox="0 0 1000 465"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
                aria-hidden="true"
              >
                <path
                  d="M52 2 H968 Q998 2 998 32 V433 Q998 463 968 463 H2 Z"
                  fill="none"
                  stroke="#cdb6e8"
                  strokeWidth="8"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="absolute -bottom-3 right-2 z-10 flex min-w-40 items-center gap-3 rounded-xl border border-white/90 bg-white px-3 py-2.5 shadow-[0_10px_24px_rgba(54,22,93,0.24)] sm:-bottom-3.5 sm:right-3 sm:min-w-48 sm:gap-3.5 sm:px-4 sm:py-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f0e2ff] text-primary sm:h-11 sm:w-11">
                <PackageCheck size={22} aria-hidden="true" />
              </span>
              <span>
                <span className="block text-sm font-semibold text-[#514a61]">Trusted by</span>
                <span className="block text-sm font-black leading-tight text-primary sm:text-base">50,000+</span>
                <span className="block text-sm text-[#615a70]">Happy Customers</span>
              </span>
            </div>
          </div>
        </section>

        <section aria-labelledby="values-heading" className="mt-10 grid items-stretch gap-3 sm:mt-12 lg:grid-cols-[1fr_1.7fr_0.85fr] lg:gap-4">
          <div className="flex flex-col justify-center py-1 lg:pr-2">
            <p className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-[0.16em] text-primary"><span className="h-px w-5 bg-primary" aria-hidden="true" /> Our Core Values</p>
            <h2 id="values-heading" className="mt-1 text-2xl font-black leading-tight text-[#17123b] sm:text-3xl">What Drives Us</h2>
            <p className="mt-2 max-w-sm text-justify text-sm leading-6 text-[#5b566b]">
              Our values guide everything we do — from the products we select to the support we provide. They shape how we bring genuine technology to our customers, create a dependable shopping experience and offer helpful guidance at every step. We believe great technology should be accessible, reliable and useful in everyday life.
            </p>
            <Link to="/contactus" className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4b00c8] to-[#a000d8] px-4 py-2.5 text-sm font-bold text-white transition hover:shadow-md">
              Learn More <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
          <div className="grid content-center gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map(({ title, detail, Icon }) => (
              <article key={title} className="group min-h-[116px] rounded-2xl border border-[#e9def5] bg-gradient-to-br from-white via-[#fcfaff] to-[#f2eaff] p-3.5 shadow-[0_3px_12px_rgba(54,22,93,0.06)] transition duration-200 hover:-translate-y-1 hover:border-[#d3b8f1] hover:shadow-[0_10px_22px_rgba(75,0,200,0.12)] sm:min-h-[126px] sm:p-4">
                <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-[#eadbff] text-primary shadow-sm transition-colors group-hover:bg-primary group-hover:text-white sm:h-11 sm:w-11">
                  <Icon size={22} strokeWidth={2} aria-hidden="true" />
                </span>
                <h3 className="text-sm font-extrabold text-[#28134d]">{title}</h3>
                <p className="mt-1 text-sm leading-5 text-[#625b70]">{detail}</p>
              </article>
            ))}
          </div>
          <aside aria-label="Better tech, better life" className="relative isolate min-h-[190px] overflow-hidden rounded-2xl bg-[#31065f] shadow-[0_8px_24px_rgba(54,22,93,0.16)] sm:min-h-[220px] lg:min-h-0">
            <img src="/images/loginbanner.png" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[82%_center]" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#370768]/45 via-[#3b0872]/55 to-[#32065f]/80" aria-hidden="true" />
            <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-[#3b0872]/50 to-transparent" aria-hidden="true" />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-right text-white drop-shadow-lg sm:right-6">
              <p className="text-xl font-black leading-[1.05] tracking-tight sm:text-2xl">Better<br />Tech<br />Better<br />Life</p>
              <span className="ml-auto mt-2 block h-0.5 w-10 rounded-full bg-fuchsia-300" aria-hidden="true" />
            </div>
          </aside>
        </section>


        <section aria-label="Our mission and vision" className="relative mt-10 overflow-hidden rounded-2xl border border-[#e6d9f4] bg-gradient-to-br from-[#f5edff] via-white to-[#f7f1ff] shadow-sm sm:mt-12 md:grid md:min-h-[270px] md:grid-cols-2">
          <article className="relative isolate z-10 flex items-start gap-4 overflow-hidden bg-gradient-to-br from-[#21064b] via-[#3c0871] to-[#170333] px-5 py-6 text-white sm:px-7 md:col-start-1 md:row-start-1 md:min-h-[270px] md:w-[112%] md:gap-4 md:py-8 md:pr-[19%] md:[clip-path:polygon(0_0,78%_0,100%_100%,0_100%)]">
            <div className="absolute -left-12 -bottom-16 -z-10 h-44 w-44 rounded-full border-[25px] border-white/5" aria-hidden="true" />
            <span className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/10 text-fuchsia-200 ring-1 ring-white/10 sm:h-14 sm:w-14">
              <Target size={29} aria-hidden="true" />
            </span>
            <div className="max-w-sm">
              <h2 className="text-base font-extrabold sm:text-lg">Our Mission</h2>
              <p className="mt-0.5 text-sm font-bold uppercase tracking-[0.14em] text-fuchsia-200">Driven by purpose</p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                To make the latest technology easily accessible to everyone by offering a wide range of genuine products, competitive prices and exceptional customer service.
              </p>
              <Link to="/shop" className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#9d24ed] to-[#640dd0] px-3.5 py-2 text-sm font-bold text-white shadow-md transition hover:brightness-110">
                Explore Our Products <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
          </article>
          <article className="relative isolate min-h-[210px] overflow-hidden px-5 py-6 sm:px-7 md:col-start-2 md:row-start-1 md:-ml-[12%] md:min-h-[270px] md:pl-[18%] md:pr-5 md:py-8">
            <div className="absolute inset-0 -z-20 bg-gradient-to-br from-[#f2e7ff] via-white to-[#f7f0ff]" aria-hidden="true" />
            <div className="absolute -right-10 -top-10 -z-10 h-44 w-44 rounded-full bg-fuchsia-100/70 blur-3xl" aria-hidden="true" />
            <img src="/images/loginimage.png" alt="" className="pointer-events-none absolute bottom-0 right-0 z-0 h-[88%] w-[47%] object-contain object-bottom opacity-90" />
            <div className="relative z-10 flex items-start gap-3 sm:gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#eadbff] text-primary sm:h-14 sm:w-14">
                <Eye size={29} aria-hidden="true" />
              </span>
              <div className="max-w-[65%]">
                <h2 className="text-base font-extrabold text-[#17123b] sm:text-lg">Our Vision</h2>
                <p className="mt-0.5 text-sm font-bold uppercase tracking-[0.14em] text-primary/70">A brighter tomorrow</p>
                <p className="mt-3 text-sm leading-6 text-[#5b566b]">
                  To be a leading and most trusted tech e-commerce destination, known for innovation, customer satisfaction and long-term value.
                </p>
              </div>
            </div>
            <div className="pointer-events-none absolute right-[39%] top-5 flex gap-2 text-fuchsia-300/70" aria-hidden="true">
              <span className="h-2 w-2 rounded-full bg-current" />
              <span className="mt-3 h-1.5 w-1.5 rounded-full bg-current" />
            </div>
          </article>
        </section>


        <section aria-label="OurTech at a glance" className="mt-10 grid grid-cols-2 divide-x divide-y divide-[#d9c7ee] overflow-hidden rounded-2xl border border-[#eee2f9] bg-[#f4efff] sm:mt-12 sm:grid-cols-4 sm:divide-y-0">
          {[
            { value: "50,000+", label: "Happy Customers", Icon: UsersRound },
            { value: "10,000+", label: "Products", Icon: Box },
            { value: "100+", label: "Top Brands", Icon: BadgeCheck },
            { value: averageRating ? `${averageRating.toFixed(1)} / 5` : "—", label: "Customer Rating", Icon: Star },
          ].map(({ value, label, Icon }) => (
            <div key={label} className="flex items-center justify-center gap-3 px-2 py-5 sm:py-6">
              <Icon size={25} strokeWidth={1.8} className="shrink-0 text-primary sm:h-7 sm:w-7" aria-hidden="true" />
              <span><span className="block text-base font-black text-primary">{value}</span><span className="block text-sm text-[#615a70]">{label}</span></span>
            </div>
          ))}
        </section>



        <section aria-labelledby="journey-heading" className="relative mt-10 overflow-hidden rounded-2xl border border-[#eee3f8] bg-gradient-to-r from-[#faf7ff] via-white to-[#f4efff] px-4 py-5 sm:mt-12 sm:px-6 sm:py-6">
          <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-violet-100/60 blur-3xl" aria-hidden="true" />
          <div className="relative mb-5">
            <h2 id="journey-heading" className="text-lg font-black text-[#17123b]">Our Journey</h2>
            <p className="mt-1 text-sm font-semibold uppercase tracking-[0.08em] text-[#625b70]">
              A quick look at how OurTech has grown over the years.
            </p>
          </div>
          <div className="relative grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-3 lg:grid-cols-6 lg:gap-3">
            {milestones.map(({ year, title, detail, Icon }, index) => (
              <article key={year} className="relative flex min-w-0 flex-col items-center text-center lg:items-start lg:text-left">
                {index < milestones.length - 1 && (
                  <span className="absolute left-[calc(50%+25px)] top-5 hidden h-px w-[calc(100%-50px)] bg-[#d7c2ef] lg:block" aria-hidden="true">
                    <ArrowRight size={13} className="absolute -right-1.5 -top-[6px] text-primary" />
                  </span>
                )}
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#8d13e8] to-[#4b00c8] text-white shadow-[0_4px_12px_rgba(75,0,200,0.2)] ring-4 ring-[#f2eaff] lg:ml-0">
                  <Icon size={18} strokeWidth={2} aria-hidden="true" />
                </span>
                <p className="mt-1.5 text-sm font-black text-primary">{year}</p>
                <h3 className="mt-0.5 text-sm font-extrabold leading-tight text-[#211936]">{title}</h3>
                <p className="mt-1 max-w-[145px] text-sm leading-5 text-[#625b70]">{detail}</p>
              </article>
            ))}
          </div>
        </section>

        <section aria-label="Shop categories and our promise" className="mt-10 grid gap-3 sm:mt-12 lg:grid-cols-[2.4fr_1fr]">
          <div className="grid overflow-hidden rounded-2xl border border-[#eee3f8] bg-[#f4eaff] sm:grid-cols-[0.9fr_2.6fr]">
            <div className="flex flex-col justify-center p-4 sm:p-5">
              <h2 className="text-lg font-black leading-tight text-[#211936]">Explore Our Top Categories</h2>
              <p className="mt-1.5 text-sm leading-5 text-[#625b70]">Discover the latest in tech, from everyday essentials to your next big upgrade.</p>
              <Link to="/shop" className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-gradient-to-r from-[#4b00c8] to-[#a000d8] px-3.5 py-2 text-sm font-bold text-white">
                Shop Now <ArrowRight size={13} aria-hidden="true" />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 lg:grid-cols-5">
              {loadingCategories ? (
                Array.from({ length: 5 }, (_, index) => <div key={index} className="h-24 animate-pulse rounded-xl bg-white/70" />)
              ) : categoryFailed ? (
                <p className="col-span-full self-center text-center text-sm text-[#625b70]">Categories could not be loaded. Please try again later.</p>
              ) : categories.length ? categories.map((category, index) => {
                const Icon = categoryIcons[index % categoryIcons.length];
                const image = getCategoryImage(category.images);
                return (
                  <Link key={category.catId || category.id || category.name} to={`/shop?category=${encodeURIComponent(category.name)}`} className="group flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border border-[#eee6f6] bg-white px-2 py-2 text-center transition hover:-translate-y-0.5 hover:shadow-md">
                    <span className="flex h-12 w-full items-center justify-center">
                      {image ? <img src={image} alt="" loading="lazy" className="h-full max-w-full object-contain" /> : <Icon size={31} className="text-primary" aria-hidden="true" />}
                    </span>
                    <span className="max-w-full truncate text-sm font-bold text-[#211936] group-hover:text-primary">{category.name}</span>
                  </Link>
                );
              }) : (
                <p className="col-span-full self-center text-center text-sm text-[#625b70]">No categories are available right now.</p>
              )}
            </div>
          </div>
          <aside className="relative isolate flex min-h-40 flex-col justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#200644] via-[#5100a8] to-[#9300cf] p-5 text-white">
            <div className="absolute -bottom-8 -right-5 -z-10 text-white/10"><ShieldCheck size={128} strokeWidth={1} aria-hidden="true" /></div>
            <h2 className="text-lg font-extrabold">Why Shop with OurTech?</h2>
            <ul className="mt-3 space-y-2 text-sm font-medium text-white/90">
              <li className="flex items-center gap-2"><PackageCheck size={14} className="text-fuchsia-200" aria-hidden="true" /> Fast &amp; secure delivery</li>
              <li className="flex items-center gap-2"><BadgeCheck size={14} className="text-fuchsia-200" aria-hidden="true" /> Genuine products</li>
              <li className="flex items-center gap-2"><ArrowRight size={14} className="text-fuchsia-200" aria-hidden="true" /> Easy returns</li>
              <li className="flex items-center gap-2"><Headphones size={14} className="text-fuchsia-200" aria-hidden="true" /> Dedicated support</li>
            </ul>
          </aside>
        </section>

        <div className="mt-5 sm:mt-4">
          <HomeReviews
            reviews={reviews}
            loading={loadingReviews}
            fetchFailed={reviewsFailed}
          />
        </div>

        <section aria-label="Shop with OurTech" className="relative isolate mt-10 flex min-h-36 items-center overflow-hidden rounded-2xl bg-[#1d0645] px-5 py-6 text-white sm:mt-12 sm:min-h-40 sm:px-8">
          <img src="/images/pageheader.png" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[70%_center]" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#220747]/95 via-[#360575]/90 to-[#360575]/35" aria-hidden="true" />
          <div className="max-w-lg">
            <h2 className="text-xl font-black sm:text-2xl">Be a Part of <span className="text-fuchsia-300">OurTech Family</span></h2>
            <p className="mt-1.5 max-w-md text-sm leading-6 text-white/85">Explore the latest gadgets, discover helpful technology and find what fits your everyday life.</p>
          </div>
          <Link to="/shop" className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 text-sm font-extrabold text-primary shadow-lg transition hover:-translate-y-0.5 sm:px-5">
            Shop Now <ArrowRight size={13} aria-hidden="true" />
          </Link>
        </section>
      </PageContainer>
    </main>
  );
}

export default AboutUs;
