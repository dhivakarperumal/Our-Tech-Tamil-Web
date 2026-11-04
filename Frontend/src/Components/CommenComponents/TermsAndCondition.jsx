import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Box,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  CreditCard,
  FileText,
  Globe,
  Headphones,
  Lock,
  Package,
  RefreshCcw,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Truck,
  UserCircle,
  Zap,
} from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

const sections = [
  {
    num: "01",
    icon: Globe,
    title: "Website Usage",
    bullets: [
      "Users agree to access this website only for lawful purposes and not to engage in activities that may harm, disrupt, or compromise the functionality or security of the website.",
      "Any attempt to gain unauthorized access to the website, servers, or databases associated with the platform is strictly prohibited.",
    ],
  },
  {
    num: "02",
    icon: UserCircle,
    title: "User Accounts",
    bullets: [
      "Customers may create an account to place orders and track their purchases. Users are responsible for maintaining the confidentiality of their account credentials.",
      "Any activity performed under your account will be considered your responsibility.",
    ],
  },
  {
    num: "03",
    icon: Box,
    title: "Product Information",
    bullets: [
      "We make every effort to ensure product descriptions, images, and pricing are accurate. However, variations may occur due to manufacturing differences, photography, and the way screens display colors.",
      "Product specifications and included accessories are listed on each product page. Please review those details before placing an order.",
    ],
  },
  {
    num: "04",
    icon: Zap,
    title: "Color Variation Disclaimer",
    bullets: [
      "The colors of products displayed on our website may vary slightly from the actual product due to differences in screen resolution, lighting conditions, and device display settings.",
    ],
  },
  {
    num: "05",
    icon: CreditCard,
    title: "Pricing & Payments",
    bullets: [
      "All prices listed on the website are in Indian Rupees (Rs.) unless otherwise stated. Prices are subject to change without prior notice.",
      "Payment must be completed during checkout using secure payment methods. Orders will only be processed after successful payment confirmation.",
    ],
  },
  {
    num: "06",
    icon: Package,
    title: "Product Availability",
    bullets: [
      "While we strive to maintain accurate inventory levels, certain products may become unavailable due to high demand or technical errors. In such cases, customers will be notified and refunded if payment has already been made.",
    ],
  },
  {
    num: "07",
    icon: BadgeCheck,
    title: "Order Confirmation",
    bullets: [
      "After placing an order, customers will receive an order confirmation via email or SMS. This confirmation does not guarantee acceptance of the order.",
      "We reserve the right to cancel orders due to product unavailability, payment verification issues, or suspected fraudulent activity.",
    ],
  },
  {
    num: "08",
    icon: Ban,
    title: "Order Cancellation",
    bullets: [
      "Customers may cancel orders before the product is shipped. Once the product has been dispatched, cancellations may not be possible.",
    ],
  },
  {
    num: "09",
    icon: Truck,
    title: "Shipping Policy",
    bullets: [
      "Orders are usually processed within 1-2 business days after payment confirmation.",
      "Domestic delivery: 3-7 business days.",
      "International delivery: 7-15 business days.",
      "Tracking details will be provided once the order is shipped.",
      "Delivery timelines may vary depending on courier services and location.",
    ],
  },
  {
    num: "10",
    icon: RefreshCcw,
    title: "Return & Refund Policy",
    bullets: [
      "Returns are accepted only for damaged or incorrect products reported within 48 hours of delivery.",
      "Product must be unused and in its original packaging with tags intact.",
      "Clear photos of the issue must be provided.",
      "Refunds will be processed within 5-7 business days after inspection of the returned item.",
    ],
  },
  {
    num: "11",
    icon: Lock,
    title: "Privacy Policy",
    bullets: [
      "We respect your privacy and are committed to protecting your personal information. Customer data is used only for order processing, delivery, and improving user experience.",
      "Customer details such as name, phone number, and address are collected.",
      "Information is used only for order processing and delivery.",
      "We do not sell or share personal data with third parties.",
    ],
  },
  {
    num: "12",
    icon: ShieldAlert,
    title: "Fraud Prevention",
    bullets: [
      "We reserve the right to cancel orders if fraudulent activity, unauthorized payment methods, or suspicious transactions are detected.",
    ],
  },
  {
    num: "13",
    icon: ShieldCheck,
    title: "Intellectual Property",
    bullets: [
      "All website content including images, designs, logos, graphics, and text are the property of our brand and protected by copyright laws.",
    ],
  },
  {
    num: "14",
    icon: FileText,
    title: "Force Majeure",
    bullets: [
      "We shall not be liable for delays or failure to perform obligations due to events beyond our control such as natural disasters, pandemics, transportation disruptions, or government restrictions.",
    ],
  },
  {
    num: "15",
    icon: Scale,
    title: "Governing Law",
    bullets: [
      "These Terms & Conditions are governed by the laws of India. Any disputes shall be subject to the jurisdiction of courts in Tamil Nadu.",
    ],
  },
];

