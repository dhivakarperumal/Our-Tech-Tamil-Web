import { Headphones, Mail, MapPin, Phone, Tag, Truck } from "lucide-react";
import { Link } from "react-router-dom";
import PageContainer from "./PageContainer";

const Header = () => (
  <div className="site-footer text-[10px] font-medium text-white sm:text-xs">
    <PageContainer>
      <div className="flex min-h-9 items-center justify-between gap-3 py-1.5">
        <div className="hidden items-center gap-3 sm:flex md:gap-5">
          <a href="tel:+919876543210" className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-accent">
            <Phone size={13} aria-hidden="true" />
            <span>+91 98765 43210</span>
          </a>
          <span className="h-4 w-px bg-white/25" aria-hidden="true" />
          <a href="mailto:support@ourtechtamil.com" className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-accent">
            <Mail size={13} aria-hidden="true" />
            <span>support@ourtechtamil.com</span>
          </a>
        </div>

        <div className="mx-auto inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/70 px-3 py-1 text-[10px] font-semibold sm:text-xs">
          <Truck size={14} className="text-accent" aria-hidden="true" />
          <span>Free Delivery on Orders Above ₹1,999</span>
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <Link to="/ordersmain" className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-accent">
            <MapPin size={13} aria-hidden="true" />
            Track Order
          </Link>
          <Link to="/contactus" className="inline-flex items-center gap-1.5 whitespace-nowrap hover:text-accent">
            <Headphones size={13} aria-hidden="true" />
            Help
          </Link>
          <Link to="/shop" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-accent/70 px-3 py-1 hover:bg-white/10">
            <Tag size={13} aria-hidden="true" />
            Deals &amp; Offers
          </Link>
        </div>
      </div>
    </PageContainer>
  </div>
);

export default Header;
