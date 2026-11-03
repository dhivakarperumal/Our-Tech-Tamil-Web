import { Link } from "react-router-dom";
import {
  Users,
  ShoppingBag,
  Headphones,
  Shield,
  Truck,
  Star,
  Rocket,
  ShoppingCart,
  Trophy,
} from "lucide-react";
import PageContainer from "./PageContainer";

/* ─── Stat Card ─────────────────────────────────────────── */
const StatCard = ({ icon: Icon, value, label }) => (
  <div className="flex flex-col items-center gap-1 rounded-2xl border border-[#e9def5] bg-white px-6 py-4 text-center shadow-sm">
    <Icon size={28} className="text-primary" />
    <span className="text-xl font-extrabold text-[#1a0745]">{value}</span>
    <span className="text-xs font-semibold text-gray-500">{label}</span>
  </div>
);

/* ─── Value Card ─────────────────────────────────────────── */
const ValueCard = ({ icon: Icon, title, desc }) => (
  <div className="flex items-start gap-3 rounded-2xl bg-[#f8f4ff] px-5 py-4">
    <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-gradient-middle text-white shadow">
      <Icon size={19} />
    </span>
    <div>
      <p className="font-bold text-[#1a0745]">{title}</p>
      <p className="mt-0.5 text-xs text-gray-500 leading-relaxed">{desc}</p>
    </div>
  </div>
);

/* ─── Timeline Step ──────────────────────────────────────── */
const TimelineStep = ({ icon: Icon, year, title, desc, isLast }) => (
  <div className="relative flex flex-col items-center text-center px-3">
    {/* connector line */}
    {!isLast && (
      <div className="absolute top-5 left-1/2 h-px w-full bg-gradient-to-r from-primary/60 to-gradient-middle/60" />
    )}
    <span className="relative z-10 mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gradient-middle text-white shadow-md">
      <Icon size={18} />
    </span>
    <span className="text-base font-extrabold text-primary">{year}</span>
    <span className="mt-0.5 text-sm font-bold text-[#1a0745]">{title}</span>
    <span className="mt-0.5 text-xs text-gray-500 leading-relaxed">{desc}</span>
  </div>
);

