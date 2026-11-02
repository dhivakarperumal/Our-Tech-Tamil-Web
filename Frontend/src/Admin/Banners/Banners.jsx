import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  Image,
  ImagePlus,
  Link as LinkIcon,
  Loader2,
  Megaphone,
  Monitor,
  Plus,
  Smartphone,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";

const emptyForm = {
  title: "",
  subtitle: "",
  description: "",
  destination_link: "",
  target_section: "hero",
  is_published: true,
  desktop_image: null,
  mobile_image: null,
};

const inputClassName = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";
const labelClassName = "text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400";

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000")
    .replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function getPublishedValue(value) {
  return value === true || Number(value) === 1;
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
}

function ImagePicker({ label, icon: Icon, image, onChange, required }) {
  const inputRef = useRef(null);
  const preview = image?.preview || getImageUrl(typeof image === "string" ? image : "");

  const selectImage = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Each banner image must be 8 MB or smaller.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      onChange({ file, preview: String(reader.result) });
    };
    reader.onerror = () => toast.error("Could not preview this image.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <span className={labelClassName}>{label}</span>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="group mt-2 flex h-32 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 transition hover:border-orange-300 hover:bg-orange-50/40"
      >
        {preview ? (
          <img
            src={preview}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:text-orange-500">
              <Icon size={19} />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wide text-slate-700">
              {required ? "Upload visual" : "Upload optional visual"}
            </span>
            <span className="mt-1 text-[10px] text-slate-400">JPEG, PNG, WebP or GIF · Max 8 MB</span>
          </>
        )}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={selectImage}
      />
      {preview && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="mt-2 text-xs font-semibold text-slate-500 transition hover:text-rose-600"
        >
          Remove {label.toLowerCase()}
        </button>
      )}
    </div>
  );
}

