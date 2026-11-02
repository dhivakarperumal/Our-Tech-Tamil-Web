import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Image, ImagePlus, Loader2, Plus, Trash2, Wrench, X } from "lucide-react";
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
  const configuredBackendUrl = import.meta.env.VITE_BACKEND_URL || api.defaults.baseURL || window.location.origin;
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
  const [imagePreview, setImagePreview] = useState("");
  const imagePreviewRef = useRef("");
  const [deletingId, setDeletingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

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
    if (!isAddModalOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !uploadingImage) setIsAddModalOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddModalOpen, saving, uploadingImage]);

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
    imageForm.append("images", file);
    setUploadingImage(true);
    try {
      const { data } = await api.post("/products/upload", imageForm);
      const uploadedImage = data?.images?.[0];
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
      const { data } = await api.post("/admin/content/services", {
        ...form,
        service_id: form.service_id.trim(),
        name: form.name.trim(),
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        note: form.note.trim(),
        duration: form.duration.trim(),
        image_url: form.image_url.trim(),
      });
      setServices((current) => [data.service, ...current]);
      setForm(emptyService);
      if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
      imagePreviewRef.current = "";
      setImagePreview("");
      setIsAddModalOpen(false);
      toast.success("Service added.");
    } catch (error) {
      console.error("Failed to add service:", error);
      toast.error(error.response?.data?.message || "Could not add this service.");
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

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#250744] via-[#3B0A68] to-[#7410A2] p-6 text-white shadow-xl shadow-violet-950/10 sm:p-8">
        <div className="pointer-events-none absolute -right-10 -top-20 h-64 w-64 rounded-full bg-fuchsia-400/15 blur-3xl" />
        <div className="relative flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-[#FFD52E]">
            <Wrench className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#FFD52E]">Admin workspace</p>
            <h1 className="mt-1 text-2xl font-bold sm:text-3xl">Services</h1>
            <p className="mt-1 text-sm text-white/70">Create and manage the services offered to your customers.</p>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden rounded-2xl border border-white/15 bg-white/10 px-5 py-3 text-center sm:block">
              <p className="text-2xl font-bold">{services.length}</p>
              <p className="text-xs text-white/65">Total services</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#FFD52E] px-4 py-3 text-sm font-bold text-[#210839] shadow-lg shadow-amber-500/20 transition hover:-translate-y-0.5 hover:bg-[#FFE36A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-violet-900"
            >
              <Plus className="h-4 w-4" />
              Add service
            </button>
          </div>
        </div>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-5 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-slate-900">Your services</h2>
            <p className="mt-1 text-xs text-slate-500">Saved services appear here.</p>
          </div>
          <span className="shrink-0 rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-700">{services.length} total</span>
        </div>

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
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {services.map((service) => (
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
                <button
                  type="button"
                  onClick={() => deleteService(service)}
                  disabled={deletingId === service.id}
                  aria-label={`Delete ${service.name}`}
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                >
                  {deletingId === service.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </button>
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
                  <h2 id="add-service-title" className="mt-0.5 font-bold text-slate-900">Add a service</h2>
                  <p className="text-xs text-slate-500">Create a service listing. Fields marked * are required.</p>
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
                  Service ID *
                  <input
                    required
                    minLength={2}
                    maxLength={40}
                    pattern="[A-Za-z0-9][A-Za-z0-9_-]{1,39}"
                    value={form.service_id}
                    onChange={(event) => setForm({ ...form, service_id: event.target.value })}
                    placeholder="e.g. SRV-001"
                    className={inputClass}
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
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">
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
                <label className="mt-3 block text-xs font-medium text-slate-500">
                  Or paste an image URL
                  <span className="relative block">
                    <Image className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      inputMode="url"
                      maxLength={2048}
                      value={form.image_url}
                      onChange={(event) => {
                        if (imagePreviewRef.current) URL.revokeObjectURL(imagePreviewRef.current);
                        imagePreviewRef.current = "";
                        setImagePreview("");
                        setForm((current) => ({ ...current, image_url: event.target.value }));
                      }}
                      placeholder="https://example.com/service.jpg"
                      className={`${inputClass} pl-10`}
                    />
                  </span>
                </label>
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
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving..." : "Add service"}
                </button>
              </div>
            </footer>
          </section>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Services;
