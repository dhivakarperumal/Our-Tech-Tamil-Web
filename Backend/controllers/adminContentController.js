const crypto = require("node:crypto");

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

function validateUploadedYoutubeAsset(value, extensions) {
  return typeof value === "string"
    && new RegExp(`^/uploads/youtube-videos/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\\.(?:${extensions})$`, "i").test(value);
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
    && (
      validateDataFile(document.data, DOCUMENT_TYPES, 1024 * 1024)
      || validateUploadedYoutubeAsset(document.url, "pdf|doc|docx|xls|xlsx|rtf|txt")
    ),
  );
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

function parseServiceInput(body) {
  const service = {
    name: typeof body.name === "string" ? body.name.trim() : "",
    title: typeof body.title === "string" ? body.title.trim() : "",
    subtitle: typeof body.subtitle === "string" ? body.subtitle.trim() : "",
    description: typeof body.description === "string" ? body.description.trim() : "",
    note: typeof body.note === "string" ? body.note.trim() : "",
    duration: typeof body.duration === "string" ? body.duration.trim() : "",
    image_url: typeof body.image_url === "string" ? body.image_url.trim() : "",
    status: body.status || "Active",
    price: body.price === "" || body.price == null ? null : Number(body.price),
  };

  if (service.name.length < 2 || service.name.length > 120) {
    return { error: "Service name must be between 2 and 120 characters." };
  }
  if (service.title.length < 2 || service.title.length > 160) {
    return { error: "Service title must be between 2 and 160 characters." };
  }
  if (service.subtitle.length > 240 || service.description.length > 5000 ||
      service.note.length > 5000 || service.duration.length > 80) {
    return { error: "Subtitle, description, note, or duration is too long." };
  }
  if (service.price !== null &&
      (!Number.isFinite(service.price) || service.price < 0 || service.price > 99999999.99)) {
    return { error: "Enter a valid service price." };
  }
  if (!validateOptionalUrl(service.image_url)) {
    return { error: "Image URL must be a valid HTTP or HTTPS URL." };
  }
  if (!SERVICE_STATUSES.has(service.status)) {
    return { error: "Choose a valid service status." };
  }
  return { service };
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

    async getNextServiceId(request, response, next) {
      try {
        const [rows] = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM admin_services");
        const nextId = Number(rows[0]?.nextId) || 1;
        return response.json({ service_id: `SRV-${String(nextId).padStart(5, "0")}` });
      } catch (error) {
        return next(error);
      }
    },

    async createService(request, response, next) {
      const { service, error: validationError } = parseServiceInput(request.body || {});
      if (validationError) return response.status(400).json({ message: validationError });

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const temporaryServiceId = `TMP-${crypto.randomUUID()}`;
        const [result] = await connection.execute(
          "INSERT INTO admin_services (service_id, name, title, subtitle, description, note, price, duration, image_url, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [temporaryServiceId, service.name, service.title, service.subtitle || null, service.description || null, service.note || null, service.price, service.duration || null, service.image_url || null, service.status],
        );
        const serviceId = `SRV-${String(result.insertId).padStart(5, "0")}`;
        await connection.execute(
          "UPDATE admin_services SET service_id = ? WHERE id = ?",
          [serviceId, result.insertId],
        );
        const [services] = await connection.execute(
          "SELECT id, service_id, name, title, subtitle, description, note, price, duration, image_url, status, created_at FROM admin_services WHERE id = ?",
          [result.insertId],
        );
        await connection.commit();
        return response.status(201).json({ service: services[0] });
      } catch (error) {
        if (connection) await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "Could not generate a unique Service ID. Please try again." });
        }
        return next(error);
      } finally {
        connection?.release();
      }
    },

    async updateService(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid service id." });
      }

      const { service, error: validationError } = parseServiceInput(request.body || {});
      if (validationError) return response.status(400).json({ message: validationError });

      try {
        const [result] = await pool.execute(
          `UPDATE admin_services
           SET name = ?, title = ?, subtitle = ?, description = ?, note = ?, price = ?, duration = ?, image_url = ?, status = ?
           WHERE id = ?`,
          [
            service.name,
            service.title,
            service.subtitle || null,
            service.description || null,
            service.note || null,
            service.price,
            service.duration || null,
            service.image_url || null,
            service.status,
            id,
          ],
        );
        if (!result.affectedRows) {
          const [existing] = await pool.execute("SELECT id FROM admin_services WHERE id = ? LIMIT 1", [id]);
          if (!existing.length) return response.status(404).json({ message: "Service not found." });
        }

        const [services] = await pool.execute(
          "SELECT id, service_id, name, title, subtitle, description, note, price, duration, image_url, status, created_at FROM admin_services WHERE id = ? LIMIT 1",
          [id],
        );
        return response.json({ service: services[0] });
      } catch (error) {
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

    async getNextYoutubeVideoCode(request, response, next) {
      try {
        const [rows] = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM admin_youtube_videos");
        const nextId = Number(rows[0]?.nextId) || 1;
        return response.json({ video_code: `YT-${String(nextId).padStart(5, "0")}` });
      } catch (error) {
        return next(error);
      }
    },

    async createYoutubeVideo(request, response, next) {
      const body = request.body || {};
      const title = typeof body.title === "string" ? body.title.trim() : "";
      const description = typeof body.description === "string" ? body.description.trim() : "";
      const thumbnailImage = body.thumbnail_image || "";
      const thumbnailUrl = typeof body.thumbnail_url === "string" ? body.thumbnail_url.trim() : "";
      const applicationLinks = body.application_links;
      const documents = body.documents;
      const followUpNotes = typeof body.follow_up_notes === "string" ? body.follow_up_notes.trim() : "";
      const status = body.status || "Active";
      const parsedVideo = parseYoutubeUrl(body.video_url);

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
      if (thumbnailImage
        && !validateDataFile(thumbnailImage, new Set(["image/jpeg", "image/png", "image/webp"]), 3 * 1024 * 1024)
        && !validateUploadedYoutubeAsset(thumbnailImage, "jpg|png|webp")) {
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

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const temporaryVideoCode = `TMP-${crypto.randomUUID()}`;
        const [result] = await connection.execute(
          "INSERT INTO admin_youtube_videos (video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            temporaryVideoCode,
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
        const videoCode = `YT-${String(result.insertId).padStart(5, "0")}`;
        await connection.execute(
          "UPDATE admin_youtube_videos SET video_code = ? WHERE id = ?",
          [videoCode, result.insertId],
        );
        const [videos] = await connection.execute(
          "SELECT id, video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status, created_at FROM admin_youtube_videos WHERE id = ?",
          [result.insertId],
        );
        await connection.commit();
        return response.status(201).json({
          video: {
            ...videos[0],
            application_links: parseJsonArray(videos[0].application_links),
            documents: parseJsonArray(videos[0].documents),
          },
        });
      } catch (error) {
        if (connection) {
          try {
            await connection.rollback();
          } catch (rollbackError) {
            console.error("Failed to roll back YouTube video creation:", rollbackError);
          }
        }
        if (error.code === "ER_DUP_ENTRY") {
          const message = error.message?.includes("video_code")
            ? "Could not generate a unique Video ID. Please try again."
            : "This YouTube video has already been added.";
          return response.status(409).json({ message });
        }
        return next(error);
      } finally {
        connection?.release();
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
