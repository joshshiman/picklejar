"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import Link from "next/link";

type PickleJarStatus =
  | "setup"
  | "suggesting"
  | "voting"
  | "completed"
  | "cancelled";

interface PickleJar {
  id: string;
  title: string;
  description?: string | null;
  status: PickleJarStatus | string;
  suggestion_deadline?: string | null;
  voting_deadline?: string | null;
}

export default function EditPage() {
  const params = useParams();
  const id = params.id as string;

  const [picklejar, setPicklejar] = useState<PickleJar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    const fetchPickleJar = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
        );
        setPicklejar(res.data);
        setTitle(res.data.title);
        setDescription(res.data.description || "");
      } catch (error) {
        console.error("Failed to fetch PickleJar:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPickleJar();
  }, [id]);

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
        {
          title,
          description: description || null,
        },
      );
      // Refresh local state
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
      );
      setPicklejar(res.data);
      alert("Saved successfully!");
    } catch (error) {
      console.error("Failed to update PickleJar:", error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleAdvancePhase = async (
    endpoint:
      | "start-suggesting"
      | "start-voting"
      | "complete"
      | "revert-to-setup"
      | "revert-to-suggesting"
      | "revert-to-voting",
  ) => {
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}/${endpoint}`,
      );
      // Refetch jar to update status
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
      );
      setPicklejar(res.data);
    } catch (error) {
      console.error(`Failed to ${endpoint}:`, error);
      alert(`Failed to change phase.`);
    }
  };

  const handleUpdateDeadline = async (
    type: "suggestion" | "voting",
    dateValue: string,
  ) => {
    try {
      const payload =
        type === "suggestion"
          ? {
              suggestion_deadline: dateValue
                ? new Date(dateValue).toISOString()
                : null,
            }
          : {
              voting_deadline: dateValue
                ? new Date(dateValue).toISOString()
                : null,
            };

      await axios.patch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
        payload,
      );
      // Refetch
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
      );
      setPicklejar(res.data);
    } catch (error) {
      console.error("Failed to update deadline:", error);
    }
  };

  if (loading || !picklejar) {
    return (
      <div className="min-h-screen bg-white px-6 py-12 text-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  const normalizedStatus = picklejar.status.toLowerCase();

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href={`/jar/${id}`}
            className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
          >
            ← Back to PickleJar
          </Link>
        </div>

        <header className="mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 mb-2">
            Edit PickleJar
          </h1>
          <p className="text-gray-600">
            Update details and manage the phase of your event.
          </p>
        </header>

        <div className="space-y-16">
          {/* Section 1: Details */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">
              Details
            </h2>
            <form onSubmit={handleSaveDetails} className="space-y-8">
              <div className="space-y-2">
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700"
                >
                  Title
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-2xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-medium text-gray-700"
                >
                  Description
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-lg text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors resize-none"
                  rows={2}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-black transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </form>
          </section>

          {/* Section 2: Phase Management */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">
              Phase Management
            </h2>

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                  Current Status
                </span>
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1 text-sm font-medium text-gray-900 shadow-sm border border-gray-200">
                  {normalizedStatus.charAt(0).toUpperCase() +
                    normalizedStatus.slice(1)}
                </span>
              </div>

              <div className="flex flex-wrap gap-3">
                {normalizedStatus === "setup" && (
                  <button
                    onClick={() => handleAdvancePhase("start-suggesting")}
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors"
                  >
                    Start Suggesting
                  </button>
                )}
                {normalizedStatus === "suggesting" && (
                  <>
                    <button
                      onClick={() => handleAdvancePhase("revert-to-setup")}
                      className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Back to Setup
                    </button>
                    <button
                      onClick={() => handleAdvancePhase("start-voting")}
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors"
                    >
                      Start Voting
                    </button>
                  </>
                )}
                {normalizedStatus === "voting" && (
                  <>
                    <button
                      onClick={() => handleAdvancePhase("revert-to-suggesting")}
                      className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Back to Suggestions
                    </button>
                    <button
                      onClick={() => handleAdvancePhase("complete")}
                      className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black transition-colors"
                    >
                      Complete & Reveal
                    </button>
                  </>
                )}
                {normalizedStatus === "completed" && (
                  <>
                    <button
                      onClick={() => handleAdvancePhase("revert-to-voting")}
                      className="rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Reopen Voting
                    </button>
                  </>
                )}
              </div>
            </div>
          </section>

          {/* Section 3: Deadlines */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-6 border-b border-gray-100 pb-2">
              Deadlines
            </h2>
            <div className="grid gap-8 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Suggestion Deadline
                </label>
                <input
                  type="datetime-local"
                  className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-base text-gray-900 focus:border-gray-900 focus:outline-none transition-colors"
                  value={
                    picklejar?.suggestion_deadline
                      ? format(
                          new Date(picklejar.suggestion_deadline),
                          "yyyy-MM-dd'T'HH:mm",
                        )
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdateDeadline("suggestion", e.target.value)
                  }
                />
                <p className="text-xs text-gray-500">
                  Optional. Displayed to users during suggestion phase.
                </p>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Voting Deadline
                </label>
                <input
                  type="datetime-local"
                  className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-base text-gray-900 focus:border-gray-900 focus:outline-none transition-colors"
                  value={
                    picklejar?.voting_deadline
                      ? format(
                          new Date(picklejar.voting_deadline),
                          "yyyy-MM-dd'T'HH:mm",
                        )
                      : ""
                  }
                  onChange={(e) =>
                    handleUpdateDeadline("voting", e.target.value)
                  }
                />
                <p className="text-xs text-gray-500">
                  Optional. Displayed to users during voting phase.
                </p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
