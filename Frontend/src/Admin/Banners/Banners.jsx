import { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileImage,
  Image,
  ImagePlus,
  LayoutGrid,
  Link as LinkIcon,
  Loader2,
  Megaphone,
  Monitor,
  Pencil,
  Plus,
  Search,
  Smartphone,
  Trash2,
  UploadCloud,
  X,
  List,
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

const inputClassName = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-primary focus:ring-4 focus:ring-primary/10";
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
        className="group mt-2 flex h-32 w-full flex-col items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/70 transition hover:border-primary-light hover:bg-primary/5"
      >
        {preview ? (
          <img
            src={preview}
            alt={`${label} preview`}
            className="h-full w-full object-cover"
          />
        ) : (
          <>
            <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm transition group-hover:text-primary">
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
    if (!form.mobile_image && banner?.mobile_image) {
      data.append("remove_mobile_image", "true");
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
        <header className="relative flex items-center gap-3 overflow-hidden border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-fuchsia-800 px-5 py-4 sm:px-7">
          <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border-[24px] border-white/[0.06]" />
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-violet-100 shadow-inner">
            <ImagePlus size={20} />
          </div>
          <div className="relative min-w-0">
            <h2 className="text-base font-extrabold text-white">
              {banner ? "Edit promotion" : "New promotion"}
            </h2>
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-violet-200">
              Banner studio
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close dialog"
            className="relative ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
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
                        ? "bg-white text-primary shadow-sm"
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
                    ? "border-accent/50 bg-accent/10 text-primary"
                    : "border-slate-200 bg-slate-50 text-slate-500"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${form.is_published ? "bg-primary" : "bg-slate-400"}`} />
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
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-dark via-primary to-gradient-middle px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
      setCurrentPage((page) => Math.min(
        page,
        Math.max(1, Math.ceil((banners.length - 1) / itemsPerPage)),
      ));
      toast.success("Promotion deleted.");
    } catch (error) {
      console.error("Failed to delete banner:", error);
      toast.error(error.response?.data?.message || "Could not delete this promotion.");
    } finally {
      setDeletingId(null);
    }
  };

  const publishedCount = banners.filter((banner) =>
    getPublishedValue(banner.is_published),
  ).length;
  const draftCount = banners.length - publishedCount;
  const filteredBanners = banners.filter((banner) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [
      banner.title,
      banner.subtitle,
      banner.description,
      banner.target_section,
      String(banner.id),
    ].some((value) => String(value || "").toLowerCase().includes(query));
    const isPublished = getPublishedValue(banner.is_published);
    const matchesStatus = statusFilter === "All" ||
      (statusFilter === "Published" && isPublished) ||
      (statusFilter === "Draft" && !isPublished);
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.max(1, Math.ceil(filteredBanners.length / itemsPerPage));
  const visibleBanners = filteredBanners.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const renderBannerActions = (banner) => (
    <div className="flex items-center justify-center gap-2">
      <button
        type="button"
        onClick={() => openEditModal(banner)}
        aria-label={`Edit ${banner.title}`}
        title="Edit"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-violet-100 text-primary transition hover:bg-primary/10"
      >
        <Pencil size={14} />
      </button>
      <button
        type="button"
        onClick={() => deleteBanner(banner)}
        disabled={deletingId === banner.id}
        aria-label={`Delete ${banner.title}`}
        title="Delete"
        className="flex h-8 w-8 items-center justify-center rounded-full border border-rose-100 text-rose-500 transition hover:bg-rose-50 disabled:opacity-50"
      >
        {deletingId === banner.id
          ? <Loader2 size={14} className="animate-spin" />
          : <Trash2 size={14} />}
      </button>
    </div>
  );

  const renderBannerImage = (banner, className) => banner.desktop_image
    ? (
      <img
        src={getImageUrl(banner.desktop_image)}
        alt={banner.title}
        className={className}
      />
    )
    : (
      <div className="flex h-full w-full items-center justify-center bg-gray-50 text-gray-300">
        <FileImage size={24} />
      </div>
    );

  return (
    <div className="min-h-screen space-y-6 pb-20 font-sans">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-6">
        <div className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#8B5CF6] text-white shadow-lg shadow-purple-200 sm:h-16 sm:w-16">
            <Image size={25} />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-gray-400">Total Banners</p>
            <h3 className="mb-1 text-3xl font-black leading-none text-slate-800">{banners.length}</h3>
            <p className="text-[11px] font-medium text-gray-400">All promotional banners</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#10B981] text-white shadow-lg shadow-emerald-200 sm:h-16 sm:w-16">
            <CheckCircle2 size={25} />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-gray-400">Published</p>
            <h3 className="mb-1 text-3xl font-black leading-none text-slate-800">{publishedCount}</h3>
            <p className="text-[11px] font-medium text-gray-400">Visible on website</p>
          </div>
        </div>
        <div className="flex items-center gap-5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[#F59E0B] text-white shadow-lg shadow-orange-200 sm:h-16 sm:w-16">
            <Megaphone size={25} />
          </div>
          <div>
            <p className="mb-1 text-xs font-bold text-gray-400">Drafts</p>
            <h3 className="mb-1 text-3xl font-black leading-none text-slate-800">{draftCount}</h3>
            <p className="text-[11px] font-medium text-gray-400">Not published yet</p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="relative w-full flex-1 sm:min-w-[220px] sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-lg text-gray-400" size={18} />
          <input
            type="search"
            placeholder="Search banners by headline, subtitle..."
            value={searchQuery}
            onChange={(event) => {
              setSearchQuery(event.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-gray-100 bg-gray-50 py-2.5 pl-11 pr-4 text-sm font-medium text-gray-700 outline-none transition-all placeholder:text-gray-400 focus:border-purple-300 focus:ring-2 focus:ring-purple-100"
          />
        </div>

        <div className="flex w-full flex-wrap items-center gap-3 sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value);
                setCurrentPage(1);
              }}
              className="w-full cursor-pointer appearance-none rounded-xl border border-gray-200 bg-white py-2.5 pl-4 pr-10 text-sm font-bold text-gray-600 outline-none focus:border-purple-300 sm:w-auto"
            >
              <option value="All">Select Status</option>
              <option value="Published">Published</option>
              <option value="Draft">Draft</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                aria-pressed={viewMode === "table"}
                className={`rounded-lg p-2 transition-all ${viewMode === "table" ? "admin-button-toggle-active" : "admin-button-toggle-inactive"}`}
              >
                <List size={18} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Card view"
                aria-pressed={viewMode === "grid"}
                className={`rounded-lg p-2 transition-all ${viewMode === "grid" ? "admin-button-toggle-active" : "admin-button-toggle-inactive"}`}
              >
                <LayoutGrid size={18} />
              </button>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="admin-button-primary flex items-center gap-2 rounded-md px-4 py-3 text-sm font-bold shadow-md active:scale-95 sm:px-5"
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Add New Banner</span>
              <span className="sm:hidden">Add Banner</span>
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12">
          <div className="mb-4 h-10 w-10 animate-spin rounded-full border-4 border-purple-100 border-t-purple-600" />
          <p className="font-bold text-gray-500">Loading Banners...</p>
        </div>
      ) : visibleBanners.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white p-12 text-center sm:p-16">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-50 text-gray-300">
            <Search size={30} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">
            {banners.length ? "No banners found" : "No promotions yet"}
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            {banners.length
              ? "Adjust your search or filter to find what you're looking for."
              : "Add a banner to promote your store's offers and collections."}
          </p>
          {!banners.length && (
            <button
              type="button"
              onClick={openCreateModal}
              className="admin-button-primary mt-5 flex items-center gap-2 rounded-md px-5 py-3 text-sm font-bold shadow-md"
            >
              <Plus size={17} />
              Add New Banner
            </button>
          )}
        </div>
      ) : viewMode === "table" ? (
        <div className="mb-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left">
              <thead>
                <tr className="admin-table-header border-b border-[#3c096c]">
                  <th className="w-12 px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">S.No.</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Banner</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Description</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Target section</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Status</th>
                  <th className="px-4 py-4 text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Updated</th>
                  <th className="px-4 py-4 text-center text-[10px] font-bold uppercase tracking-wider text-[#FCD34D]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {visibleBanners.map((banner, index) => (
                  <tr key={banner.id} className="group transition-colors hover:bg-gray-50/50">
                    <td className="px-4 py-4 text-center text-sm font-bold text-gray-500">
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                          {renderBannerImage(banner, "h-full w-full object-cover")}
                        </div>
                        <div className="min-w-0">
                          <h4 className="max-w-[220px] truncate text-sm font-bold text-slate-800">{banner.title}</h4>
                          {banner.subtitle && (
                            <p className="max-w-[220px] truncate text-[11px] text-gray-400">{banner.subtitle}</p>
                          )}
                          <p className="mt-0.5 text-[10px] font-medium text-gray-400">ID: {banner.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-4 text-sm font-medium text-gray-500">
                      {banner.description || "No description"}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-block rounded-lg bg-violet-50 px-3 py-1 text-[11px] font-bold text-violet-700">
                        {banner.target_section === "offers" ? "Offers" : "Hero section"}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {getPublishedValue(banner.is_published) ? (
                        <span className="inline-block rounded-lg bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-600">Published</span>
                      ) : (
                        <span className="inline-block rounded-lg bg-orange-50 px-3 py-1 text-[11px] font-bold text-orange-600">Draft</span>
                      )}
                    </td>
                    <td className="px-4 py-4 text-xs font-medium text-gray-500">{formatDate(banner.updated_at)}</td>
                    <td className="px-4 py-4">{renderBannerActions(banner)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 px-4 py-3 text-xs text-gray-500">
            <span>
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, filteredBanners.length)} of {filteredBanners.length} banners
            </span>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((page) => page - 1)}
                  aria-label="Previous page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="font-bold text-slate-700">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((page) => page + 1)}
                  aria-label="Next page"
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {visibleBanners.map((banner) => (
              <article key={banner.id} className="flex h-full flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition-all hover:shadow-md">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-gray-100 bg-gray-50">
                    {renderBannerImage(banner, "h-full w-full object-cover")}
                  </div>
                  <span className="rounded bg-gray-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    ID: {banner.id}
                  </span>
                </div>

                <div className="flex-1">
                  <h3 className="mb-1 text-sm font-bold text-slate-800">{banner.title}</h3>
                  {banner.subtitle && (
                    <p className="mb-2 line-clamp-1 text-xs font-semibold text-violet-700">{banner.subtitle}</p>
                  )}
                  <p className="mb-4 line-clamp-2 text-xs text-gray-500">
                    {banner.description || "No description provided."}
                  </p>

                  <div className="mb-4 flex flex-wrap items-center gap-4">
                    <div>
                      <p className="text-[10px] font-medium text-gray-400">Target section</p>
                      <span className="mt-0.5 inline-block rounded bg-violet-50 px-2 py-0.5 text-[10px] font-bold uppercase text-violet-700">
                        {banner.target_section === "offers" ? "Offers" : "Hero"}
                      </span>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-gray-400">Status</p>
                      {getPublishedValue(banner.is_published) ? (
                        <span className="mt-0.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-600">Published</span>
                      ) : (
                        <span className="mt-0.5 inline-block rounded bg-orange-50 px-2 py-0.5 text-[10px] font-bold uppercase text-orange-600">Draft</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mb-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3 text-[10px] text-gray-400">
                  <span>Created: {formatDate(banner.created_at)}</span>
                  <span>{banner.mobile_image ? "Desktop + mobile" : "Desktop only"}</span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  {banner.destination_link ? (
                    <a
                      href={banner.destination_link}
                      target={/^https?:\/\//i.test(banner.destination_link) ? "_blank" : undefined}
                      rel="noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
                    >
                      Destination <ArrowUpRight size={14} />
                    </a>
                  ) : <span />}
                  {renderBannerActions(banner)}
                </div>
              </article>
            ))}
          </div>
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-center gap-3 text-xs text-gray-500">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((page) => page - 1)}
                aria-label="Previous page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-bold text-slate-700">{currentPage} / {totalPages}</span>
              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((page) => page + 1)}
                aria-label="Next page"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      )}

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
