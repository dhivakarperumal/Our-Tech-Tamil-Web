import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, ShieldCheck, ShoppingBag, Truck } from "lucide-react";
import api from "../../api";

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

  const heroBanner = useMemo(
    () => banners.find((banner) => banner.target_section === "hero") || null,
    [banners],
  );

  const heroImage = heroBanner?.desktop_image ? getImageUrl(heroBanner.desktop_image) : "";
  const heroTitle = heroBanner?.title || "Everything You Need in One Place";
  const heroItems = (
    heroBanner?.subtitle || "Gadgets & Electronics | Natural Products | Clothing & Fashion"
  )
    .split("|")
    .map((item) => item.trim())
    .filter(Boolean);

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-violet-100 via-violet-200 to-purple-200">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.7),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(167,139,250,0.26),_transparent_30%)]" />
      <div className="relative mx-auto max-w-[1500px] px-4 pb-8 pt-8 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative z-10 max-w-[700px]">
            <div className="mb-6 inline-flex items-center gap-2 rounded-2xl border border-violet-300/60 bg-white/25 px-4 py-2.5 shadow-[0_10px_25px_rgba(91,48,156,0.08)] backdrop-blur-sm">
              <ShoppingBag className="h-5 w-5 text-violet-700" />
              <span className="text-base font-bold text-violet-800">Shop by Categories</span>
            </div>

            <h1 className="text-[2.7rem] font-black leading-[0.9] tracking-[-0.08em] text-slate-900 sm:text-[4rem] xl:text-[6rem]">
              {heroTitle}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700 sm:text-base">
              {heroItems.map((item, index) => (
                <div key={`${item}-${index}`} className="flex items-center gap-3">
                  <span>{item}</span>
                  {index < heroItems.length - 1 && <span className="text-violet-400">|</span>}
                </div>
              ))}
            </div>

            <div className="mt-8 grid max-w-[620px] grid-cols-1 gap-4 sm:grid-cols-3">
              {[
                { icon: Truck, title: "Fast", subtitle: "Delivery" },
                { icon: ShieldCheck, title: "Secure", subtitle: "Payments" },
                { icon: Clock3, title: "24/7", subtitle: "Support" },
              ].map(({ icon: Icon, title, subtitle }, index) => (
                <div key={title} className="flex items-center gap-3">
                  {index !== 0 && <div className="hidden h-12 w-px bg-violet-200 sm:block" />}
                  <div className="flex h-14 w-14 items-center justify-center rounded-full border border-violet-300 bg-white/30 text-violet-700 shadow-inner shadow-violet-100/80">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xl font-black text-slate-800">{title}</div>
                    <div className="text-sm text-slate-600">{subtitle}</div>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-9 inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-700 to-purple-700 px-6 py-4 text-lg font-bold text-white shadow-[0_18px_35px_rgba(91,48,156,0.28)] transition hover:translate-y-[-1px]"
            >
              <span>Shop Now</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </div>

          <div className="relative z-10 flex min-h-[420px] items-center justify-center lg:min-h-[560px]">
            <div className="absolute h-[440px] w-[440px] rounded-full border-[12px] border-violet-300/90 shadow-[0_0_25px_rgba(168,85,247,0.45)] lg:h-[560px] lg:w-[560px]" />

            <div className="absolute right-10 top-16 h-24 w-24 rotate-12 rounded-full bg-gradient-to-br from-green-200 to-green-400 opacity-90 blur-sm" />
            <div className="absolute right-16 top-20 h-20 w-20 rotate-[-10deg] rounded-full bg-gradient-to-br from-green-300 to-emerald-500 opacity-80 blur-sm" />
            <div className="absolute right-24 top-24 h-20 w-20 rotate-12 rounded-full bg-gradient-to-br from-green-300 to-emerald-500 opacity-80 blur-sm" />

            {heroImage ? (
              <img
                src={heroImage}
                alt="Featured banner product"
                className="relative z-10 max-h-[470px] w-[90%] object-contain drop-shadow-[0_30px_35px_rgba(100,60,180,0.22)]"
              />
            ) : (
              <div className="relative z-10 flex h-[420px] w-[90%] items-center justify-center rounded-[2rem] bg-gradient-to-br from-violet-800 via-violet-600 to-fuchsia-400 shadow-[0_30px_45px_rgba(98,58,175,0.26)]">
                <div className="relative h-[220px] w-[280px] rounded-[1.5rem] border border-white/20 bg-white/5 backdrop-blur-sm" />
              </div>
            )}

            <div className="absolute left-8 top-20 h-16 w-16 rounded-full bg-violet-500/10 blur-2xl" />
            <div className="absolute bottom-10 left-0 h-24 w-24 rounded-full bg-violet-400/10 blur-2xl" />
          </div>
        </div>

        <div className="relative z-10 mt-10 flex justify-center gap-3 pb-4">
          {[0, 1, 2, 3].map((dot) => (
            <span
              key={dot}
              className={`h-3.5 w-3.5 rounded-full ${dot === 0 ? "bg-violet-700 shadow-[0_0_0_4px_rgba(139,92,246,0.15)]" : "bg-violet-200"}`}
            />
          ))}
        </div>
      </div>

      <div className="absolute -bottom-12 left-0 h-32 w-full rotate-[-2deg] bg-gradient-to-r from-violet-200/60 via-violet-100/80 to-violet-200/60" />
      <div className="absolute -bottom-12 right-0 h-28 w-[55%] rotate-[5deg] bg-gradient-to-r from-violet-100/60 to-violet-200/60" />
    </section>
  );
}

export default HomeBanners;
