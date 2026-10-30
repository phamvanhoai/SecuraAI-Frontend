import Image from "next/image";
import type { NotificationImageReference } from "../types/notification-image";
export function NotificationImages({
  notificationId,
  images,
}: {
  notificationId: string;
  images: NotificationImageReference[];
}) {
  if (!images.length) return null;
  return (
    <div className="mt-3 grid max-w-3xl gap-3 sm:grid-cols-2">
      {images.map((image) => {
        const source =
          "/api/notifications/" +
          encodeURIComponent(notificationId) +
          "/images/" +
          image.index;
        return (
          <a
            key={image.index}
            href={source}
            target="_blank"
            rel="noreferrer"
            className="border-border focus-visible:outline-brand block overflow-hidden rounded-lg border"
            aria-label={"Open image " + image.name}
          >
            <Image
              src={source}
              alt={image.name}
              width={640}
              height={400}
              unoptimized
              className="max-h-64 w-full object-contain"
            />
          </a>
        );
      })}
    </div>
  );
}
