"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type FormData = {
  title: string;
  description: string;
};

export default function CreatePickleJarPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Please give your PickleJar a name.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/`,
        {
          title: form.title.trim(),
          description: form.description.trim() || null,
          // creator_phone intentionally omitted for minimal flow;
          // backend should treat it as optional or handle defaults.
        },
      );

      const picklejar = response.data;
      if (!picklejar?.id) {
        throw new Error("PickleJar was created but no ID was returned.");
      }

      router.push(`/jar/${picklejar.id}`);
    } catch (err: any) {
      console.error("Failed to create PickleJar:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong creating your PickleJar.";
      setError(typeof msg === "string" ? msg : "Unable to create PickleJar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-50 flex flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-8 text-center">
          <p className="text-xs uppercase tracking-[0.25em] text-slate-400 mb-2">
            PickleJar
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-50 mb-3">
            Create a new <span className="text-emerald-400">PickleJar</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400 max-w-md mx-auto">
            Just give your hangout a name. Description is optional. You&apos;ll
            get a single link to share with your group.
          </p>
        </header>

        <section className="bg-slate-900/60 border border-slate-800 rounded-3xl shadow-xl shadow-black/40 p-6 sm:p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="block text-xs font-medium text-slate-200"
              >
                Meeting name
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g. Friday Night Dinner, Game Night, Ski Trip"
                value={form.title}
                onChange={handleChange("title")}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="description"
                className="block text-xs font-medium text-slate-200"
              >
                Description (optional)
              </label>
              <textarea
                id="description"
                placeholder="Add any context, constraints, or ideas to guide suggestions."
                rows={3}
                value={form.description}
                onChange={handleChange("description")}
                className="w-full rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-slate-50 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/70 focus:border-transparent resize-none"
              />
              <p className="text-[11px] text-slate-500">
                You can leave this blank if the name is self-explanatory.
              </p>
            </div>

            {error && (
              <div className="rounded-2xl border border-red-500/60 bg-red-950/40 px-4 py-3 text-xs text-red-100">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full inline-flex items-center justify-center rounded-full bg-emerald-400 px-6 py-2.5 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30 hover:bg-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? "Creating your PickleJar…" : "Create PickleJar"}
            </button>
          </form>

          <p className="text-[11px] text-slate-500 text-center">
            After you create this PickleJar, you&apos;ll land on the main page
            with a single shareable link. No login required for guests.
          </p>
        </section>
      </div>
    </main>
  );
}
