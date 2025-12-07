"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

type SuggestionFormData = {
  title: string;
  description: string;
  location?: string;
};

export default function SuggestPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SuggestionFormData>();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;

  const [memberId, setMemberId] = useState<string | null>(null);

  useEffect(() => {
    const queryId = searchParams.get("member_id");
    if (queryId) {
      setMemberId(queryId);
      return;
    }
    const storedId = localStorage.getItem(`pj_member_${id}`);
    if (storedId) {
      setMemberId(storedId);
    }
  }, [id, searchParams]);

  const onSubmit = async (data: SuggestionFormData) => {
    if (!memberId) {
      alert("You must join the PickleJar first.");
      router.push(`/jar/${id}`);
      return;
    }

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggest?member_id=${memberId}`,
        data,
      );
      router.push(`/jar/${id}`);
    } catch (error) {
      console.error("Failed to submit suggestion:", error);
      alert("Failed to submit suggestion. Please try again.");
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-900 flex flex-col justify-center">
      <div className="mx-auto max-w-2xl w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-12">
          {/* Question 1 */}
          <div className="space-y-4">
            <label
              htmlFor="title"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              1. What's your idea? <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g. Thai Food, Bowling"
              {...register("title", { required: "Title is required" })}
              className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-2xl md:text-3xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
              autoFocus
            />
            {errors.title && (
              <p className="text-sm text-red-600 bg-red-50 inline-block px-2 py-1 rounded">
                ⚠️ {errors.title.message}
              </p>
            )}
          </div>

          {/* Question 2 */}
          <div className="space-y-4">
            <label
              htmlFor="description"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              2. Any details?{" "}
              <span className="text-lg text-gray-400 font-normal">
                (Optional)
              </span>
            </label>
            <textarea
              id="description"
              placeholder="Links, context, reasoning..."
              {...register("description")}
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

          {/* Question 3 */}
          <div className="space-y-4">
            <label
              htmlFor="location"
              className="block text-2xl md:text-3xl font-light text-gray-900"
            >
              3. Where?{" "}
              <span className="text-lg text-gray-400 font-normal">
                (Optional)
              </span>
            </label>
            <input
              id="location"
              type="text"
              placeholder="e.g. 123 Main St"
              {...register("location")}
              className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-xl md:text-2xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
            />
          </div>

          <div className="pt-8">
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all"
            >
              Submit Suggestion ↵
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
