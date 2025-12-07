"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import axios from "axios";

type FormData = {
  title: string;
  description: string;
  points_per_voter: number;
  creator_phone: string;
};

export default function CreatePickleJarPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>();
  const router = useRouter();

  const onSubmit = async (data: FormData) => {
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/`,
        data,
      );
      const picklejar = response.data;
      router.push(`/pj/${picklejar.id}`);
    } catch (error) {
      console.error("Failed to create PickleJar:", error);
      // Handle error state here
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="w-full max-w-md">
        <h1 className="text-4xl font-bold text-center text-green-600 mb-8">
          Create a New PickleJar
        </h1>
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="bg-white dark:bg-gray-800 shadow-md rounded-lg px-8 pt-6 pb-8 mb-4"
        >
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="title"
            >
              Title
            </label>
            <input
              id="title"
              type="text"
              placeholder="e.g., Friday Night Dinner"
              {...register("title", { required: "Title is required" })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700"
            />
            {errors.title && (
              <p className="text-red-500 text-xs italic">
                {errors.title.message}
              </p>
            )}
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="description"
            >
              Description
            </label>
            <textarea
              id="description"
              placeholder="Let's decide where to eat!"
              {...register("description")}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700 h-24"
            />
          </div>
          <div className="mb-4">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="creator_phone"
            >
              Your Phone Number
            </label>
            <input
              id="creator_phone"
              type="tel"
              placeholder="+1234567890"
              {...register("creator_phone", {
                required: "Phone number is required",
              })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700"
            />
            {errors.creator_phone && (
              <p className="text-red-500 text-xs italic">
                {errors.creator_phone.message}
              </p>
            )}
          </div>
          <div className="mb-6">
            <label
              className="block text-gray-700 dark:text-gray-300 text-sm font-bold mb-2"
              htmlFor="points_per_voter"
            >
              Points per Voter
            </label>
            <input
              id="points_per_voter"
              type="number"
              defaultValue={10}
              {...register("points_per_voter", {
                required: true,
                valueAsNumber: true,
                min: 1,
              })}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 dark:text-gray-200 leading-tight focus:outline-none focus:shadow-outline dark:bg-gray-700"
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full"
            >
              Create PickleJar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
