import { useEffect } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, X } from "lucide-react";

function getMediaUrl(value) {
  if (!value || /^(https?:|data:|blob:)/i.test(value)) return value || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${value.startsWith("/") ? value : `/${value}`}`;
}

function YoutubeVideoDetailsModal({ video, onClose }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={`youtube-details-title-${video.id}`}
        className="my-auto w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <header className="flex items-start justify-between gap-4 bg-violet-800 px-5 py-4 text-white sm:px-7">
          <div className="min-w-0">
            <h2 id={`youtube-details-title-${video.id}`} className="text-lg font-bold sm:text-xl">{video.title}</h2>
            {video.video_code && <p className="mt-1 text-xs font-medium text-violet-100">{video.video_code}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close video details"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/20 text-white/80 transition hover:bg-white/10 hover:text-white"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </header>

        <div className="max-h-[calc(100vh-7rem)] overflow-y-auto">
          <div className="aspect-video bg-slate-950">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.video_id)}?autoplay=1`}
              title={video.title}
              className="h-full w-full"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="space-y-5 p-5 sm:p-7">
            {video.description && (
              <section>
                <h3 className="mb-2 text-sm font-bold text-slate-900">Description</h3>
                <p className="whitespace-pre-wrap text-sm leading-6 text-slate-600">{video.description}</p>
              </section>
            )}
            {video.application_links?.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-bold text-slate-900">Application links</h3>
                <div className="flex flex-wrap gap-2">
                  {video.application_links.map((link, index) => (
                    <a
                      key={`${link.url}-${index}`}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                    >
                      {link.title}
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              </section>
            )}
            {video.documents?.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-bold text-slate-900">Supporting documents</h3>
                <ul className="space-y-2">
                  {video.documents.map((document, index) => (
                    <li key={`${document.name}-${index}`}>
                      <a
                        href={getMediaUrl(document.url || document.data)}
                        download={document.name}
                        className="inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900"
                      >
                        <FileText size={16} aria-hidden="true" />
                        {document.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            {video.follow_up_notes && (
              <section>
                <h3 className="mb-2 text-sm font-bold text-slate-900">Additional notes</h3>
                <p className="whitespace-pre-wrap rounded-xl bg-violet-50 p-4 text-sm leading-6 text-slate-700">{video.follow_up_notes}</p>
              </section>
            )}
            {video.created_at && (
              <p className="text-xs text-slate-500">
                Added {new Date(video.created_at).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
      </section>
    </div>,
    document.body,
  );
}

export default YoutubeVideoDetailsModal;
