
import React from "react";

const banners = [
  {
    id: 1,
    title: "Gaming Zone",
    subtitle: "Upgrade Your Play",
    offer: "Up to 40% OFF",
    button: "Shop Gaming",
    image:
      "https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=500&auto=format&fit=crop",
    imageAlt: "Gaming controller",
    theme: "gaming",
  },
  {
    id: 2,
    title: "Work & Study",
    subtitle: "Laptops for Every Need",
    offer: "From ₹34,999",
    button: "Explore Laptops",
    image:
      "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=500&auto=format&fit=crop",
    imageAlt: "Laptop",
    theme: "laptop",
  },
  {
    id: 3,
    title: "Audio & Sound",
    subtitle: "Feel the Real Sound",
    offer: "Up to 40% OFF",
    button: "Shop Audio",
    image:
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&auto=format&fit=crop",
    imageAlt: "Over-ear headphones",
    theme: "audio",
  },
];

const TechBanner = () => {
  return (
    <section className="w-full py-4">
      <div className="mx-auto grid max-w-[1450px] grid-cols-1 gap-2 px-4 sm:grid-cols-3">

        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`group relative flex h-[108px] min-w-0 overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl sm:h-[116px] ${
              banner.theme === "gaming"
                ? "bg-gradient-to-r from-secondary-dark via-primary to-primary-dark"
                : banner.theme === "laptop"
                  ? "bg-gradient-to-r from-surface via-background to-secondary-light/30"
                  : "bg-gradient-to-r from-secondary-dark via-secondary to-gradient-middle"
            }`}
          >
            {/* Text Content */}
            <div className="relative z-10 flex w-[60%] flex-col justify-center pl-4 sm:pl-5">
              <h3
                className={`text-sm font-extrabold tracking-tight sm:text-base ${
                  banner.theme === "laptop"
                    ? "text-text-primary"
                    : "text-surface"
                }`}
              >
                {banner.title}
                {banner.theme === "gaming" && " 🎮"}
              </h3>

              <p
                className={`text-[11px] font-medium sm:text-xs ${
                  banner.theme === "laptop"
                    ? "text-text-secondary"
                    : "text-surface/80"
                }`}
              >
                {banner.subtitle}
              </p>

              <p
                className={`mt-0.5 text-sm font-black sm:text-base ${
                  banner.theme === "laptop"
                    ? "text-primary"
                    : "text-accent"
                }`}
              >
                {banner.offer}
              </p>

              <button
                className={`mt-1 flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold transition-all duration-300 group-hover:gap-2 sm:text-[10px] ${
                  banner.theme === "laptop"
                    ? "bg-surface text-primary-dark hover:bg-primary hover:text-surface"
                    : "bg-surface text-primary-dark hover:bg-accent"
                }`}
              >
                {banner.button}
                <span>→</span>
              </button>
            </div>

            {/* Product Image */}
            {banner.theme === "audio" && (
              <div
                aria-hidden="true"
                className="absolute right-[27%] top-1/2 flex -translate-y-1/2 items-center gap-1 opacity-70"
              >
                {[12, 20, 30, 18, 26, 14].map((height, index) => (
                  <span
                    key={index}
                    className="w-1 rounded-full bg-accent"
                    style={{ height: `${height}px` }}
                  />
                ))}
              </div>
            )}
            <div className="absolute right-0 top-0 flex h-full w-[46%] items-center justify-center">
              <img
                src={banner.image}
                alt={banner.imageAlt}
                className={`h-[96%] w-full object-contain p-1 transition-transform duration-500 group-hover:scale-110 ${
                  banner.theme === "audio" ? "relative z-10 mix-blend-multiply" : ""
                }`}
              />
            </div>

            {/* Decorative Glow */}
            <div
              className={`pointer-events-none absolute -right-8 -top-12 h-32 w-32 rounded-full blur-3xl ${
                banner.theme === "laptop"
                  ? "bg-surface/70"
                  : "bg-secondary-light/30"
              }`}
            />
          </div>
        ))}

      </div>
    </section>
  );
};

export default TechBanner;
