import { ArrowRight, BookOpen, ShieldCheck, Smartphone } from "lucide-react";
import PageContainer from "../CommenComponents/PageContainer";
import PageHeader from "../CommenComponents/PageHeader";

const guides = [
  {
    title: "Choose the right gadget for your everyday needs",
    category: "Buying guide",
    description: "Start with the features you will use most, compare the specifications that matter, and choose a product that fits your daily routine.",
    icon: Smartphone,
  },
  {
    title: "Simple ways to protect your devices",
    category: "Care & maintenance",
    description: "Keep devices clean and dry, use suitable cases and chargers, and follow the care instructions provided with each product.",
    icon: ShieldCheck,
  },
  {
    title: "Understand product features before you buy",
    category: "Technology basics",
    description: "Learn how to compare compatibility, connectivity, battery life, and included accessories so you can shop with confidence.",
    icon: BookOpen,
  },
];

function Articles() {
  return (
    <>
      <PageHeader title="Articles" />
      <main className="bg-[#faf9fc] py-8 sm:py-12">
        <PageContainer>
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-text-primary sm:text-3xl">
              Guides for your tech journey
            </h2>
            <p className="mt-3 text-sm leading-6 text-text-secondary sm:text-base">
              Helpful tips and straightforward information to make choosing and caring for your gadgets easier.
            </p>
          </div>

          <div className="mx-auto mt-8 grid max-w-5xl gap-4 md:grid-cols-2">
            {guides.map(({ title, category, description, icon: Icon }) => (
              <article
                key={title}
                className="rounded-2xl border border-[#e9def5] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-6"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f3eaff] text-primary">
                  <Icon size={21} aria-hidden="true" />
                </span>
                <p className="mt-4 text-xs font-bold uppercase tracking-wider text-primary">{category}</p>
                <h3 className="mt-2 text-lg font-bold leading-snug text-text-primary">{title}</h3>
                <p className="mt-3 text-sm leading-6 text-text-secondary">{description}</p>
                <a
                  href="mailto:support@ourtechtamil.com?subject=Question%20about%20your%20tech%20guides"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline"
                >
                  Ask us a question <ArrowRight size={15} aria-hidden="true" />
                </a>
              </article>
            ))}
          </div>
        </PageContainer>
      </main>
    </>
  );
}

export default Articles;
