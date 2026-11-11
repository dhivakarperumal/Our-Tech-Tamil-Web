import { useEffect, useState } from "react";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../../api";
import PageContainer from "../CommenComponents/PageContainer";
import YoutubeVideoCard from "../CommenComponents/YoutubeVideoCard";

function HomeYoutubeVideos() {
  const [videos, setVideos] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    api.get("/youtube-videos")
      .then(({ data }) => {
        if (active) setVideos(Array.isArray(data.videos) ? data.videos : []);
      })
      .catch((error) => {
        console.error("Failed to load home page YouTube videos:", error);
        if (active) setFailed(true);
      });

    return () => { active = false; };
  }, []);

  if (failed || videos.length === 0) return null;

  return (
    <section aria-labelledby="home-youtube-videos-title" className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_#f3e8ff_0%,_#faf8fc_48%,_#ffffff_100%)] py-10 sm:py-14">
      <PageContainer>
        <div className="mb-7 flex flex-col gap-5 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-violet-700">Watch &amp; Explore</p>
            <h2 id="home-youtube-videos-title" className="mt-1 text-3xl font-black tracking-[-0.05em] text-slate-950 sm:text-4xl">
              Featured <span className="text-violet-700">Product Videos</span>
            </h2>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              See detailed reviews, unboxings and real demos of our top products.
            </p>
            <div className="mt-4 h-1 w-16 rounded-full bg-violet-700" />
          </div>
          <Link
            to="/youtube-videos"
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-violet-600 bg-white/80 px-5 py-2.5 text-sm font-bold text-violet-800 shadow-sm transition hover:bg-violet-700 hover:text-white"
          >
            <Play size={15} fill="currentColor" aria-hidden="true" />
            View All Videos
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid items-stretch gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 xl:gap-5">
          {videos.map((video) => <YoutubeVideoCard key={video.id} video={video} />)}
        </div>
      </PageContainer>
    </section>
  );
}

export default HomeYoutubeVideos;