const TermsAndConditions = () => {
  const [activeSection, setActiveSection] = useState("01");

  return (
    <main className="bg-[#fcfaff] pb-8">
      <PageHeader title="Terms & Conditions" />
      <PageContainer className="pt-4 sm:pt-5">
      

        <div className="mt-4 grid items-start gap-3 lg:grid-cols-[246px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-[#eadcfb] bg-white p-2 shadow-[0_3px_12px_rgba(87,31,145,0.06)] lg:sticky lg:top-5">
            <div className="flex items-center gap-3 rounded-xl bg-[#faf6ff] px-3 py-2.5">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0e2ff] text-primary">
                <ClipboardList size={23} aria-hidden="true" />
              </span>
              <div>
                <h2 className="text-sm font-extrabold text-[#17122b]">Quick Navigation</h2>
                <p className="text-[11px] text-[#626078]">Browse policy sections</p>
              </div>
            </div>

            <nav aria-label="Terms and conditions sections" className="mt-2 grid max-h-56 grid-cols-2 gap-x-2 gap-y-2 overflow-y-auto sm:grid-cols-3 lg:max-h-none lg:grid-cols-1 lg:gap-y-1.5">
              {sections.map(({ num, title }) => (
                <a
                  key={num}
                  href={`#terms-${num}`}
                  onClick={() => setActiveSection(num)}
                  aria-current={activeSection === num ? "location" : undefined}
                  className={`flex min-w-0 items-center gap-2 rounded-lg border-b border-[#eee7f5] px-2 py-2.5 text-[11px] transition last:border-b-0 sm:text-xs lg:rounded-none lg:py-2.5 lg:text-[11px] ${
                    activeSection === num
                      ? "bg-[#f0ddff] font-bold text-primary"
                      : "text-[#29243c] hover:bg-[#faf6ff] hover:text-primary"
                  }`}
                >
                  <span className="shrink-0 font-semibold">{num}</span>
                  <span className="truncate">{title}</span>
                  {activeSection === num && <ChevronRight size={14} className="ml-auto shrink-0" aria-hidden="true" />}
                </a>
              ))}
            </nav>

            <div className="mt-3 rounded-xl bg-[#f5eaff] p-3">
              <div className="flex items-start gap-2.5">
                <Headphones size={26} className="mt-0.5 shrink-0 text-primary" aria-hidden="true" />
                <div>
                  <h3 className="text-xs font-extrabold text-[#17122b]">Need Assistance?</h3>
                  <p className="mt-0.5 text-[10px] leading-4 text-[#55516b]">
                    Have questions about our policies? Our support team is here to help.
                  </p>
                </div>
              </div>
              <Link
                to="/contactus"
                className="mt-2 flex items-center justify-center gap-2 rounded-full border border-primary bg-white px-3 py-2 text-[11px] font-bold text-primary transition hover:bg-primary hover:text-white"
              >
                Contact Support <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
          </aside>

          <div className="min-w-0 space-y-3">
            <section className="flex flex-col gap-3 rounded-2xl border border-[#e6d3fc] bg-white p-4 shadow-[0_3px_12px_rgba(87,31,145,0.06)] sm:flex-row sm:items-center sm:px-5 sm:py-3.5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f1e4ff] text-primary sm:h-[58px] sm:w-[58px]">
                <Scale size={28} aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-extrabold leading-tight text-[#17122b] sm:text-xl">Welcome to Our Tech</h2>
                <p className="mt-0.5 text-xs leading-[1.4] text-[#39364b] sm:text-[13px]">
                  Welcome to Our Tech. By accessing, browsing, or using this website, you agree to comply with the following Terms &amp; Conditions. These terms apply to all visitors, customers, and users of our website and services.
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2 border-t border-[#cbb1e7] pt-2 text-xs sm:ml-2 sm:border-l sm:border-t-0 sm:py-1 sm:pl-5 sm:pr-1">
                <CalendarDays size={23} className="text-primary" aria-hidden="true" />
                <div>
                  <p className="font-bold text-[#17122b]">Last Updated</p>
                  <p className="text-[#55516b]">12 Oct 2026</p>
                </div>
              </div>
            </section>

            {sections.map(({ num, icon: Icon, title, bullets }) => (
              <section
                id={`terms-${num}`}
                key={num}
                className="scroll-mt-24 grid grid-cols-[62px_minmax(0,1fr)] gap-x-3 gap-y-1.5 rounded-2xl border border-[#eadcfb] bg-white px-3.5 py-3 shadow-[0_3px_12px_rgba(87,31,145,0.06)] sm:grid-cols-[68px_minmax(0,1fr)] sm:gap-x-4 sm:px-5 sm:py-3"
              >
                <div className="row-span-2 flex flex-col items-center gap-1.5 border-r border-[#cbb1e7] pr-3">
                  <span className="flex h-7 w-11 items-center justify-center rounded-lg bg-gradient-to-r from-[#8500c9] to-[#b000dc] text-xs font-extrabold text-white">
                    {num}
                  </span>
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f5eaff] text-primary">
                    <Icon size={23} aria-hidden="true" />
                  </span>
                </div>
                <h2 className="self-center text-sm font-extrabold leading-5 text-[#17122b] sm:text-base">{title}</h2>
                <ul className="min-w-0 space-y-1">
                  {bullets.map((bullet, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-[1.45] text-[#29263d] sm:text-xs">
                      <span className="mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-[#9400cf]" aria-hidden="true" />
                      <span>{bullet}</span>
                    </li>
                  ))}
                </ul>
              </section>
            ))}

            <section className="relative flex min-h-[100px] flex-col justify-center gap-4 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4b0d8c] via-[#8f16cf] to-[#b532dc] px-5 py-4 text-white shadow-sm sm:min-h-[112px] sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="relative z-10 flex items-start gap-3">
                <Headphones size={40} className="shrink-0 text-white" aria-hidden="true" />
                <div className="max-w-md">
                  <h2 className="text-lg font-extrabold leading-tight sm:text-xl">Still Have Questions?</h2>
                  <p className="mt-1 text-[11px] leading-4 text-white/90 sm:text-xs">
                    If you need clarification about our terms and conditions, feel free to get in touch with our customer support team.
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="relative z-10 inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-full bg-white px-5 py-2.5 text-xs font-extrabold text-primary shadow transition hover:bg-[#f0e7ff] sm:self-center"
              >
                Contact Us <ArrowRight size={15} aria-hidden="true" />
              </Link>
              <img
                src="/images/loginimage.png"
                alt=""
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 right-[18%] hidden h-28 w-64 object-contain opacity-90 lg:block"
              />
            </section>
          </div>
        </div>
      </PageContainer>
    </main>
  );
};

export default TermsAndConditions;