/* ─── Main Component ─────────────────────────────────────── */
const AboutUs = () => {
  return (
    <div className="bg-[#faf9fc] pb-0">

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#f3e8ff] via-[#ede0ff] to-[#e8d5ff] py-16">
        {/* decorative blobs */}
        <div className="pointer-events-none absolute -top-16 -right-16 h-72 w-72 rounded-full bg-gradient-to-br from-primary/20 to-gradient-middle/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-56 w-56 rounded-full bg-gradient-to-br from-gradient-middle/20 to-primary/10 blur-2xl" />

        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left */}
            <div className="space-y-5">
              <span className="inline-block rounded-full border border-primary/25 bg-white/70 px-4 py-1 text-xs font-semibold text-primary shadow-sm backdrop-blur">
                About Us
              </span>
              <h1 className="text-4xl font-extrabold leading-tight text-[#1a0745] sm:text-5xl">
                Your Trusted <br className="hidden sm:block" />
                <span className="bg-gradient-to-r from-primary to-gradient-middle bg-clip-text text-transparent">
                  Gadgets Store
                </span>
              </h1>
              <p className="max-w-md text-base text-gray-600 leading-relaxed">
                We bring a wide range of quality tech products to your
                fingertips — from electronics to accessories, all in one place.
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-primary to-gradient-middle px-6 py-3 text-sm font-bold text-white shadow-lg transition hover:brightness-110 hover:-translate-y-0.5"
              >
                Shop Now →
              </Link>
            </div>

            {/* Right – decorative graphic */}
            <div className="flex justify-center">
              <div className="relative flex h-64 w-64 items-center justify-center sm:h-80 sm:w-80">
                {/* glow ring */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/30 to-gradient-middle/20 blur-2xl" />
                {/* inner circle */}
                <div className="relative flex h-52 w-52 flex-col items-center justify-center gap-3 rounded-full bg-gradient-to-br from-primary to-gradient-middle shadow-2xl sm:h-64 sm:w-64">
                  <ShoppingBag size={56} className="text-white/90" />
                  <span className="text-lg font-extrabold text-white">Our Tech</span>
                  <span className="text-xs font-semibold text-white/70 tracking-widest uppercase">Gadgets Store</span>
                </div>
                {/* floating badges */}
                <span className="absolute top-2 right-2 flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-xl text-2xl">
                  🎮
                </span>
                <span className="absolute bottom-4 left-0 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl text-xl">
                  💻
                </span>
                <span className="absolute top-10 -left-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent shadow-xl text-xl">
                  🎧
                </span>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ── WHO WE ARE ───────────────────────────────────────── */}
      <section className="py-16">
        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left – office image placeholder */}
            <div className="relative">
              <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#e9d5ff] to-[#f3e8ff] shadow-xl">
                <div className="flex h-64 items-center justify-center sm:h-80">
                  <div className="flex flex-col items-center gap-3 text-primary/60">
                    <ShoppingBag size={72} strokeWidth={1.2} />
                    <span className="text-lg font-bold text-primary">Our Tech</span>
                    <span className="text-xs font-semibold tracking-widest uppercase text-primary/50">Gadgets Store</span>
                  </div>
                </div>
              </div>
              {/* accent badge */}
              <div className="absolute -bottom-4 -right-4 rounded-2xl border border-[#e9def5] bg-white px-5 py-3 shadow-lg">
                <p className="text-[11px] font-semibold text-gray-500">Est.</p>
                <p className="text-2xl font-extrabold text-primary">2020</p>
              </div>
            </div>

            {/* Right */}
            <div className="space-y-5">
              <span className="inline-block rounded-full border border-primary/25 bg-[#f3eaff] px-4 py-1 text-xs font-semibold text-primary">
                Who We Are
              </span>
              <h2 className="text-3xl font-extrabold text-[#1a0745] sm:text-4xl">
                About Our Tech
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                Our Tech is your go-to online destination for all things gadgets and electronics.
                We offer a curated selection of high-quality products — from smartphones and laptops
                to gaming gear and accessories — paired with great deals, secure payments, and fast
                delivery right to your door.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <StatCard icon={Users} value="50K+" label="Happy Customers" />
                <StatCard icon={ShoppingBag} value="10K+" label="Products" />
                <StatCard icon={Headphones} value="24/7" label="Support" />
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ── OUR VALUES ───────────────────────────────────────── */}
      <section className="py-16 bg-white">
        <PageContainer>
          <div className="mb-10 text-center space-y-2">
            <span className="inline-block rounded-full border border-primary/25 bg-[#f3eaff] px-4 py-1 text-xs font-semibold text-primary">
              Our Values
            </span>
            <h2 className="text-3xl font-extrabold text-[#1a0745] sm:text-4xl">
              What We Stand For
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <ValueCard
              icon={Star}
              title="Quality First"
              desc="Premium products with trusted brands you can rely on."
            />
            <ValueCard
              icon={Shield}
              title="Secure Shopping"
              desc="Your data and payments are always safe with us."
            />
            <ValueCard
              icon={Truck}
              title="Fast Delivery"
              desc="Quick, reliable and on-time delivery to your door."
            />
            <ValueCard
              icon={Headphones}
              title="Customer Care"
              desc="We're here to help you, always — 24/7 support."
            />
          </div>
        </PageContainer>
      </section>

      {/* ── OUR JOURNEY ──────────────────────────────────────── */}
      <section className="py-16">
        <PageContainer>
          <div className="grid items-start gap-10 lg:grid-cols-[1fr_2fr]">
            {/* Left text */}
            <div className="space-y-4">
              <span className="inline-block rounded-full border border-primary/25 bg-[#f3eaff] px-4 py-1 text-xs font-semibold text-primary">
                Our Journey
              </span>
              <h2 className="text-3xl font-extrabold text-[#1a0745] sm:text-4xl">
                Growing With You
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                From a simple idea to a trusted online store, our journey has
                been about one goal — making tech shopping smarter, easier, and
                more enjoyable for everyone.
              </p>
            </div>

            {/* Timeline */}
            <div className="relative grid grid-cols-2 gap-6 sm:grid-cols-4">
              <TimelineStep
                icon={Rocket}
                year="2020"
                title="The Beginning"
                desc="Launched with a simple vision for better tech shopping."
              />
              <TimelineStep
                icon={ShoppingCart}
                year="2022"
                title="Expanding"
                desc="Added new product categories and partnerships."
              />
              <TimelineStep
                icon={Users}
                year="2024"
                title="Growing Community"
                desc="Reached 50K+ happy customers milestone."
              />
              <TimelineStep
                icon={Trophy}
                year="2025"
                title="And Beyond"
                desc="Continuing to deliver a better shopping experience."
                isLast
              />
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ── JOIN CTA ──────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-[#2d0060] via-primary to-[#7200d6] py-16">
        {/* blobs */}
        <div className="pointer-events-none absolute -top-20 right-0 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 left-10 h-56 w-56 rounded-full bg-white/5 blur-2xl" />

        <PageContainer>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            {/* Left */}
            <div className="space-y-5">
              <h2 className="text-3xl font-extrabold text-white sm:text-4xl leading-tight">
                Join Our Shopping Family
              </h2>
              <p className="text-base text-white/75">
                Be a part of thousands of happy shoppers today!
              </p>
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-white px-7 py-3 text-sm font-bold text-primary shadow-xl transition hover:bg-white/90 hover:-translate-y-0.5"
              >
                Shop Now →
              </Link>
            </div>

            {/* Right – decorative */}
            <div className="flex justify-center gap-6">
              <div className="flex flex-col items-center justify-end gap-3">
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-4xl shadow-xl border border-white/20">
                  🎧
                </span>
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-3xl shadow-xl border border-white/20">
                  ⌚
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-3">
                <span className="flex h-24 w-24 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-5xl shadow-xl border border-white/20">
                  💻
                </span>
              </div>
              <div className="flex flex-col items-center justify-end gap-3">
                <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-3xl shadow-xl border border-white/20">
                  🎮
                </span>
                <span className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/10 backdrop-blur text-4xl shadow-xl border border-white/20">
                  📱
                </span>
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

    </div>
  );
};

export default AboutUs;
