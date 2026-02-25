"use client";

import { FormEvent } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type CompleteProfileModalProps = {
  isOpen: boolean;
  firstName: string;
  lastName: string;
  isSaving: boolean;
  error: string | null;
  onFirstNameChange: (value: string) => void;
  onLastNameChange: (value: string) => void;
  onSubmit: (event: FormEvent) => void;
};

export default function CompleteProfileModal({
  isOpen,
  firstName,
  lastName,
  isSaving,
  error,
  onFirstNameChange,
  onLastNameChange,
  onSubmit,
}: CompleteProfileModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="complete-profile-title"
    >
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl">
        <div className="bg-[linear-gradient(120deg,#0f172a_0%,#1d4ed8_60%,#60a5fa_100%)] px-6 py-5 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-100">
            First Time Setup
          </p>
          <h2 id="complete-profile-title" className="mt-1 text-xl font-bold">
            Complete your profile
          </h2>
          <p className="mt-1 text-sm text-blue-100">
            Add your name to continue chatting.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 p-6">
          <Input
            type="text"
            value={firstName}
            onChange={(e) => onFirstNameChange(e.target.value)}
            placeholder="First name"
            maxLength={60}
            required
            className="h-11 rounded-xl border-slate-300 bg-slate-50"
          />
          <Input
            type="text"
            value={lastName}
            onChange={(e) => onLastNameChange(e.target.value)}
            placeholder="Last name"
            maxLength={60}
            required
            className="h-11 rounded-xl border-slate-300 bg-slate-50"
          />

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <Button
            type="submit"
            className="h-11 w-full rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Profile"}
          </Button>
        </form>
      </div>
    </div>
  );
}
