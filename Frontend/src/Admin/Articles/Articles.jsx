import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ArrowUpRight,
  Eye,
  FilePlus2,
  Hash,
  FileText,
  ImagePlus,
  LayoutGrid,
  Link2,
  Loader2,
  List,
  Pencil,
  Plus,
  Search,
  ShoppingBag,
  Sparkles,
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
const fieldLabelClass = "block text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500";
const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");

const getImageUrl = (image) => {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image;
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
};

const Articles = () => {
  const [articles, setArticles] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [validationErrors, setValidationErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");
  const [viewingContent, setViewingContent] = useState(null);

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

  useEffect(() => {
    if (!viewingContent) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setViewingContent(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [viewingContent]);

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setValidationErrors((current) => {
      const errorField = field === "title" || field === "product_name"
        ? field
        : field === "description" || field === "rating" || field === "image_url"
          ? field
          : null;
      if (!errorField || !current[errorField]) return current;
      const next = { ...current };
      delete next[errorField];
      return next;
    });
  };

  const updateRow = (field, index, key, value) => {
    setForm((current) => ({
      ...current,
      [field]: current[field].map((row, rowIndex) => rowIndex === index ? { ...row, [key]: value } : row),
    }));
    if (field === "buy_links") {
      setValidationErrors((current) => {
        if (!current.buy_links) return current;
        const next = { ...current };
        delete next.buy_links;
        return next;
      });
    }
  };

  const addRow = (field, row) => {
    setForm((current) => ({ ...current, [field]: [...current[field], row] }));
    if (field === "buy_links") {
      setValidationErrors((current) => {
        if (!current.buy_links) return current;
        const next = { ...current };
        delete next.buy_links;
        return next;
      });
    }
  };

  const removeRow = (field, index) => {
    setForm((current) => ({ ...current, [field]: current[field].filter((_, rowIndex) => rowIndex !== index) }));
    if (field === "buy_links") {
      setValidationErrors((current) => {
        if (!current.buy_links) return current;
        const next = { ...current };
        delete next.buy_links;
        return next;
      });
    }
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
    setValidationErrors({});
  };

  const openAddForm = () => {
    setEditingId(null);
    setForm(emptyForm);
    setValidationErrors({});
    setIsFormOpen(true);
  };

  const submitForm = async (event) => {
    event.preventDefault();
    const errors = {};
    const isArticle = form.content_type === "article";
    if (isArticle && form.title.trim().length < 2) {
      errors.title = "Enter an article title with at least 2 characters.";
    }
    if (!isArticle && form.product_name.trim().length < 2) {
      errors.product_name = "Enter a product name with at least 2 characters.";
    }
    if (!form.description.trim()) {
      errors.description = isArticle ? "Article description is required." : "Review description is required.";
    }
    const enteredLinks = form.buy_links.filter((link) => link.name.trim() || link.url.trim());
    const validLinks = enteredLinks.filter((link) => {
        const name = link.name.trim();
        const url = link.url.trim();
        if (!name || !url) return false;
        try {
          const parsedUrl = new URL(url);
          return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
        } catch {
          return false;
        }
      });
    if ((!isArticle && validLinks.length === 0) || validLinks.length !== enteredLinks.length) {
      if (!isArticle || enteredLinks.length > 0) {
        errors.buy_links = validLinks.length === 0
          ? isArticle
            ? "Each article link must include a name and a valid HTTP or HTTPS URL."
            : "Add at least one buy link with a name and a valid HTTP or HTTPS URL."
          : "Each link must include a name and a valid HTTP or HTTPS URL.";
      }
    }
    if (!isArticle) {
      const rating = Number(form.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        errors.rating = "Enter a rating from 1 to 5.";
      }
    }
    if (!form.image_url) {
      errors.image_url = isArticle ? "Upload a cover image." : "Upload a product image.";
    }
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      toast.error("Complete the required fields before saving.");
      const firstInvalidField = Object.keys(errors)[0];
      requestAnimationFrame(() => {
        const field = document.querySelector(`[data-validation-field="${firstInvalidField}"]`);
        field?.scrollIntoView({ behavior: "smooth", block: "center" });
        field?.focus({ preventScroll: true });
      });
      return;
    }
    setValidationErrors({});
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
    setValidationErrors({});
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
  const articleCount = articles.filter((item) => item.content_type === "article").length;
  const productReviewCount = articles.length - articleCount;
  const reviewRatings = articles
    .filter((item) => item.content_type === "product_review" && item.rating != null)
    .map((item) => Number(item.rating))
    .filter(Number.isFinite);
  const averageReviewRating = reviewRatings.length
    ? (reviewRatings.reduce((total, rating) => total + rating, 0) / reviewRatings.length).toFixed(1)
    : "—";
  const normalizedSearch = searchTerm.trim().toLowerCase();
  const filteredArticles = articles.filter((item) => {
    const matchesType = contentTypeFilter === "all" || item.content_type === contentTypeFilter;
    const name = item.content_type === "article" ? item.title : item.product_name;
    const matchesSearch = !normalizedSearch || [
      name,
      item.content_id,
      item.description,
    ].some((value) => String(value || "").toLowerCase().includes(normalizedSearch));
    return matchesType && matchesSearch;
  });
  const contentStats = [
    { label: "Total content", value: articles.length, sub: "Articles and product reviews", icon: FilePlus2, gradient: "from-violet-800 to-fuchsia-700" },
    { label: "Articles", value: articleCount, sub: "Published articles", icon: FileText, gradient: "from-emerald-400 to-teal-500" },
    { label: "Product reviews", value: productReviewCount, sub: "Saved product reviews", icon: ShoppingBag, gradient: "from-orange-400 to-amber-500" },
    { label: "Average rating", value: averageReviewRating, sub: "Product reviews out of 5", icon: Star, gradient: "from-rose-400 to-pink-500" },
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <section aria-label="Content summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {contentStats.map(({ label, value, sub, icon: Icon, gradient }) => (
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
      </section>

      <section aria-label="Search and filter content" className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
        <label className="relative w-full min-w-[180px] flex-1 sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search by title, product, ID, or description..."
            aria-label="Search articles and product reviews"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-medium text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:bg-white"
          />
        </label>
        <select
          value={contentTypeFilter}
          onChange={(event) => setContentTypeFilter(event.target.value)}
          aria-label="Filter content type"
          className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-600 outline-none transition hover:border-violet-400 focus:border-violet-500 sm:ml-auto"
        >
          <option value="all">All content types</option>
          <option value="article">Articles</option>
          <option value="product_review">Product reviews</option>
        </select>
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-100 p-1" role="group" aria-label="Content view">
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
          onClick={openAddForm}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-4 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110"
        >
          <Plus className="h-4 w-4" /> Add content
        </button>
      </section>

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
            className="my-0 flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25 sm:my-auto sm:h-[min(90dvh,58rem)] sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <div className="relative flex shrink-0 items-center justify-between overflow-hidden border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-fuchsia-800 px-5 py-4 sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border-[24px] border-white/[0.06]" />
              <div className="relative flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-violet-100 shadow-inner">
                  {isArticle ? <FilePlus2 className="h-5 w-5" /> : <ShoppingBag className="h-5 w-5" />}
                </span>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">Content studio</p>
                  <h2 id="content-form-title" className="truncate font-bold text-white">
                    {editingId ? "Edit content" : `Create ${isArticle ? "an article" : "a product review"}`}
                  </h2>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsFormOpen(false);
                  resetForm();
                }}
                disabled={saving || uploadingImage}
                aria-label="Close form"
                className="relative rounded-xl border border-white/15 bg-white/10 p-2 text-white/75 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form noValidate onSubmit={submitForm} className="flex min-h-0 flex-1 basis-0 flex-col overflow-hidden">
              <div className="min-h-0 flex-1 space-y-4 overflow-x-hidden overflow-y-auto overscroll-y-contain bg-slate-50/80 p-4 sm:space-y-5 sm:p-6">
        {Object.keys(validationErrors).length > 0 && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
            <p className="font-bold">Please fix the following before saving:</p>
            <ul className="mt-1 list-inside list-disc space-y-0.5">
              {Object.values(validationErrors).map((message) => <li key={message}>{message}</li>)}
            </ul>
          </div>
        )}
        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-600" />
            <p className="text-sm font-bold text-slate-800">Choose a content type</p>
          </div>
          <p className="mt-1 text-xs text-slate-500">Start by selecting what you want to publish.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {[
              { value: "article", label: "Article", description: "Create an article with a title and image", Icon: FilePlus2 },
              { value: "product_review", label: "Product Review", description: "Review a product and add a buy link", Icon: ShoppingBag },
            ].map(({ value, label, description, Icon }) => (
              <label
                key={value}
                className={`group flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition duration-200 ${
                  form.content_type === value
                    ? "border-violet-400 bg-gradient-to-br from-violet-50 to-fuchsia-50 shadow-sm ring-2 ring-violet-100"
                    : "border-slate-200 bg-white hover:border-violet-200 hover:bg-violet-50/40"
                } ${editingId ? "cursor-not-allowed opacity-70" : ""}`}
              >
                <input
                  type="radio"
                  name="content_type"
                  value={value}
                  checked={form.content_type === value}
                  disabled={Boolean(editingId)}
                  onChange={() => {
                    setForm({ ...emptyForm, content_type: value });
                    setValidationErrors({});
                  }}
                  className="mt-1 accent-violet-700"
                />
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${form.content_type === value ? "bg-violet-700 text-white shadow-md shadow-violet-900/20" : "bg-slate-100 text-slate-500 group-hover:bg-violet-100 group-hover:text-violet-700"}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="pt-0.5">
                  <span className="block text-sm font-bold text-slate-800">{label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-slate-500">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className={fieldLabelClass}>
            Content ID
            <span className="relative block">
              <Hash className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-violet-500" />
              <input value={form.content_id || "Generating..."} readOnly className={`${inputClass} mt-2 border-violet-100 bg-violet-50/60 pl-10 font-bold tracking-wide text-violet-800`} />
            </span>
          </label>
          {isArticle ? (
            <label className={fieldLabelClass}>
              Title
              <input
                required
                minLength={2}
                maxLength={200}
                data-validation-field="title"
                aria-invalid={Boolean(validationErrors.title)}
                value={form.title}
                onChange={(event) => updateForm("title", event.target.value)}
                placeholder="Enter article title"
                className={`${inputClass} font-medium`}
              />
              {validationErrors.title && <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-rose-600">{validationErrors.title}</span>}
            </label>
          ) : (
            <label className={fieldLabelClass}>
              Product name
              <input
                required
                minLength={2}
                maxLength={191}
                data-validation-field="product_name"
                aria-invalid={Boolean(validationErrors.product_name)}
                value={form.product_name}
                onChange={(event) => updateForm("product_name", event.target.value)}
                placeholder="Enter product name"
                className={`${inputClass} font-medium`}
              />
              {validationErrors.product_name && <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-rose-600">{validationErrors.product_name}</span>}
            </label>
          )}
        </div>
        </section>

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
          <label className={fieldLabelClass}>
            {isArticle ? "Article description" : "Review description"}
            <textarea
              required
              maxLength={5000}
              rows={4}
              data-validation-field="description"
              aria-invalid={Boolean(validationErrors.description)}
              value={form.description}
              onChange={(event) => updateForm("description", event.target.value)}
              placeholder={isArticle ? "Write a clear, engaging description for your article..." : "Share your honest product review..."}
              className={`${inputClass} mt-2 resize-y leading-relaxed`}
            />
            <span className="mt-1 block text-right text-[11px] font-medium normal-case tracking-normal text-slate-400">
              {form.description.length.toLocaleString()} / 5,000 characters
            </span>
            {validationErrors.description && <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-rose-600">{validationErrors.description}</span>}
          </label>
        </section>

        {!isArticle && (
          <>
            <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
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
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                >
                  <Plus className="h-4 w-4" /> Add feature
                </button>
              </div>
              <div className="mt-4 space-y-3">
                {form.product_features.length === 0 && (
                  <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-500">No features yet. Add product specifications such as material, size, or battery life.</p>
                )}
                {form.product_features.map((feature, index) => (
                  <div key={`feature-${index}`} className="grid grid-cols-1 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:gap-3">
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

        <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5">
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
                  className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-3 py-2 text-sm font-semibold text-violet-700 shadow-sm transition hover:border-violet-300 hover:bg-violet-50"
                >
                  <Plus className="h-4 w-4" /> Add link
                </button>
              </div>
              <div className="mt-4 space-y-3" data-validation-field="buy_links" tabIndex={-1}>
                {form.buy_links.map((link, index) => (
                  <div key={`buy-link-${index}`} className="grid grid-cols-1 items-center gap-2 rounded-xl border border-slate-100 bg-slate-50 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)_auto] sm:gap-3">
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
                {validationErrors.buy_links && <p className="text-xs font-medium text-rose-600">{validationErrors.buy_links}</p>}
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
                    data-validation-field="rating"
                    aria-invalid={Boolean(validationErrors.rating)}
                    value={form.rating}
                    onChange={(event) => updateForm("rating", event.target.value)}
                    className={`${inputClass} pl-10`}
                  />
                </span>
                {validationErrors.rating && <span className="mt-1 block text-xs font-medium normal-case tracking-normal text-rose-600">{validationErrors.rating}</span>}
              </label>
              <p className="flex items-center gap-2 self-end rounded-xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
                <ArrowUpRight className="h-4 w-4 shrink-0" />
                Use ratings from 1 to 5.
              </p>
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

        <section
          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm sm:p-5"
          data-validation-field="image_url"
          tabIndex={-1}
        >
          <div className="flex items-center justify-between gap-3">
            <div>
              <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                <ImagePlus className="h-4 w-4 text-violet-700" />
                {isArticle ? "Cover image" : "Product image"}
              </h3>
              <p className="mt-1 text-xs text-slate-500">Choose a clear image to make your content stand out.</p>
            </div>
            {form.image_url && <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700">Image ready</span>}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-dashed border-violet-200 bg-gradient-to-r from-violet-50/70 to-white p-4">
            {form.image_url ? (
              <img src={getImageUrl(form.image_url)} alt="Selected content" className="h-24 w-24 rounded-xl border border-white object-cover shadow-md ring-1 ring-slate-200" />
            ) : (
              <span className="flex h-24 w-24 items-center justify-center rounded-xl border border-white bg-white text-violet-400 shadow-sm ring-1 ring-slate-200">
                <ImagePlus className="h-8 w-8" />
              </span>
            )}
            <div className="min-w-[12rem] flex-1">
              <p className="text-sm font-semibold text-slate-800">{form.image_url ? "Your image is ready" : "Upload a cover image"}</p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">PNG, JPEG, WEBP, or GIF · Up to 5 MB</p>
              <div className="mt-3 flex flex-wrap gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-900">
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
              {validationErrors.image_url && <p className="mt-2 text-xs font-medium text-rose-600">{validationErrors.image_url}</p>}
            </div>
          </div>
        </section>

              </div>
              <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-white/95 px-5 py-3.5 backdrop-blur sm:px-7">
                <span className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600">
                  <Hash className="h-3.5 w-3.5 text-violet-600" />
                  {form.content_id || "Generating ID..."}
                </span>
                <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || uploadingImage || !form.content_id}
            className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-md shadow-violet-900/20 transition hover:-translate-y-0.5 hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <FilePlus2 className="h-4 w-4" />}
            {saving ? "Saving..." : editingId ? "Update content" : `Add ${isArticle ? "article" : "product review"}`}
          </button>
          {editingId && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50">
              Cancel edit
            </button>
          )}
                </div>
        </div>
            </form>
          </section>
        </div>,
        document.body,
      )}

      {viewingContent && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingContent(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="content-preview-title"
            className="my-auto max-h-[90dvh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-7">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-violet-700">
                  {viewingContent.content_type === "article" ? "Article" : "Product review"}
                </p>
                <h2 id="content-preview-title" className="mt-1 text-lg font-bold text-slate-900">
                  {viewingContent.content_type === "article" ? viewingContent.title : viewingContent.product_name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setViewingContent(null)}
                aria-label="Close preview"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-5 p-5 sm:p-7">
              <img
                src={getImageUrl(viewingContent.image_url)}
                alt={viewingContent.content_type === "article" ? viewingContent.title : viewingContent.product_name}
                className="max-h-80 w-full rounded-2xl bg-slate-100 object-contain"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                <span className="font-semibold text-violet-700">{viewingContent.content_id}</span>
                {viewingContent.content_type === "product_review" && (
                  <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                    <Star className="h-4 w-4 fill-current" /> {Number(viewingContent.rating).toFixed(1)}
                  </span>
                )}
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{viewingContent.description}</p>
              {viewingContent.product_features?.length > 0 && (
                <div>
                  <h3 className="mb-2 font-bold text-slate-900">Product features</h3>
                  <dl className="divide-y divide-slate-100 rounded-xl border border-slate-100 px-4">
                    {viewingContent.product_features.map((feature, index) => (
                      <div key={`${feature.name}-${index}`} className="flex flex-wrap justify-between gap-2 py-3 text-sm">
                        <dt className="font-semibold text-slate-700">{feature.name}</dt>
                        <dd className="text-slate-600">{feature.value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
              {viewingContent.more_details && (
                <div>
                  <h3 className="mb-2 font-bold text-slate-900">More details</h3>
                  <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700">{viewingContent.more_details}</p>
                </div>
              )}
              {viewingContent.buy_links?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingContent.buy_links.map((link, index) => (
                    <a
                      key={`${link.url}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-violet-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-900"
                    >
                      {link.name || "Open link"} <ArrowUpRight className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>,
        document.body,
      )}

      <section className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
        {loading ? (
          <div className="flex min-h-40 items-center justify-center gap-2 text-sm text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin text-violet-700" /> Loading content...
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-slate-500">
            {articles.length === 0
              ? "No content has been added yet."
              : "No content matches your search or selected filter."}
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left">
              <thead className="admin-table-header text-xs uppercase tracking-wide">
                <tr>
                  <th className="rounded-tl-xl px-4 py-4">S No.</th>
                  <th className="px-4 py-4">Content</th>
                  <th className="px-4 py-4">ID</th>
                  <th className="px-4 py-4">Type</th>
                  <th className="px-4 py-4">Details</th>
                  <th className="rounded-tr-xl px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((item, index) => {
                  const name = item.content_type === "article" ? item.title : item.product_name;
                  return (
                    <tr key={item.id} className="text-sm text-slate-700 hover:bg-violet-50/40">
                      <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
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
                          <button type="button" onClick={() => setViewingContent(item)} aria-label={`View ${name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700">
                            <Eye className="h-4 w-4" />
                          </button>
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
        ) : (
          <div className="grid gap-5 p-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredArticles.map((item) => {
              const name = item.content_type === "article" ? item.title : item.product_name;
              const isReview = item.content_type === "product_review";
              return (
                <article key={item.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:border-violet-200 hover:shadow-md">
                  <img
                    src={getImageUrl(item.image_url)}
                    alt={name || ""}
                    loading="lazy"
                    className="h-48 w-full bg-slate-100 object-cover"
                  />
                  <div className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="line-clamp-2 font-bold text-slate-900">{name}</h3>
                      <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${isReview ? "bg-amber-50 text-amber-700" : "bg-violet-50 text-violet-700"}`}>
                        {isReview ? "Product Review" : "Article"}
                      </span>
                    </div>
                    <p className="line-clamp-3 min-h-[3.75rem] text-sm text-slate-500">{item.description}</p>
                    <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs">
                      <span className="font-semibold text-violet-700">{item.content_id}</span>
                      {isReview ? (
                        <span className="inline-flex items-center gap-1 font-semibold text-amber-600">
                          <Star className="h-4 w-4 fill-current" /> {Number(item.rating).toFixed(1)}
                        </span>
                      ) : null}
                    </div>
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => setViewingContent(item)} aria-label={`View ${name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-700">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => editArticle(item)} aria-label={`Edit ${name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-violet-50 hover:text-violet-700">
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => deleteArticle(item)} disabled={deletingId === item.id} aria-label={`Delete ${name}`} className="rounded-lg p-2 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
                        {deletingId === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
};

export default Articles;
