
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
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
  if (theme === "gaming") return "Shop Gaming";
  if (theme === "laptop") return "Explore Laptops";
  return "Shop Audio";
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
    <section className="w-full">
      <PageContainer className="py-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-2">
          {banners.map((banner) => {
            const theme = getTheme(banner.title);
            const destination = banner.destination_link || "/shop";
            const content = (
              <>
                <div className="relative z-10 flex w-[62%] flex-col justify-center pl-5 sm:pl-4 lg:pl-6">
                  <h3
                    className={`text-[15px] font-extrabold leading-tight tracking-tight sm:text-[14px] lg:text-base ${
                      theme === "laptop" ? "text-text-primary" : "text-surface"
                    }`}
                  >
                    {banner.title}
                    {theme === "gaming" && " 🎮"}
                  </h3>

                  {banner.subtitle && (
                    <p
                      className={`text-[11px] font-medium leading-tight sm:text-[10px] lg:text-xs ${
                        theme === "laptop" ? "text-text-secondary" : "text-surface/80"
                      }`}
                    >
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.description && (
                    <p
                      className={`mt-0.5 text-[15px] font-black leading-tight sm:text-[13px] lg:text-base ${
                        theme === "laptop" ? "text-primary-dark" : "text-accent"
                      }`}
                    >
                      {banner.description}
                    </p>
                  )}

                  <span
                    className={`mt-2 flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold transition-all duration-300 group-hover:gap-2 sm:mt-1.5 ${
                      theme === "laptop"
                        ? "bg-surface text-primary-dark hover:bg-primary hover:text-surface"
                        : "bg-surface text-primary-dark hover:bg-accent"
                    }`}
                  >
                    {getButtonLabel(theme)}
                    <span aria-hidden="true">→</span>
                  </span>
                </div>

                <div className="absolute right-1 top-0 flex h-full w-[44%] items-center justify-center sm:w-[46%]">
                  <img
                    src={getImageUrl(banner.desktop_image)}
                    alt={banner.title}
                    className={`h-[92%] w-full object-contain p-1 transition-transform duration-500 group-hover:scale-110 ${
                      theme === "gaming"
                        ? "scale-110"
                        : theme === "audio"
                          ? "scale-110"
                          : ""
                    }`}
                  />
                </div>
              </>
            );
            const className = `group relative flex h-[140px] min-w-0 overflow-hidden rounded-2xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-[132px] lg:h-[150px] ${
              theme === "gaming"
                ? "bg-gradient-to-r from-secondary-dark via-primary to-primary-dark"
                : theme === "laptop"
                  ? "bg-gradient-to-r from-[#f7d8f6] via-[#fceafb] to-[#e9c8f5]"
                  : "bg-gradient-to-r from-secondary-dark via-secondary to-gradient-middle"
            }`;

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
