"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

type FormData = {
  title: string;
  description: string;
};

export default function HomePage() {
  const router = useRouter();

  const [form, setForm] = useState<FormData>({
    title: "",
    description: "",
  });

  const [touched, setTouched] = useState<{ title: boolean }>({
    title: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const titleError =
    touched.title && !form.title.trim()
      ? "Give this hangout a name so people know what they're joining."
      : null;

  const handleChange =
    (field: keyof FormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = e.target.value;
      setForm((prev) => ({ ...prev, [field]: value }));
    };

  const handleBlur = (field: keyof typeof touched) => () => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched((prev) => ({ ...prev, title: true }));
    setErrorMessage(null);

    if (!form.title.trim()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const payload: any = {
        title: form.title.trim(),
      };

      if (form.description.trim()) {
        payload.description = form.description.trim();
      }

      // Backend currently expects this shape; creator-related/auth is TODO.
      const res = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/`,
        payload,
      );

      const picklejar = res.data;
      if (!picklejar?.id) {
        throw new Error("Missing PickleJar ID in response.");
      }

      router.push(`/jar/${picklejar.id}`);
    } catch (err: any) {
      console.error("Failed to create PickleJar:", err);
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Something went wrong creating your PickleJar.";
      setErrorMessage(typeof msg === "string" ? msg : "Unable to create jar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-12">
          {/* Question 1 */}
          <div className="space-y-4">
            <label
              htmlFor="title"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              1. What are we planning? <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="Type your answer here..."
              value={form.title}
              onChange={handleChange("title")}
              onBlur={handleBlur("title")}
              className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-2xl md:text-3xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
              autoFocus
            />
            {titleError && (
              <p className="text-sm text-red-600 bg-red-50 inline-block px-2 py-1 rounded">
                ⚠️ {titleError}
              </p>
            )}
          </div>

          {/* Question 2 */}
          <div className="space-y-4">
            <label
              htmlFor="description"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              2. Any extra details?{" "}
              <span className="text-lg text-gray-400 font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              id="description"
              placeholder="Type your answer here..."
              value={form.description}
              onChange={handleChange("description")}
              className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-xl md:text-2xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors resize-none"
              rows={1}
              style={{ minHeight: "3rem" }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>

          {errorMessage && (
            <div className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          )}

          <div className="pt-8">
            <button
              type="submit"
              disabled={isSubmitting || !!titleError}
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {isSubmitting ? "Creating..." : "Start PickleJar ↵"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
