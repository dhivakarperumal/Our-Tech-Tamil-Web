import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Ban,
  Box,
  CalendarDays,
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
import PageHeader from "../CommenComponents/PageHeader";
import PageContainer from "./PageContainer";

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
  return (
    <>
      <PageHeader title="Terms & Conditions" />

      <main className="bg-[#f5f0fc] py-8 sm:py-12">
        <PageContainer>
          <div className="space-y-4">

            {/* ── Hero Intro Card ── */}
            <div className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-[#ede4fb] px-6 py-6 sm:flex-row sm:items-center sm:gap-6 sm:px-8 sm:py-7">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-white shadow-sm text-primary">
                <Scale size={26} />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl font-extrabold text-[#17122b] sm:text-2xl">
                  Welcome to Our Tech
                </h1>
                <p className="mt-1 text-sm leading-6 text-[#525b70]">
                  Welcome to Our Tech. By accessing, browsing, or using this website, you agree to comply with the
                  following Terms &amp; Conditions. These terms apply to all visitors, customers, and users of our
                  website and services.
                </p>
              </div>
              <div className="flex shrink-0 self-start sm:self-auto">
                <div className="flex items-center gap-2 rounded-xl border border-[#d5c2f5] bg-white px-4 py-2.5 text-xs shadow-sm">
                  <CalendarDays size={15} className="text-primary" />
                  <div>
                    <p className="text-[11px] font-semibold text-[#525b70]">Last Updated</p>
                    <p className="font-extrabold text-[#17122b]">12 Oct 2026</p>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section Cards ── */}
            {sections.map(({ num, icon: Icon, title, bullets }) => (
              <div
                key={num}
                className="flex items-start gap-4 rounded-2xl border border-[#e4d8f8] bg-white px-5 py-5 shadow-sm sm:gap-6 sm:px-7 sm:py-6"
              >
                {/* Left: number + icon stacked, fixed width */}
                <div className="flex w-14 shrink-0 flex-col items-center gap-2 sm:w-16">
                  <span className="text-sm font-extrabold text-primary">{num}</span>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#ede4fb] text-primary">
                    <Icon size={22} />
                  </div>
                </div>

                {/* Right: title + bullets */}
                <div className="flex-1 min-w-0 pt-0.5">
                  <h2 className="text-base font-extrabold text-[#17122b] sm:text-lg">{title}</h2>
                  <ul className="mt-3 space-y-2">
                    {bullets.map((b, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm leading-6 text-[#525b70]">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                        {b}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}

            {/* ── Still Have Questions CTA ── */}
            <div className="relative flex flex-col items-start justify-between gap-6 overflow-hidden rounded-2xl bg-gradient-to-r from-[#4B00C8] via-[#7b00d4] to-[#B000D8] px-7 py-7 sm:flex-row sm:items-center sm:px-10 sm:py-8">
              <div className="flex items-start gap-4 z-10">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/20">
                  <Headphones size={24} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-white sm:text-2xl">
                    Still Have Questions?
                  </h3>
                  <p className="mt-1 max-w-md text-sm leading-6 text-white/80">
                    If you need clarification about our terms and conditions, feel free to get in touch
                    with our customer support team.
                  </p>
                </div>
              </div>
              <Link
                to="/contact"
                className="z-10 inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-7 py-3 text-sm font-extrabold text-primary shadow transition hover:bg-[#f0e7ff]"
              >
                Contact Us
                <ArrowRight size={16} />
              </Link>
              <div className="pointer-events-none absolute -right-12 -top-12 h-52 w-52 rounded-full bg-white/5" />
              <div className="pointer-events-none absolute -bottom-10 right-32 h-36 w-36 rounded-full bg-white/5" />
            </div>

          </div>
        </PageContainer>
      </main>
    </>
  );
};

export default TermsAndConditions;