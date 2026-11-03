import {
  Clock3,
  Headphones,
  Mail,
  MapPin,
  MessageSquareText,
  Phone,
  Send,
  UserRound,
} from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

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

  return (
    <>
      <PageHeader title="Contact Us" />
      <main className="bg-[#faf8fd] py-7 sm:py-10">
        <PageContainer>

          <section aria-labelledby="contact-information-heading" className="mt-1 mb-7">
            <div className="mb-3 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e6fa] text-primary">
                <Headphones size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="contact-information-heading" className="text-lg font-extrabold text-[#101832]">
                  Contact Information
                </h2>
                <p className="text-xs text-[#64708a]">Reach out to us through any of these channels.</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <a href="tel:+919876543210" className="flex min-w-0 items-center gap-3 rounded-xl border border-[#eadff4] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a52ae1] to-[#6509b8] text-white">
                  <Phone size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[#101832]">Call Us</span>
                  <span className="mt-0.5 block text-xs text-[#34405c]">+91 98765 43210</span>
                  <span className="mt-0.5 block text-[10px] text-[#737b91]">Mon–Sat, 9:00 AM–7:00 PM</span>
                </span>
              </a>

              <a href="mailto:support@ourtechtamil.com" className="flex min-w-0 items-center gap-3 rounded-xl border border-[#eadff4] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a52ae1] to-[#6509b8] text-white">
                  <Mail size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[#101832]">Email Us</span>
                  <span className="mt-0.5 block break-all text-xs text-[#34405c]">support@ourtechtamil.com</span>
                  <span className="mt-0.5 block text-[10px] text-[#737b91]">We&apos;ll reply within 24 hours.</span>
                </span>
              </a>

              <a
                href="https://www.google.com/maps/search/?api=1&query=122%2C+Tirupathur%2C+Tamil+Nadu+635601%2C+India"
                target="_blank"
                rel="noreferrer"
                className="flex min-w-0 items-center gap-3 rounded-xl border border-[#eadff4] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a52ae1] to-[#6509b8] text-white">
                  <MapPin size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[#101832]">Visit Our Store</span>
                  <span className="mt-0.5 block text-xs leading-5 text-[#34405c]">122, Tirupathur,<br />Tamil Nadu – 635601, India</span>
                </span>
              </a>

              <div className="flex min-w-0 items-center gap-3 rounded-xl border border-[#eadff4] bg-white p-4 shadow-sm">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#a52ae1] to-[#6509b8] text-white">
                  <Clock3 size={19} aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-extrabold text-[#101832]">Support Hours</span>
                  <span className="mt-0.5 block text-xs text-[#34405c]">Monday – Saturday</span>
                  <span className="mt-0.5 block text-[10px] text-[#737b91]">9:00 AM – 7:00 PM</span>
                </span>
              </div>
            </div>
          </section>

          <div className="grid mb-10 items-stretch gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="overflow-hidden rounded-2xl border border-[#eadff4] bg-white shadow-[0_8px_24px_rgba(54,22,93,0.07)]">
              <div className="flex items-start gap-3 border-b border-[#f0e9f6] bg-gradient-to-r from-white to-[#fcf8ff] px-5 py-4 sm:px-6">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f3eaff] text-primary">
                  <MessageSquareText size={21} aria-hidden="true" />
                </span>
                <div>
                  <h2 className="text-lg font-extrabold text-[#101832]">Send Us a Message</h2>
                  <p className="mt-0.5 text-xs leading-5 text-[#64708a]">
                    Fill in the details below and our team will get back to you as soon as possible.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-x-4 gap-y-3 p-5 sm:grid-cols-2 sm:p-6">
                <label className="text-xs font-bold text-[#202b46]">
                  Full Name <span className="text-rose-600">*</span>
                  <span className="relative block">
                    <UserRound size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d7291]" aria-hidden="true" />
                    <input className={`${inputClass} pl-9`} name="name" placeholder="Enter your name" autoComplete="name" required maxLength={120} />
                  </span>
                </label>

                <label className="text-xs font-bold text-[#202b46]">
                  Email Address <span className="text-rose-600">*</span>
                  <span className="relative block">
                    <Mail size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d7291]" aria-hidden="true" />
                    <input className={`${inputClass} pl-9`} name="email" type="email" placeholder="Enter your email" autoComplete="email" required maxLength={254} />
                  </span>
                </label>

                <label className="text-xs font-bold text-[#202b46]">
                  Phone Number
                  <span className="relative block">
                    <Phone size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7d7291]" aria-hidden="true" />
                    <input className={`${inputClass} pl-9`} name="phone" type="tel" placeholder="Enter your phone number" autoComplete="tel" maxLength={30} />
                  </span>
                </label>

                <label className="text-xs font-bold text-[#202b46]">
                  Subject <span className="text-rose-600">*</span>
                  <select className={inputClass} name="subject" defaultValue="" required>
                    <option value="" disabled>Select a subject</option>
                    <option value="Product enquiry">Product enquiry</option>
                    <option value="Order support">Order support</option>
                    <option value="Returns and refunds">Returns and refunds</option>
                    <option value="Other">Other</option>
                  </select>
                </label>

                <label className="text-xs font-bold text-[#202b46] sm:col-span-2">
                  Message <span className="text-rose-600">*</span>
                  <textarea
                    className={`${inputClass} min-h-28 resize-y`}
                    name="message"
                    placeholder="Write your message here..."
                    required
                    maxLength={3000}
                  />
                </label>

                <div className="sm:col-span-2 sm:text-center">
                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#9415dc] to-[#5100a8] px-7 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(103,21,181,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_9px_20px_rgba(103,21,181,0.28)] sm:w-auto"
                  >
                    <Send size={16} aria-hidden="true" />
                    Send Message
                  </button>
                </div>
              </form>
            </section>

            <aside className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[#2c0757] via-[#720db5] to-[#c74df3] p-5 sm:min-h-80 lg:min-h-0">
              <div className="absolute -left-20 top-8 h-48 w-48 rounded-full bg-fuchsia-400/20 blur-3xl" aria-hidden="true" />
              <div className="absolute -right-10 bottom-0 h-48 w-48 rounded-full bg-violet-200/20 blur-3xl" aria-hidden="true" />
              <img
                src="/images/loginimage.png"
                alt="Laptop, headphones, phone and gaming controller"
                className="relative z-10 max-h-[360px] w-full object-contain drop-shadow-[0_18px_28px_rgba(21,4,43,0.35)]"
              />
              <div className="absolute bottom-4 left-4 right-4 z-20 rounded-xl border border-white/20 bg-[#2c0757]/50 px-4 py-3 text-white backdrop-blur-sm sm:bottom-5 sm:left-5 sm:right-5">
                <div className="flex items-center gap-2 text-sm font-extrabold">
                  <Headphones size={17} className="text-fuchsia-200" aria-hidden="true" />
                  We&apos;re here to help
                </div>
                <p className="mt-1 text-xs leading-5 text-white/85">
                  Questions about a product or order? Our team is happy to help.
                </p>
              </div>
            </aside>
          </div>

          <section aria-labelledby="store-map-heading" className="mt-6 overflow-hidden rounded-2xl border border-[#eadff4] bg-white p-4 shadow-[0_8px_24px_rgba(54,22,93,0.07)] sm:p-5">
            <div className="mb-4 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f0e6fa] text-primary">
                <MapPin size={20} aria-hidden="true" />
              </span>
              <div>
                <h2 id="store-map-heading" className="text-lg font-extrabold text-[#101832]">Find Us on Map</h2>
                <p className="text-xs text-[#64708a]">Visit our store at 122, Tirupathur, Tamil Nadu – 635601, India.</p>
              </div>
            </div>
            <iframe
              title="Our Tech location in Tirupathur"
              src="https://maps.google.com/maps?q=122%2C%20Tirupathur%2C%20Tamil%20Nadu%20635601%2C%20India&t=&z=13&ie=UTF8&iwloc=&output=embed"
              className="h-64 w-full rounded-xl border-0 bg-[#f3eff7] sm:h-80"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </section>
        </PageContainer>
      </main>
    </>
  );
}

export default ContactUs;
