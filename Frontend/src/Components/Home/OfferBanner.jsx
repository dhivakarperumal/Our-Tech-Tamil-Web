import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
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

function OfferBanner() {
  const [banner, setBanner] = useState(null);

  useEffect(() => {
    let active = true;

    const fetchLatestOffer = async () => {
      try {
        const { data } = await api.get("/banners");
        const latestOffer = (Array.isArray(data?.banners) ? data.banners : [])
          .filter((item) =>
            item.target_section === "offers" && isPublished(item.is_published),
          )
          .sort((first, second) => Number(second.id) - Number(first.id))[0] || null;

        if (active) setBanner(latestOffer);
      } catch (error) {
        console.error("Failed to fetch latest offer banner:", error);
      }
    };

    fetchLatestOffer();
    return () => {
      active = false;
    };
  }, []);

  if (!banner) return null;

  const destination = banner.destination_link || "/shop";
  const content = (
    <>
      {banner.desktop_image && (
        <img
          src={getImageUrl(banner.desktop_image)}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      <div
        aria-hidden="true"
        className="absolute inset-0 bg-gradient-to-r from-[#31006f]/95 via-[#5100a8]/75 to-transparent"
      />
      <div className="relative z-10 flex min-h-[260px] w-full flex-col items-start justify-center px-6 py-10 sm:px-10 md:min-h-[360px] md:w-[64%] md:px-12 lg:px-16">
        <h2 className="max-w-2xl text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="mt-2 max-w-xl text-base font-semibold leading-snug text-white sm:text-xl lg:text-2xl">
            {banner.subtitle}
          </p>
        )}
        {banner.description && (
          <p className="mt-2 max-w-xl whitespace-pre-line text-sm font-medium leading-relaxed text-white/90 sm:text-base lg:text-lg">
            {banner.description}
          </p>
        )}
        <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-extrabold text-primary-dark shadow-lg transition group-hover:-translate-y-0.5 group-hover:bg-accent sm:px-7 sm:text-base">
          Explore Deals
          <ArrowRight size={19} aria-hidden="true" />
        </span>
      </div>
    </>
  );
  const className = "group relative isolate flex aspect-auto min-h-[260px] w-full overflow-hidden rounded-2xl bg-gradient-to-r from-primary-dark via-primary to-gradient-middle shadow-lg md:aspect-[3/1] md:min-h-[360px]";

  return (
    <section aria-label="Latest offer">
      <PageContainer className="py-4 sm:py-6">
        {/^https?:\/\//i.test(destination) ? (
          <a
            href={destination}
            target="_blank"
            rel="noopener noreferrer"
            className={className}
          >
            {content}
          </a>
        ) : (
          <Link to={destination} className={className}>
            {content}
          </Link>
        )}
      </PageContainer>
    </section>
  );
}

export default OfferBanner;
