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
    <article className="group flex h-full flex-col overflow-hidden rounded-[24px] border border-violet-100 bg-white shadow-[0_12px_30px_rgba(75,0,200,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(75,0,200,0.15)]">
      <div className="relative aspect-video overflow-hidden bg-slate-950">
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
            className="absolute inset-0 flex h-full w-full items-center justify-center"
          >
            {!thumbnailFailed && (
              <img
                src={thumbnail}
                alt=""
                loading="lazy"
                onError={handleThumbnailError}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
            )}
            <span className="relative flex h-14 w-14 items-center justify-center rounded-full border border-white/60 bg-violet-700/90 text-white shadow-[0_0_30px_rgba(124,58,237,0.65)] transition group-hover:scale-110">
              <Play size={23} fill="currentColor" className="ml-0.5" aria-hidden="true" />
            </span>
            <span className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-slate-950/60 to-transparent" aria-hidden="true" />
          </button>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        <span className="mb-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold text-violet-800">
          <Video size={13} aria-hidden="true" />
          Product video
        </span>
        <h3 className="line-clamp-2 min-h-[3.25rem] text-lg font-extrabold leading-tight tracking-[-0.03em] text-slate-950">{video.title}</h3>
        {video.description && (
          <p className="mt-2 line-clamp-3 min-h-[4.5rem] flex-1 text-sm leading-6 text-slate-600">{video.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {video.application_links?.slice(0, 1).map((link, index) => (
            <a
              key={`${link.url}-${index}`}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-bold text-violet-800 transition hover:bg-violet-100"
            >
              {link.title}
              <ExternalLink size={14} aria-hidden="true" />
            </a>
          ))}
          <a
            href={video.video_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-700 to-fuchsia-600 px-3 py-2 text-sm font-bold text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)] transition hover:brightness-110"
          >
            <Video size={16} aria-hidden="true" />
            Watch on YouTube
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2" aria-label="Video actions">
          <button
            type="button"
            onClick={() => setDetailsOpen(true)}
            className="text-xs font-semibold text-violet-700 underline decoration-violet-200 underline-offset-4 transition hover:text-violet-900"
          >
            Video details
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
