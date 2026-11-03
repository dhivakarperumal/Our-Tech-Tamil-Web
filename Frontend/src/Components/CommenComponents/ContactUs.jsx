import { Headphones, Mail, MessageCircle, Phone } from "lucide-react";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

function ContactUs() {
  return (
    <>
      <PageHeader title="Contact Us" />
      <main className="bg-[#faf9fc] py-8 sm:py-12">
        <PageContainer>
          <div className="mx-auto max-w-5xl">
            <div className="text-center">
              <h2 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
                We’re here to help
              </h2>
              <p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-text-secondary sm:text-base">
                Have a question about a product or need help with your order? Get in touch with our support team.
              </p>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <a
                href="tel:+919876543210"
                className="group rounded-2xl border border-[#e9def5] bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3eaff] text-primary">
                  <Phone size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-text-primary">Call us</h3>
                <p className="mt-1 text-sm text-text-secondary">+91 98765 43210</p>
              </a>
              <a
                href="mailto:support@ourtechtamil.com"
                className="group rounded-2xl border border-[#e9def5] bg-white p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#f3eaff] text-primary">
                  <Mail size={22} aria-hidden="true" />
                </span>
                <h3 className="mt-4 font-bold text-text-primary">Email support</h3>
                <p className="mt-1 break-all text-sm text-text-secondary">support@ourtechtamil.com</p>
              </a>
            </div>

            <div className="mt-6 rounded-2xl bg-gradient-to-r from-secondary-dark via-primary to-gradient-middle p-6 text-white sm:flex sm:items-center sm:justify-between sm:gap-6">
              <div className="flex items-start gap-3">
                <Headphones className="mt-0.5 shrink-0 text-accent" size={22} aria-hidden="true" />
                <div>
                  <h3 className="font-bold">Need a quick answer?</h3>
                  <p className="mt-1 text-sm leading-6 text-white/80">
                    Send us an email and include your order or product details if relevant.
                  </p>
                </div>
              </div>
              <a
                href="mailto:support@ourtechtamil.com"
                className="mt-4 inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-primary transition hover:bg-accent sm:mt-0"
              >
                <MessageCircle size={16} aria-hidden="true" /> Contact support
              </a>
            </div>
          </div>
        </PageContainer>
      </main>
    </>
  );
}

export default ContactUs;
