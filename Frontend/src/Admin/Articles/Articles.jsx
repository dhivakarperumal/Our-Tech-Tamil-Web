import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  FilePlus2,
  ImagePlus,
  Link2,
  Loader2,
  Pencil,
  Plus,
  ShoppingBag,
  Star,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";

const emptyForm = {
  content_type: "article",
  content_id: "",
  title: "",
  product_name: "",
  description: "",
  product_features: [],
  image_url: "",
  rating: "5",
  buy_links: [{ name: "", url: "" }],
  more_details: "",
};

const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const getImageUrl = (image) => {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image;
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchArticles = async () => {
      try {
        const { data } = await api.get("/admin/content/articles");
        if (active) setArticles(Array.isArray(data.articles) ? data.articles : []);
      } catch (error) {
        console.error("Failed to load articles and product reviews:", error);
        toast.error(error.response?.data?.message || "Could not load articles and product reviews.");
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchArticles();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (editingId) return;
    let active = true;
    api.get("/admin/content/articles/next-id", { params: { type: form.content_type } })
      .then(({ data }) => {
        if (typeof data.content_id !== "string" || !data.content_id) {
          throw new Error("The server did not return a content ID.");
        }
        if (active) setForm((current) => ({ ...current, content_id: data.content_id }));
      })
      .catch((error) => {
        console.error("Failed to generate content ID:", error);
        toast.error(error.response?.data?.message || error.message || "Could not generate a content ID.");
      });
    return () => {
      active = false;
    };
  }, [form.content_type, editingId]);

  useEffect(() => {
    if (!isFormOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !uploadingImage) {
        setIsFormOpen(false);
        setEditingId(null);
        setForm(emptyForm);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFormOpen, saving, uploadingImage]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateRow = (field, index, key, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row),
    }));
  };

  const addRow = (field, row) => {
    setForm((current) => ({ ...current, [field]: [...current[field], row] }));
  };

  const removeRow = (field, index) => {
    setForm((current) => ({ ...current, [field]: current[field].filter((_, rowIndex) => rowIndex !== index) }));
  };

  const uploadImage = async (event) => {
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

    const imageForm = new FormData();
    imageForm.append("file", file);
    setUploadingImage(true);
    try {
      const { data } = await api.post("/admin/content/articles/upload-image", imageForm);
      if (typeof data.image !== "string" || !data.image) {
        throw new Error("The image upload did not return a saved image.");
      }
      updateForm("image_url", data.image);
      toast.success("Image uploaded.");
    } catch (error) {
      console.error("Failed to upload article image:", error);
      toast.error(error.response?.data?.message || error.message || "Could not upload the image.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    if (!form.image_url) {
      toast.error("Upload an image before saving.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      title: form.title.trim(),
      product_name: form.product_name.trim(),
      description: form.description.trim(),
      product_features: form.product_features
        .map((feature) => ({ name: feature.name.trim(), value: feature.value.trim() }))
        .filter((feature) => feature.name || feature.value),
      buy_links: form.buy_links
        .map((link) => ({ name: link.name.trim(), url: link.url.trim() }))
        .filter((link) => link.name || link.url),
      more_details: form.more_details.trim(),
      rating: form.content_type === "product_review" ? Number(form.rating) : null,
    };

    try {
      const { data } = editingId
        ? await api.put(`/admin/content/articles/${editingId}`, payload)
        : await api.post("/admin/content/articles", payload);
      setArticles((current) => editingId
        ? current.map((item) => item.id === data.article.id ? data.article : item)
        : [data.article, ...current]);
      resetForm();
      setIsFormOpen(false);
      toast.success(editingId ? "Content updated." : "Content added.");
    } catch (error) {
      console.error(editingId ? "Failed to update content:" : "Failed to create content:", error);
      toast.error(error.response?.data?.message || `Could not ${editingId ? "update" : "save"} this content.`);
    } finally {
      setSaving(false);
    }
  };

  const editArticle = (item) => {
    setEditingId(item.id);
    setForm({
      content_type: item.content_type,
      content_id: item.content_id,
      title: item.title || "",
      product_name: item.product_name || "",
      description: item.description || "",
      product_features: Array.isArray(item.product_features)
        ? item.product_features
        : item.product_features
          ? [{ name: "Details", value: item.product_features }]
          : [],
      image_url: item.image_url || "",
      rating: item.rating == null ? "5" : String(item.rating),
      buy_links: Array.isArray(item.buy_links) && item.buy_links.length
        ? item.buy_links
        : item.buy_link
          ? [{ name: "Buy", url: item.buy_link }]
          : [{ name: "", url: "" }],
      more_details: item.more_details || "",
    });
    setIsFormOpen(true);
  };

  const deleteArticle = async (item) => {
    const name = item.content_type === "article" ? item.title : item.product_name;
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setDeletingId(item.id);
    try {
      await api.delete(`/admin/content/articles/${item.id}`);
      setArticles((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) {
        resetForm();
        setIsFormOpen(false);
      }
      toast.success("Content deleted.");
    } catch (error) {
      console.error("Failed to delete content:", error);
      toast.error(error.response?.data?.message || "Could not delete this content.");
    } finally {
      setDeletingId(null);
    }
  };

  const isArticle = form.content_type === "article";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <header className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <FilePlus2 className="h-6 w-6" />
        </span>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-700">Content management</p>
          <h1 className="text-2xl font-black text-slate-900">Articles &amp; Product Reviews</h1>
        </div>
        <button
          type="button"
          onClick={openAddForm}
          className="ml-auto inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add content
        </button>
      </header>

      {isFormOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-x-hidden overflow-y-auto overscroll-y-contain bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !uploadingImage) {
              setIsFormOpen(false);
              resetForm();
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-form-title"
            className="my-0 flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25 sm:my-auto sm:h-[min(90dvh,52rem)] sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 bg-gradient-to-r from-white via-white to-violet-50/70 px-5 py-4 sm:px-7">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-700">Content management</p>
                <h2 id="content-form-title" className="mt-0.5 font-bold text-slate-900">
                  {editingId ? "Edit content" : "Add article or product review"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                disabled={saving || uploadingImage}
                aria-label="Close form"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={submitForm} className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-5 overflow-x-hidden overflow-y-auto overscroll-y-contain p-5 sm:p-7">
        <div>
          <p className="text-sm font-bold text-slate-800">Choose content type</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { value: "article", label: "Article", description: "Create an article with a title and image", Icon: FilePlus2 },
              { value: "product_review", label: "Product Review", description: "Review a product and add a buy link", Icon: ShoppingBag },
            ].map(({ value, label, description, Icon }) => (
              <label
                key={value}
                className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${
                  form.content_type === value
                    ? "border-violet-400 bg-violet-50 ring-2 ring-violet-100"
                    : "border-slate-200 hover:border-violet-200"
                } ${editingId ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name="content_type"
                  value={value}
                  checked={form.content_type === value}
                  disabled={Boolean(editingId)}
                  onChange={() => setForm({ ...emptyForm, content_type: value })}
                  className="mt-1 accent-violet-700"
                />
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-violet-700" />
                <span>
                  <span className="block text-sm font-bold text-slate-800">{label}</span>
                  <span className="mt-1 block text-xs text-slate-500">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-700">
            ID
            <input value={form.content_id || "Generating..."} readOnly className={`${inputClass} bg-slate-50 font-semibold text-violet-700`} />
          </label>
          {isArticle ? (
            <label className="text-sm font-semibold text-slate-700">
              Title
              <input
                required
                minLength={2}
                maxLength={200}
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Enter article title"
                className={inputClass}
              />
            </label>
          ) : (
            <label className="text-sm font-semibold text-slate-700">
              Product name
              <input
                required
                minLength={2}
                maxLength={191}
                value={form.product_name}
                onChange={(event) => updateForm("product_name", event.target.value)}
                placeholder="Enter product name"
                className={inputClass}
              />
            </label>
          )}
        </div>

        <label className="block text-sm font-semibold text-slate-700">
          Description
          <textarea
            required
            maxLength={5000}
            rows={5}
            value={form.description}
            onChange={(event) => updateForm("description", event.target.value)}
            placeholder={isArticle ? "Write the article description..." : "Write the product review..."}
            className={inputClass}
          />
        </label>

        {!isArticle && (
          <>
            <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-800">
                    <ShoppingBag className="h-4 w-4 text-violet-700" /> Product features
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">Add each feature as a name and value.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addRow("product_features", { name: "", value: "" })}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  <Plus className="h-4 w-4" /> Add feature
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {form.product_features.length === 0 && (
                  <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">No product features added.</p>
                )}
                {form.product_features.map((feature, index) => (
                  <div key={`feature-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <input
                      maxLength={120}
                      value={feature.name}
                      onChange={(event) => updateRow("product_features", index, "name", event.target.value)}
                      placeholder="Feature name"
                      aria-label={`Feature ${index + 1} name`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <input
                      maxLength={500}
                      value={feature.value}
                      onChange={(event) => updateRow("product_features", index, "value", event.target.value)}
                      placeholder="Feature value or description"
                      aria-label={`Feature ${index + 1} value`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow("product_features", index)}
                      aria-label={`Remove feature ${index + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

          </>
        )}

        <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="flex items-center gap-2 font-bold text-slate-800">
                    <Link2 className="h-4 w-4 text-violet-700" /> {isArticle ? "Article links" : "Buy links"}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">Add one or more buttons, each with its own name and URL.</p>
                </div>
                <button
                  type="button"
                  onClick={() => addRow("buy_links", { name: "", url: "" })}
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-50"
                >
                  <Plus className="h-4 w-4" /> Add link
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {form.buy_links.map((link, index) => (
                  <div key={`buy-link-${index}`} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] items-center gap-3 rounded-xl bg-slate-50 p-3">
                    <input
                      maxLength={120}
                      value={link.name}
                      onChange={(event) => updateRow("buy_links", index, "name", event.target.value)}
                      placeholder={isArticle ? "Link name (e.g. Read more)" : "Link name (e.g. Amazon)"}
                      aria-label={`Content link ${index + 1} name`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <input
                      type="url"
                      maxLength={2048}
                      value={link.url}
                      onChange={(event) => updateRow("buy_links", index, "url", event.target.value)}
                      placeholder={isArticle ? "https://example.com/article" : "https://example.com/product"}
                      aria-label={`Content link ${index + 1} URL`}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      onClick={() => removeRow("buy_links", index)}
                      aria-label={`Remove buy link ${index + 1}`}
                      className="flex h-11 w-11 items-center justify-center rounded-xl text-slate-400 transition hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>

        {!isArticle && (
          <>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-semibold text-slate-700">
                Rating (1–5)
                <span className="relative block">
                  <Star className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-500" />
                  <input
                    required
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={form.rating}
                    onChange={(event) => updateForm("rating", event.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </span>
              </label>
              <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                Add several named buy links above, such as Amazon and Flipkart.
              </div>
            </div>
            <label className="block text-sm font-semibold text-slate-700">
              More details
              <textarea
                maxLength={5000}
                rows={3}
                value={form.more_details}
                onChange={(event) => updateForm("more_details", event.target.value)}
                placeholder="Add any additional review or product information"
                className={inputClass}
              />
            </label>
          </>
        )}

        <div>
          <span className="text-sm font-semibold text-slate-700">{isArticle ? "Article image" : "Product image"}</span>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            {form.image_url ? (
              <img src={getImageUrl(form.image_url)} alt="Selected content" className="h-24 w-24 rounded-xl border border-slate-200 object-cover" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                <ImagePlus className="h-7 w-7" />
              </span>
            )}
            <div className="flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-violet-50 hover:text-violet-700">
                {uploadingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploadingImage ? "Uploading..." : form.image_url ? "Change image" : "Upload image"}
                <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" onChange={uploadImage} disabled={uploadingImage} className="sr-only" />
              </label>
              {form.image_url && (
                <button type="button" onClick={() => updateForm("image_url", "")} className="inline-flex items-center gap-1 rounded-xl px-3 py-2.5 text-sm font-semibold text-rose-600 hover:bg-rose-50">
                  <X className="h-4 w-4" /> Remove
                </button>
              )}
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">PNG, JPEG, WEBP, or GIF; maximum size 5 MB.</p>
        </div>

              </div>
              <div className="flex shrink-0 flex-wrap gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:px-7">
          <button
            type="submit"
            disabled={saving || uploadingImage || !form.content_id}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
            {saving ? "Saving..." : editingId ? "Update content" : `Add ${isArticle ? "article" : "product review"}`}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              Cancel edit
            </button>
          )}
        </div>
            </form>
          </section>
        </div>,
        document.body,
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-5 py-4 sm:px-6">
          <h2 className="font-bold text-slate-900">Saved articles and product reviews</h2>
          <p className="mt-1 text-sm text-slate-500">{articles.length} {articles.length === 1 ? "item" : "items"}</p>
        </div>
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-700" /> Loading content...
          </div>
        ) : articles.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">No content has been added yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-violet-950 text-xs uppercase tracking-wide text-white">
                <tr>
                  <th className="px-4 py-3">Content</th>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Details</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {articles.map((item) => {
                  const name = item.content_type === "article" ? item.title : item.product_name;
                  return (
                    <tr key={item.id} className="text-sm text-slate-700 hover:bg-violet-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img src={getImageUrl(item.image_url)} alt="" className="h-12 w-12 rounded-lg object-cover" />
                          <div className="max-w-sm">
                            <p className="font-semibold text-slate-900">{name}</p>
                            <p className="line-clamp-2 text-xs text-slate-500">{item.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-violet-700">{item.content_id}</td>
                      <td className="px-4 py-3">{item.content_type === "article" ? "Article" : "Product Review"}</td>
                      <td className="px-4 py-3">
                        {item.content_type === "product_review" ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                            <Star className="h-4 w-4 fill-current" /> {Number(item.rating).toFixed(1)}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-1">
                          <button type="button" onClick={() => editArticle(item)} aria-label={`Edit ${name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button type="button" onClick={() => deleteArticle(item)} disabled={deletingId === item.id} aria-label={`Delete ${name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                            {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default Articles;
