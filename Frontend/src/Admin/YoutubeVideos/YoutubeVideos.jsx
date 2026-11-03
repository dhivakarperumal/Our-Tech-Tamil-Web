import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  BadgeCheck,
  CircleAlert,
  Eye,
  ExternalLink,
  FileText,
  ImagePlus,
  LayoutGrid,
  List,
  Loader2,
  Link2,
  Pencil,
  Plus,
  Search,
  Trash2,
  Upload,
  Video,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../api";
import StatusDropdown from "../StatusDropdown";

const emptyVideo = {
  video_code: "",
  title: "",
  video_url: "",
  description: "",
  thumbnail_image: "",
  thumbnail_url: "",
  application_links: [{ title: "", url: "" }],
  documents: [],
  follow_up_notes: "",
  status: "Active",
};
const inputClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100";
const allowedDocumentTypes = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/rtf",
  "text/plain",
  "text/rtf",
]);
const documentTypesByExtension = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  txt: "text/plain",
  rtf: "application/rtf",
};

const resolveMediaUrl = (value) => {
  if (typeof value !== "string" || !value || /^(https?:|data:|blob:)/i.test(value)) return value;
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${value.startsWith("/") ? value : `/${value}`}`;
};

const parseJsonArray = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const YoutubeVideos = () => {
  const [videos, setVideos] = useState([]);
  const [form, setForm] = useState(emptyVideo);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [loadingVideoCode, setLoadingVideoCode] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingVideoId, setEditingVideoId] = useState(null);
  const [viewVideo, setViewVideo] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [viewMode, setViewMode] = useState("table");

  const loadVideos = async () => {
    try {
      const { data } = await api.get("/admin/content/youtube-videos");
      setVideos(Array.isArray(data.videos) ? data.videos.map((video) => ({
        ...video,
        application_links: parseJsonArray(video.application_links),
        documents: parseJsonArray(video.documents),
      })) : []);
    } catch (error) {
      console.error("Failed to load YouTube videos:", error);
      toast.error(error.response?.data?.message || "Could not load YouTube videos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVideos();
  }, []);

  useEffect(() => {
    if (!isAddModalOpen && !viewVideo) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !saving && !uploadingThumbnail && !uploadingDocuments) {
        setIsAddModalOpen(false);
        setViewVideo(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isAddModalOpen, viewVideo, saving, uploadingThumbnail, uploadingDocuments]);

  const updateApplicationLink = (index, field, value) => {
    setForm((current) => ({
      ...current,
      application_links: current.application_links.map((link, linkIndex) =>
        linkIndex === index ? { ...link, [field]: value } : link
      ),
    }));
  };

  const uploadThumbnail = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Choose a PNG, JPEG, or WEBP image.");
      event.target.value = "";
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      toast.error("Thumbnail image must be 3 MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploadingThumbnail(true);
    try {
      const uploadData = new FormData();
      uploadData.append("file", file);
      const { data } = await api.post("/admin/content/youtube-videos/upload-thumbnail", uploadData);
      if (typeof data.image !== "string" || !data.image) {
        throw new Error("The thumbnail upload did not return a saved image.");
      }
      setForm((current) => ({ ...current, thumbnail_image: data.image, thumbnail_url: "" }));
      toast.success("Thumbnail image ready.");
    } catch (error) {
      console.error("Could not upload thumbnail image:", error);
      toast.error(error.response?.data?.message || error.message || "Could not upload the thumbnail image.");
    } finally {
      setUploadingThumbnail(false);
      event.target.value = "";
    }
  };

  const uploadDocuments = async (event) => {
    const selectedFiles = Array.from(event.target.files || []);
    if (!selectedFiles.length) return;
    const remainingSlots = 4 - form.documents.length;
    if (selectedFiles.length > remainingSlots) {
      toast.error("You can attach up to 4 documents.");
      event.target.value = "";
      return;
    }
    const getDocumentType = (file) => {
      if (allowedDocumentTypes.has(file.type)) return file.type;
      const extension = file.name.split(".").pop()?.toLowerCase();
      return extension ? documentTypesByExtension[extension] || "" : "";
    };
    const invalidFile = selectedFiles.find((file) =>
      !getDocumentType(file) || file.size > 1024 * 1024 || file.name.length > 180
    );
    if (invalidFile) {
      toast.error(`${invalidFile.name}: use PDF, Word, Excel, or text files up to 1 MB each.`);
      event.target.value = "";
      return;
    }

    setUploadingDocuments(true);
    try {
      const uploadData = new FormData();
      selectedFiles.forEach((file) => uploadData.append("files", file));
      const { data } = await api.post("/admin/content/youtube-videos/upload-documents", uploadData);
      if (!Array.isArray(data.documents) || data.documents.length !== selectedFiles.length) {
        throw new Error("The document upload did not return all saved documents.");
      }
      setForm((current) => ({ ...current, documents: [...current.documents, ...data.documents] }));
      toast.success(`${data.documents.length} document${data.documents.length === 1 ? "" : "s"} attached.`);
    } catch (error) {
      console.error("Could not upload supporting documents:", error);
      toast.error(error.response?.data?.message || error.message || "Could not upload the selected documents.");
    } finally {
      setUploadingDocuments(false);
      event.target.value = "";
    }
  };

  const openAddVideoModal = async () => {
    setLoadingVideoCode(true);
    try {
      const { data } = await api.get("/admin/content/youtube-videos/next-id");
      if (typeof data.video_code !== "string" || !data.video_code) {
        throw new Error("The server did not return a Video ID.");
      }
      setForm({ ...emptyVideo, video_code: data.video_code });
      setEditingVideoId(null);
      setIsAddModalOpen(true);
    } catch (error) {
      console.error("Failed to generate Video ID:", error);
      toast.error(error.response?.data?.message || error.message || "Could not generate a Video ID.");
    } finally {
      setLoadingVideoCode(false);
    }
  };

  const openEditVideoModal = (video) => {
    setForm({
      ...emptyVideo,
      ...video,
      application_links: parseJsonArray(video.application_links).length
        ? parseJsonArray(video.application_links)
        : [{ title: "", url: "" }],
      documents: parseJsonArray(video.documents),
      follow_up_notes: video.follow_up_notes || "",
      thumbnail_image: video.thumbnail_image || "",
      thumbnail_url: video.thumbnail_url || "",
    });
    setEditingVideoId(video.id);
    setIsAddModalOpen(true);
  };

  const submitVideo = async (event) => {
    event.preventDefault();
    const invalidLink = form.application_links.find((link) =>
      (link.title.trim() && !link.url.trim()) || (!link.title.trim() && link.url.trim())
    );
    if (invalidLink) {
      toast.error("Every application link needs both a title and a URL.");
      return;
    }
    setSaving(true);
    const payload = {
      ...form,
      video_code: form.video_code.trim(),
      title: form.title.trim(),
      video_url: form.video_url.trim(),
      description: form.description.trim(),
      thumbnail_url: form.thumbnail_url.trim(),
      application_links: form.application_links
        .filter((link) => link.title.trim() || link.url.trim())
        .map((link) => ({ title: link.title.trim(), url: link.url.trim() })),
      follow_up_notes: form.follow_up_notes.trim(),
    };
    try {
      const { data } = editingVideoId
        ? await api.put(`/admin/content/youtube-videos/${editingVideoId}`, payload)
        : await api.post("/admin/content/youtube-videos", payload);
      const savedVideo = {
        ...data.video,
        application_links: parseJsonArray(data.video.application_links),
        documents: parseJsonArray(data.video.documents),
      };
      setVideos((current) => editingVideoId
        ? current.map((video) => video.id === editingVideoId ? savedVideo : video)
        : [savedVideo, ...current]);
      setForm(emptyVideo);
      setEditingVideoId(null);
      setIsAddModalOpen(false);
      toast.success(editingVideoId ? "YouTube video updated." : "YouTube video added.");
    } catch (error) {
      console.error("Failed to save YouTube video:", error);
      toast.error(error.response?.data?.message || "Could not save this video.");
    } finally {
      setSaving(false);
    }
  };

  const deleteVideo = async (video) => {
    if (!window.confirm(`Delete "${video.title}"? This cannot be undone.`)) return;
    setDeletingId(video.id);
    try {
      await api.delete(`/admin/content/youtube-videos/${video.id}`);
      setVideos((current) => current.filter((entry) => entry.id !== video.id));
      toast.success("Video deleted.");
    } catch (error) {
      console.error("Failed to delete YouTube video:", error);
      toast.error(error.response?.data?.message || "Could not delete this video.");
    } finally {
      setDeletingId(null);
    }
  };

  const activeVideoCount = videos.filter((video) => video.status === "Active").length;
  const inactiveVideoCount = videos.length - activeVideoCount;
  const filteredVideos = videos.filter((video) => {
    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || [
      video.title,
      video.video_code,
      video.video_url,
      video.description,
    ].some((value) => String(value || "").toLowerCase().includes(query));
    const matchesStatus = statusFilter === "All" || video.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="mx-auto max-w-7xl space-y-7 pb-10">
      <section aria-label="YouTube video summary" className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          { label: "Total Videos", value: videos.length, detail: "All video listings", Icon: Video, color: "bg-violet-700" },
          { label: "Active", value: activeVideoCount, detail: "Available videos", Icon: BadgeCheck, color: "bg-emerald-500" },
          { label: "Inactive", value: inactiveVideoCount, detail: "Hidden videos", Icon: CircleAlert, color: "bg-amber-500" },
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
            placeholder="Search videos by title, ID..."
            aria-label="Search YouTube videos"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-2 focus:ring-violet-100"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter videos by status"
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
            onClick={openAddVideoModal}
            disabled={loadingVideoCode}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-800 to-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:brightness-110 disabled:opacity-60 sm:flex-none"
          >
            {loadingVideoCode ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add video
          </button>
        </div>
      </div>

      {isAddModalOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-start justify-center overflow-x-hidden overflow-y-auto overscroll-y-contain bg-slate-950/60 p-3 backdrop-blur-sm sm:items-center sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !saving && !uploadingThumbnail && !uploadingDocuments) {
              setIsAddModalOpen(false);
            }
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="youtube-form-title"
            className="my-0 flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] w-full max-w-3xl flex-col overflow-hidden rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25 sm:my-auto sm:h-[min(90dvh,52rem)] sm:max-h-[calc(100dvh-2.5rem)]"
          >
            <div className="relative z-10 flex shrink-0 items-center justify-between overflow-hidden border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-fuchsia-800 px-5 py-4 sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border-[24px] border-white/[0.06]" />
              <div className="relative flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-violet-100 shadow-inner">
                  <Video className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">Video management</p>
                  <h2 id="youtube-form-title" className="mt-0.5 font-bold text-white">{editingVideoId ? "Edit YouTube video" : "Add a YouTube video"}</h2>
                  <p className="text-xs text-violet-100/80">{editingVideoId ? "Update the video and its supporting details." : "Add a video, application links, and supporting details."}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                disabled={saving || uploadingThumbnail || uploadingDocuments}
                aria-label="Close YouTube video form"
                className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white disabled:opacity-50"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form
              id="add-youtube-form"
              onSubmit={submitVideo}
              className="min-h-0 flex-1 basis-0 space-y-5 overflow-x-hidden overflow-y-auto overscroll-y-contain p-5 sm:p-7"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Video ID (Auto-generated)
                  <input
                    readOnly
                    value={form.video_code}
                    placeholder="Generating..."
                    className={`${inputClass} cursor-not-allowed bg-slate-50`}
                  />
                </label>
                <label className="block text-sm font-semibold text-slate-700">
                  Video title *
                  <input
                    required
                    minLength={2}
                    maxLength={160}
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="e.g. Apply for our latest opportunity"
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block text-sm font-semibold text-slate-700">
                YouTube video URL *
                <input
                  required
                  type="url"
                  maxLength={2048}
                  value={form.video_url}
                  onChange={(event) => setForm({ ...form, video_url: event.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={inputClass}
                />
              </label>

              <section className="rounded-2xl border border-slate-200 p-4">
                <div className="mb-3">
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <ImagePlus className="h-4 w-4 text-violet-700" />
                    Thumbnail image
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">Upload a PNG, JPEG, or WEBP (max 3 MB).</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">
                    {uploadingThumbnail ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingThumbnail ? "Reading image..." : "Upload thumbnail"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      onChange={uploadThumbnail}
                      disabled={uploadingThumbnail || saving}
                      className="sr-only"
                    />
                  </label>
                  {(form.thumbnail_image || form.thumbnail_url) && (
                    <>
                      <img
                        src={resolveMediaUrl(form.thumbnail_image || form.thumbnail_url)}
                        alt="Video thumbnail preview"
                        className="h-12 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setForm({ ...form, thumbnail_image: "", thumbnail_url: "" })}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                      >
                        Remove thumbnail
                      </button>
                    </>
                  )}
                </div>
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      <Link2 className="h-4 w-4 text-violet-700" />
                      Application links
                    </h3>
                    <p className="mt-1 text-xs text-slate-500">Add one or more buttons, each with its own title and URL.</p>
                  </div>
                  <button
                    type="button"
                    disabled={form.application_links.length >= 20}
                    onClick={() => setForm((current) => ({
                      ...current,
                      application_links: [...current.application_links, { title: "", url: "" }],
                    }))}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50 disabled:opacity-50"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add link
                  </button>
                </div>
                {form.application_links.map((link, index) => (
                  <div key={index} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)_auto]">
                    <input
                      maxLength={120}
                      value={link.title}
                      onChange={(event) => updateApplicationLink(index, "title", event.target.value)}
                      placeholder="Link title (e.g. Apply now)"
                      aria-label={`Application link ${index + 1} title`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <input
                      type="url"
                      maxLength={2048}
                      value={link.url}
                      onChange={(event) => updateApplicationLink(index, "url", event.target.value)}
                      placeholder="https://example.com/apply"
                      aria-label={`Application link ${index + 1} URL`}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
                    />
                    <button
                      type="button"
                      disabled={form.application_links.length === 1}
                      onClick={() => setForm((current) => ({
                        ...current,
                        application_links: current.application_links.filter((_, linkIndex) => linkIndex !== index),
                      }))}
                      aria-label={`Remove application link ${index + 1}`}
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </section>

              <section className="space-y-3 rounded-2xl border border-slate-200 p-4">
                <div>
                  <h3 className="flex items-center gap-2 text-sm font-bold text-slate-800">
                    <FileText className="h-4 w-4 text-violet-700" />
                    Supporting documents
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">Attach up to 4 PDF, Word, Excel, or text files (max 1 MB each).</p>
                </div>
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-semibold text-violet-800 transition hover:bg-violet-100">
                  {uploadingDocuments ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingDocuments ? "Reading documents..." : "Upload documents"}
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.rtf"
                    onChange={uploadDocuments}
                    disabled={uploadingDocuments || saving || form.documents.length >= 4}
                    className="sr-only"
                  />
                </label>
                {form.documents.length > 0 && (
                  <ul className="space-y-2">
                    {form.documents.map((document, index) => (
                      <li key={`${document.name}-${index}`} className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                        <FileText className="h-4 w-4 shrink-0 text-violet-700" />
                        <span className="min-w-0 flex-1 truncate text-slate-700">{document.name}</span>
                        <button
                          type="button"
                          onClick={() => setForm((current) => ({
                            ...current,
                            documents: current.documents.filter((_, documentIndex) => documentIndex !== index),
                          }))}
                          aria-label={`Remove ${document.name}`}
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                <label className="block text-sm font-semibold text-slate-700">
                  Follow-up notes
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={form.follow_up_notes}
                    onChange={(event) => setForm({ ...form, follow_up_notes: event.target.value })}
                    placeholder="Add instructions or follow-up details for applicants..."
                    className={`${inputClass} resize-y`}
                  />
                </label>
              </section>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-semibold text-slate-700">
                  Description
                  <textarea
                    rows={3}
                    maxLength={5000}
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="Add a short description for this video..."
                    className={`${inputClass} resize-y`}
                  />
                </label>
                <StatusDropdown
                  label="Status"
                  value={form.status}
                  onChange={(status) => setForm({ ...form, status })}
                />
              </div>
            </form>

            <footer className="z-10 flex shrink-0 flex-col-reverse gap-3 border-t border-slate-100 bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-slate-500">{editingVideoId ? "Save your changes to update this video." : "Add a YouTube link to create this video entry."}</p>
              <div className="flex flex-col-reverse gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  disabled={saving || uploadingThumbnail || uploadingDocuments}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="add-youtube-form"
                  disabled={saving || uploadingThumbnail || uploadingDocuments}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-700 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-violet-700/15 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingVideoId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                  {saving ? "Saving video..." : editingVideoId ? "Save changes" : "Add video"}
                </button>
              </div>
            </footer>
          </section>
        </div>,
        document.body
      )}

      {viewVideo && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewVideo(null);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="youtube-view-title"
            className="my-auto max-h-[calc(100dvh-2rem)] w-full max-w-2xl overflow-y-auto rounded-3xl border border-white/70 bg-white shadow-2xl shadow-slate-950/25"
          >
            <header className="relative flex items-start justify-between gap-4 overflow-hidden border-b border-violet-100 bg-gradient-to-r from-violet-950 via-violet-900 to-fuchsia-800 px-5 py-4 sm:px-7">
              <div className="pointer-events-none absolute -right-8 -top-14 h-40 w-40 rounded-full border-[24px] border-white/[0.06]" />
              <div className="relative min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-200">Video details</p>
                <h2 id="youtube-view-title" className="mt-1 truncate text-lg font-bold text-white">{viewVideo.title}</h2>
                <p className="mt-1 text-xs font-medium text-violet-100/80">{viewVideo.video_code || `YT-${String(viewVideo.id).padStart(5, "0")}`}</p>
              </div>
              <button
                type="button"
                onClick={() => setViewVideo(null)}
                aria-label="Close video details"
                className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-5 p-5 sm:p-7">
              <img
                src={resolveMediaUrl(viewVideo.thumbnail_image || viewVideo.thumbnail_url || `https://img.youtube.com/vi/${viewVideo.video_id}/hqdefault.jpg`)}
                alt={`${viewVideo.title} thumbnail`}
                className="aspect-video w-full rounded-2xl bg-slate-950 object-cover"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className={`rounded-full px-3 py-1 text-xs font-bold ${viewVideo.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                  {viewVideo.status}
                </span>
                <a
                  href={viewVideo.video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                >
                  <ExternalLink className="h-4 w-4" />
                  Open on YouTube
                </a>
              </div>
              {viewVideo.description && <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{viewVideo.description}</p>}
              {viewVideo.application_links?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">Application links</h3>
                  <div className="flex flex-wrap gap-2">
                    {viewVideo.application_links.map((link, index) => (
                      <a
                        key={`${link.url}-${index}`}
                        href={link.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg border border-violet-100 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-50"
                      >
                        {link.title}<ExternalLink className="h-3 w-3" />
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {viewVideo.documents?.length > 0 && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">Supporting documents</h3>
                  <ul className="space-y-2">
                    {viewVideo.documents.map((document, index) => (
                      <li key={`${document.name}-${index}`}>
                        <a
                          href={resolveMediaUrl(document.url || document.data)}
                          download={document.name}
                          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-violet-700"
                        >
                          <FileText className="h-4 w-4" />{document.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {viewVideo.follow_up_notes && (
                <div>
                  <h3 className="mb-2 text-sm font-bold text-slate-800">Follow-up notes</h3>
                  <p className="whitespace-pre-wrap rounded-xl bg-amber-50 p-3 text-sm leading-6 text-amber-900">{viewVideo.follow_up_notes}</p>
                </div>
              )}
            </div>
            <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4 sm:px-7">
              <button
                type="button"
                onClick={() => {
                  const video = viewVideo;
                  setViewVideo(null);
                  openEditVideoModal(video);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-800"
              >
                <Pencil className="h-4 w-4" />Edit video
              </button>
            </footer>
          </section>
        </div>,
        document.body
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-0 shadow-sm">
        {loading ? (
          <div className="flex min-h-48 items-center justify-center rounded-2xl border border-slate-200 bg-white text-violet-700 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2 text-sm text-slate-500">Loading videos...</span>
          </div>
        ) : videos.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
            <Video className="h-8 w-8 text-violet-300" />
            <p className="mt-3 font-semibold text-slate-700">No videos yet</p>
            <p className="mt-1 text-sm text-slate-500">Add your first YouTube video to get started.</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="flex min-h-48 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/70 px-5 text-center">
            <Search className="h-8 w-8 text-violet-300" />
            <p className="mt-3 font-semibold text-slate-700">No matching videos</p>
            <p className="mt-1 text-sm text-slate-500">Try another search or status filter.</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full min-w-[760px] text-left">
              <thead className="bg-violet-950 text-xs uppercase tracking-wide text-[#FCD34D]">
                <tr>
                  <th className="px-4 py-4">S. No.</th>
                  <th className="px-4 py-4">Video</th>
                  <th className="px-4 py-4">Video ID</th>
                  <th className="px-4 py-4">Thumbnail</th>
                  <th className="px-4 py-4">Status</th>
                  <th className="px-4 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredVideos.map((video, index) => (
                  <tr key={video.id} className="text-sm text-slate-700 hover:bg-violet-50/40">
                    <td className="px-4 py-4 font-semibold text-slate-500">{index + 1}</td>
                    <td className="px-4 py-4">
                      <a href={video.video_url} target="_blank" rel="noreferrer" className="font-semibold text-slate-900 hover:text-violet-700">
                        {video.title}
                      </a>
                      <p className="max-w-sm truncate text-xs text-slate-500">{video.video_url}</p>
                    </td>
                    <td className="px-4 py-4 font-medium text-violet-700">{video.video_code || `YT-${String(video.id).padStart(5, "0")}`}</td>
                    <td className="px-4 py-4">
                      <img
                        src={resolveMediaUrl(video.thumbnail_image || video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`)}
                        alt=""
                        className="h-12 w-20 rounded-lg border border-slate-200 object-cover"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${video.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                        {video.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => setViewVideo(video)}
                        aria-label={`View ${video.title}`}
                        title="View video details"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditVideoModal(video)}
                        aria-label={`Edit ${video.title}`}
                        title="Edit video"
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVideo(video)}
                        disabled={deletingId === video.id}
                        aria-label={`Delete ${video.title}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        {deletingId === video.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {filteredVideos.map((video) => (
              <article key={video.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-violet-950/5">
                <a
                  href={video.video_url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Open ${video.title} on YouTube`}
                  className="group relative block aspect-video bg-slate-950"
                >
                  <img
                    src={resolveMediaUrl(video.thumbnail_image || video.thumbnail_url || `https://img.youtube.com/vi/${video.video_id}/hqdefault.jpg`)}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-90 transition group-hover:opacity-75"
                  />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/95 text-violet-700 shadow-lg transition group-hover:scale-110">
                      <Video className="ml-0.5 h-5 w-5" />
                    </span>
                  </span>
                </a>
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
                          {video.video_code || `YT-${String(video.id).padStart(5, "0")}`}
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${video.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                          {video.status}
                        </span>
                      </div>
                      <h3 className="line-clamp-2 font-semibold text-slate-900">{video.title}</h3>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => setViewVideo(video)}
                        aria-label={`View ${video.title}`}
                        title="View video details"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditVideoModal(video)}
                        aria-label={`Edit ${video.title}`}
                        title="Edit video"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-violet-50 hover:text-violet-700"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteVideo(video)}
                        disabled={deletingId === video.id}
                        aria-label={`Delete ${video.title}`}
                        title="Delete video"
                        className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
                      >
                        {deletingId === video.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {video.description && <p className="mt-2 line-clamp-2 text-sm text-slate-500">{video.description}</p>}
                  {video.application_links?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {video.application_links.map((link, index) => (
                        <a
                          key={`${link.url}-${index}`}
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
                        >
                          {link.title}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ))}
                    </div>
                  )}
                  {video.documents?.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {video.documents.map((document, index) => (
                        <a
                          key={`${document.name}-${index}`}
                          href={resolveMediaUrl(document.url || document.data)}
                          download={document.name}
                          className="flex items-center gap-2 text-xs font-medium text-slate-600 transition hover:text-violet-700"
                        >
                          <FileText className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{document.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                  {video.follow_up_notes && (
                    <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {video.follow_up_notes}
                    </p>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default YoutubeVideos;
