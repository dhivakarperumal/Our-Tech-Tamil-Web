import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Clock3,
  ChevronDown,
  ClipboardList,
  Headphones,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Settings2,
  ShieldCheck,
  Store,
  Truck,
  UserRound,
  UsersRound,
  Zap,
} from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

const supportTopics = [
  { label: "Customer Support", detail: "Help with your orders and products", Icon: Headphones, href: "#contact-form" },
  { label: "Order Assistance", detail: "Track, modify or cancel your order", Icon: ClipboardList, href: "/ordersmain" },
  { label: "Product Enquiry", detail: "Ask about specifications and more", Icon: Settings2, href: "#contact-form" },
  { label: "Warranty & Returns", detail: "Get support for returns and warranty", Icon: ShieldCheck, href: "#contact-form" },
  { label: "Store Visit", detail: "Find our store and opening hours", Icon: Store, href: "#find-our-store" },
];

const storeBenefits = [
  { title: "Fast & Safe Delivery", detail: "Across India", Icon: Truck },
  { title: "100% Genuine Products", detail: "Brand Warranty", Icon: BadgeCheck },
  { title: "Easy Returns", detail: "Hassle-free process", Icon: RefreshCw },
  { title: "Dedicated Support", detail: "We’re always here for you", Icon: Headphones },
];

const reasons = [
  { title: "Quick Response", detail: "We usually reply within 24 hours.", Icon: Zap },
  { title: "Trusted Support", detail: "Get reliable and expert assistance.", Icon: ShieldCheck },
  { title: "Expert Guidance", detail: "Product recommendations that fit your needs.", Icon: UsersRound },
  { title: "After-Sales Support", detail: "Help with warranty, returns and service requests.", Icon: RefreshCw },
];

const questions = [
  {
    question: "How can I track my order?",
    answer: "You can track your order from the Track Orders section in your account. If you need a hand, send us your order number and we’ll help.",
  },
  {
    question: "Can I cancel or modify my order?",
    answer: "Contact us as soon as possible with your order number. We’ll check whether it can still be changed or cancelled before dispatch.",
  },
  {
    question: "What is your return and refund policy?",
    answer: "Please contact our support team with your order details and a description of the issue. We’ll guide you through the available return or refund options.",
  },
  {
    question: "Do you provide warranty for products?",
    answer: "Warranty coverage depends on the product and its manufacturer. Check the product details or get in touch with us for help with a specific item.",
  },
  {
    question: "Can I get product recommendations?",
    answer: "Absolutely. Tell us what you’re looking for and how you plan to use it, and our team will be happy to suggest suitable options.",
  },
];

const inputClass =
  "mt-1.5 w-full rounded-lg border border-[#e7dff0] bg-white px-3 py-2.5 text-sm text-[#211936] outline-none transition placeholder:text-[#9b93a8] focus:border-primary focus:ring-2 focus:ring-primary/10";

