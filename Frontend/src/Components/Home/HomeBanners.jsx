import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function isPublished(value) {
  return value === true || Number(value) === 1;
}

function HomeBanners() {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchBanners = async () => {
      try {
        const { data } = await api.get("/banners");
        if (active) {
          const published = (Array.isArray(data?.banners) ? data.banners : []).filter((banner) =>
            isPublished(banner.is_published),
          );
          setBanners(published);
        }
      } catch (error) {
        console.error("Failed to fetch home page banners:", error);
      }
    };

    fetchBanners();
    return () => {
      active = false;
    };
  }, []);

  const heroBanners = useMemo(
    () => banners.filter((banner) => banner.target_section === "hero"),
    [banners],
  );
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);

  useEffect(() => {
    if (heroBanners.length < 2) return undefined;

    const interval = window.setInterval(() => {
      setActiveHeroIndex((currentIndex) => (currentIndex + 1) % heroBanners.length);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [heroBanners.length]);

  const heroBanner = heroBanners[activeHeroIndex] || heroBanners[0] || null;

  const heroImage = heroBanner?.desktop_image ? getImageUrl(heroBanner.desktop_image) : "";
  const heroTitle = heroBanner?.title || "Everything You Need in One Place";
  const heroItems = (
    heroBanner?.subtitle || "Gadgets & Electronics | Natural Products | Clothing & Fashion"
  )
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section className="relative isolate flex flex-col overflow-hidden bg-gradient-to-br from-[#faf5ff] via-[#f2e7ff] to-[#c99af4] lg:h-[90vh] lg:min-h-[600px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_68%_48%,rgba(164,91,232,0.34),transparent_38%),radial-gradient(ellipse_at_26%_0%,rgba(255,255,255,0.9),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-[8%] -top-[57%] h-[82%] w-[62%] rounded-[50%] bg-white/45" />
      <div className="pointer-events-none absolute -bottom-[44%] -left-[8%] h-[58%] w-[72%] -rotate-6 rounded-[50%] bg-white/35" />
      <div className="pointer-events-none absolute -bottom-[50%] -right-[12%] h-[72%] w-[70%] rotate-[-8deg] rounded-[50%] bg-violet-400/30" />

      <PageContainer className="relative flex flex-1 flex-col py-5 sm:py-7 lg:flex-row lg:items-center lg:py-6">
        <div
          key={heroBanner?.id ?? activeHeroIndex}
          className={`grid w-full flex-1 items-center gap-1 sm:gap-3 lg:grid-cols-[0.98fr_1.02fr] xl:gap-0 ${
            heroBanners.length > 1 ? "home-hero-slide" : ""
          }`}
        >
          <div className="order-2 relative z-10 py-3 sm:py-4 lg:order-1 lg:py-0">
            <a
              href="#shop-by-category"
              className="mb-5 inline-flex items-center gap-2 rounded-full bg-[#ead8ff] px-4 py-2 text-sm font-bold text-[#35116d] transition hover:bg-[#dfc5ff] sm:mb-7 sm:px-5 sm:py-2.5 sm:text-base"
            >
              <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Explore Our Collection</span>
            </a>

            <h1 className="max-w-[700px] text-[clamp(2rem,8vw,2.5rem)] font-black leading-[1.02] tracking-[-0.055em] text-[#24104f] sm:text-5xl xl:text-[3.75rem]">
              {heroTitle}
            </h1>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs font-medium text-[#22213b] sm:mt-7 sm:gap-x-4 sm:gap-y-2 sm:text-[15px]">
              {heroItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex min-w-0 items-center gap-3 sm:gap-4">
                  <span>{item}</span>
                  {index < heroItems.length - 1 && <span className="text-[#4c326f]">|</span>}
                </div>
              ))}
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-3 sm:mt-8 sm:gap-5">
              {[
                { icon: Truck, title: "Fast", subtitle: "Delivery" },
                { icon: ShieldCheck, title: "Secure", subtitle: "Payments" },
                { icon: Clock3, title: "24/7", subtitle: "Support" },
              ].map(({ icon: Icon, title, subtitle }, index) => (
                <div key={title} className="flex items-center gap-2 text-[#26134c] sm:gap-2.5">
                  {index > 0 && <span className="mr-1 hidden h-12 w-px bg-violet-500/40 sm:block" />}
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/25 text-[#4b16a3] shadow-[inset_0_0_16px_rgba(255,255,255,0.55)] sm:h-[58px] sm:w-[58px]">
                    <Icon className="h-5 w-5 sm:h-6 sm:w-6" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col text-[11px] leading-tight sm:text-[14px]">
                    <strong className="font-extrabold">{title}</strong>
                    <span className="font-semibold">{subtitle}</span>
                  </span>
                </div>
              ))}
            </div>

            <a
              href={heroBanner?.destination_link || "#shop-by-category"}
              className="mt-6 inline-flex min-w-[190px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#9415dc] to-[#5100a8] px-5 py-3 text-base font-extrabold text-white shadow-[0_14px_28px_rgba(103,21,181,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(103,21,181,0.36)] sm:mt-9 sm:min-w-[230px] sm:px-6 sm:py-3.5 sm:text-lg"
            >
              <span>Shop Now</span>
              <ArrowRight className="h-5 w-5 sm:h-6 sm:w-6" />
            </a>
          </div>

          <div className="order-1 relative z-10 flex h-[min(72vw,300px)] min-h-[210px] w-full items-center justify-center sm:h-[min(60vw,390px)] sm:min-h-[300px] lg:order-2 lg:h-auto lg:min-h-0">
            {heroImage ? (
              <picture className="relative z-10 flex h-full w-full items-center justify-center">
                {heroBanner?.mobile_image && (
                  <source
                    media="(max-width: 639px)"
                    srcSet={getImageUrl(heroBanner.mobile_image)}
                  />
                )}
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className="h-full max-h-[300px] w-full object-contain drop-shadow-[0_20px_28px_rgba(67,30,116,0.2)] sm:max-h-[390px] lg:max-h-[65vh]"
                />
              </picture>
            ) : (
              <div className="relative z-10 h-3/4 w-3/4 bg-gradient-to-br from-violet-300/30 to-white/30" />
            )}
          </div>
        </div>

      </PageContainer>
    </section>
  );
}

export default HomeBanners;
