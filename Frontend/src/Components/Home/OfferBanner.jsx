import { useEffect, useState } from "react";
import { ArrowRight, BadgePercent, Sparkles } from "lucide-react";
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
  const descriptionText = (banner.description || "")
    .split(/\r?\n/)
    .filter((line) => !/mega\s*sale/i.test(line))
    .join("\n")
    .trim();
  const content = (
    <>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-32 z-0 h-80 w-80 rounded-full border-[32px] border-fuchsia-300/10"
      />

      <div
        className="relative z-10 grid h-full min-h-[430px] w-full grid-cols-1 items-center gap-2 p-5 sm:min-h-[360px] sm:p-8 md:min-h-0 md:grid-cols-[0.9fr_1.25fr] md:gap-0 md:p-8 lg:p-12"
        style={{
          backgroundColor: "#10002e",
          backgroundImage: "radial-gradient(ellipse at 70% 55%, rgba(174,30,255,0.6), transparent 34%), radial-gradient(ellipse at 100% 0%, rgba(64,0,200,0.6), transparent 40%), linear-gradient(112deg, #10002e 0%, #290078 45%, #4b00c8 100%)",
        }}
      >
        <div className="relative z-10 flex min-w-0 flex-col items-start justify-center md:max-w-[470px]">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-fuchsia-200/50 bg-white/10 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.14em] text-white shadow-[0_0_24px_rgba(217,70,239,0.25)] backdrop-blur sm:text-xs">
            <Sparkles size={14} className="text-amber-300" aria-hidden="true" />
            Limited-time offer
          </span>
          <h2 className="max-w-full text-3xl font-black leading-[1.05] tracking-tight text-white drop-shadow sm:text-4xl lg:text-5xl">
            {banner.title}
          </h2>
          {banner.subtitle && (
            <p className="mt-3 max-w-md text-sm font-semibold leading-relaxed text-fuchsia-100 sm:text-base">
              {banner.subtitle}
            </p>
          )}
          {descriptionText && (
            <p className="mt-2 max-w-md whitespace-pre-line text-xs leading-relaxed text-white/80 sm:text-sm">
              {descriptionText}
            </p>
          )}
          <span className="mt-5 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-amber-300 to-yellow-400 px-5 py-3 text-sm font-black text-[#24104f] shadow-[0_8px_24px_rgba(255,191,0,0.3)] transition duration-200 group-hover:-translate-y-0.5 group-hover:shadow-[0_12px_30px_rgba(255,191,0,0.45)]">
            Explore Deals
            <ArrowRight size={18} aria-hidden="true" />
          </span>
        </div>

        {banner.desktop_image && (
          <div className="relative flex h-full min-h-0 w-full items-center justify-center md:pl-3">
            <div aria-hidden="true" className="absolute left-1/2 top-1/2 aspect-square w-[75%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-200/30 shadow-[0_0_48px_rgba(217,70,239,0.32)]" />
            <div aria-hidden="true" className="absolute bottom-[12%] left-[8%] right-[4%] h-5 rounded-[50%] bg-fuchsia-400/40 blur-xl" />
          <img
            src={getImageUrl(banner.desktop_image)}
            alt={banner.title}
              className="relative z-[1] h-[220px] w-full object-contain drop-shadow-[0_20px_28px_rgba(9,0,40,0.5)] sm:h-[250px] md:h-full md:max-h-[340px] lg:max-h-[390px] transition-transform duration-500 group-hover:scale-[1.03]"
          />
          </div>
        )}

        {offerText && (
          <div className="absolute right-4 top-4 z-20 hidden -rotate-6 flex-col items-center justify-center rounded-2xl border border-amber-100/70 bg-gradient-to-br from-amber-300 to-yellow-500 px-4 py-3 text-center text-[#25104d] shadow-[0_12px_28px_rgba(15,0,45,0.35)] sm:flex md:right-[4%] md:top-[12%] md:px-5 md:py-4">
            <BadgePercent size={20} className="mb-1" aria-hidden="true" />
            <span className="text-[9px] font-black uppercase tracking-wider md:text-[10px]">Mega deal</span>
            <span className="mt-0.5 max-w-28 text-xs font-black leading-tight md:text-sm">{offerText}</span>
          </div>
        )}
      </div>
    </>
  );
  const className = "group relative isolate aspect-[1.35/1] min-h-[430px] w-full overflow-hidden rounded-[1.75rem] border border-fuchsia-300/40 bg-gradient-to-br from-[#10002e] via-[#31008c] to-[#4b00c8] shadow-[0_24px_54px_rgba(76,0,200,0.24)] transition duration-300 hover:shadow-[0_30px_64px_rgba(76,0,200,0.34)] sm:aspect-[2.2/1] sm:min-h-[360px] md:aspect-[3.5/1] md:min-h-[320px]";

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
