
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Gamepad2, Headphones, Laptop } from "lucide-react";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";

function isPublished(value) {
  return value === true || Number(value) === 1;
}

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function getTheme(title = "") {
  const normalizedTitle = title.toLowerCase();
  if (/gaming|game/.test(normalizedTitle)) return "gaming";
  if (/work|study|laptop|computer/.test(normalizedTitle)) return "laptop";
  return "audio";
}

function getButtonLabel(theme) {
  if (theme === "laptop") return "Explore Now";
  return "Shop Now";
}

function getThemeStyles(theme) {
  if (theme === "gaming") {
    return {
      card: "border-violet-500/60 bg-gradient-to-br from-[#100044] via-[#3b00ce] to-[#7800ed] text-white shadow-[0_20px_40px_rgba(74,0,220,0.28)]",
      glow: "bg-fuchsia-500/30",
      button: "bg-amber-400 text-slate-950 hover:bg-amber-300",
      icon: Gamepad2,
    };
  }
  if (theme === "laptop") {
    return {
      card: "border-violet-100 bg-gradient-to-br from-white via-[#f9efff] to-[#ead4ff] text-[#17102d] shadow-[0_16px_34px_rgba(92,30,160,0.16)]",
      glow: "bg-violet-300/45",
      button: "border border-violet-500 bg-white/80 text-violet-950 hover:bg-white",
      icon: Laptop,
    };
  }
  return {
    card: "border-violet-500/60 bg-gradient-to-br from-[#11003f] via-[#4000bd] to-[#9200ed] text-white shadow-[0_20px_40px_rgba(74,0,220,0.28)]",
    glow: "bg-fuchsia-500/30",
    button: "bg-amber-400 text-slate-950 hover:bg-amber-300",
    icon: Headphones,
  };
}

const TechBanner = () => {
  const [banners, setBanners] = useState([]);

  useEffect(() => {
    let active = true;

    const fetchOfferBanners = async () => {
      try {
        const { data } = await api.get("/banners");
        if (active) {
          const offerBanners = (Array.isArray(data?.banners) ? data.banners : [])
            .filter((banner) =>
              banner.target_section === "offers" && isPublished(banner.is_published),
            )
            .sort((first, second) => Number(first.id) - Number(second.id))
            .slice(0, 3);
          setBanners(offerBanners);
        }
      } catch (error) {
        console.error("Failed to fetch offer banners:", error);
      }
    };

    fetchOfferBanners();
    return () => {
      active = false;
    };
  }, []);

  if (banners.length === 0) return null;

  return (
    <section className="w-full" aria-label="Featured technology collections">
      <PageContainer className="py-5 sm:py-7">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
          {banners.map((banner) => {
            const theme = getTheme(banner.title);
            const themeStyles = getThemeStyles(theme);
            const ThemeIcon = themeStyles.icon;
            const destination = banner.destination_link || "/shop";
            const content = (
              <>
                <div aria-hidden="true" className={`pointer-events-none absolute -right-8 -top-14 h-44 w-44 rounded-full blur-3xl ${themeStyles.glow}`} />
                <div aria-hidden="true" className="pointer-events-none absolute left-4 top-4 flex gap-1 opacity-70">
                  {[0, 1, 2, 3].map((dot) => (
                    <span key={dot} className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                  ))}
                </div>
                <div className="relative z-10 flex h-full w-[58%] flex-col items-start justify-center p-4 sm:p-5 lg:p-6">
                  <span className={`mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-extrabold uppercase tracking-[0.16em] ${theme === "laptop" ? "bg-violet-100 text-violet-800" : "border border-white/15 bg-white/10 text-violet-100"}`}>
                    <ThemeIcon size={12} aria-hidden="true" />
                    Featured collection
                  </span>
                  <h3
                    className="line-clamp-2 text-lg font-black leading-[1.08] tracking-tight sm:text-xl lg:text-[1.65rem]"
                  >
                    {banner.title}
                  </h3>

                  {banner.subtitle && (
                    <p
                      className={`mt-2 line-clamp-2 text-[11px] font-medium leading-relaxed sm:text-xs ${theme === "laptop" ? "text-slate-600" : "text-white/80"}`}
                    >
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.description && (
                    <p
                      className={`mt-1.5 line-clamp-1 text-xs font-extrabold sm:text-sm ${theme === "laptop" ? "text-violet-800" : "text-fuchsia-200"}`}
                    >
                      {banner.description}
                    </p>
                  )}

                  <span
                    className={`mt-3 inline-flex w-fit items-center gap-2 rounded-full px-3.5 py-2 text-[10px] font-extrabold transition duration-200 group-hover:gap-3 sm:text-xs ${themeStyles.button}`}
                  >
                    {getButtonLabel(theme)}
                    <ArrowRight size={14} aria-hidden="true" />
                  </span>
                </div>

                <div className="absolute inset-y-0 right-0 flex w-[48%] items-center justify-center">
                  <div aria-hidden="true" className={`absolute inset-3 rounded-full blur-2xl ${themeStyles.glow}`} />
                  <img
                    src={getImageUrl(banner.desktop_image)}
                    alt={banner.title}
                    className="relative h-[88%] w-full object-contain p-2 transition-transform duration-500 group-hover:scale-105 sm:p-3"
                  />
                </div>
              </>
            );
            const className = `group relative isolate flex aspect-[2.2/1] min-h-40 min-w-0 overflow-hidden rounded-[1.6rem] border transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_44px_rgba(74,0,220,0.24)] sm:aspect-[2.35/1] lg:min-h-0 ${themeStyles.card}`;

            return /^https?:\/\//i.test(destination) ? (
              <a
                key={banner.id}
                href={destination}
                target="_blank"
                rel="noopener noreferrer"
                className={className}
              >
                {content}
              </a>
            ) : (
              <Link key={banner.id} to={destination} className={className}>
                {content}
              </Link>
            );
          })}
        </div>
      </PageContainer>
    </section>
  );
};

export default TechBanner;
