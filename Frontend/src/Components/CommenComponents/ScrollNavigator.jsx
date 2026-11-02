// src/components/ScrollNavigator.jsx
import React, { useEffect, useState } from "react";
import { ChevronUp, Phone } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";

const ScrollNavigator = () => {
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const updateScrollTopVisibility = () => {
      setShowScrollTop(window.scrollY > 300);
    };

    updateScrollTopVisibility();
    window.addEventListener("scroll", updateScrollTopVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollTopVisibility);
  }, []);

  return (
    <>
      <div className="fixed right-4 bottom-5 z-30 flex flex-col items-center gap-3">
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-primary shadow-md transition hover:-translate-y-1 hover:bg-primary hover:text-white"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            <ChevronUp size={24} aria-hidden="true" />
          </button>
        )}
        <a
          href="https://wa.me/919876543210"
          target="_blank"
          rel="noreferrer"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-md transition hover:scale-105 hover:bg-[#1DA851]"
          aria-label="Chat with us on WhatsApp"
          title="WhatsApp"
        >
          <FaWhatsapp size={25} aria-hidden="true" />
        </a>
        <a
          href="tel:+919876543210"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white shadow-md transition hover:scale-105 hover:bg-primary-light"
          aria-label="Call us"
          title="Call us"
        >
          <Phone size={22} aria-hidden="true" />
        </a>
      </div>
    </>
  );
};

export default ScrollNavigator;