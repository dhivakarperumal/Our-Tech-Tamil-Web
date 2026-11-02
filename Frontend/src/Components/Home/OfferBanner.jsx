import React from "react";

const OfferBanner = () => {
  return (
    <section className="w-full px-2 pb-4 sm:px-4">
      <div className="group relative mx-auto flex h-[140px] max-w-[1450px] overflow-hidden rounded-xl bg-gradient-to-r from-primary-dark via-primary to-gradient-middle shadow-sm sm:h-[150px]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-16 left-[28%] h-28 w-[42%] rotate-[-8deg] rounded-[50%] bg-gradient-to-r from-accent via-accent-light to-primary-light opacity-90"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-20 left-[40%] h-28 w-[38%] rotate-[7deg] rounded-[50%] bg-gradient-to-r from-gradient-middle to-primary-light"
        />

        <div className="relative z-10 flex w-1/2 flex-col justify-center pl-4 sm:w-[38%] sm:pl-6">
          <h2 className="text-sm font-bold leading-tight text-surface sm:text-base">
            Big Tech Deals
          </h2>
          <p className="text-sm font-extrabold leading-tight text-surface sm:text-base">
            Up to <span className="text-accent">50% OFF</span>
          </p>
          <p className="mt-0.5 text-[8px] font-medium text-surface/90 sm:text-[9px]">
            Mobiles | Laptops | Audio | Wearables
          </p>
          <button
            type="button"
            className="mt-1.5 flex w-fit items-center gap-1 rounded-full bg-surface px-2.5 py-1 text-[8px] font-bold text-primary-dark transition-colors hover:bg-accent"
          >
            Explore Deals <span aria-hidden="true">→</span>
          </button>
        </div>

        <svg
          role="img"
          aria-label="Laptop, smartphone, smartwatch, earbuds and portable speaker"
          viewBox="0 0 410 120"
          preserveAspectRatio="xMidYMid meet"
          className="absolute bottom-0 left-[51%] z-[1] h-full w-[46%] overflow-visible sm:left-[34%] sm:w-[56%]"
        >
          <defs>
            <linearGradient id="offer-laptop-screen" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#18005b" />
              <stop offset="0.55" stopColor="#7b2cf5" />
              <stop offset="1" stopColor="#ff4dd8" />
            </linearGradient>
            <linearGradient id="offer-laptop-wave" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#47d8ff" />
              <stop offset="0.5" stopColor="#c536ff" />
              <stop offset="1" stopColor="#ff5ca8" />
            </linearGradient>
            <linearGradient id="offer-metal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#b9b8cb" />
            </linearGradient>
          </defs>

          <g>
            <path d="M37 18 Q37 14 42 14 H145 Q149 14 149 18 V80 H37 Z" fill="#17132d" />
            <path d="M42 19 H144 V75 H42 Z" fill="url(#offer-laptop-screen)" />
            <path d="M42 63 Q77 30 104 55 T144 37 V75 H42 Z" fill="url(#offer-laptop-wave)" opacity=".9" />
            <path d="M27 81 H159 L173 91 Q174 94 168 95 H19 Q14 94 18 91 Z" fill="url(#offer-metal)" />
            <path d="M75 82 H111 L116 87 H70 Z" fill="#8a8998" />
          </g>

          <g transform="translate(165 54)">
            <rect x="0" y="0" width="32" height="52" rx="7" fill="#15131f" />
            <rect x="3" y="5" width="26" height="42" rx="4" fill="url(#offer-laptop-screen)" />
            <circle cx="16" cy="50" r="1" fill="#d8d8e2" />
            <circle cx="8" cy="10" r="1.4" fill="#09080e" />
            <circle cx="13" cy="10" r="1.4" fill="#09080e" />
          </g>

          <g transform="translate(201 54)">
            <path d="M7 9 Q7 3 14 3 H34 Q41 3 41 10 V46 Q41 53 34 53 H14 Q7 53 7 46 Z" fill="#20202a" />
            <rect x="11" y="10" width="26" height="35" rx="3" fill="#161925" />
            <text x="24" y="32" textAnchor="middle" fill="#65f5d0" fontSize="13" fontWeight="700">10</text>
            <path d="M12 47 H36" stroke="#6e6f79" strokeWidth="1" />
          </g>

          <g transform="translate(247 70)" fill="none" stroke="#f4f3fa" strokeWidth="4">
            <path d="M5 19 V12 A10 10 0 0 1 25 12 V19" />
            <rect x="2" y="17" width="7" height="13" rx="3.5" fill="#f4f3fa" stroke="none" />
            <rect x="21" y="17" width="7" height="13" rx="3.5" fill="#f4f3fa" stroke="none" />
            <path d="M17 25 Q22 29 27 25" strokeWidth="2" />
          </g>

          <g transform="translate(279 65)">
            <rect x="0" y="0" width="61" height="36" rx="12" fill="#16151d" />
            <path d="M7 7 H54" stroke="#484650" strokeWidth="1.5" />
            <circle cx="15" cy="18" r="7" fill="#292832" stroke="#5b5965" strokeWidth="1.5" />
            <circle cx="46" cy="18" r="7" fill="#292832" stroke="#5b5965" strokeWidth="1.5" />
            <text x="30.5" y="22" textAnchor="middle" fill="#f7f5fa" fontSize="9" fontWeight="800">JBL</text>
          </g>
        </svg>

        <div className="absolute right-2 top-1/2 z-20 flex h-[96px] w-[66px] -translate-y-1/2 rotate-[8deg] flex-col items-center justify-center rounded-lg bg-gradient-to-b from-accent to-accent-dark text-center text-primary-dark shadow-lg sm:right-4 sm:h-[108px] sm:w-[74px]">
          <span className="text-[11px] font-black leading-none sm:text-xs">MEGA</span>
          <span className="mt-0.5 text-lg font-black leading-none sm:text-xl">SALE</span>
          <span className="mt-0.5 text-[9px] font-extrabold leading-none sm:text-[10px]">
            50% OFF
          </span>
        </div>
      </div>
    </section>
  );
};

export default OfferBanner;
