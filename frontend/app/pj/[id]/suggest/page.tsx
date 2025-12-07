"use client";

import { useForm } from "react-hook-form";
import { useParams, useRouter } from "next/navigation";
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
  const id = params.id as string;

  // This is a placeholder for the member's ID.
  // In a real app, you'd get this from a cookie, local storage, or a context after the user joins.
  const memberId = "c7a8c5e2-3b9e-4b8a-9c8a-8e7f6a5d4b3c";

  const onSubmit = async (data: SuggestionFormData) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggest?member_id=${memberId}`,
        data,
      );
      router.push(`/pj/${id}`);
    } catch (error) {
      console.error("Failed to submit suggestion:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8">Make a Suggestion</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg mx-auto">
        <div className="mb-4">
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Title
          </label>
          <input
            id="title"
            type="text"
            {...register("title", { required: "Title is required" })}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          {errors.title && (
            <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
          )}
        </div>
        <div className="mb-4">
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            {...register("description")}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 h-24"
          />
        </div>
        <div className="mb-4">
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700"
          >
            Location (Optional)
          </label>
          <input
            id="location"
            type="text"
            {...register("location")}
            className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600"
        >
          Submit Suggestion
        </button>
      </form>
    </div>
  );
}
