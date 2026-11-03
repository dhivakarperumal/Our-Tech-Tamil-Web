import { useState } from "react";
import {
  ChevronDown,
  Users,
  ShoppingBag,
  Headphones,
  Shield,
  Truck,
  Star,
  Rocket,
  ShoppingCart,
  Trophy,
  Target,
  Eye,
  BadgeCheck,
  Tag,
  Play,
  MessageCircleQuestion,
} from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

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
  const [openFaq, setOpenFaq] = useState(null);
  const faqs = [
    {
      question: "What kind of products can I shop for at Our Tech?",
      answer:
        "We offer a selection of electronics and gadgets, including mobile phones, laptops, and tech accessories. Please check each product page for its specifications and included items.",
    },
    {
      question: "How long does delivery take?",
      answer:
        "Orders are usually processed within 1–2 business days. Domestic delivery typically takes 3–7 business days, depending on your location and courier service.",
    },
    {
      question: "Can I cancel an order after placing it?",
      answer:
        "You may request cancellation before your order has shipped. Once it has been dispatched, cancellation may no longer be possible.",
    },
    {
      question: "What should I do if my order arrives damaged or incorrect?",
      answer:
        "Contact our support team within 48 hours of delivery and provide clear photos of the issue. Returned items must be unused and in their original packaging.",
    },
    {
      question: "How can I check my order status?",
      answer:
        "Create an account to view and track your purchases. Shipping tracking details are provided after your order has been dispatched.",
    },
  ];

  return (
    <div className="bg-[#faf9fc] pb-0">

     <PageHeader title="About Us" />

      {/* ── WHO WE ARE ───────────────────────────────────────── */}
      <section className="py-10 sm:py-14">
        <PageContainer>
          <div className="grid items-center gap-7 lg:grid-cols-2 lg:gap-10">
            <div className="relative overflow-hidden rounded-2xl bg-[#23094c] shadow-[0_12px_30px_rgba(47,12,86,0.2)]">
              <img
                src="/images/loginbanner.png"
                alt="Our Tech collection of gadgets and electronics"
                className="aspect-[16/9] h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1b063f]/45 via-transparent to-transparent" aria-hidden="true" />
              <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-primary/90 text-white shadow-[0_0_0_8px_rgba(255,255,255,0.18)] sm:h-16 sm:w-16">
                  <Play size={24} className="ml-1 fill-current" />
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <span className="inline-flex items-center gap-2 text-[10px] font-extrabold uppercase tracking-[0.2em] text-primary sm:text-xs">
                <span className="h-px w-7 bg-gradient-to-r from-primary to-gradient-middle" aria-hidden="true" />
                Who We Are
                <span className="h-px w-7 bg-gradient-to-r from-primary to-gradient-middle" aria-hidden="true" />
              </span>
              <h2 className="text-2xl font-extrabold leading-tight text-[#1a0745] sm:text-3xl">
                Our Tech Gadgets Store
              </h2>
              <p className="text-sm leading-6 text-gray-600">
                We are a technology retail platform dedicated to bringing you a wide range of genuine electronics and accessories at the best prices. From laptops and mobile phones to smart accessories, we make it easy to shop for quality tech with confidence.
              </p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { icon: Shield, label: "Genuine Products" },
                  { icon: Truck, label: "Fast & Safe Delivery" },
                  { icon: Headphones, label: "Dedicated Support" },
                ].map(({ icon: Icon, label }) => (
                  <div key={label} className="flex min-w-0 items-center gap-2 text-[10px] font-bold leading-4 text-[#33284a] sm:text-xs">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#f1e6fc] text-primary">
                      <Icon size={16} aria-hidden="true" />
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 sm:gap-3">
                <StatCard icon={Users} value="50K+" label="Happy Customers" />
                <StatCard icon={ShoppingBag} value="10K+" label="Products" />
                <StatCard icon={Headphones} value="24/7" label="Support" />
              </div>
            </div>
          </div>
        </PageContainer>
      </section>

      {/* ── MISSION, VISION, FAQ, VALUES & WHY CHOOSE US ────── */}
      <section className="py-10 sm:py-14">
        <PageContainer>
          <div className="grid gap-4 md:grid-cols-2">
            <article className="flex items-start gap-4 rounded-2xl border border-[#eadcf6] bg-white p-5 shadow-[0_8px_24px_rgba(74,27,120,0.08)] sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0e2ff] text-primary">
                <Target size={23} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#1a0745]">Our Mission</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  To deliver high-quality gadgets and a seamless shopping experience with trust, value, and great customer support.
                </p>
              </div>
            </article>

            <article className="flex items-start gap-4 rounded-2xl border border-[#eadcf6] bg-white p-5 shadow-[0_8px_24px_rgba(74,27,120,0.08)] sm:p-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#f0e2ff] text-primary">
                <Eye size={23} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-base font-extrabold text-[#1a0745]">Our Vision</h2>
                <p className="mt-1 text-sm leading-6 text-gray-600">
                  To be a leading and trusted tech store, bringing the latest technology to everyone for a smarter lifestyle.
                </p>
              </div>
            </article>
          </div>

          <div className="my-8 rounded-3xl bg-white py-8 sm:my-10 sm:py-10">
            <div className="grid items-start gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:gap-10">
              <div>
                <div className="mb-6">
                  <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-[#f3eaff] px-4 py-1 text-xs font-semibold text-primary">
                    <MessageCircleQuestion size={15} aria-hidden="true" />
                    FAQ
                  </span>
                  <h2 className="mt-3 text-2xl font-extrabold text-[#1a0745] sm:text-3xl">
                    Frequently Asked Questions
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    Find quick answers to common questions about shopping with us.
                  </p>
                </div>

                <div className="space-y-3">
                  {faqs.map(({ question, answer }, index) => {
                    const isOpen = openFaq === index;
                    const answerId = `about-faq-answer-${index}`;

                    return (
                      <article
                        key={question}
                        className="overflow-hidden rounded-2xl border border-[#eadcf6] bg-white shadow-[0_4px_16px_rgba(74,27,120,0.06)]"
                      >
                        <h3>
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-controls={answerId}
                            onClick={() => setOpenFaq(isOpen ? null : index)}
                            className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left text-sm font-bold text-[#1a0745] transition hover:bg-[#fcf9ff] sm:px-5"
                          >
                            {question}
                            <ChevronDown
                              size={18}
                              className={`shrink-0 text-primary transition-transform ${isOpen ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        </h3>
                        {isOpen && (
                          <div id={answerId} className="border-t border-[#f0e8f8] px-4 py-4 text-sm leading-6 text-gray-600 sm:px-5">
                            {answer}
                          </div>
                        )}
                      </article>
                    );
                  })}
                </div>
              </div>

              <div>
                <div className="mb-6">
                  <span className="inline-block rounded-full border border-primary/25 bg-[#f3eaff] px-4 py-1 text-xs font-semibold text-primary">
                    Our Values
                  </span>
                  <h2 className="mt-3 text-2xl font-extrabold text-[#1a0745] sm:text-3xl">
                    What We Stand For
                  </h2>
                  <p className="mt-2 text-sm text-gray-500">
                    The principles behind every order and customer experience.
                  </p>
                </div>
                <div className="space-y-3">
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
              </div>
            </div>
          </div>

          <div className="mt-5 rounded-3xl border border-[#eadcf6] bg-gradient-to-br from-[#fbf7ff] via-[#f5edff] to-[#fdf9ff] p-5 shadow-[0_12px_30px_rgba(74,27,120,0.08)] sm:mt-6 sm:p-8">
            <div className="mb-5 flex items-center gap-3 sm:mb-6">
              <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c89af1] to-[#a855f7]" />
              <h2 className="shrink-0 text-center text-lg font-extrabold text-[#1a0745] sm:text-xl">
                Why Choose Us?
              </h2>
              <span className="h-px flex-1 bg-gradient-to-l from-transparent via-[#c89af1] to-[#a855f7]" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                {
                  icon: BadgeCheck,
                  title: "Trusted Store",
                  description: "Carefully selected products from reliable brands.",
                },
                {
                  icon: Tag,
                  title: "Best Prices",
                  description: "Great value on quality tech and accessories.",
                },
                {
                  icon: Truck,
                  title: "Quick Delivery",
                  description: "Fast, dependable delivery across India.",
                },
                {
                  icon: Headphones,
                  title: "Customer Support",
                  description: "Friendly help whenever you need us.",
                },
              ].map(({ icon: Icon, title, description }) => (
                <article
                  key={title}
                  className="flex items-center gap-3 rounded-xl border border-[#eadcf6] bg-white/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3eaff] text-primary">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <div>
                    <h3 className="text-sm font-extrabold text-[#1a0745]">{title}</h3>
                    <p className="mt-0.5 text-xs leading-5 text-gray-500">{description}</p>
                  </div>
                </article>
              ))}
            </div>
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

    </div>
  );
};

export default AboutUs;
