
import React from "react";

const banners = [
  {
    id: 1,
    title: "Gaming Zone",
    subtitle: "Upgrade Your Play",
    offer: "Up to 40% OFF",
    button: "Shop Gaming",
    image:
      "https://images.unsplash.com/photo-1592840496694-26d035b52b48?w=500&auto=format&fit=crop",
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
      "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=500&auto=format&fit=crop",
    imageAlt: "Over-ear headphones",
    theme: "audio",
  },
];

const TechBanner = () => {
  return (
    <section className="w-full py-3">
      <div className="mx-auto max-w-[1450px] overflow-x-auto px-2 sm:px-4">
        <div className="grid min-w-[690px] grid-cols-3 gap-2 md:min-w-0">
        {banners.map((banner) => (
          <div
            key={banner.id}
            className={`group relative flex h-[102px] min-w-0 overflow-hidden rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
              banner.theme === "gaming"
                ? "bg-gradient-to-r from-secondary-dark via-primary to-primary-dark"
                : banner.theme === "laptop"
                  ? "bg-gradient-to-r from-secondary-light/30 via-background to-secondary-light/50"
                  : "bg-gradient-to-r from-secondary-dark via-secondary to-gradient-middle"
            }`}
          >
            {/* Text Content */}
            <div className="relative z-10 flex w-[60%] flex-col justify-center pl-5">
              <h3
                className={`text-[15px] font-extrabold tracking-tight ${
                  banner.theme === "laptop"
                    ? "text-text-primary"
                    : "text-surface"
                }`}
              >
                {banner.title}
                {banner.theme === "gaming" && " 🎮"}
              </h3>

              <p
                className={`text-[11px] font-medium ${
                  banner.theme === "laptop"
                    ? "text-text-secondary"
                    : "text-surface/80"
                }`}
              >
                {banner.subtitle}
              </p>

              <p
                className={`mt-0.5 text-[15px] font-black ${
                  banner.theme === "laptop"
                    ? "text-gradient-middle"
                    : "text-accent"
                }`}
              >
                {banner.offer}
              </p>

              <button
                className={`mt-1 flex w-fit items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-bold transition-all duration-300 group-hover:gap-2 ${
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
                src={banner.image}
                alt={banner.imageAlt}
                className={`h-full w-full object-contain p-1 mix-blend-multiply transition-transform duration-500 group-hover:scale-110 ${
                  banner.theme === "gaming"
                    ? "scale-150"
                    : banner.theme === "audio"
                      ? "relative z-20 scale-125"
                      : ""
                }`}
              />
            </div>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
};

export default TechBanner;
