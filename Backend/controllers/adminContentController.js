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

function validateUploadedYoutubeAsset(value, folder, extensions) {
  return typeof value === "string"
    && new RegExp(`^/uploads/${folder}/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\\.(?:${extensions})$`, "i").test(value);
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
      || validateUploadedYoutubeAsset(document.url, "youtube-videos", "pdf|doc|docx|xls|xlsx|rtf|txt")
    ),
  );
}

function parseYoutubeVideoInput(body) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const thumbnailImage = body.thumbnail_image || "";
  const thumbnailUrl = typeof body.thumbnail_url === "string" ? body.thumbnail_url.trim() : "";
  const applicationLinks = body.application_links;
  const documents = body.documents;
  const followUpNotes = typeof body.follow_up_notes === "string" ? body.follow_up_notes.trim() : "";
  const status = body.status || "Active";
  const parsedVideo = parseYoutubeUrl(body.video_url);

  if (title.length < 2 || title.length > 160) return { error: "Video title must be between 2 and 160 characters." };
  if (!parsedVideo) return { error: "Enter a valid YouTube video URL." };
  if (description.length > 5000) return { error: "Description must be 5,000 characters or fewer." };
  if (followUpNotes.length > 5000) return { error: "Follow-up notes must be 5,000 characters or fewer." };
  if (!thumbnailImage && !thumbnailUrl) return { error: "Upload a thumbnail image." };
  if (thumbnailImage
    && !validateDataFile(thumbnailImage, new Set(["image/jpeg", "image/png", "image/webp"]), 3 * 1024 * 1024)
    && !validateUploadedYoutubeAsset(thumbnailImage, "youtube", "jpg|png|webp")
    && !validateUploadedYoutubeAsset(thumbnailImage, "youtube-videos", "jpg|png|webp")) {
    return { error: "Upload a PNG, JPEG, or WEBP thumbnail no larger than 3 MB." };
  }
  if (!validateOptionalUrl(thumbnailUrl)) return { error: "Thumbnail URL must be a valid HTTP or HTTPS URL." };
  if (!validateApplicationLinks(applicationLinks)) {
    return { error: "Add up to 20 application links with a title and valid HTTP or HTTPS URL." };
  }
  if (!validateDocuments(documents)) {
    return { error: "Upload up to 4 supported documents, each no larger than 1 MB." };
  }
  if (!SERVICE_STATUSES.has(status)) return { error: "Choose a valid video status." };

  return {
    video: {
      title,
      videoUrl: parsedVideo.url,
      videoId: parsedVideo.videoId,
      thumbnailImage,
      thumbnailUrl,
      description,
      applicationLinks,
      documents,
      followUpNotes,
      status,
    },
  };
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

function parseArticleInput(body) {
  const contentType = body.content_type;
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const productName = typeof body.product_name === "string" ? body.product_name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const productFeatures = body.product_features == null ? [] : body.product_features;
  const buyLinks = body.buy_links == null ? [] : body.buy_links;
  const imageUrl = typeof body.image_url === "string" ? body.image_url.trim() : "";
  const moreDetails = typeof body.more_details === "string" ? body.more_details.trim() : "";
  const rating = body.rating === "" || body.rating == null ? null : Number(body.rating);

  if (!["article", "product_review"].includes(contentType)) {
    return { error: "Choose Article or Product Review." };
  }
  if (contentType === "article" && (title.length < 2 || title.length > 200)) {
    return { error: "Article title must be between 2 and 200 characters." };
  }
  if (contentType === "product_review" && (productName.length < 2 || productName.length > 191)) {
    return { error: "Product name must be between 2 and 191 characters." };
  }
  if (!description || description.length > 5000) {
    return { error: "Description is required and must be 5,000 characters or fewer." };
  }
  if (!Array.isArray(productFeatures) || productFeatures.length > 20 ||
      !productFeatures.every((feature) =>
        feature && typeof feature.name === "string" && feature.name.trim().length <= 120
        && typeof feature.value === "string" && feature.value.trim().length <= 500
        && (feature.name.trim() || feature.value.trim()))) {
    return { error: "Add up to 20 product features with a name and value." };
  }
  if (!Array.isArray(buyLinks) || buyLinks.length > 20 ||
      !buyLinks.every((link) =>
        link && typeof link.name === "string" && link.name.trim().length <= 120
        && typeof link.url === "string" && link.url.trim().length <= 2048
        && (link.name.trim() || link.url.trim())
        && (!link.url.trim() || validateOptionalUrl(link.url.trim())))) {
    return { error: "Add up to 20 buy links with a name and valid HTTP or HTTPS URL." };
  }
  if (moreDetails.length > 5000) {
    return { error: "Additional details must be 5,000 characters or fewer." };
  }
  if (!/^\/uploads\/articles\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}\.(?:jpg|png|webp|gif)$/i.test(imageUrl)) {
    return { error: "Upload a valid article or product image." };
  }
  if (contentType === "product_review" && (rating === null || !Number.isFinite(rating) || rating < 1 || rating > 5)) {
    return { error: "Product rating must be between 1 and 5." };
  }
  if (contentType === "product_review" && buyLinks.length === 0) {
    return { error: "Add at least one buy link with a name and valid URL." };
  }
  if (buyLinks.some((link) => !link.name.trim() || !link.url.trim())) {
    return { error: "Each link needs both a name and a valid URL." };
  }
  if (contentType === "product_review" && productFeatures.some((feature) => !feature.name.trim() || !feature.value.trim())) {
    return { error: "Each product feature needs both a name and a value." };
  }

  return {
    article: {
      contentType,
      title: contentType === "article" ? title : null,
      productName: contentType === "product_review" ? productName : null,
      description,
      productFeatures: contentType === "product_review" ? productFeatures : [],
      imageUrl,
      rating: contentType === "product_review" ? rating : null,
      buyLinks,
      buyLink: buyLinks[0]?.url || null,
      moreDetails: contentType === "product_review" ? moreDetails || null : null,
    },
  };
}

