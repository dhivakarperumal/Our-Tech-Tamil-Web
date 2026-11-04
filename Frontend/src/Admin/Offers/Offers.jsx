import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CircleAlert,
  Eye,
  Gift,
  Heart,
  LayoutGrid,
  List,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
  Zap,
  Percent,
  RefreshCw,
} from "lucide-react";
import { toast } from "react-hot-toast";
import api from "../../api";
import Loader from "../../Components/CommenComponents/Loader";

const OFFER_ICONS = {
  Tag,
  Sparkles,
  ShoppingBag,
  Gift,
  Zap,
  Percent,
  Heart,
  Star,
  ShoppingCart,
};

const EMPTY_FORM = {
  title: "",
  offer_percentage: "",
  description: "",
  icon: "Tag",
  status: "active",
  start_date: "",
  end_date: "",
};

const dateValue = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value.slice(0, 10);
  const date = new Date(value);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const todayValue = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
};

const formatDate = (value) => {
  const date = dateValue(value);
  if (!date) return "—";
  return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getEffectiveStatus = (offer) => {
  if (offer.status !== "active") return "Inactive";
  const today = todayValue();
  if (dateValue(offer.end_date) < today) return "Expired";
  if (dateValue(offer.start_date) > today) return "Upcoming";
  return "Active";
};

const statusStyles = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-600/15",
  Inactive: "bg-slate-100 text-slate-600 ring-slate-500/15",
  Expired: "bg-rose-50 text-rose-700 ring-rose-600/15",
  Upcoming: "bg-amber-50 text-amber-700 ring-amber-600/15",
};

