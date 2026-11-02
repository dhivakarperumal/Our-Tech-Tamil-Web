const fs = require("node:fs/promises");
const path = require("node:path");

const uploadDirectory = path.join(__dirname, "..", "uploads", "banners");
const allowedSections = new Set(["hero", "offers"]);

function requestError(message, status = 400) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getUploadedFiles(request) {
  return Object.values(request.files || {}).flat();
}

async function removeUploadedFiles(files) {
  await Promise.all(files.map(async (file) => {
    try {
      await fs.unlink(file.path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }));
}

function getStoredFilename(imagePath) {
  if (typeof imagePath !== "string" || !imagePath.startsWith("/uploads/banners/")) {
    return null;
  }
  const filename = path.basename(imagePath);
  return filename && filename === imagePath.slice("/uploads/banners/".length)
    ? filename
    : null;
}

async function removeStoredImages(imagePaths) {
  await Promise.all(imagePaths.map(async (imagePath) => {
    const filename = getStoredFilename(imagePath);
    if (!filename) return;
    try {
      await fs.unlink(path.join(uploadDirectory, filename));
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }));
}

function parseBanner(body, existing, files) {
  const title = typeof body.title === "string" ? body.title.trim() : "";
  const subtitle = typeof body.subtitle === "string" ? body.subtitle.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() : "";
  const destinationLink = typeof body.destination_link === "string"
    ? body.destination_link.trim()
    : "";
  const targetSection = typeof body.target_section === "string"
    ? body.target_section.trim()
    : "";
  const publishedValue = body.is_published;
  const isPublished = publishedValue === true || publishedValue === "true";
  const desktopImage = files.desktop_image?.[0]
    ? `/uploads/banners/${files.desktop_image[0].filename}`
    : existing?.desktop_image || "";
  const mobileImage = files.mobile_image?.[0]
    ? `/uploads/banners/${files.mobile_image[0].filename}`
    : existing?.mobile_image || null;

  if (!title || title.length > 160) {
    throw requestError("Headline is required and must be 160 characters or fewer.");
  }
  if (subtitle.length > 240) {
    throw requestError("Subtitle must be 240 characters or fewer.");
  }
  if (description.length > 5000) {
    throw requestError("Description must be 5000 characters or fewer.");
  }
  if (destinationLink.length > 2048) {
    throw requestError("Destination link must be 2048 characters or fewer.");
  }
  if (destinationLink && !(
    (destinationLink.startsWith("/") && !destinationLink.startsWith("//") &&
      !destinationLink.replace(/\\/g, "/").split("/").includes("..")) ||
    (() => {
      try {
        const url = new URL(destinationLink);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    })()
  )) {
    throw requestError("Destination link must be a site path or a valid HTTP or HTTPS URL.");
  }
  if (!allowedSections.has(targetSection)) {
    throw requestError("Choose either the Hero section or Offers section.");
  }
  if (!desktopImage) {
    throw requestError("A desktop banner image is required.");
  }
  if (!mobileImage) {
    throw requestError("A mobile banner image is required.");
  }

  return {
    title,
    subtitle: subtitle || null,
    description: description || null,
    destination_link: destinationLink || null,
    target_section: targetSection,
    is_published: isPublished,
    desktop_image: desktopImage,
    mobile_image: mobileImage || null,
  };
}

function createBannerController(pool) {
  return {
    async list(request, response, next) {
      try {
        const [banners] = await pool.query(
          `SELECT id, title, subtitle, description, destination_link, target_section,
                  is_published, desktop_image, mobile_image, created_at, updated_at
           FROM banners
           ORDER BY created_at DESC, id DESC`,
        );
        return response.json({ banners });
      } catch (error) {
        return next(error);
      }
    },

    async create(request, response, next) {
      const uploadedFiles = getUploadedFiles(request);
      let saved = false;
      try {
        const banner = parseBanner(request.body || {}, null, request.files || {});
        const [result] = await pool.execute(
          `INSERT INTO banners
            (title, subtitle, description, destination_link, target_section,
             is_published, desktop_image, mobile_image)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            banner.title,
            banner.subtitle,
            banner.description,
            banner.destination_link,
            banner.target_section,
            banner.is_published,
            banner.desktop_image,
            banner.mobile_image,
          ],
        );
        saved = true;
        const [rows] = await pool.execute(
          `SELECT id, title, subtitle, description, destination_link, target_section,
                  is_published, desktop_image, mobile_image, created_at, updated_at
           FROM banners WHERE id = ?`,
          [result.insertId],
        );
        return response.status(201).json({ banner: rows[0] });
      } catch (error) {
        if (!saved) {
          try {
            await removeUploadedFiles(uploadedFiles);
          } catch (cleanupError) {
            console.error("Could not remove rejected banner uploads:", cleanupError);
          }
        }
        return next(error);
      }
    },

    async update(request, response, next) {
      const id = Number(request.params.id);
      const uploadedFiles = getUploadedFiles(request);
      let saved = false;
      try {
        if (!Number.isSafeInteger(id) || id < 1) {
          throw requestError("Invalid banner id.");
        }
        const [existingRows] = await pool.execute(
          "SELECT desktop_image, mobile_image FROM banners WHERE id = ? LIMIT 1",
          [id],
        );
        if (!existingRows.length) {
          throw requestError("Banner not found.", 404);
        }

        const banner = parseBanner(request.body || {}, existingRows[0], request.files || {});
        await pool.execute(
          `UPDATE banners
           SET title = ?, subtitle = ?, description = ?, destination_link = ?,
               target_section = ?, is_published = ?, desktop_image = ?, mobile_image = ?
           WHERE id = ?`,
          [
            banner.title,
            banner.subtitle,
            banner.description,
            banner.destination_link,
            banner.target_section,
            banner.is_published,
            banner.desktop_image,
            banner.mobile_image,
            id,
          ],
        );
        saved = true;
        const [rows] = await pool.execute(
          `SELECT id, title, subtitle, description, destination_link, target_section,
                  is_published, desktop_image, mobile_image, created_at, updated_at
           FROM banners WHERE id = ?`,
          [id],
        );
        const replacedImages = [
          request.files?.desktop_image?.[0] ? existingRows[0].desktop_image : null,
          request.files?.mobile_image?.[0] ? existingRows[0].mobile_image : null,
        ].filter(Boolean);
        try {
          await removeStoredImages(replacedImages);
        } catch (cleanupError) {
          console.error("Could not remove replaced banner images:", cleanupError);
        }
        return response.json({ banner: rows[0] });
      } catch (error) {
        if (!saved) {
          try {
            await removeUploadedFiles(uploadedFiles);
          } catch (cleanupError) {
            console.error("Could not remove rejected banner uploads:", cleanupError);
          }
        }
        return next(error);
      }
    },

    async remove(request, response, next) {
      const id = Number(request.params.id);
      try {
        if (!Number.isSafeInteger(id) || id < 1) {
          throw requestError("Invalid banner id.");
        }
        const [rows] = await pool.execute(
          "SELECT desktop_image, mobile_image FROM banners WHERE id = ? LIMIT 1",
          [id],
        );
        if (!rows.length) {
          throw requestError("Banner not found.", 404);
        }
        await pool.execute("DELETE FROM banners WHERE id = ?", [id]);
        try {
          await removeStoredImages([rows[0].desktop_image, rows[0].mobile_image]);
        } catch (cleanupError) {
          console.error("Could not remove deleted banner images:", cleanupError);
        }
        return response.status(204).end();
      } catch (error) {
        return next(error);
      }
    },
  };
}

module.exports = { createBannerController };
