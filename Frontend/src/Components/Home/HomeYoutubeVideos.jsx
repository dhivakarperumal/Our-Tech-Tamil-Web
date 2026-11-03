import { useEffect, useState } from "react";
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
    <section aria-labelledby="home-youtube-videos-title" className="bg-[#faf8fc] py-8 sm:py-12">
      <PageContainer>
        <div className="mb-5 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-violet-700">From our channel</p>
          <h2 id="home-youtube-videos-title" className="mt-1 text-2xl font-black text-slate-900 sm:text-3xl">
            Watch our videos
          </h2>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
          {videos.map((video) => <YoutubeVideoCard key={video.id} video={video} />)}
        </div>
      </PageContainer>
    </section>
  );
}

export default HomeYoutubeVideos;
