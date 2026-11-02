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
  const offerText = [banner.subtitle, banner.description]
    .filter(Boolean)
    .join(" ")
    .match(/(?:up to\s*)?\d{1,3}\s*%\s*off|from\s*₹?\s*[\d,]+/i)?.[0];
  const content = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_61%_43%,rgba(241,0,255,0.82),transparent_35%),radial-gradient(ellipse_at_84%_100%,rgba(219,0,255,0.65),transparent_42%),linear-gradient(112deg,#30005f_0%,#5900b9_48%,#310078_100%)]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-[17%] left-[22%] h-[28%] w-[62%] rounded-[50%] border-t-4 border-yellow-200 bg-gradient-to-b from-fuchsia-400 via-purple-700 to-[#24004f] shadow-[0_-8px_35px_rgba(255,215,0,0.75)]"
      />

      <div className="relative z-10 flex w-full flex-col justify-center px-6 py-6 pr-20 sm:px-10 sm:py-7 sm:pr-24 md:absolute md:inset-y-0 md:left-0 md:w-[34%] md:px-8 md:pr-0 lg:px-12">
        <h2 className="max-w-lg text-3xl font-black leading-tight tracking-tight text-white drop-shadow-sm sm:text-4xl lg:text-5xl">
          {banner.title}
        </h2>
        {banner.subtitle && (
          <p className="mt-2 max-w-lg text-lg font-extrabold leading-tight text-accent sm:text-xl lg:text-3xl">
            {banner.subtitle}
          </p>
        )}
        {banner.description && (
          <p className="mt-3 max-w-lg whitespace-pre-line text-xs font-medium leading-relaxed text-white/95 sm:text-sm lg:text-base">
            {banner.description}
          </p>
        )}
        <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-extrabold text-primary-dark shadow-lg transition group-hover:-translate-y-0.5 group-hover:bg-accent sm:px-7 sm:py-3 sm:text-base">
          Explore Deals
          <ArrowRight size={19} aria-hidden="true" />
        </span>
      </div>

      {banner.desktop_image && (
        <div className="relative z-[1] mx-auto flex h-[145px] w-[78%] items-center justify-center sm:h-[180px] md:absolute md:inset-y-[8%] md:left-[27%] md:mx-0 md:h-[84%] md:w-[56%] lg:left-[25%] lg:w-[60%]">
          <img
            src={getImageUrl(banner.desktop_image)}
            alt={banner.title}
            className="h-full w-full object-contain drop-shadow-[0_18px_22px_rgba(18,0,50,0.45)]"
          />
        </div>
      )}

      <div className="absolute right-3 top-3 z-20 flex h-[74px] w-[64px] rotate-[7deg] flex-col items-center justify-center rounded-xl bg-gradient-to-b from-yellow-300 via-yellow-400 to-amber-500 text-center text-primary-dark shadow-[0_8px_24px_rgba(20,0,50,0.4)] sm:right-5 sm:top-5 sm:h-[100px] sm:w-[86px] md:right-[3%] md:top-[12%] md:h-[132px] md:w-[112px] lg:h-[160px] lg:w-[136px]">
        <span className="text-[10px] font-black leading-none sm:text-xs lg:text-base">MEGA</span>
        <span className="mt-1 text-base font-black leading-none sm:text-xl lg:text-3xl">SALE</span>
        {offerText && (
          <span className="mt-1 max-w-[90%] text-[8px] font-extrabold leading-tight sm:text-[10px] lg:text-sm">
            {offerText}
          </span>
        )}
      </div>
    </>
  );
  const className = "group relative isolate flex min-h-[280px] w-full flex-col overflow-hidden rounded-2xl bg-gradient-to-r from-primary-dark via-primary to-gradient-middle shadow-lg sm:min-h-[320px] md:min-h-[300px] md:flex-row";

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
