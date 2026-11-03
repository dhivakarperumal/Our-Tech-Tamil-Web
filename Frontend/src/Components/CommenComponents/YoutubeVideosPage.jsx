import { useEffect, useState } from "react";
import { ExternalLink, Grid2X2, List, Search, Video } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState("cards");
  const [selectedVideo, setSelectedVideo] = useState(null);
  const filteredVideos = videos.filter((video) => {
    const query = searchQuery.trim().toLowerCase();
    return !query || [video.title, video.description, video.video_code, ...(video.application_links || []).map((link) => link.title)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query));
  });

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
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <label className="relative block w-full sm:max-w-sm">
              <Search size={17} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search videos..."
                aria-label="Search videos"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-violet-500 focus:ring-4 focus:ring-violet-100"
              />
            </label>
            <div className="flex items-center justify-end gap-1" role="group" aria-label="Video view mode">
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                aria-label="Card view"
                aria-pressed={viewMode === "cards"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${viewMode === "cards" ? "bg-violet-700 text-white" : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"}`}
              >
                <Grid2X2 size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Table view"
                aria-pressed={viewMode === "table"}
                className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${viewMode === "table" ? "bg-violet-700 text-white" : "text-slate-500 hover:bg-violet-50 hover:text-violet-700"}`}
              >
                <List size={18} aria-hidden="true" />
              </button>
            </div>
          </div>
          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {[1, 2, 3].map((item) => (
                <div key={item} className="aspect-video animate-pulse rounded-2xl bg-white shadow-sm" />
              ))}
            </div>
          ) : failed ? (
            <p role="alert" className="rounded-xl border border-rose-100 bg-white px-4 py-8 text-center text-sm text-rose-700">
              Videos could not be loaded. Please refresh the page and try again.
            </p>
          ) : filteredVideos.length ? (
            viewMode === "cards" ? (
              <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                {filteredVideos.map((video) => <YoutubeVideoCard key={video.id} video={video} />)}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-violet-100 bg-white shadow-sm">
                <table className="w-full min-w-[780px] text-left text-sm">
                  <thead className="bg-violet-50 text-xs uppercase tracking-wide text-violet-800">
                    <tr>
                      <th scope="col" className="px-4 py-3 font-bold">Video</th>
                      <th scope="col" className="px-4 py-3 font-bold">Description</th>
                      <th scope="col" className="px-4 py-3 font-bold">Links</th>
                      <th scope="col" className="px-4 py-3 text-right font-bold">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-violet-50">
                    {filteredVideos.map((video) => (
                      <tr key={video.id} className="text-slate-700">
                        <td className="px-4 py-3">
                          <div className="flex min-w-[240px] items-center gap-3">
                            <img
                              src={getImageUrl(video.thumbnail_image || video.thumbnail_url) || `https://img.youtube.com/vi/${encodeURIComponent(video.video_id)}/hqdefault.jpg`}
                              alt=""
                              loading="lazy"
                              className="aspect-video w-24 shrink-0 rounded-lg bg-slate-100 object-cover"
                            />
                            <span className="font-bold text-slate-900">{video.title}</span>
                          </div>
                        </td>
                        <td className="max-w-sm px-4 py-3">
                          <p className="line-clamp-2 text-slate-600">{video.description || "—"}</p>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex min-w-[120px] flex-wrap gap-2">
                            {video.application_links?.length ? video.application_links.map((link, index) => (
                              <a
                                key={`${link.url}-${index}`}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-semibold text-violet-700 hover:bg-violet-100"
                              >
                                {link.title}
                                <ExternalLink size={12} aria-hidden="true" />
                              </a>
                            )) : <span className="text-slate-400">—</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-2">
                            <a
                              href={video.video_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-2 text-xs font-bold text-violet-700 hover:bg-violet-50"
                            >
                              Watch
                              <ExternalLink size={13} aria-hidden="true" />
                            </a>
                            <button
                              type="button"
                              onClick={() => setSelectedVideo(video)}
                              className="rounded-lg bg-violet-700 px-3 py-2 text-xs font-bold text-white hover:bg-violet-800"
                            >
                              More
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            <div className="rounded-2xl border border-violet-100 bg-white px-5 py-12 text-center shadow-sm">
              <Video className="mx-auto text-violet-400" size={40} aria-hidden="true" />
              <h3 className="mt-3 font-bold text-slate-800">{searchQuery.trim() ? "No videos found" : "Videos coming soon"}</h3>
              <p className="mt-1 text-sm text-slate-500">{searchQuery.trim() ? "Try a different search term." : "Check back later for videos from our channel."}</p>
            </div>
          )}
        </PageContainer>
      </main>
      {selectedVideo && <YoutubeVideoDetailsModal video={selectedVideo} onClose={() => setSelectedVideo(null)} />}
    </>
  );
}

export default YoutubeVideosPage;
