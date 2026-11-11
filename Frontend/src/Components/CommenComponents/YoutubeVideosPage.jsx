import { useEffect, useState } from "react";
import { ExternalLink, Video } from "lucide-react";
import api from "../../api";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";
import YoutubeVideoCard from "./YoutubeVideoCard";
import YoutubeVideoDetailsModal from "./YoutubeVideoDetailsModal";

function getImageUrl(image) {
  if (!image || /^(https?:|data:|blob:)/i.test(image)) return image || "";
  const backendUrl = (import.meta.env.VITE_BACKEND_URL || "http://localhost:5000").replace(/\/$/, "");
  return `${backendUrl}${image.startsWith("/") ? image : `/${image}`}`;
}

function YoutubeVideosPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(null);

  useEffect(() => {
    let active = true;
    api.get("/youtube-videos")
      .then(({ data }) => {
        if (active) setVideos(Array.isArray(data.videos) ? data.videos : []);
      })
      .catch((error) => {
        console.error("Failed to load YouTube videos page:", error);
        if (active) setFailed(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => { active = false; };
  }, []);

  return (
    <>
      <PageHeader title="YouTube Videos" />
      <main className="min-h-[60vh] bg-[#faf8fc] py-7 sm:py-10">
        <PageContainer>
          <div className="mb-6 text-center">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">From our channel</p>
            <h2 className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">Watch our videos</h2>
          </div>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {[1, 2, 3].map((item) => (
                <div key={item} className="aspect-video animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          ) : failed ? (
            <p role="alert" className="rounded-xl border border-rose-100 bg-white px-4 py-8 text-center text-sm text-rose-700">
              Videos could not be loaded. Please refresh the page and try again.
            </p>
          ) : videos.length ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
              {videos.map((video) => <YoutubeVideoCard key={video.id} video={video} />)}
            </div>
          ) : (
            <div className="rounded-2xl border border-violet-100 bg-white px-5 py-12 text-center shadow-sm">
              <Video className="mx-auto text-violet-400" size={40} aria-hidden="true" />
              <h3 className="mt-3 font-bold text-slate-800">Videos coming soon</h3>
              <p className="mt-1 text-sm text-slate-500">Check back later for videos from our channel.</p>
            </div>
          )}
        </PageContainer>
      </main>
      {selectedVideo && <YoutubeVideoDetailsModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </>
  );
}

export default YoutubeVideosPage;
