import { Image } from "lucide-react";

const Banners = () => (
  <section className="min-h-[60vh] space-y-6">
    <header>
      <p className="text-sm font-semibold text-primary">Marketing Management</p>
      <h1 className="mt-1 text-2xl font-bold text-slate-900">Promotion Banners</h1>
      <p className="mt-2 text-sm text-slate-500">
        Manage the promotional banners displayed in your store.
      </p>
    </header>

    <div className="flex min-h-80 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center shadow-sm">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <Image size={28} aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-slate-800">
        Banner management is not connected yet
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">
        The backend does not currently provide banner storage or management
        endpoints. Connect a banner API to create, edit, and publish promotions
        here.
      </p>
    </div>
  </section>
);

export default Banners;
