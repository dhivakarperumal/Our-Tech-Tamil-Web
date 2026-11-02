import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  CircleAlert,
  Edit2,
  Eye,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  Plus,
  Search,
  Trash2,
  Wrench,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import StatusDropdown from "../StatusDropdown";

const emptyService = {
  service_id: "",
  name: "",
  title: "",
  subtitle: "",
  description: "",
  note: "",
  price: "",
  duration: "",
  image_url: "",
  status: "Active",
};

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";

const getServiceImageUrl = (image) => {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image;
  const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL
    || (api.defaults.baseURL?.startsWith("http") ? api.defaults.baseURL : "http://localhost:5000");
  const backendOrigin = new URL(configuredBackendUrl, window.location.origin).origin;
  const imagePath = image.replace(/\\/g, "/").replace(/^\/+/, "");
  return new URL(imagePath, `${backendOrigin}/`).href;
};

const Services = () => {
  const [services, setServices] = useState([]);
  const [form, setForm] = useState(emptyService);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [loadingServiceId, setLoadingServiceId] = useState(false);
  const [imagePreview, setImagePreview] = useState("");
  const imagePreviewRef = useRef("");
  const [deletingId, setDeletingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [viewService, setViewService] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  const loadServices = async () => {
    try {
      const { data } = await api.get("/admin/content/services");
      setServices(Array.isArray(data.services) ? data.services : []);
    } catch (error) {
      console.error("Failed to load services:", error);
      toast.error(error.response?.data?.message || "Could not load services.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  useEffect(() => () => {
    if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
  }, []);

  useEffect(() => {
    if (!isAddModalOpen && !viewService) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !uploadingImage) {
        setIsAddModalOpen(false);
        setViewService(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddModalOpen, viewService, saving, uploadingImage]);

  const uploadServiceImage = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type)) {
      toast.error("Choose a PNG, JPEG, WEBP, or GIF image.");
      event.target.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
    imagePreviewRef.current = previewUrl;
    setImagePreview(previewUrl);
    setForm((current) => ({ ...current, image_url: "" }));

    const imageForm = new FormData();
    imageForm.append("file", file);
    setUploadingImage(true);
    try {
      const { data } = await api.post("/admin/content/services/upload-image", imageForm);
      const uploadedImage = data?.image;
      if (typeof uploadedImage !== "string" || !uploadedImage) {
        throw new Error("The image upload did not return a saved image.");
      }
      setForm((current) => ({ ...current, image_url: uploadedImage }));
      toast.success("Service image uploaded.");
    } catch (error) {
      console.error("Failed to upload service image:", error);
      toast.error(error.response?.data?.message || error.message || "Could not upload the service image.");
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = "";
      setImagePreview("");
      setForm((current) => ({ ...current, image_url: "" }));
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const submitService = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const servicePayload = {
        ...form,
        service_id: form.service_id.trim(),
        name: form.name.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        note: form.note.trim(),
        duration: form.duration.trim(),
        image_url: form.image_url.trim(),
      };
      const { data } = editingServiceId
        ? await api.put(`/admin/content/services/${editingServiceId}`, servicePayload)
        : await api.post("/admin/content/services", servicePayload);
      setServices((current) => editingServiceId
        ? current.map((service) => service.id === data.service.id ? data.service : service)
        : [data.service, ...current]);
      setForm(emptyService);
      setEditingServiceId(null);
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = "";
      setImagePreview("");
      setIsAddModalOpen(false);
      toast.success(editingServiceId ? "Service updated." : "Service added.");
    } catch (error) {
      console.error(editingServiceId ? "Failed to update service:" : "Failed to add service:", error);
      toast.error(error.response?.data?.message || `Could not ${editingServiceId ? "update" : "add"} this service.`);
    } finally {
      setSaving(false);
    }
  };

  const deleteService = async (service) => {
    if (!window.confirm(`Delete "${service.name}"? This cannot be undone.`)) return;
    setDeletingId(service.id);
    try {
      await api.delete(`/admin/content/services/${service.id}`);
      setServices((current) => current.filter((entry) => entry.id !== service.id));
      toast.success("Service deleted.");
    } catch (error) {
      console.error("Failed to delete service:", error);
      toast.error(error.response?.data?.message || "Could not delete this service.");
    } finally {
      setDeletingId(null);
    }
  };

  const openAddServiceModal = async () => {
    setLoadingServiceId(true);
    try {
      const { data } = await api.get("/admin/content/services/next-id");
      if (typeof data.service_id !== "string" || !data.service_id) {
        throw new Error("The server did not return a Service ID.");
      }
      setForm({ ...emptyService, service_id: data.service_id });
      setEditingServiceId(null);
      setImagePreview("");
      setIsAddModalOpen(true);
    } catch (error) {
      console.error("Failed to generate Service ID:", error);
      toast.error(error.response?.data?.message || error.message || "Could not generate a Service ID.");
    } finally {
      setLoadingServiceId(false);
    }
  };

  const openEditServiceModal = (service) => {
    setForm({
      service_id: service.service_id || "",
      name: service.name || "",
      title: service.title || "",
      subtitle: service.subtitle || "",
      description: service.description || "",
      note: service.note || "",
      price: service.price == null ? "" : String(service.price),
      duration: service.duration || "",
      image_url: service.image_url || "",
      status: service.status || "Active",
    });
    setEditingServiceId(service.id);
    setImagePreview("");
    setIsAddModalOpen(true);
  };

  const activeServiceCount = services.filter((service) => service.status === "Active").length;
  const inactiveServiceCount = services.length - activeServiceCount;
  const filteredServices = services.filter((service) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [
      service.name,
      service.title,
      service.subtitle,
      service.service_id,
      service.description,
    ].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "All" || service.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <section aria-label="Service summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Services", value: services.length, detail: "All service listings", Icon: Wrench, color: "bg-violet-700" },
          { label: "Active", value: activeServiceCount, detail: "Available services", Icon: BadgeCheck, color: "bg-emerald-500" },
          { label: "Inactive", value: inactiveServiceCount, detail: "Hidden services", Icon: CircleAlert, color: "bg-amber-500" },
        ].map(({ label, value, detail, Icon, color }) => (
          <article key={label} className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm ${color}`}>
              <Icon className="h-6 w-6" />
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-slate-400">{label}</p>
              <p className="text-3xl font-black leading-tight text-slate-800">{value}</p>
              <p className="truncate text-xs text-slate-400">{detail}</p>
            </div>
          </article>
        ))}
      </section>

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5 xl:flex-row xl:items-center xl:justify-between">
          <label className="relative block w-full xl:max-w-md">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search services by name, ID, title..."
              aria-label="Search services"
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
            />
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              aria-label="Filter services by status"
              className="min-w-36 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 outline-none focus:border-violet-300"
            >
              <option value="All">All statuses</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-1">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label="Grid view"
                aria-pressed={viewMode === "grid"}
                className={`rounded-lg p-2.5 transition ${viewMode === "grid" ? "bg-white text-violet-700 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                aria-pressed={viewMode === "table"}
                className={`rounded-lg p-2.5 transition ${viewMode === "table" ? "bg-white text-violet-700 shadow-sm" : "text-slate-400 hover:text-slate-700"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <button
              type="button"
              onClick={openAddServiceModal}
              disabled={loadingServiceId}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-60 sm:flex-none"
            >
              {loadingServiceId ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Add service
            </button>
          </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center text-violet-700">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading services...</span>
          </div>
        ) : services.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
            <Wrench className="h-8 w-8 text-violet-300" />
            <p className="mt-3 font-semibold text-slate-700">No services yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first service to get started.</p>
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
            <Search className="h-8 w-8 text-violet-300" />
            <p className="mt-3 font-semibold text-slate-700">No matching services</p>
            <p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-violet-950 text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-4">S. No.</th>
                  <th className="px-4 py-4">Service</th>
                  <th className="px-4 py-4">Service ID</th>
                  <th className="px-4 py-4">Price</th>
                  <th className="px-4 py-4">Duration</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredServices.map((service, index) => (
                  <tr key={service.id} className="text-sm text-slate-700 hover:bg-violet-50/40">
                    <td className="px-4 py-4 font-semibold text-slate-500">{index + 1}</td>
                    <td className="px-4 py-4">
                      <p className="font-semibold text-slate-900">{service.title}</p>
                      <p className="text-xs text-slate-500">{service.name}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-violet-700">{service.service_id}</td>
                    <td className="px-4 py-4">{service.price == null ? "—" : `₹${Number(service.price).toLocaleString("en-IN")}`}</td>
                    <td className="px-4 py-4">{service.duration || "—"}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${service.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {service.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-end gap-1">
                        <button type="button" onClick={() => setViewService(service)} aria-label={`View ${service.name}`} title="View service details" className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => openEditServiceModal(service)} aria-label={`Edit ${service.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700">
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button type="button" onClick={() => deleteService(service)} disabled={deletingId === service.id} aria-label={`Delete ${service.name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                          {deletingId === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filteredServices.map((service) => (
              <article key={service.id} className="flex gap-4 rounded-xl border border-slate-100 p-4 transition hover:border-violet-200 hover:bg-violet-50/30">
                {service.image_url ? (
                  <img src={getServiceImageUrl(service.image_url)} alt="" className="h-16 w-16 shrink-0 rounded-lg bg-slate-100 object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <Wrench className="h-6 w-6" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-slate-900">{service.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${service.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {service.status}
                    </span>
                  </div>
                  <p className="mt-1 text-xs font-medium text-violet-700">{service.service_id} · {service.name}</p>
                  {service.subtitle && <p className="mt-1 text-sm font-medium text-slate-600">{service.subtitle}</p>}
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">{service.description || "No description provided."}</p>
                  {service.note && <p className="mt-2 line-clamp-2 rounded-lg bg-amber-50 px-2.5 py-1.5 text-xs text-amber-800">{service.note}</p>}
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs font-medium text-slate-600">
                    {service.price != null && <span>₹{Number(service.price).toLocaleString("en-IN")}</span>}
                    {service.duration && <span>{service.duration}</span>}
                  </div>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => setViewService(service)}
                    aria-label={`View ${service.name}`}
                    title="View service details"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => openEditServiceModal(service)}
                    aria-label={`Edit ${service.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteService(service)}
                    disabled={deletingId === service.id}
                    aria-label={`Delete ${service.name}`}
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                  >
                    {deletingId === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {isAddModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-x-hidden overflow-y-auto overscroll-y-contain bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !uploadingImage) setIsAddModalOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-service-title"
            className="my-0 flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25 sm:my-auto sm:h-[min(90dvh,52rem)] sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <div className="z-10 flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white via-white to-violet-50/70 px-5 py-4 sm:px-7">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-100 text-violet-700 shadow-sm shadow-violet-900/10">
                  <Wrench className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Service management</p>
                  <h2 id="add-service-title" className="mt-0.5 font-bold text-slate-900">{editingServiceId ? "Edit service" : "Add a service"}</h2>
                  <p className="text-xs text-slate-500">{editingServiceId ? "Update this service listing." : "Create a service listing."} Fields marked * are required.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={saving || uploadingImage}
                aria-label="Close add service dialog"
                className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-500 transition hover:bg-white hover:text-slate-900 hover:shadow-sm disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              id="add-service-form"
              onSubmit={submitService}
              className="min-h-0 flex-1 basis-0 space-y-5 overflow-x-hidden overflow-y-auto overscroll-y-contain p-5 sm:p-7"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Service ID (Auto-generated)
                  <input
                    readOnly
                    value={form.service_id}
                    placeholder="Generating..."
                    className={`${inputClass} cursor-not-allowed bg-slate-50`}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Service name *
                  <input
                    required
                    minLength={2}
                    maxLength={120}
                    value={form.name}
                    onChange={(event) => setForm({ ...form, name: event.target.value })}
                    placeholder="e.g. Custom blouse stitching"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Service title *
                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="Enter the title customers will see"
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Service subtitle
                  <input
                    maxLength={240}
                    value={form.subtitle}
                    onChange={(event) => setForm({ ...form, subtitle: event.target.value })}
                    placeholder="Add a short supporting line"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                Service description
                <textarea
                  rows={4}
                  maxLength={5000}
                  value={form.description}
                  onChange={(event) => setForm({ ...form, description: event.target.value })}
                  placeholder="Describe what this service includes..."
                  className={`${inputClass} resize-y`}
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Note
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={form.note}
                    onChange={(event) => setForm({ ...form, note: event.target.value })}
                    placeholder="Add any important service note..."
                    className={`${inputClass} resize-y`}
                  />
                </label>
                <StatusDropdown
                  label="Visibility"
                  value={form.status}
                  onChange={(status) => setForm({ ...form, status })}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Price (₹)
                  <input
                    type="number"
                    min="0"
                    max="99999999.99"
                    step="0.01"
                    value={form.price}
                    onChange={(event) => setForm({ ...form, price: event.target.value })}
                    placeholder="Optional"
                    className={inputClass}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Duration
                  <input
                    maxLength={80}
                    value={form.duration}
                    onChange={(event) => setForm({ ...form, duration: event.target.value })}
                    placeholder="e.g. 3-5 business days"
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="block text-sm font-semibold text-slate-700">
                Service image
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">
                    {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    {uploadingImage ? "Uploading image..." : imagePreview ? "Change image" : "Choose image"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      onChange={uploadServiceImage}
                      disabled={uploadingImage || saving}
                      aria-label="Upload service image"
                      className="sr-only"
                    />
                  </label>
                  {(imagePreview || form.image_url) && (
                    <>
                      <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2">
                        <img
                          src={imagePreview || getServiceImageUrl(form.image_url)}
                          alt="Service image preview"
                          className="h-16 w-24 rounded-lg border border-slate-200 bg-white object-cover shadow-sm"
                        />
                        <span className="text-xs font-semibold text-slate-600">
                          {uploadingImage ? "Uploading..." : "Image ready"}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
                          imagePreviewRef.current = "";
                          setImagePreview("");
                          setForm((current) => ({ ...current, image_url: "" }));
                        }}
                        className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50 hover:text-rose-700"
                      >
                        Remove image
                      </button>
                    </>
                  )}
                </div>
              </div>

            </form>

            <footer className="z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-slate-500">Your service will be available in the admin service list.</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={saving || uploadingImage}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-service-form"
                  disabled={saving || uploadingImage}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingServiceId ? <Edit2 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving..." : editingServiceId ? "Update service" : "Add service"}
                </button>
              </div>
            </footer>
          </section>
        </div>,
        document.body
      )}

      {viewService && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewService(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="service-view-title"
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25"
          >
            <header className="flex items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-white to-violet-50/70 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Service details</p>
                <h2 id="service-view-title" className="mt-1 text-lg font-bold text-slate-900">{viewService.title}</h2>
                <p className="mt-1 text-xs font-medium text-violet-700">{viewService.service_id}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewService(null)}
                aria-label="Close service details"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 transition hover:bg-white hover:text-slate-900"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-5 p-5 sm:p-7">
              {viewService.image_url && (
                <img
                  src={getServiceImageUrl(viewService.image_url)}
                  alt={viewService.title}
                  className="aspect-video w-full rounded-2xl bg-slate-100 object-cover"
                />
              )}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{viewService.name}</p>
                  {viewService.subtitle && <p className="mt-1 text-sm text-slate-500">{viewService.subtitle}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${viewService.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {viewService.status}
                </span>
              </div>
              {(viewService.price != null || viewService.duration) && (
                <div className="grid gap-3 sm:grid-cols-2">
                  {viewService.price != null && (
                    <div className="rounded-xl bg-violet-50 p-3">
                      <p className="text-xs font-semibold text-violet-600">Price</p>
                      <p className="mt-1 font-bold text-slate-900">₹{Number(viewService.price).toLocaleString("en-IN")}</p>
                    </div>
                  )}
                  {viewService.duration && (
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs font-semibold text-slate-500">Duration</p>
                      <p className="mt-1 font-bold text-slate-900">{viewService.duration}</p>
                    </div>
                  )}
                </div>
              )}
              {viewService.description && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">Description</h3>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{viewService.description}</p>
                </div>
              )}
              {viewService.note && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">Note</h3>
                  <p className="whitespace-pre-wrap rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{viewService.note}</p>
                </div>
              )}
            </div>
            <footer className="flex justify-end border-t border-slate-100 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => {
                  const service = viewService;
                  setViewService(null);
                  openEditServiceModal(service);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
              >
                <Edit2 className="h-4 w-4" />Edit service
              </button>
            </footer>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Services;