function BannerModal({ banner, saving, onClose, onSubmit }) {
  const [form, setForm] = useState(() => banner
    ? {
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      destination_link: banner.destination_link || "",
      target_section: banner.target_section || "hero",
      is_published: getPublishedValue(banner.is_published),
        desktop_image: banner.desktop_image || null,
      mobile_image: banner.mobile_image || null,
    }
    : emptyForm);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, saving]);

  const setField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const submit = (event) => {
    event.preventDefault();
    if (!form.desktop_image) {
      toast.error("Add a desktop banner visual.");
      return;
    }
    if (!form.mobile_image) {
      toast.error("Add a mobile banner visual.");
      return;
    }
    const data = new FormData();
    data.append("title", form.title.trim());
    data.append("subtitle", form.subtitle.trim());
    data.append("description", form.description.trim());
    data.append("destination_link", form.destination_link.trim());
    data.append("target_section", form.target_section);
    data.append("is_published", String(form.is_published));
    if (form.desktop_image?.file instanceof File) {
      data.append("desktop_image", form.desktop_image.file);
    }
    if (form.mobile_image?.file instanceof File) {
      data.append("mobile_image", form.mobile_image.file);
    }
    onSubmit(data);
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !saving) onClose();
      }}
    >
      <form
        onSubmit={submit}
        className="flex max-h-[min(94dvh,820px)] w-full max-w-[620px] flex-col overflow-hidden rounded-[26px] bg-white shadow-2xl"
      >
        <header className="flex items-center gap-3 border-b border-slate-100 px-5 py-4 sm:px-7">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-500 text-white shadow-lg shadow-orange-500/20">
            <ImagePlus size={20} />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">
              {banner ? "Edit promotion" : "New promotion"}
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-slate-400">
              Banner studio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
          >
            <X size={17} />
          </button>
        </header>

        <div className="space-y-5 overflow-y-auto px-5 py-5 sm:space-y-6 sm:px-7">
          <fieldset>
            <legend className={labelClassName}>Media assets</legend>
            <div className="mt-1 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:gap-4">
              <ImagePicker
                label="Desktop"
                icon={Monitor}
                image={form.desktop_image}
                onChange={(image) => setField("desktop_image", image)}
                required
              />
              <ImagePicker
                label="Mobile"
                icon={Smartphone}
                image={form.mobile_image}
                onChange={(image) => setField("mobile_image", image)}
                required
              />
            </div>
          </fieldset>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="block">
              <span className={labelClassName}>Headline</span>
              <input
                value={form.title}
                onChange={(event) => setField("title", event.target.value)}
                placeholder="Catchy main title"
                maxLength={160}
                required
                className={inputClassName}
              />
            </label>
            <label className="block">
              <span className={labelClassName}>Captivating subtitle</span>
              <input
                value={form.subtitle}
                onChange={(event) => setField("subtitle", event.target.value)}
                placeholder="Supporting tag line"
                maxLength={240}
                className={inputClassName}
              />
            </label>
          </div>

          <label className="block">
            <span className={labelClassName}>Detailed description</span>
            <textarea
              value={form.description}
              onChange={(event) => setField("description", event.target.value)}
              placeholder="Describe the offer or collection details..."
              maxLength={5000}
              rows={3}
              className={`${inputClassName} resize-y`}
            />
          </label>

          <label className="block">
            <span className={labelClassName}>Action destination (link)</span>
            <span className="relative block">
              <LinkIcon
                size={16}
                aria-hidden="true"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={form.destination_link}
                onChange={(event) => setField("destination_link", event.target.value)}
                placeholder="e.g. /shop or https://..."
                maxLength={2048}
                className={`${inputClassName} pl-11`}
              />
            </span>
          </label>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <fieldset>
              <legend className={labelClassName}>Target section</legend>
              <div className="mt-2 grid grid-cols-2 rounded-xl bg-slate-50 p-1">
                {[
                  ["hero", "Hero sec"],
                  ["offers", "Offers"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setField("target_section", value)}
                    aria-pressed={form.target_section === value}
                    className={`rounded-lg px-3 py-3 text-[10px] font-bold uppercase tracking-wide transition ${
                      form.target_section === value
                        ? "bg-white text-orange-600 shadow-sm"
                        : "text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className={labelClassName}>Visibility</legend>
              <button
                type="button"
                role="switch"
                aria-checked={form.is_published}
                onClick={() => setField("is_published", !form.is_published)}
                className={`mt-2 flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-3 text-[10px] font-bold uppercase tracking-wide transition ${
                  form.is_published
                    ? "border-orange-200 bg-orange-50 text-orange-600"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${form.is_published ? "bg-orange-500" : "bg-slate-400"}`} />
                {form.is_published ? "Published on website" : "Saved as draft"}
              </button>
            </fieldset>
          </div>
        </div>

        <footer className="flex items-center justify-end gap-3 border-t border-slate-100 bg-slate-50/70 px-5 py-4 sm:px-7">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-500 transition hover:bg-white hover:text-slate-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <UploadCloud size={16} />}
            {saving ? "Saving..." : banner ? "Save changes" : "Create promotion"}
          </button>
        </footer>
      </form>
    </div>
  );
}

function Banners() {
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [activeBanner, setActiveBanner] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchBanners = async () => {
      try {
        const { data } = await api.get("/admin/banners");
        if (active) setBanners(Array.isArray(data.banners) ? data.banners : []);
      } catch (error) {
        console.error("Failed to load banners:", error);
        if (active) {
          toast.error(error.response?.data?.message || "Could not load banners.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchBanners();
    return () => {
      active = false;
    };
  }, []);

  const openCreateModal = () => {
    setActiveBanner(null);
    setModalOpen(true);
  };

  const openEditModal = (banner) => {
    setActiveBanner(banner);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (!saving) setModalOpen(false);
  };

  const saveBanner = async (formData) => {
    setSaving(true);
    try {
      const { data } = activeBanner
        ? await api.put(`/admin/banners/${activeBanner.id}`, formData)
        : await api.post("/admin/banners", formData);
      setBanners((current) => activeBanner
        ? current.map((banner) => banner.id === data.banner.id ? data.banner : banner)
        : [data.banner, ...current]);
      setModalOpen(false);
      toast.success(activeBanner ? "Promotion updated." : "Promotion created.");
    } catch (error) {
      console.error("Failed to save banner:", error);
      toast.error(error.response?.data?.message || "Could not save this promotion.");
    } finally {
      setSaving(false);
    }
  };

  const deleteBanner = async (banner) => {
    if (!window.confirm(`Delete "${banner.title}"? This will also remove its uploaded images.`)) return;
    setDeletingId(banner.id);
    try {
      await api.delete(`/admin/banners/${banner.id}`);
      setBanners((current) => current.filter((entry) => entry.id !== banner.id));
      toast.success("Promotion deleted.");
    } catch (error) {
      console.error("Failed to delete banner:", error);
      toast.error(error.response?.data?.message || "Could not delete this promotion.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10 sm:space-y-7">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#391334] via-[#762542] to-[#C1421C] p-5 text-white shadow-xl shadow-orange-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-orange-300/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-orange-200 sm:h-14 sm:w-14">
            <Megaphone className="h-6 w-6 sm:h-7 sm:w-7" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200 sm:text-xs">
              Marketing management
            </p>
            <h1 className="mt-1 text-xl font-bold sm:text-3xl">Promotion banners</h1>
            <p className="mt-1 text-xs text-white/70 sm:text-sm">
              Create desktop and mobile promotions for your store.
            </p>
          </div>
          <div className="flex w-full items-center gap-3 sm:ml-auto sm:w-auto">
            <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-4 py-2 text-center sm:block">
              <p className="text-xl font-bold">{banners.length}</p>
              <p className="text-[10px] text-white/65">Total banners</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-400 px-4 py-3 text-sm font-bold text-[#3b1b20] shadow-lg shadow-orange-950/20 transition hover:-translate-y-0.5 hover:bg-orange-300 sm:flex-none"
            >
              <Plus size={17} />
              New promotion
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Your promotions</h2>
            <p className="mt-1 text-xs text-slate-500">Manage creative, destination, and visibility.</p>
          </div>
          <span className="shrink-0 rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-700">
            {banners.filter((banner) => getPublishedValue(banner.is_published)).length} published
          </span>
        </div>

        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-orange-600">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading promotions...</span>
          </div>
        ) : banners.length === 0 ? (
          <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
            <Image className="h-9 w-9 text-orange-300" />
            <p className="mt-3 font-semibold text-slate-700">No promotions yet</p>
            <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
              Add desktop and mobile visuals, choose where the banner belongs, and publish it when ready.
            </p>
            <button
              type="button"
              onClick={openCreateModal}
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              <Plus size={15} />
              Create your first promotion
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {banners.map((banner) => (
              <article
                key={banner.id}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-orange-200 hover:shadow-md"
              >
                <div className="relative h-40 bg-slate-100 sm:h-48">
                  {banner.desktop_image ? (
                    <img
                      src={getImageUrl(banner.desktop_image)}
                      alt={banner.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-slate-300">
                      <Image size={34} />
                    </div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ${
                    getPublishedValue(banner.is_published)
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-900/70 text-white"
                  }`}>
                    {getPublishedValue(banner.is_published) ? "Published" : "Draft"}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700">
                    {banner.target_section === "offers" ? "Offers" : "Hero section"}
                  </span>
                </div>
                <div className="space-y-4 p-4 sm:p-5">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-bold text-slate-900">{banner.title}</h3>
                      {banner.subtitle && (
                        <p className="mt-1 truncate text-sm text-slate-500">{banner.subtitle}</p>
                      )}
                      {banner.description && (
                        <p className="mt-2 line-clamp-2 text-xs leading-5 text-slate-500">{banner.description}</p>
                      )}
                    </div>
                    {banner.destination_link && (
                      <a
                        href={banner.destination_link}
                        target={/^https?:\/\//i.test(banner.destination_link) ? "_blank" : undefined}
                        rel="noreferrer"
                        aria-label="Open banner destination"
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600 transition hover:bg-orange-100"
                      >
                        <ArrowUpRight size={17} />
                      </a>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2 border-t border-slate-100 pt-3 text-[10px] text-slate-500 sm:grid-cols-2">
                    <span>Created: {formatDate(banner.created_at)}</span>
                    <span>Updated: {formatDate(banner.updated_at)}</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-2 text-[10px] font-medium text-slate-500">
                      {banner.mobile_image ? (
                        <>
                          <Smartphone size={14} className="text-slate-400" />
                          Mobile visual added
                        </>
                      ) : (
                        <>
                          <Monitor size={14} className="text-slate-400" />
                          Desktop visual only
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(banner)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBanner(banner)}
                        disabled={deletingId === banner.id}
                        aria-label={`Delete ${banner.title}`}
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-rose-100 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
                      >
                        {deletingId === banner.id
                          ? <Loader2 size={15} className="animate-spin" />
                          : <Trash2 size={15} />}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {modalOpen && (
        <BannerModal
          key={activeBanner?.id || "new"}
          banner={activeBanner}
          saving={saving}
          onClose={closeModal}
          onSubmit={saveBanner}
        />
      )}
    </div>
  );
}

export default Banners;