function ContactUs() {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const subject = `[Website Contact] ${formData.get("subject")}`;
    const body = [
      `Name: ${formData.get("name")}`,
      `Email: ${formData.get("email")}`,
      `Phone: ${formData.get("phone") || "Not provided"}`,
      "",
      formData.get("message"),
    ].join("\n");

    window.location.href = `mailto:support@ourtechtamil.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const handleNewsletterSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = formData.get("newsletter-email");
    const subject = "Newsletter subscription request";
    const body = `Please add ${email} to the OurTech newsletter.`;

    window.location.href = `mailto:support@ourtechtamil.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <main className="bg-[#fcfaff] pb-10">
      <PageHeader title="Contact Us" />

      <PageContainer className="!px-4 sm:!px-6 lg:!px-[3%]">
        <nav aria-label="Contact topics" className="relative z-10 -mt-4 mb-7 grid overflow-hidden rounded-2xl border border-[#eee2f9] bg-white shadow-[0_8px_24px_rgba(54,22,93,0.12)] sm:grid-cols-2 lg:-mt-5 lg:grid-cols-5">
          {supportTopics.map(({ label, detail, Icon, href }, index) => (
            <a
              key={label}
              href={href}
              className={`group flex min-h-[96px] items-center gap-3 px-4 py-4 transition hover:bg-[#fbf6ff] sm:px-5 ${index > 0 ? "border-t border-[#eee7f5] lg:border-l lg:border-t-0" : ""} ${index % 2 === 1 ? "sm:border-l" : ""} ${index === 1 ? "sm:border-t-0" : ""}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#f4eaff] text-primary transition group-hover:bg-primary group-hover:text-white">
                <Icon size={20} aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-extrabold text-[#171326]">{label}</span>
                <span className="mt-0.5 block text-[10px] leading-4 text-[#646074]">{detail}</span>
              </span>
            </a>
          ))}
        </nav>

        <section aria-label="Contact options" className="grid items-stretch gap-4 lg:grid-cols-[1.25fr_0.78fr_0.88fr]">
          <section id="contact-form" aria-labelledby="send-message-heading" className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#eee4f7] bg-white shadow-[0_7px_22px_rgba(54,22,93,0.07)]">
            <div className="flex items-start gap-3 px-4 pb-2 pt-4 sm:px-5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-primary">
                <Mail size={21} aria-hidden="true" />
              </span>
              <div>
                <h2 id="send-message-heading" className="text-lg font-extrabold leading-6 text-[#171326]">Send Us a Message</h2>
                <p className="mt-1 text-xs leading-5 text-[#5e596b]">Have a question or need assistance? Fill in the details below and we&apos;ll get back to you shortly.</p>
              </div>
            </div>
            <form onSubmit={handleSubmit} className="grid gap-x-3 gap-y-2.5 p-4 pt-2 sm:grid-cols-2 sm:px-5 sm:pb-5">
              <label className="text-xs font-semibold text-[#302b3d]">
                Your Name <span className="text-rose-600">*</span>
                <span className="relative block">
                  <UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#756d84]" aria-hidden="true" />
                  <input className={`${inputClass} pl-9`} name="name" placeholder="Enter your name" autoComplete="name" required maxLength={120} />
                </span>
              </label>
              <label className="text-xs font-semibold text-[#302b3d]">
                Email Address <span className="text-rose-600">*</span>
                <span className="relative block">
                  <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#756d84]" aria-hidden="true" />
                  <input className={`${inputClass} pl-9`} name="email" type="email" placeholder="Enter your email" autoComplete="email" required maxLength={254} />
                </span>
              </label>
              <label className="text-xs font-semibold text-[#302b3d]">
                Mobile Number
                <span className="relative block">
                  <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#756d84]" aria-hidden="true" />
                  <input className={`${inputClass} pl-9`} name="phone" type="tel" placeholder="Enter your number" autoComplete="tel" maxLength={30} />
                </span>
              </label>
              <label className="text-xs font-semibold text-[#302b3d]">
                Select Subject <span className="text-rose-600">*</span>
                <select className={inputClass} name="subject" defaultValue="" required>
                  <option value="" disabled>Select a subject</option>
                  <option value="Product enquiry">Product enquiry</option>
                  <option value="Order support">Order support</option>
                  <option value="Returns and refunds">Warranty &amp; returns</option>
                  <option value="Other">Other</option>
                </select>
              </label>
              <label className="text-xs font-semibold text-[#302b3d] sm:col-span-2">
                Your Message <span className="text-rose-600">*</span>
                <textarea className={`${inputClass} min-h-20 resize-y`} name="message" placeholder="Write your message here..." required maxLength={3000} />
              </label>
              <div className="sm:col-span-2">
                <button type="submit" className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#9415dc] to-[#5100a8] px-5 py-2.5 text-xs font-bold text-white shadow-[0_5px_14px_rgba(103,21,181,0.22)] transition hover:-translate-y-0.5 hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  Send Message <Send size={14} aria-hidden="true" />
                </button>
              </div>
            </form>
          </section>

          <section aria-labelledby="get-in-touch-heading" className="rounded-2xl border border-[#eee4f7] bg-white p-4 shadow-[0_7px_22px_rgba(54,22,93,0.05)] sm:p-5">
            <h2 id="get-in-touch-heading" className="text-lg font-extrabold text-[#171326]">Get in <span className="text-primary">Touch</span></h2>
            <span className="mt-1 block h-0.5 w-9 rounded-full bg-fuchsia-600" aria-hidden="true" />
            <div className="mt-3 space-y-3">
              <a href="tel:+919876543210" className="group flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><Phone size={19} aria-hidden="true" /></span>
                <span><span className="block text-xs font-extrabold text-[#201b2d]">Call Us</span><span className="mt-0.5 block text-xs text-[#3d3749]">+91 98765 43210</span></span>
              </a>
              <a href="mailto:support@ourtechtamil.com" className="group flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><Mail size={19} aria-hidden="true" /></span>
                <span className="min-w-0"><span className="block text-xs font-extrabold text-[#201b2d]">Email Us</span><span className="mt-0.5 block break-all text-xs text-[#3d3749]">support@ourtechtamil.com</span></span>
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=122%2C+Tirupathur%2C+Tamil+Nadu+635601%2C+India" target="_blank" rel="noreferrer" className="group flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-primary transition group-hover:bg-primary group-hover:text-white"><MapPin size={19} aria-hidden="true" /></span>
                <span><span className="block text-xs font-extrabold text-[#201b2d]">Visit Our Store</span><span className="mt-0.5 block text-xs leading-4 text-[#3d3749]">122, Tirupathur<br />Tamil Nadu – 635601, India</span></span>
              </a>
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f4eaff] text-primary"><Clock3 size={19} aria-hidden="true" /></span>
                <span><span className="block text-xs font-extrabold text-[#201b2d]">Working Hours</span><span className="mt-0.5 block text-xs leading-4 text-[#3d3749]">Mon–Sat: 9:00 AM – 7:00 PM</span></span>
              </div>
            </div>
          </section>

          <a
            href="https://www.google.com/maps/search/?api=1&query=122%2C+Tirupathur%2C+Tamil+Nadu+635601%2C+India"
            target="_blank"
            rel="noreferrer"
            aria-label="Visit Our Tech in Tirupathur"
            className="group relative isolate flex min-h-64 overflow-hidden rounded-2xl bg-[#230747] shadow-[0_7px_22px_rgba(54,22,93,0.12)]"
          >
            <img src="/images/loginbanner.png" alt="" className="absolute inset-0 -z-20 h-full w-full object-cover object-[62%_center] transition duration-500 group-hover:scale-105" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-t from-[#1a0635]/95 via-[#230747]/30 to-[#1a0635]/10" aria-hidden="true" />
            <div className="mt-auto w-full p-5 text-white">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-sm"><Store size={13} aria-hidden="true" /> OUR EXPERIENCE STORE</span>
              <h2 className="mt-2 text-xl font-extrabold">Visit Our Store</h2>
              <p className="mt-1 text-xs leading-5 text-white/85">Discover your next favourite gadget in person.</p>
              <span className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white">Get directions <ArrowUpRight size={14} aria-hidden="true" /></span>
            </div>
          </a>
        </section>

        <section aria-labelledby="why-contact-heading" className="mt-7">
          <div className="mb-4 text-center">
            <h2 id="why-contact-heading" className="text-xl font-extrabold tracking-tight text-[#171326] sm:text-2xl">Why Contact <span className="text-primary">OurTech?</span></h2>
            <span className="mx-auto mt-2 block h-0.5 w-10 rounded-full bg-fuchsia-600" aria-hidden="true" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {reasons.map(({ title, detail, Icon }) => (
              <div key={title} className="flex items-center gap-3 rounded-xl border border-[#f0e8f7] bg-gradient-to-r from-[#f7f0ff] to-[#fbf8ff] p-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#efe0ff] text-primary"><Icon size={22} aria-hidden="true" /></span>
                <span><span className="block text-xs font-extrabold text-[#201b2d]">{title}</span><span className="mt-1 block text-[11px] leading-4 text-[#5e596b]">{detail}</span></span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2 lg:gap-8">
          <div aria-labelledby="faq-heading">
            <div className="mb-3">
              <h2 id="faq-heading" className="text-lg font-extrabold text-[#171326]">Frequently Asked Questions</h2>
              <span className="mt-1 block h-0.5 w-9 rounded-full bg-fuchsia-600" aria-hidden="true" />
            </div>
            <div className="space-y-1.5">
              {questions.map(({ question, answer }, index) => (
                <details key={question} className="group overflow-hidden rounded-lg border border-[#f0e8f7] bg-white" open={index === 0}>
                  <summary className="flex list-none items-center justify-between gap-3 bg-[#f7f1fc] px-3.5 py-2.5 text-xs font-bold text-[#211936] transition hover:bg-[#efe2fa] [&::-webkit-details-marker]:hidden">
                    {question}
                    <ChevronDown size={15} className="shrink-0 text-primary transition-transform group-open:rotate-180" aria-hidden="true" />
                  </summary>
                  <p className="px-3.5 py-2.5 text-xs leading-5 text-[#514b5d]">{answer}</p>
                </details>
              ))}
            </div>
            <a href="mailto:support@ourtechtamil.com?subject=Support%20question" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary underline decoration-primary/30 underline-offset-4 transition hover:decoration-primary">
              Still need help? Contact our team <ArrowRight size={14} aria-hidden="true" />
            </a>
          </div>

          <div id="find-our-store" aria-labelledby="store-heading" className="scroll-mt-28 overflow-hidden rounded-2xl border border-[#eee4f7] bg-white p-3 shadow-[0_7px_22px_rgba(54,22,93,0.06)] sm:p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
              <h2 id="store-heading" className="text-lg font-extrabold text-[#171326]">Find Our Store</h2>
              <span className="mt-1 block h-0.5 w-9 rounded-full bg-fuchsia-600" aria-hidden="true" />
              </div>
              <span className="hidden items-center gap-1.5 rounded-full bg-[#f4eaff] px-3 py-1.5 text-[10px] font-bold text-primary sm:inline-flex"><Clock3 size={13} aria-hidden="true" /> Open Mon–Sat</span>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-[#eae5ef] bg-[#eeeaf3]">
              <iframe
                title="Our Tech store in Tirupathur"
                src="https://maps.google.com/maps?q=122%2C%20Tirupathur%2C%20Tamil%20Nadu%20635601%2C%20India&t=&z=13&ie=UTF8&iwloc=&output=embed"
                className="h-64 w-full border-0 sm:h-72"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#f3e7ff] text-primary"><MapPin size={18} aria-hidden="true" /></span>
                <span><span className="block text-xs font-extrabold text-[#201b2d]">OurTech Experience Store</span><span className="mt-0.5 block text-[11px] leading-4 text-[#5e596b]">122, Tirupathur, Tamil Nadu – 635601</span></span>
              </div>
              <div className="flex flex-wrap gap-2 sm:justify-end">
              <a href="https://www.google.com/maps/dir/?api=1&destination=122%2C+Tirupathur%2C+Tamil+Nadu+635601%2C+India" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#9415dc] to-[#5100a8] px-5 py-2.5 text-xs font-bold text-white transition hover:shadow-md">
                Get Directions <Send size={13} aria-hidden="true" />
              </a>
              <a href="https://www.google.com/maps/search/?api=1&query=122%2C+Tirupathur%2C+Tamil+Nadu+635601%2C+India" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-[#ded2eb] bg-white px-4 py-2.5 text-xs font-bold text-[#28223a] transition hover:border-primary hover:text-primary">
                <MapPin size={14} aria-hidden="true" /> View on Google Maps
              </a>
              </div>
            </div>
          </div>
        </section>

        <section aria-label="OurTech newsletter and benefits" className="mt-7 overflow-hidden rounded-2xl border border-[#eee2f9] bg-white shadow-[0_8px_24px_rgba(54,22,93,0.08)]">
          <div className="grid items-center gap-4 bg-gradient-to-r from-[#461080] via-[#7021b5] to-[#9816d3] px-5 py-5 text-white sm:px-7 lg:grid-cols-[1fr_auto] lg:gap-8">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/15"><Mail size={22} aria-hidden="true" /></span>
              <span>
                <span className="block text-sm font-extrabold sm:text-base">Stay Updated with OurTech</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-white/85 sm:text-xs">Get the latest offers, new arrivals, and exclusive deals straight to your inbox.</span>
              </span>
            </div>
            <form onSubmit={handleNewsletterSubmit} className="flex min-w-0 rounded-xl bg-white p-1 shadow-md sm:max-w-md sm:justify-self-start lg:w-[360px] lg:justify-self-end">
              <label htmlFor="newsletter-email" className="sr-only">Email address for newsletter</label>
              <span className="flex min-w-0 flex-1 items-center gap-2 px-2.5 text-[#756d84]">
                <Mail size={16} aria-hidden="true" />
                <input id="newsletter-email" name="newsletter-email" type="email" autoComplete="email" required maxLength={254} placeholder="Enter your email address" className="min-w-0 flex-1 bg-transparent py-2 text-[11px] text-[#211936] outline-none placeholder:text-[#8e8799]" />
              </span>
              <button type="submit" className="shrink-0 rounded-lg bg-gradient-to-r from-[#9415dc] to-[#5100a8] px-4 py-2 text-[11px] font-bold text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Subscribe</button>
            </form>
          </div>
          <div className="grid divide-y divide-[#eee7f5] sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4">
            {storeBenefits.map(({ title, detail, Icon }, index) => (
              <div key={title} className={`flex items-center gap-3 px-5 py-4 sm:px-6 ${index > 0 ? "sm:border-l sm:border-[#eee7f5]" : ""}`}>
                <Icon size={25} className="shrink-0 text-primary" aria-hidden="true" />
                <span><span className="block text-[11px] font-extrabold text-[#201b2d]">{title}</span><span className="mt-0.5 block text-[10px] text-[#5e596b]">{detail}</span></span>
              </div>
            ))}
          </div>
        </section>

      </PageContainer>
    </main>
  );
}

export default ContactUs;
