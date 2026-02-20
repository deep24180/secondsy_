"use client";

import { useEffect } from "react";
import Image from "next/image";

type ImagePreviewModalProps = {
  isOpen: boolean;
  imageUrl: string | null;
  onClose: () => void;
};

export default function ImagePreviewModal({
  isOpen,
  imageUrl,
  onClose,
}: ImagePreviewModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image preview"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] max-w-[90vw]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/60 px-3 py-1 text-sm text-white hover:bg-black/80"
          aria-label="Close image preview"
        >
          Close
        </button>
        <Image
          src={imageUrl}
          alt="Message image preview"
          width={1600}
          height={1600}
          className="max-h-[90vh] w-auto rounded-lg object-contain"
          priority
        />
      </div>
    </div>
  );
}
