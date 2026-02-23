"use client";

import { useEffect } from "react";
import { Button } from "../ui/button";

type DeleteModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  isLoading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function DeleteModal({
  isOpen,
  title,
  description,
  isLoading = false,
  onCancel,
  onConfirm,
}: DeleteModalProps) {
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !isLoading) {
        onCancel();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="delete-modal-title"
      onClick={() => {
        if (!isLoading) onCancel();
      }}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          id="delete-modal-title"
          className="text-lg font-bold text-slate-900"
        >
          {title}
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          {description || "This action cannot be undone."}
        </p>

        <div className="mt-6 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            className="bg-red-600 text-white hover:bg-red-700"
            onClick={onConfirm}
            disabled={isLoading}
          >
            {isLoading ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}
