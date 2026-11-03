import { useState } from "react";
import { ExternalLink, Play, Video } from "lucide-react";

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

  const handleThumbnailError = () => {
    if (thumbnail !== fallbackThumbnail) {
      setThumbnail(fallbackThumbnail);
    } else {
      setThumbnailFailed(true);
    }
  };

  return (
    <article className="overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-[0_8px_24px_rgba(75,0,200,0.07)]">
      <div className="relative aspect-video bg-slate-950">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(video.video_id)}?autoplay=1`}
            title={video.title}
            className="absolute inset-0 h-full w-full"
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
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
      <div className="p-4 sm:p-5">
        <h3 className="line-clamp-2 font-bold leading-snug text-slate-900">{video.title}</h3>
        {video.description && (
          <p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-600">{video.description}</p>
        )}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {video.application_links?.length > 0 && (
            <div className="flex flex-wrap gap-2" aria-label="Application links">
            {video.application_links.map((link, index) => (
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
            </div>
          )}
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
      </div>
    </article>
  );
}

export default YoutubeVideoCard;
