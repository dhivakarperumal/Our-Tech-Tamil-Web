import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ExternalLink, FileText, Play, Video, X } from "lucide-react";

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function YoutubeVideoCard({ video }) {
  const fallbackThumbnail = `https://img.youtube.com/vi/${encodeURIComponent(video.video_id)}/hqdefault.jpg`;
  const primaryThumbnail = getImageUrl(video.thumbnail_image || video.thumbnail_url) || fallbackThumbnail;
  const [thumbnail, setThumbnail] = useState(primaryThumbnail);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);

  useEffect(() => {
    if (!detailsOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event) => {
      if (event.key === "Escape") setDetailsOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [detailsOpen]);

  const handleThumbnailError = () => {
    if (thumbnail !== fallbackThumbnail) {
      setThumbnail(fallbackThumbnail);
    } else {
      setThumbnailFailed(true);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_8px_24px_rgba(75,0,200,0.07)]">
      <div className="relative aspect-video bg-slate-950">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.video_id)}?autoplay=1`}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={`Play ${video.title}`}
            className="group absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {!thumbnailFailed && (
              <img
                src={thumbnail}
                alt=""
                loading="lazy"
                onError={handleThumbnailError}
                className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />
            )}
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[#4B00C8] text-white shadow-lg transition group-hover:scale-110">
              <Play size={24} fill="currentColor" aria-hidden="true" />
            </span>
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <h3 className="line-clamp-2 font-bold leading-snug text-slate-900">{video.title}</h3>
        {video.description && (
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-slate-600">{video.description}</p>
        )}
        <div className="mt-3">
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-violet-700 transition hover:text-violet-900"
          >
            <Video size={16} aria-hidden="true" />
            Watch on YouTube
            <ExternalLink size={14} aria-hidden="true" />
          </a>
        </div>
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-3" aria-label="Video actions">
          {video.application_links?.map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              {link.title}
              <ExternalLink size={13} aria-hidden="true" />
            </a>
          ))}
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-700 px-4 py-2 text-sm font-bold text-white transition hover:bg-violet-800 focus:outline-none focus:ring-4 focus:ring-violet-200"
          >
            More
            <ExternalLink size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      {detailsOpen && createPortal(
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/70 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setDetailsOpen(false);
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
                onClick={() => setDetailsOpen(false)}
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
                            href={getImageUrl(document.url || document.data)}
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
      )}
    </article>
  );
}

export default YoutubeVideoCard;
