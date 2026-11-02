
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../../api";

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
    <section className="w-full py-3">
      <div className="mx-auto max-w-[1450px] overflow-x-auto px-2 sm:px-4">
        <div className="grid min-w-[690px] grid-cols-3 gap-2 md:min-w-0">
          {banners.map((banner) => {
            const theme = getTheme(banner.title);
            const destination = banner.destination_link || "/shop";
            const content = (
              <>
                <div className="relative z-10 flex w-[60%] flex-col justify-center pl-5">
                  <h3
                    className={`text-[15px] font-extrabold tracking-tight ${
                      theme === "laptop" ? "text-text-primary" : "text-surface"
                    }`}
                  >
                    {banner.title}
                    {theme === "gaming" && " 🎮"}
                  </h3>

                  {banner.subtitle && (
                    <p
                      className={`text-[11px] font-medium ${
                        theme === "laptop" ? "text-text-secondary" : "text-surface/80"
                      }`}
                    >
                      {banner.subtitle}
                    </p>
                  )}

                  {banner.description && (
                    <p
                      className={`mt-0.5 text-[15px] font-black ${
                        theme === "laptop" ? "text-gradient-middle" : "text-accent"
                      }`}
                    >
                      {banner.description}
                    </p>
                  )}

                  <span
                    className={`mt-1 flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold transition-all duration-300 group-hover:gap-2 ${
                      theme === "laptop"
                        ? "bg-surface text-primary-dark hover:bg-primary hover:text-surface"
                        : "bg-surface text-primary-dark hover:bg-accent"
                    }`}
                  >
                    {getButtonLabel(theme)}
                    <span aria-hidden="true">→</span>
                  </span>
                </div>

                {theme === "audio" && (
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 76 42"
                    className="absolute right-[22%] top-1/2 z-10 h-10 w-[76px] -translate-y-1/2"
                  >
                    <path
                      d="M1 22h8l5-8 7 17 7-25 8 34 8-23 7 14 6-9 5 4h13"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      className="text-accent"
                    />
                  </svg>
                )}
                <div className="absolute right-0 top-0 flex h-full w-[46%] items-center justify-center">
                  <img
                    src={getImageUrl(banner.desktop_image)}
                    alt={banner.title}
                    className={`h-full w-full object-contain p-1 mix-blend-multiply transition-transform duration-500 group-hover:scale-110 ${
                      theme === "gaming"
                        ? "scale-150"
                        : theme === "audio"
                          ? "relative z-20 scale-125"
                          : ""
                    }`}
                  />
                </div>
              </>
            );
            const className = `group relative flex h-[132px] min-w-0 overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              theme === "gaming"
                ? "bg-gradient-to-r from-secondary-dark via-primary to-primary-dark"
                : theme === "laptop"
                  ? "bg-gradient-to-r from-secondary-light/30 via-background to-secondary-light/50"
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
      </div>
    </section>
  );
};

export default TechBanner;
