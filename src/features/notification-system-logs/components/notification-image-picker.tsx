"use client";
import Image from "next/image";
import { ImagePlus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { prepareNotificationImage } from "../api/prepare-notification-image";
import type { NotificationImage } from "../types/notification-image";
export function NotificationImagePicker({
  images,
  onChange,
  disabled,
  onBusyChange,
}: {
  images: NotificationImage[];
  onChange: (images: NotificationImage[]) => void;
  disabled: boolean;
  onBusyChange: (busy: boolean) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  async function select(files: File[]): Promise<void> {
    setError(undefined);
    if (images.length + files.length > 3) {
      setError("You can attach up to 3 images.");
      return;
    }
    setBusy(true);
    onBusyChange(true);
    try {
      const prepared = await Promise.all(files.map(prepareNotificationImage));
      onChange([...images, ...prepared]);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Unable to prepare these images.",
      );
    } finally {
      setBusy(false);
      onBusyChange(false);
    }
  }
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={disabled || busy || images.length >= 3}
          onClick={() => input.current?.click()}
        >
          <ImagePlus className="size-4" aria-hidden="true" />
          {busy ? "Preparing images?" : "Add images"}
        </Button>
        <span className="text-muted text-xs">
          PNG, JPEG or WebP ? up to 3 images ? 5 MB each. Images are optimized
          for sending.
        </span>
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          multiple
          className="sr-only"
          tabIndex={-1}
          aria-label="Attach message images"
          disabled={disabled || busy}
          onChange={(event) => {
            const files = Array.from(event.target.files ?? []);
            event.target.value = "";
            if (files.length) void select(files);
          }}
        />
      </div>
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {images.length ? (
        <ul aria-label="Attached images" className="grid gap-3 sm:grid-cols-3">
          {images.map((image, index) => (
            <li
              key={index}
              className="border-border bg-neutral-soft relative overflow-hidden rounded-lg border p-2"
            >
              <Image
                src={image.dataUrl}
                alt={image.name}
                width={320}
                height={180}
                unoptimized
                className="h-28 w-full object-contain"
              />
              <p className="text-muted mt-2 truncate pr-6 text-xs">
                {image.name}
              </p>
              <button
                type="button"
                aria-label={"Remove image " + image.name}
                disabled={disabled || busy}
                onClick={() =>
                  onChange(images.filter((_, position) => position !== index))
                }
                className="bg-surface text-foreground focus-visible:outline-brand absolute top-1 right-1 grid size-9 place-items-center rounded-md border disabled:opacity-50"
              >
                <X className="size-4" aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
