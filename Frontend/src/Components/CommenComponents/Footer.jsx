import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  ChevronRight,
  FileText,
  Gamepad2,
  Grid2X2,
  Headphones,
  House,
  Info,
  Laptop,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
  Smartphone,
  Watch,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import api from "../../api";
import PageContainer from "./PageContainer";

const CURRENT_YEAR = new Date().getFullYear();

const quickLinks = [
  { label: "Home", to: "/", Icon: House },
  { label: "Shop", to: "/shop", Icon: ShoppingBag },
  { label: "Articles", to: "/articles", Icon: FileText },
  { label: "About Us", to: "/about", Icon: Info },
  { label: "Contact Us", to: "/contactus", Icon: Mail },
];

const getCategoryIcon = (name = "") => {
  const normalized = name.toLowerCase();
  if (/mobile|phone/.test(normalized)) return Smartphone;
  if (/laptop|computer/.test(normalized)) return Laptop;
  if (/audio|headphone|speaker/.test(normalized)) return Headphones;
  if (/watch|wearable/.test(normalized)) return Watch;
  if (/game/.test(normalized)) return Gamepad2;
  return Package;
};

const Footer = () => {
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    let active = true;

    api.get("/categories")
      .then(({ data }) => {
        if (active) {
          const activeCategories = (Array.isArray(data) ? data : [])
            .filter((category) => (category.status || "Active") === "Active")
            .sort((first, second) => Number(first.id) - Number(second.id));
          setCategories(activeCategories);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch footer categories:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const linkClass =
    "group flex w-fit items-center gap-3 text-sm text-white/85 transition-colors hover:text-white";
  const headingClass =
    "mb-4 flex items-center gap-3 text-lg font-extrabold text-white";

  return (
    <footer className="site-footer relative isolate mt-16 overflow-hidden text-white">
      <svg
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 w-full opacity-70"
        viewBox="0 0 1600 220"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 10 C220 80 265 160 500 170 C740 180 850 100 1040 125 C1260 155 1390 220 1600 70 V220 H0 Z" fill="#4B00C8" opacity=".35" />
        <path d="M0 100 C200 45 310 150 540 190 C780 232 930 165 1110 140 C1310 110 1440 115 1600 0 V220 H0 Z" fill="#7B2CF5" opacity=".28" />
        <path d="M0 100 C200 45 310 150 540 190 C780 232 930 165 1110 140 C1310 110 1440 115 1600 0" fill="none" stroke="#a83be8" strokeWidth="2" opacity=".8" />
      </svg>

      <PageContainer className="!max-w-none !px-[5%] lg:!px-[4%]">
        <div className="grid gap-x-8 gap-y-9 py-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_0.95fr_0.95fr_1.2fr_1.2fr] lg:gap-x-6 lg:py-10 xl:gap-x-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link
              to="/"
              aria-label="Our Tech home"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/images/logo.jpeg"
                alt=""
                className="h-14 w-14 rounded-full bg-white object-cover shadow-md ring-2 ring-secondary-light ring-offset-2 ring-offset-secondary-dark"
              />
              <span className="flex flex-col leading-none">
                <span className="text-2xl font-extrabold tracking-tight text-white">
                  Our <span className="text-secondary-light">Tech</span>
                </span>
                <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white/85">
                  Gadgets Store
                </span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-7 text-white/80">
              Your one-stop destination for the latest gadgets, accessories,
              and smart tech at the best prices.
            </p>
            <div className="mt-5 flex items-center gap-2">
              {[
                { label: "Instagram", Icon: FaInstagram },
                { label: "YouTube", Icon: FaYoutube },
                { label: "Facebook", Icon: FaFacebookF },
                { label: "LinkedIn", Icon: FaLinkedinIn },
                { label: "X", Icon: FaXTwitter },
              ].map(({ label, Icon }) => (
                <span
                  key={label}
                  aria-label={label}
                  title={label}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 hover:text-secondary-light"
                >
                  <Icon size={17} aria-hidden="true" />
                </span>
              ))}
            </div>
          </div>

          <div className="border-white/15 sm:border-l sm:pl-6">
            <h2 className={headingClass}>
              <span className="text-secondary-light"><FileText size={22} aria-hidden="true" /></span>
              Quick Links
            </h2>
            <div className="mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-secondary-light to-gradient-middle" />
            <ul className="flex flex-col gap-3">
              {quickLinks.map(({ label, to, Icon }) => (
                <li key={label}>
                  <Link to={to} className={linkClass}>
                    <Icon size={19} aria-hidden="true" />
                    <span className="flex-1">{label}</span>
                    <ChevronRight size={16} className="opacity-0 transition group-hover:translate-x-1 group-hover:opacity-100" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="border-white/15 sm:border-l sm:pl-6">
            <h2 className={headingClass}>
              <span className="text-secondary-light"><Grid2X2 size={22} aria-hidden="true" /></span>
              Categories
            </h2>
            <div className="mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-secondary-light to-gradient-middle" />
            <ul className="flex flex-col gap-2.5">
              {categories.slice(0, 5).map((category) => {
                const CategoryIcon = getCategoryIcon(category.name);
                return (
                  <li key={category.catId || category.id || category.name}>
                    <Link to="/shop" className={linkClass}>
                      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-secondary-light">
                        <CategoryIcon size={17} aria-hidden="true" />
                      </span>
                      <span className="line-clamp-1">{category.name}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {categories.length > 0 && (
              <Link
                to="/#shop-by-category"
                className="mt-4 inline-flex items-center gap-2 rounded-full border border-secondary-light px-4 py-2 text-sm font-bold text-white transition hover:bg-secondary-light/15"
              >
                View All Categories
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            )}
          </div>

          <div className="border-white/15 sm:border-l sm:pl-6">
            <h2 className={headingClass}>
              <span className="text-secondary-light"><Headphones size={22} aria-hidden="true" /></span>
              Contact Information
            </h2>
            <div className="mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-secondary-light to-gradient-middle" />
            <ul className="flex flex-col gap-4">
              <li>
                <a href="tel:+919876543210" className={linkClass}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent">
                    <Phone size={18} aria-hidden="true" />
                  </span>
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a href="mailto:support@ourtechtamil.com" className={linkClass}>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent">
                    <Mail size={18} aria-hidden="true" />
                  </span>
                  support@ourtechtamil.com
                </a>
              </li>
              <li className="flex items-start gap-3 text-sm leading-6 text-white/85">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 text-accent">
                  <MapPin size={18} aria-hidden="true" />
                </span>
                <span>122, Tirupathur,<br />Tamil Nadu – 635601,<br />India</span>
              </li>
            </ul>
          </div>

          <div className="border-white/15 sm:col-span-2 sm:border-t sm:pt-6 lg:col-span-1 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
            <h2 className={headingClass}>
              <span className="text-secondary-light"><MapPin size={22} aria-hidden="true" /></span>
              Our Location
            </h2>
            <div className="mb-4 h-1 w-20 rounded-full bg-gradient-to-r from-secondary-light to-gradient-middle" />
            <a
              href="https://www.google.com/maps/search/?api=1&query=Tirupathur%2C+Tamil+Nadu+635601%2C+India"
              target="_blank"
              rel="noreferrer"
              aria-label="View Our Tech location on Google Maps"
              className="block overflow-hidden rounded-2xl border border-white/15 bg-white/10"
            >
              <iframe
                title="Our Tech location in Tirupathur"
                src="https://maps.google.com/maps?q=Tirupathur%2C%20Tamil%20Nadu%20635601%2C%20India&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="pointer-events-none h-48 w-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </a>
          </div>
        </div>

        <div className="flex flex-col gap-5 border-t border-white/20 py-5 text-sm text-white/85 lg:flex-row lg:items-center lg:justify-between">
          <p>© {CURRENT_YEAR} Our Tech. All Rights Reserved.</p>
          <nav aria-label="Legal links" className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link to="/termsandconditions" className="transition-colors hover:text-secondary-light">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link to="/termsandconditions" className="transition-colors hover:text-secondary-light">Terms &amp; Conditions</Link>
            <span aria-hidden="true">|</span>
            <Link to="/contactus" className="transition-colors hover:text-secondary-light">Shipping Policy</Link>
          </nav>
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <span className="mr-2 font-semibold">We Accept</span>
            {["VISA", "Mastercard", "RuPay", "UPI"].map((method) => (
              <span
                key={method}
                className="flex h-10 min-w-[64px] items-center justify-center rounded-md bg-white px-3 text-xs font-extrabold italic text-[#1f1650] shadow-sm"
              >
                {method === "Mastercard" ? (
                  <span className="flex items-center" aria-label="Mastercard">
                    <span className="h-5 w-5 rounded-full bg-red-500" />
                    <span className="-ml-2 h-5 w-5 rounded-full bg-amber-400/90" />
                  </span>
                ) : method}
              </span>
            ))}
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

export default Footer;
