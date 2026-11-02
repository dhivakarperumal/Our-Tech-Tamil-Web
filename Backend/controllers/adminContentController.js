const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const SERVICE_STATUSES = new Set(["Active", "Inactive"]);
const DOCUMENT_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
  "text/rtf",
]);

function parseYoutubeUrl(value) {
  if (typeof value !== "string" || value.length > 2048) return null;

  let url;
  try {
    url = new URL(value.trim());
  } catch {
    return null;
  }

  const hostname = url.hostname.toLowerCase();
  let videoId = "";
  if (hostname === "youtu.be" || hostname === "www.youtu.be") {
    videoId = url.pathname.split("/").filter(Boolean)[0] || "";
  } else if (hostname === "youtube.com" || hostname.endsWith(".youtube.com")) {
    if (url.pathname === "/watch") {
      videoId = url.searchParams.get("v") || "";
    } else {
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(pathParts[0])) {
        videoId = pathParts[1] || "";
      }
    }
  }

  return YOUTUBE_ID_PATTERN.test(videoId)
    ? { videoId, url: `https://www.youtube.com/watch?v=${videoId}` }
    : null;
}

function validateOptionalUrl(value) {
  if (value === "") return true;
  if (typeof value !== "string" || value.length > 2048) return false;
  if (value.startsWith("/") && !value.startsWith("//")) {
    return !value.replace(/\\/g, "/").split("/").includes("..");
  }
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function validateDataFile(value, allowedTypes, maxBytes) {
  if (typeof value !== "string") return false;
  const match = /^data:([a-z0-9.+-]+\/[a-z0-9.+-]+);base64,([A-Za-z0-9+/]*={0,2})$/i.exec(value);
  if (!match || !allowedTypes.has(match[1].toLowerCase())) return false;
  return Math.floor((match[2].length * 3) / 4) <= maxBytes;
}

function validateApplicationLinks(value) {
  if (!Array.isArray(value) || value.length > 20) return false;
  return value.every((link) =>
    link
    && typeof link.title === "string"
    && link.title.trim().length >= 1
    && link.title.trim().length <= 120
    && typeof link.url === "string"
    && link.url.trim().length > 0
    && validateOptionalUrl(link.url.trim()),
  );
}

function validateDocuments(value) {
  if (!Array.isArray(value) || value.length > 4) return false;
  return value.every((document) =>
    document
    && typeof document.name === "string"
    && document.name.trim().length >= 1
    && document.name.trim().length <= 180
    && typeof document.type === "string"
    && validateDataFile(document.data, DOCUMENT_TYPES, 1024 * 1024),
  );
}

function validateVideoCode(value) {
  return typeof value === "string" && /^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(value);
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function createAdminContentController(pool) {
  return {
    async listServices(request, response, next) {
      try {
        const [services] = await pool.query(
          "SELECT id, service_id, name, title, subtitle, description, note, price, duration, image_url, status, created_at FROM admin_services ORDER BY created_at DESC",
        );
        return response.json({ services });
      } catch (error) {
        return next(error);
      }
    },

    async createService(request, response, next) {
      const body = request.body || {};
      const serviceId = typeof body.service_id === "string" ? body.service_id.trim().toUpperCase() : "";
      const name = typeof body.name === "string" ? body.name.trim() : "";
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      const note = typeof body.note === "string" ? body.note.trim() : "";
      const duration = typeof body.duration === "string" ? body.duration.trim() : "";
      const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
      const status = body.status || "Active";
      const price = body.price === "" || body.price == null ? null : Number(body.price);

      if (!/^[A-Z0-9][A-Z0-9_-]{1,39}$/.test(serviceId)) {
        return response.status(400).json({ message: "Service ID must be 2-40 letters, numbers, hyphens, or underscores." });
      }
      if (name.length < 2 || name.length > 120) {
        return response.status(400).json({ message: "Service name must be between 2 and 120 characters." });
      }
      if (title.length < 2 || title.length > 160) {
        return response.status(400).json({ message: "Service title must be between 2 and 160 characters." });
      }
      if (subtitle.length > 240 || description.length > 5000 || note.length > 5000 || duration.length > 80) {
        return response.status(400).json({ message: "Subtitle, description, note, or duration is too long." });
      }
      if (price !== null && (!Number.isFinite(price) || price < 0 || price > 99999999.99)) {
        return response.status(400).json({ message: "Enter a valid service price." });
      }
      if (!validateOptionalUrl(imageUrl)) {
        return response.status(400).json({ message: "Image URL must be a valid HTTP or HTTPS URL." });
      }
      if (!SERVICE_STATUSES.has(status)) {
        return response.status(400).json({ message: "Choose a valid service status." });
      }

      try {
        const [result] = await pool.execute(
          "INSERT INTO admin_services (service_id, name, title, subtitle, description, note, price, duration, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [serviceId, name, title, subtitle || null, description || null, note || null, price, duration || null, imageUrl || null, status],
        );
        const [services] = await pool.execute(
          "SELECT id, service_id, name, title, subtitle, description, note, price, duration, image_url, status, created_at FROM admin_services WHERE id = ?",
          [result.insertId],
        );
        return response.status(201).json({ service: services[0] });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "That Service ID is already in use." });
        }
        return next(error);
      }
    },

    async deleteService(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid service id." });
      }

      try {
        const [result] = await pool.execute("DELETE FROM admin_services WHERE id = ?", [id]);
        if (!result.affectedRows) {
          return response.status(404).json({ message: "Service not found." });
        }
        return response.status(204).end();
      } catch (error) {
        return next(error);
      }
    },

    async listYoutubeVideos(request, response, next) {
      try {
        const [videos] = await pool.query(
          "SELECT id, video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status, created_at FROM admin_youtube_videos ORDER BY created_at DESC",
        );
        return response.json({
          videos: videos.map((video) => ({
            ...video,
            application_links: parseJsonArray(video.application_links),
            documents: parseJsonArray(video.documents),
          })),
        });
      } catch (error) {
        return next(error);
      }
    },

    async createYoutubeVideo(request, response, next) {
      const body = request.body || {};
      const videoCode = typeof body.video_code === "string" ? body.video_code.trim().toUpperCase() : "";
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      const thumbnailImage = body.thumbnail_image || "";
      const thumbnailUrl = typeof body.thumbnail_url === "string" ? body.thumbnail_url.trim() : "";
      const applicationLinks = body.application_links;
      const documents = body.documents;
      const followUpNotes = typeof body.follow_up_notes === "string" ? body.follow_up_notes.trim() : "";
      const status = body.status || "Active";
      const parsedVideo = parseYoutubeUrl(body.video_url);

      if (!validateVideoCode(videoCode)) {
        return response.status(400).json({ message: "Video ID must be 2-40 letters, numbers, hyphens, or underscores." });
      }
      if (title.length < 2 || title.length > 160) {
        return response.status(400).json({ message: "Video title must be between 2 and 160 characters." });
      }
      if (!parsedVideo) {
        return response.status(400).json({ message: "Enter a valid YouTube video URL." });
      }
      if (description.length > 5000) {
        return response.status(400).json({ message: "Description must be 5,000 characters or fewer." });
      }
      if (followUpNotes.length > 5000) {
        return response.status(400).json({ message: "Follow-up notes must be 5,000 characters or fewer." });
      }
      if (thumbnailImage && !validateDataFile(thumbnailImage, new Set(["image/jpeg", "image/png", "image/webp"]), 3 * 1024 * 1024)) {
        return response.status(400).json({ message: "Upload a PNG, JPEG, or WEBP thumbnail no larger than 3 MB." });
      }
      if (!validateOptionalUrl(thumbnailUrl)) {
        return response.status(400).json({ message: "Thumbnail URL must be a valid HTTP or HTTPS URL." });
      }
      if (!validateApplicationLinks(applicationLinks)) {
        return response.status(400).json({ message: "Add up to 20 application links with a title and valid HTTP or HTTPS URL." });
      }
      if (!validateDocuments(documents)) {
        return response.status(400).json({ message: "Upload up to 4 supported documents, each no larger than 1 MB." });
      }
      if (!SERVICE_STATUSES.has(status)) {
        return response.status(400).json({ message: "Choose a valid video status." });
      }

      try {
        const [result] = await pool.execute(
          "INSERT INTO admin_youtube_videos (video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            videoCode,
            title,
            parsedVideo.url,
            parsedVideo.videoId,
            thumbnailImage || null,
            thumbnailUrl || null,
            description || null,
            JSON.stringify(applicationLinks),
            JSON.stringify(documents),
            followUpNotes || null,
            status,
          ],
        );
        const [videos] = await pool.execute(
          "SELECT id, video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status, created_at FROM admin_youtube_videos WHERE id = ?",
          [result.insertId],
        );
        return response.status(201).json({
          video: {
            ...videos[0],
            application_links: parseJsonArray(videos[0].application_links),
            documents: parseJsonArray(videos[0].documents),
          },
        });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          const message = error.message?.includes("video_code")
            ? "That Video ID is already in use."
            : "This YouTube video has already been added.";
          return response.status(409).json({ message });
        }
        return next(error);
      }
    },

    async deleteYoutubeVideo(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid video id." });
      }

      try {
        const [result] = await pool.execute("DELETE FROM admin_youtube_videos WHERE id = ?", [id]);
        if (!result.affectedRows) {
          return response.status(404).json({ message: "YouTube video not found." });
        }
        return response.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createAdminContentController };
