import type { NotificationImage } from "../types/notification-image";
export async function prepareNotificationImage(
  file: File,
): Promise<NotificationImage> {
  const formats: Record<string, RegExp> = {
    "image/png": /\.png$/i,
    "image/jpeg": /\.jpe?g$/i,
    "image/webp": /\.webp$/i,
  };
  if (!formats[file.type]?.test(file.name))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (!file.size || file.size > 5 * 1024 * 1024)
    throw new Error("Each image must be between 1 byte and 5 MB.");
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("This image could not be opened. Choose another image.");
  }
  try {
    if (
      !bitmap.width ||
      !bitmap.height ||
      bitmap.width * bitmap.height > 40_000_000
    )
      throw new Error(
        "This image is too large. Choose an image under 40 megapixels.",
      );
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context)
      throw new Error("Image preparation is unavailable in this browser.");
    let scale = Math.min(1, 1280 / Math.max(bitmap.width, bitmap.height));
    for (let attempt = 0; attempt < 12; attempt++) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/png");
      if (dataUrl.length <= 262166) {
        const stem =
          file.name
            .replace(/\.[^.]+$/, "")
            .split("").map((character) => character === "/" || character.charCodeAt(0) === 92 || character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? "_" : character).join("")
            .slice(0, 110) || "image";
        return { name: stem + ".png", dataUrl };
      }
      scale *= 0.8;
    }
    throw new Error(
      "This image could not be reduced enough. Choose a smaller image.",
    );
  } finally {
    bitmap.close();
  }
}
