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
    <section className="relative isolate flex min-h-[90vh] flex-col overflow-hidden bg-gradient-to-br from-[#faf5ff] via-[#f2e7ff] to-[#c99af4] lg:h-[90vh] lg:min-h-[600px]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_68%_48%,rgba(164,91,232,0.34),transparent_38%),radial-gradient(ellipse_at_26%_0%,rgba(255,255,255,0.9),transparent_55%)]" />
      <div className="pointer-events-none absolute -left-[8%] -top-[57%] h-[82%] w-[62%] rounded-[50%] bg-white/45" />
      <div className="pointer-events-none absolute -bottom-[44%] -left-[8%] h-[58%] w-[72%] -rotate-6 rounded-[50%] bg-white/35" />
      <div className="pointer-events-none absolute -bottom-[50%] -right-[12%] h-[72%] w-[70%] rotate-[-8deg] rounded-[50%] bg-violet-400/30" />

      <PageContainer className="relative flex flex-1 items-center py-6 sm:py-8 lg:py-6">
        <div className="grid w-full items-center gap-3 lg:grid-cols-[0.98fr_1.02fr] xl:gap-0">
          <div className="relative z-10 py-4 lg:py-0">
            <a
              href="#shop-by-category"
              className="mb-7 inline-flex items-center gap-2 rounded-full bg-[#ead8ff] px-5 py-2.5 text-base font-bold text-[#35116d] transition hover:bg-[#dfc5ff]"
            >
              <ShoppingBag className="h-5 w-5" />
              <span>Shop by Categories</span>
            </a>

            <h1             className="max-w-[700px] text-[2.5rem] font-black leading-[0.98] tracking-[-0.055em] text-[#24104f] sm:text-5xl xl:text-[3.75rem]">
              {heroTitle}
            </h1>

            <div className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] font-medium text-[#22213b] sm:text-[15px]">
              {heroItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-4">
                  <span>{item}</span>
                  {index < heroItems.length - 1 && <span className="text-[#4c326f]">|</span>}
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 sm:gap-5">
              {[
                { icon: Truck, title: "Fast", subtitle: "Delivery" },
                { icon: ShieldCheck, title: "Secure", subtitle: "Payments" },
                { icon: Clock3, title: "24/7", subtitle: "Support" },
              ].map(({ icon: Icon, title, subtitle }, index) => (
                <div key={title} className="flex items-center gap-2.5 text-[#26134c]">
                  {index > 0 && <span className="mr-1 hidden h-12 w-px bg-violet-500/40 sm:block" />}
                  <span className="flex h-[58px] w-[58px] shrink-0 items-center justify-center rounded-full border-2 border-white/90 bg-white/25 text-[#4b16a3] shadow-[inset_0_0_16px_rgba(255,255,255,0.55)]">
                    <Icon className="h-6 w-6" strokeWidth={2} />
                  </span>
                  <span className="flex flex-col text-[14px] leading-tight">
                    <strong className="font-extrabold">{title}</strong>
                    <span className="font-semibold">{subtitle}</span>
                  </span>
                </div>
              ))}
            </div>

            <a
              href={heroBanner?.destination_link || "#shop-by-category"}
              className="mt-9 inline-flex min-w-[230px] items-center justify-center gap-3 rounded-full bg-gradient-to-r from-[#9415dc] to-[#5100a8] px-6 py-3.5 text-lg font-extrabold text-white shadow-[0_14px_28px_rgba(103,21,181,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_32px_rgba(103,21,181,0.36)]"
            >
              <span>Shop Now</span>
              <ArrowRight className="h-6 w-6" />
            </a>
          </div>

          <div className="relative z-10 flex min-h-[320px] items-end justify-center sm:min-h-[430px] lg:min-h-0">
            {heroImage ? (
              <picture className="relative z-10 block w-full">
                {heroBanner?.mobile_image && (
                  <source
                    media="(max-width: 639px)"
                    srcSet={getImageUrl(heroBanner.mobile_image)}
                  />
                )}
                <img
                  src={heroImage}
                  alt={heroTitle}
                  className="mx-auto max-h-[500px] w-full object-contain drop-shadow-[0_20px_28px_rgba(67,30,116,0.2)] sm:max-h-[540px] lg:max-h-[65vh]"
                />
              </picture>
            ) : (
              <div className="relative z-10 h-[50%] w-[75%] bg-gradient-to-br from-violet-300/30 to-white/30" />
            )}
          </div>
        </div>

        <div className="relative z-10 mt-2 flex items-center justify-center gap-3 pb-2 lg:absolute lg:bottom-10 lg:left-[5%] lg:mt-0 lg:justify-start">
          {heroBanners.length > 0 ? heroBanners.map((banner, index) => (
            <button
              key={banner.id}
              type="button"
              aria-label={`Show banner ${index + 1}: ${banner.title}`}
              aria-current={index === activeHeroIndex ? "true" : undefined}
              onClick={() => setActiveHeroIndex(index)}
              className={`h-3.5 w-3.5 rounded-full transition ${index === activeHeroIndex ? "bg-[#7400df]" : "bg-violet-400/60 hover:bg-violet-500"}`}
            />
          )) : [0, 1, 2].map((dot) => (
            <span
              key={dot}
              className={`h-3.5 w-3.5 rounded-full ${dot === 0 ? "bg-[#7400df]" : "bg-violet-400/60"}`}
            />
          ))}
        </div>
      </PageContainer>
    </section>
  );
}

export default HomeBanners;