const Offers = () => {
  const [offers, setOffers] = useState(null);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [headerOnly, setHeaderOnly] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const fetchOffers = async () => {
    try {
      const { data } = await api.get("/offers");
      setOffers(data.offers || []);
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not load offers.");
      setOffers([]);
    }
  };

  useEffect(() => {
    let active = true;
    api.get("/offers").then(({ data }) => {
      if (active) setOffers(data.offers || []);
    }).catch((error) => {
      if (!active) return;
      toast.error(error.response?.data?.message || "Could not load offers.");
      setOffers([]);
    });
    return () => {
      active = false;
    };
  }, []);

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return (offers || []).filter((offer) => {
      const matchesSearch = !query
        || String(offer.title || "").toLowerCase().includes(query)
        || String(offer.id).toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || offer.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [offers, search, statusFilter]);

  const openForm = (offer = null) => {
    setDialog({ mode: offer ? "edit" : "create", offer });
    setForm(offer ? {
      title: offer.title || "",
      offer_percentage: String(offer.offer_percentage ?? ""),
      description: offer.description || "",
      icon: offer.icon || "Tag",
      status: offer.status || "active",
      start_date: dateValue(offer.start_date),
      end_date: dateValue(offer.end_date),
    } : { ...EMPTY_FORM });
  };

  const closeDialog = () => setDialog(null);

  const saveOffer = async (event) => {
    event.preventDefault();
    const percentage = Number(form.offer_percentage);
    if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) {
      toast.error("Offer percentage must be between 0 and 100.");
      return;
    }
    if (form.end_date < form.start_date) {
      toast.error("End date must be on or after the start date.");
      return;
    }

    try {
      setSaving(true);
      if (dialog.mode === "edit") {
        await api.put(`/offers/${dialog.offer.id}`, { ...form, offer_percentage: percentage });
        toast.success("Offer updated.");
      } else {
        await api.post("/offers", { ...form, offer_percentage: percentage });
        toast.success("Offer created.");
      }
      closeDialog();
      await fetchOffers();
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not save this offer.");
    } finally {
      setSaving(false);
    }
  };

  const deleteOffer = async (offer) => {
    if (!window.confirm(`Delete “${offer.title}”? This action cannot be undone.`)) return;
    try {
      await api.delete(`/offers/${offer.id}`);
      setOffers((current) => current.filter((item) => item.id !== offer.id));
      toast.success("Offer deleted.");
    } catch (error) {
      toast.error(error.response?.data?.message || "Could not delete this offer.");
    }
  };

  if (offers === null) return <Loader />;

  const activeCount = offers.filter((offer) => getEffectiveStatus(offer) === "Active").length;
  const scheduledCount = offers.filter((offer) => getEffectiveStatus(offer) === "Upcoming").length;
  const expiredCount = offers.filter((offer) => getEffectiveStatus(offer) === "Expired").length;
  const offerStats = [
    { label: "Total offers", value: offers.length, sub: "All promotions", icon: Tag, gradient: "from-violet-800 to-fuchsia-700" },
    { label: "Live now", value: activeCount, sub: "Currently active", icon: Check, gradient: "from-emerald-400 to-teal-500" },
    { label: "Scheduled", value: scheduledCount, sub: "Starting soon", icon: ShoppingBag, gradient: "from-orange-400 to-amber-500" },
    { label: "Expired", value: expiredCount, sub: "Past end date", icon: CircleAlert, gradient: "from-rose-400 to-pink-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 text-slate-900">
      <section aria-label="Offer summary">
        <div className="mb-3 flex justify-end">
          <label className="inline-flex cursor-pointer items-center gap-2.5 rounded-xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-semibold text-violet-800 shadow-sm transition hover:border-violet-400 hover:bg-violet-50">
            <input
              type="checkbox"
              checked={headerOnly}
              onChange={(event) => setHeaderOnly(event.target.checked)}
              className="h-4 w-4 rounded border-slate-300 accent-violet-700 focus:ring-2 focus:ring-violet-500"
            />
            Show only the top header
          </label>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {offerStats.map(({ label, value, sub, icon: Icon, gradient }) => (
            <div key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-slate-400">{label}</p>
                <p className="my-0.5 text-3xl font-black leading-none text-slate-800">{value}</p>
                <p className="mt-1 text-[10px] text-slate-400">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {!headerOnly && (
      <>
      <section aria-label="Search and filter offers" className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <label className="relative w-full min-w-[180px] flex-1 sm:max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                placeholder="Search by title or offer ID..."
                aria-label="Search offers by title or ID"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white"
              />
        </label>
        <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter offers by status"
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 outline-none transition hover:border-violet-400 focus:border-violet-500 sm:ml-auto"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
        </select>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1" role="group" aria-label="Offer view">
          <button
            type="button"
            onClick={() => setViewMode("table")}
            aria-label="Table view"
            aria-pressed={viewMode === "table"}
            className={`rounded-lg p-2 transition ${viewMode === "table" ? "bg-white text-violet-700 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
          >
            <List className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("cards")}
            aria-label="Card view"
            aria-pressed={viewMode === "cards"}
            className={`rounded-lg p-2 transition ${viewMode === "cards" ? "bg-white text-violet-700 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
        <button
          type="button"
          onClick={() => openForm()}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add offer
        </button>
      </section>

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {filteredOffers.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600"><Tag size={24} /></div>
            <h3 className="mt-4 font-bold text-slate-900">{offers.length ? "No matching offers" : "Your next big offer starts here"}</h3>
            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {offers.length ? "Try changing the search or status filter." : "Create a promotion to start highlighting your best deals."}
            </p>
            {!offers.length && (
              <button type="button" onClick={() => openForm()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800">
                <Plus size={16} /> Create first offer
              </button>
            )}
          </div>
        ) : (
          <>
            {viewMode === "table" ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead className="admin-table-header text-xs uppercase tracking-wide text-yellow-300">
                  <tr>
                    {["S No.", "Offer", "ID", "Discount", "Validity", "Status", "Actions"].map((heading) => (
                      <th key={heading} className="px-5 py-4 font-bold">{heading}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredOffers.map((offer, index) => {
                    const Icon = OFFER_ICONS[offer.icon] || Tag;
                    const status = getEffectiveStatus(offer);
                    return (
                      <tr key={offer.id} className="transition hover:bg-violet-50/30">
                        <td className="px-5 py-4 text-sm font-semibold text-slate-500">{index + 1}</td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-700"><Icon size={20} /></span>
                            <div className="min-w-0">
                              <p className="max-w-xs truncate text-sm font-bold text-slate-900">{offer.title}</p>
                              <p className="mt-1 max-w-xs truncate text-xs text-slate-400">{offer.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm font-semibold text-slate-600">#{offer.id}</td>
                        <td className="px-5 py-4"><span className="inline-flex rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800">{Number(offer.offer_percentage)}% OFF</span></td>
                        <td className="px-5 py-4 text-xs leading-5 text-slate-600">
                          <div>{formatDate(offer.start_date)}</div><div className="text-slate-400">to {formatDate(offer.end_date)}</div>
                        </td>
                        <td className="px-5 py-4"><span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ring-1 ring-inset ${statusStyles[status]}`}>{status}</span></td>
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-1">
                            <button type="button" onClick={() => setDialog({ mode: "view", offer })} title="View offer" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-violet-700"><Eye size={16} /></button>
                            <button type="button" onClick={() => openForm(offer)} title="Edit offer" className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700"><Pencil size={16} /></button>
                            <button type="button" onClick={() => deleteOffer(offer)} title="Delete offer" className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600"><Trash2 size={16} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            ) : (
            <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredOffers.map((offer) => {
                const Icon = OFFER_ICONS[offer.icon] || Tag;
                const status = getEffectiveStatus(offer);
                return (
                  <article key={offer.id} className="rounded-2xl border border-slate-100 p-5 shadow-sm transition hover:shadow-md">
                    <div className="flex items-start gap-3">
                      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700"><Icon size={21} /></span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0"><h3 className="truncate font-bold text-slate-900">{offer.title}</h3><p className="mt-1 text-xs text-slate-400">Offer ID #{offer.id}</p></div>
                          <span className={`inline-flex shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ring-inset ${statusStyles[status]}`}>{status}</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-center justify-between gap-3">
                      <span className="rounded-lg bg-amber-100 px-3 py-1.5 text-sm font-extrabold text-amber-800">{Number(offer.offer_percentage)}% OFF</span>
                      <span className="text-right text-xs leading-5 text-slate-500">{formatDate(offer.start_date)} – {formatDate(offer.end_date)}</span>
                    </div>
                    <p className="mt-3 line-clamp-2 min-h-10 text-sm leading-5 text-slate-500">{offer.description || "No description provided."}</p>
                    <div className="mt-3 flex justify-end gap-1 border-t border-slate-100 pt-2">
                      <button type="button" onClick={() => setDialog({ mode: "view", offer })} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="View offer"><Eye size={16} /></button>
                      <button type="button" onClick={() => openForm(offer)} className="rounded-lg p-2 text-slate-500 hover:bg-violet-50 hover:text-violet-700" aria-label="Edit offer"><Pencil size={16} /></button>
                      <button type="button" onClick={() => deleteOffer(offer)} className="rounded-lg p-2 text-slate-500 hover:bg-rose-50 hover:text-rose-600" aria-label="Delete offer"><Trash2 size={16} /></button>
                    </div>
                  </article>
                );
              })}
            </div>
            )}
          </>
        )}
      </section>
      </>
      )}

      {dialog && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}>
          <section className="max-h-[94dvh] w-full overflow-y-auto rounded-t-3xl bg-white shadow-2xl lg:w-3xl sm:rounded-3xl" role="dialog" aria-modal="true" aria-labelledby="offer-dialog-title">
            <div className="admin-table-header sticky top-0 z-10 flex shrink-0 items-center justify-between overflow-hidden p-5 text-white sm:p-8">
              <div className="pointer-events-none absolute -right-4 -top-8 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <h2 id="offer-dialog-title" className="text-xl font-black uppercase tracking-tight sm:text-2xl">{dialog.mode === "view" ? dialog.offer.title : dialog.mode === "edit" ? "Edit Offer" : "Create New Offer"}</h2>
                <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-80">{dialog.mode === "view" ? "Offer details and validity" : "Manage offer details and promotion dates"}</p>
              </div>
              <button type="button" onClick={closeDialog} className="relative rounded-2xl bg-white/15 p-3 text-xl font-bold transition-all hover:bg-white/25" aria-label="Close dialog"><X size={20} /></button>
            </div>

            {dialog.mode === "view" ? (
              <div className="space-y-5 p-5 sm:p-7">
                <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-violet-50 to-amber-50 p-5">
                  {(() => { const Icon = OFFER_ICONS[dialog.offer.icon] || Tag; return <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm"><Icon size={25} /></span>; })()}
                  <div><p className="text-2xl font-black text-violet-950">{Number(dialog.offer.offer_percentage)}% OFF</p><p className="mt-1 text-sm text-slate-500">Offer ID #{dialog.offer.id}</p></div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</p><p className="mt-2 font-bold text-slate-800">{getEffectiveStatus(dialog.offer)}</p></div>
                  <div className="rounded-xl border border-slate-100 p-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Validity</p><p className="mt-2 text-sm font-semibold text-slate-800">{formatDate(dialog.offer.start_date)} – {formatDate(dialog.offer.end_date)}</p></div>
                </div>
                <div><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</p><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{dialog.offer.description || "No description provided."}</p></div>
                <div className="flex justify-end"><button type="button" onClick={() => openForm(dialog.offer)} className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white hover:bg-violet-800"><Pencil size={16} /> Edit offer</button></div>
              </div>
            ) : (
              <form onSubmit={saveOffer} className="space-y-5 p-5 sm:p-7">
                <label className="block">
                  <span className="mb-1.5 block text-sm font-semibold text-slate-700">Offer ID</span>
                  <input
                    readOnly
                    value={dialog.mode === "edit" ? dialog.offer.id : "Generated automatically"}
                    className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-500 outline-none"
                  />
                </label>
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Offer title <span className="text-rose-500">*</span></span>
                    <input required maxLength={160} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="e.g. Mega Shopping Festival" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Discount percentage <span className="text-rose-500">*</span></span>
                    <div className="relative">
                      <input required type="number" min="0" max="100" step="0.01" value={form.offer_percentage} onChange={(event) => setForm({ ...form, offer_percentage: event.target.value })} placeholder="10" className="w-full rounded-xl border border-slate-200 px-3.5 py-3 pr-10 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">%</span>
                    </div>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Offer icon</span>
                    <select value={form.icon} onChange={(event) => setForm({ ...form, icon: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                      {Object.keys(OFFER_ICONS).map((icon) => <option key={icon} value={icon}>{icon}</option>)}
                    </select>
                    <span className="mt-2 inline-flex items-center gap-2 text-xs text-slate-500">{(() => { const Icon = OFFER_ICONS[form.icon]; return <Icon size={15} className="text-violet-600" />; })()} Preview</span>
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Start date <span className="text-rose-500">*</span></span>
                    <input required type="date" value={form.start_date} onChange={(event) => setForm({ ...form, start_date: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">End date <span className="text-rose-500">*</span></span>
                    <input required type="date" min={form.start_date || undefined} value={form.end_date} onChange={(event) => setForm({ ...form, end_date: event.target.value })} className="w-full rounded-xl border border-slate-200 px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Description</span>
                    <textarea maxLength={5000} rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Explain what makes this offer special..." className="w-full resize-y rounded-xl border border-slate-200 px-3.5 py-3 text-sm leading-6 outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100" />
                    <span className="mt-1 block text-right text-xs text-slate-400">{form.description.length}/5000</span>
                  </label>
                  <label className="sm:col-span-2">
                    <span className="mb-1.5 block text-sm font-semibold text-slate-700">Offer status</span>
                    <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm outline-none focus:border-violet-400 focus:ring-4 focus:ring-violet-100">
                      <option value="active">Active</option><option value="inactive">Inactive</option>
                    </select>
                  </label>
                </div>
                <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
                  {dialog.mode === "edit" && <div className="mr-auto self-center text-xs font-semibold text-slate-400">Offer ID #{dialog.offer.id}</div>}
                  <button type="button" onClick={closeDialog} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-700 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-60">
                    {saving ? <><RefreshCw size={15} className="animate-spin" /> Saving...</> : <><Check size={16} /> {dialog.mode === "edit" ? "Save changes" : "Create offer"}</>}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Offers;
