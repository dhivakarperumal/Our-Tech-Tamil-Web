import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import api from "../../api";

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function isPublished(value) {
  return value === true || Number(value) === 1;
}

function BannerImage({ banner, className }) {
  return (
    <picture className="absolute inset-0">
      {banner.mobile_image && (
        <source
          media="(max-width: 639px)"
          srcSet={getImageUrl(banner.mobile_image)}
        />
      )}
      <img
        src={getImageUrl(banner.desktop_image)}
        alt=""
        className={className}
      />
    </picture>
  );
}

function BannerContent({ banner, compact = false }) {
  return (
    <div className={`relative z-10 flex max-w-[75%] flex-col ${compact ? "gap-1" : "gap-1.5"}`}>
      <h2 className={`font-extrabold tracking-tight text-white ${compact ? "text-sm sm:text-base" : "text-lg sm:text-2xl"}`}>
        {banner.title}
      </h2>
      {banner.subtitle && (
        <p className={`font-semibold text-white/90 ${compact ? "text-[10px] sm:text-xs" : "text-xs sm:text-sm"}`}>
          {banner.subtitle}
        </p>
      )}
      {banner.description && (
        <p className={`line-clamp-2 text-white/85 ${compact ? "text-[9px] sm:text-[10px]" : "text-[10px] sm:text-xs"}`}>
          {banner.description}
        </p>
      )}
      {banner.destination_link && (
        <span className="mt-1 flex w-fit items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[9px] font-bold text-primary-dark transition-colors group-hover:bg-accent sm:text-[10px]">
          Explore now <ArrowUpRight size={13} aria-hidden="true" />
        </span>
      )}
    </div>
  );
}

function BannerCard({ banner, section }) {
  const isHero = section === "hero";
  const content = <BannerContent banner={banner} compact={isHero} />;
  const className = `group relative isolate flex min-w-0 items-center overflow-hidden rounded-xl bg-gradient-to-r from-primary-dark to-gradient-middle shadow-sm ${
    isHero ? "h-[132px] px-4 sm:px-5" : "h-[150px] px-5 sm:px-7"
  }`;
  const image = (
    <>
      <BannerImage
        banner={banner}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <span
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/40 to-black/5"
      />
      {content}
    </>
  );

  return banner.destination_link ? (
    <a
      href={banner.destination_link}
      target={/^https?:\/\//i.test(banner.destination_link) ? "_blank" : undefined}
      rel={/^https?:\/\//i.test(banner.destination_link) ? "noreferrer" : undefined}
      className={className}
      aria-label={`${banner.title} - Explore now`}
    >
      {image}
    </a>
  ) : (
    <article className={className}>
      {image}
    </article>
  );
}

function BannerGroup({ banners, section, failed }) {
  if (!banners.length && !failed) return null;

  return (
    <section
      aria-label={section === "hero" ? "Featured promotions" : "Special offers"}
      className={section === "hero" ? "w-full py-3" : "w-full px-2 pb-4 sm:px-4"}
    >
      {banners.length ? (
        <div className={`mx-auto grid max-w-[1450px] gap-2 px-2 sm:px-4 ${
          section === "hero"
            ? banners.length === 1
              ? "grid-cols-1"
              : banners.length === 2
                ? "grid-cols-1 sm:grid-cols-2"
                : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
            : "grid-cols-1 md:grid-cols-2"
        }`}>
          {banners.map((banner) => (
            <BannerCard key={banner.id} banner={banner} section={section} />
          ))}
        </div>
      ) : (
        <p className="mx-auto max-w-[1450px] px-4 py-3 text-center text-sm text-text-secondary">
          Promotions could not be loaded.
        </p>
      )}
    </section>
  );
}

function HomeBanners({ children }) {
  const [banners, setBanners] = useState([]);
  const [fetchFailed, setFetchFailed] = useState(false);

  useEffect(() => {
    let active = true;

    const fetchBanners = async () => {
      try {
        const { data } = await api.get("/banners");
        if (active) {
          setBanners(
            (Array.isArray(data?.banners) ? data.banners : [])
              .filter((banner) => isPublished(banner.is_published)),
          );
        }
      } catch (error) {
        console.error("Failed to fetch home page banners:", error);
        if (active) setFetchFailed(true);
      }
    };

    fetchBanners();
    return () => {
      active = false;
    };
  }, []);

  return (
    <>
      <BannerGroup
        banners={banners.filter((banner) => banner.target_section === "hero")}
        section="hero"
        failed={fetchFailed}
      />
      {children}
      <BannerGroup
        banners={banners.filter((banner) => banner.target_section === "offers")}
        section="offers"
        failed={fetchFailed}
      />
    </>
  );
}

export default HomeBanners;
