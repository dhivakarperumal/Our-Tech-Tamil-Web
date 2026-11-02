import React from "react";
import { Link } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
  FaYoutube,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import PageContainer from "./PageContainer";

const Footer = () => {
  const linkClass =
    "w-fit text-sm text-white/85 transition-colors hover:text-secondary-light";

  return (
    <footer className="site-footer mt-20 text-white">
      <PageContainer className="!max-w-none !px-[5%] lg:!px-[3%]">
        <div className="grid grid-cols-1 gap-x-8 gap-y-10 py-10 sm:grid-cols-3 lg:grid-cols-5 lg:gap-x-10 lg:gap-y-8 lg:py-8">
          <div className="sm:col-span-3 lg:col-span-1">
            <Link
              to="/"
              aria-label="Our Tech home"
              className="inline-flex items-center gap-3"
            >
              <img
                src="/images/logo.jpeg"
                alt=""
                className="h-12 w-12 rounded-full bg-white object-cover shadow-md ring-2 ring-secondary-light ring-offset-2 ring-offset-secondary-dark"
              />
              <span className="flex flex-col leading-none">
                <span className="text-xl font-extrabold tracking-tight text-white">
                  Our <span className="text-secondary-light">Tech</span>
                </span>
                <span className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.3em] text-white/85">
                  Gadgets Store
                </span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/80">
              Your one-stop destination for the latest gadgets, accessories,
              and smart tech at the best prices.
            </p>
            <div className="mt-4 flex items-center gap-2">
              {[
                { label: "Instagram", Icon: FaInstagram },
                { label: "YouTube", Icon: FaYoutube },
                { label: "Facebook", Icon: FaFacebookF },
                { label: "LinkedIn", Icon: FaLinkedinIn },
                { label: "X", Icon: FaXTwitter },
              ].map(({ label, Icon }) => (
                <span
                  key={label}
                  aria-hidden="true"
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 hover:text-secondary-light"
                >
                  <Icon size={15} />
                </span>
              ))}
            </div>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold">Quick Links</h2>
            <ul className="flex flex-col gap-1.5">
              <li><Link to="/" className={linkClass}>Home</Link></li>
              <li><Link to="/shop" className={linkClass}>Shop</Link></li>
              <li><Link to="/shop" className={linkClass}>Deals</Link></li>
              <li><Link to="/shop" className={linkClass}>New Arrivals</Link></li>
              <li><Link to="/shop" className={linkClass}>Best Sellers</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold">Categories</h2>
            <ul className="flex flex-col gap-1.5">
              <li><Link to="/shop" className={linkClass}>Mobiles</Link></li>
              <li><Link to="/shop" className={linkClass}>Laptops</Link></li>
              <li><Link to="/shop" className={linkClass}>Audio</Link></li>
              <li><Link to="/shop" className={linkClass}>Wearables</Link></li>
              <li><Link to="/shop" className={linkClass}>Gaming</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold">Contact Information</h2>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="tel:+919876543210"
                  aria-label="Call +91 98765 43210"
                  className={`inline-flex items-center gap-2 break-all ${linkClass}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-accent">
                    <Phone size={15} aria-hidden="true" />
                  </span>
                  +91 98765 43210
                </a>
              </li>
              <li>
                <a
                  href="mailto:support@ourtechtamil.com"
                  aria-label="Email support@ourtechtamil.com"
                  className={`inline-flex items-center gap-2 break-all ${linkClass}`}
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-accent">
                    <Mail size={15} aria-hidden="true" />
                  </span>
                  support@ourtechtamil.com
                </a>
              </li>
              <li className="flex items-start gap-2 text-sm text-white/85">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-accent">
                  <MapPin size={15} aria-hidden="true" />
                </span>
                <span>122, Tirupathur Lorem ipsum dolor sit amet consectetur.</span>
              </li>
            </ul>
          </div>

          <div>
            <h2 className="mb-3 text-sm font-bold">Help &amp; Support</h2>
            <ul className="flex flex-col gap-1.5">
              <li><Link to="/ordersmain" className={linkClass}>Track Order</Link></li>
              <li><Link to="/contactus" className={linkClass}>Returns &amp; Refunds</Link></li>
              <li><Link to="/contactus" className={linkClass}>Warranty</Link></li>
              <li><Link to="/contactus" className={linkClass}>FAQs</Link></li>
              <li><Link to="/contactus" className={linkClass}>Support Center</Link></li>
            </ul>
          </div>

        </div>

        <div className="flex flex-col gap-4 border-t border-white/20 py-4 text-xs text-white/85 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} Our Tech. All Rights Reserved.</p>
          <nav aria-label="Legal links" className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <Link to="/termsandconditions" className="transition-colors hover:text-secondary-light">Privacy Policy</Link>
            <span aria-hidden="true">|</span>
            <Link to="/termsandconditions" className="transition-colors hover:text-secondary-light">Terms &amp; Conditions</Link>
            <span aria-hidden="true">|</span>
            <Link to="/contactus" className="transition-colors hover:text-secondary-light">Shipping Policy</Link>
          </nav>
          <div className="md:ml-auto">
            <h2 className="mb-2 text-xs font-bold">We Accept</h2>
            <div className="flex flex-wrap gap-2">
              {["VISA", "Mastercard", "RuPay", "UPI"].map((method) => (
                <span
                  key={method}
                  className="flex h-8 min-w-[48px] items-center justify-center rounded-md bg-white px-2 text-[10px] font-extrabold italic text-[#1f1650] shadow-sm"
                >
                  {method === "Mastercard" ? (
                    <span className="flex items-center" aria-label="Mastercard">
                      <span className="h-4 w-4 rounded-full bg-red-500" />
                      <span className="-ml-1.5 h-4 w-4 rounded-full bg-amber-400/90" />
                    </span>
                  ) : method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </footer>
  );
};

export default Footer;