function parseArticleRows(value, fallback = []) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value) return fallback;
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}

function normalizeArticle(article) {
  const productFeatures = parseArticleRows(
    article.product_features,
    typeof article.product_features === "string" && article.product_features
      ? [{ name: "Details", value: article.product_features }]
      : [],
  );
  const buyLinks = parseArticleRows(
    article.buy_links,
    article.buy_link ? [{ name: "Buy", url: article.buy_link }] : [],
  );
  return { ...article, product_features: productFeatures, buy_links: buyLinks };
}

function createAdminContentController(pool) {
  return {
    async listArticles(request, response, next) {
      try {
        const [articles] = await pool.query(
          "SELECT id, content_id, content_type, title, product_name, description, product_features, image_url, rating, buy_link, buy_links, more_details, created_at FROM admin_articles ORDER BY created_at DESC",
        );
        return response.json({ articles: articles.map(normalizeArticle) });
      } catch (error) {
        return next(error);
      }
    },

    async listPublicArticles(request, response, next) {
      try {
        const [articles] = await pool.execute(
          `SELECT id, content_id, title, description, image_url, buy_link, buy_links, created_at
           FROM admin_articles
           WHERE content_type = 'article'
           ORDER BY created_at DESC, id DESC`,
        );
        return response.json({
          articles: articles.map((article) => ({
            ...article,
            buy_links: parseArticleRows(
              article.buy_links,
              article.buy_link ? [{ name: "Read More", url: article.buy_link }] : [],
            ),
          })),
        });
      } catch (error) {
        return next(error);
      }
    },

    async getNextArticleId(request, response, next) {
      const contentType = request.query.type;
      if (!["article", "product_review"].includes(contentType)) {
        return response.status(400).json({ message: "Choose Article or Product Review." });
      }

      try {
        const [rows] = await pool.query("SELECT COALESCE(MAX(id), 0) + 1 AS nextId FROM admin_articles");
        const prefix = contentType === "article" ? "ART" : "REV";
        const nextId = Number(rows[0]?.nextId) || 1;
        return response.json({ content_id: `${prefix}-${String(nextId).padStart(5, "0")}` });
      } catch (error) {
        return next(error);
      }
    },

    async createArticle(request, response, next) {
      const { article, error: validationError } = parseArticleInput(request.body || {});
      if (validationError) return response.status(400).json({ message: validationError });

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const temporaryId = `TMP-${crypto.randomUUID()}`;
        const [result] = await connection.execute(
          `INSERT INTO admin_articles
            (content_id, content_type, title, product_name, description, product_features, image_url, rating, buy_link, buy_links, more_details)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            temporaryId,
            article.contentType,
            article.title,
            article.productName,
            article.description,
            article.productFeatures.length ? JSON.stringify(article.productFeatures) : null,
            article.imageUrl,
            article.rating,
            article.buyLink,
            article.buyLinks.length ? JSON.stringify(article.buyLinks) : null,
            article.moreDetails,
          ],
        );
        const prefix = article.contentType === "article" ? "ART" : "REV";
        const contentId = `${prefix}-${String(result.insertId).padStart(5, "0")}`;
        await connection.execute("UPDATE admin_articles SET content_id = ? WHERE id = ?", [contentId, result.insertId]);
        const [articles] = await connection.execute(
          "SELECT id, content_id, content_type, title, product_name, description, product_features, image_url, rating, buy_link, buy_links, more_details, created_at FROM admin_articles WHERE id = ?",
          [result.insertId],
        );
        await connection.commit();
        return response.status(201).json({ article: normalizeArticle(articles[0]) });
      } catch (error) {
        if (connection) await connection.rollback();
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "Could not generate a unique content ID. Please try again." });
        }
        return next(error);
      } finally {
        connection?.release();
      }
    },

    async updateArticle(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid article id." });
      }
      const { article, error: validationError } = parseArticleInput(request.body || {});
      if (validationError) return response.status(400).json({ message: validationError });

      try {
        const [existing] = await pool.execute(
          "SELECT content_type FROM admin_articles WHERE id = ? LIMIT 1",
          [id],
        );
        if (!existing.length) return response.status(404).json({ message: "Article or product review not found." });
        if (existing[0].content_type !== article.contentType) {
          return response.status(400).json({ message: "Content type cannot be changed while editing." });
        }

        await pool.execute(
          `UPDATE admin_articles
           SET title = ?, product_name = ?, description = ?, product_features = ?, image_url = ?, rating = ?, buy_link = ?, buy_links = ?, more_details = ?
           WHERE id = ?`,
          [
            article.title,
            article.productName,
            article.description,
            article.productFeatures.length ? JSON.stringify(article.productFeatures) : null,
            article.imageUrl,
            article.rating,
            article.buyLink,
            article.buyLinks.length ? JSON.stringify(article.buyLinks) : null,
            article.moreDetails,
            id,
          ],
        );
        const [articles] = await pool.execute(
          "SELECT id, content_id, content_type, title, product_name, description, product_features, image_url, rating, buy_link, buy_links, more_details, created_at FROM admin_articles WHERE id = ? LIMIT 1",
          [id],
        );
        return response.json({ article: normalizeArticle(articles[0]) });
      } catch (error) {
        return next(error);
      }
    },

    async deleteArticle(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid article id." });
      }
      try {
        const [result] = await pool.execute("DELETE FROM admin_articles WHERE id = ?", [id]);
        if (!result.affectedRows) {
          return response.status(404).json({ message: "Article or product review not found." });
        }
        return response.status(204).end();
      } catch (error) {
        return next(error);
      }
    },

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

    async listPublicYoutubeVideos(request, response, next) {
      try {
        const [videos] = await pool.execute(
          `SELECT id, title, video_url, video_id, thumbnail_image, thumbnail_url, description,
                  application_links
           FROM admin_youtube_videos
           WHERE status = 'Active'
           ORDER BY created_at DESC, id DESC`,
        );
        return response.json({
          videos: videos.map((video) => ({
            ...video,
            application_links: parseJsonArray(video.application_links).filter((link) =>
              link
              && typeof link.title === "string"
              && link.title.trim()
              && typeof link.url === "string"
              && validateOptionalUrl(link.url.trim()),
            ),
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
      const { video, error: validationError } = parseYoutubeVideoInput(request.body || {});
      if (validationError) return response.status(400).json({ message: validationError });

      let connection;
      try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        const temporaryVideoCode = `TMP-${crypto.randomUUID()}`;
        const [result] = await connection.execute(
          "INSERT INTO admin_youtube_videos (video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            temporaryVideoCode,
            video.title,
            video.videoUrl,
            video.videoId,
            video.thumbnailImage || null,
            video.thumbnailUrl || null,
            video.description || null,
            JSON.stringify(video.applicationLinks),
            JSON.stringify(video.documents),
            video.followUpNotes || null,
            video.status,
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

    async updateYoutubeVideo(request, response, next) {
      const id = Number(request.params.id);
      if (!Number.isSafeInteger(id) || id < 1) {
        return response.status(400).json({ message: "Invalid video id." });
      }

      const { video, error: validationError } = parseYoutubeVideoInput(request.body || {});
      if (validationError) return response.status(400).json({ message: validationError });

      try {
        await pool.execute(
          `UPDATE admin_youtube_videos
           SET title = ?, video_url = ?, video_id = ?, thumbnail_image = ?, thumbnail_url = ?,
               description = ?, application_links = ?, documents = ?, follow_up_notes = ?, status = ?
           WHERE id = ?`,
          [
            video.title,
            video.videoUrl,
            video.videoId,
            video.thumbnailImage || null,
            video.thumbnailUrl || null,
            video.description || null,
            JSON.stringify(video.applicationLinks),
            JSON.stringify(video.documents),
            video.followUpNotes || null,
            video.status,
            id,
          ],
        );
        const [videos] = await pool.execute(
          "SELECT id, video_code, title, video_url, video_id, thumbnail_image, thumbnail_url, description, application_links, documents, follow_up_notes, status, created_at FROM admin_youtube_videos WHERE id = ? LIMIT 1",
          [id],
        );
        if (!videos[0]) return response.status(404).json({ message: "YouTube video not found." });
        return response.json({
          video: {
            ...videos[0],
            application_links: parseJsonArray(videos[0].application_links),
            documents: parseJsonArray(videos[0].documents),
          },
        });
      } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
          return response.status(409).json({ message: "This YouTube video has already been added." });
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
