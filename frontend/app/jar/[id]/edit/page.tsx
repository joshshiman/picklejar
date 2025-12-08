"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";
import { format } from "date-fns";
import Link from "next/link";
import { useToast } from "../../../components/ToastProvider";

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
  const { addToast } = useToast();

  const [picklejar, setPicklejar] = useState<PickleJar | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [lastSaved, setLastSaved] = useState<{
    title: string;
    description: string;
  } | null>(null);

  useEffect(() => {
    const fetchPickleJar = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
        );
        setPicklejar(res.data);
        setTitle(res.data.title);
        setDescription(res.data.description || "");
        setLastSaved({
          title: res.data.title,
          description: res.data.description || "",
        });
      } catch (error) {
        console.error("Failed to fetch PickleJar:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPickleJar();
  }, [id]);

  // Auto-save effect
  useEffect(() => {
    if (!lastSaved) return;

    // Don't save if nothing changed
    if (title === lastSaved.title && description === lastSaved.description) {
      return;
    }

    const timer = setTimeout(async () => {
      setSaving(true);
      try {
        await axios.patch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
          {
            title,
            description: description || null,
          },
        );
        setLastSaved({ title, description });
        // Quietly update local state without full refresh or toast spam
      } catch (error) {
        console.error("Failed to auto-save:", error);
        addToast("Failed to save changes.", "error");
      } finally {
        setSaving(false);
      }
    }, 1000); // 1 second debounce

    return () => clearTimeout(timer);
  }, [title, description, id, lastSaved, addToast]);

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
      addToast("Phase updated successfully", "success");
    } catch (error) {
      console.error(`Failed to ${endpoint}:`, error);
      addToast("Failed to change phase.", "error");
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
      addToast("Deadline updated", "success");
    } catch (error) {
      console.error("Failed to update deadline:", error);
      addToast("Failed to update deadline", "error");
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
          {/* Section 1: Phase Management (Top Priority) */}
          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-8">
              Phase Management
            </h2>

            <div className="relative border-l-2 border-gray-100 ml-3 space-y-12 pb-4">
              {/* Setup Phase */}
              <div className="relative pl-8">
                <div
                  className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 transition-colors ${
                    normalizedStatus === "setup"
                      ? "border-gray-900 bg-white ring-4 ring-gray-50"
                      : ["suggesting", "voting", "completed"].includes(
                            normalizedStatus,
                          )
                        ? "border-gray-900 bg-gray-900"
                        : "border-gray-200 bg-white"
                  }`}
                />
                <h3
                  className={`text-lg font-medium ${
                    normalizedStatus === "setup"
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  1. Setup
                </h3>
                {normalizedStatus === "setup" && (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-6 text-sm">
                      Configure your event details below. When you&apos;re ready
                      for members to join, move to the next phase.
                    </p>
                    <button
                      onClick={() => handleAdvancePhase("start-suggesting")}
                      className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-black transition-all shadow-sm"
                    >
                      Start Suggesting →
                    </button>
                  </div>
                )}
              </div>

              {/* Suggesting Phase */}
              <div className="relative pl-8">
                <div
                  className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 transition-colors ${
                    normalizedStatus === "suggesting"
                      ? "border-gray-900 bg-white ring-4 ring-gray-50"
                      : ["voting", "completed"].includes(normalizedStatus)
                        ? "border-gray-900 bg-gray-900"
                        : "border-gray-200 bg-white"
                  }`}
                />
                <h3
                  className={`text-lg font-medium ${
                    normalizedStatus === "suggesting"
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  2. Suggesting
                </h3>
                {normalizedStatus === "suggesting" && (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-6 text-sm">
                      Members are currently adding their ideas. Move to voting
                      when you have enough options.
                    </p>
                    <div className="flex flex-row items-center justify-between gap-4">
                      <button
                        onClick={() => handleAdvancePhase("revert-to-setup")}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ← Back to Setup
                      </button>
                      <button
                        onClick={() => handleAdvancePhase("start-voting")}
                        className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-black transition-all shadow-sm"
                      >
                        Start Voting →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Voting Phase */}
              <div className="relative pl-8">
                <div
                  className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 transition-colors ${
                    normalizedStatus === "voting"
                      ? "border-gray-900 bg-white ring-4 ring-gray-50"
                      : ["completed"].includes(normalizedStatus)
                        ? "border-gray-900 bg-gray-900"
                        : "border-gray-200 bg-white"
                  }`}
                />
                <h3
                  className={`text-lg font-medium ${
                    normalizedStatus === "voting"
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  3. Voting
                </h3>
                {normalizedStatus === "voting" && (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-6 text-sm">
                      Members are casting their votes. Complete the event to
                      reveal the winner.
                    </p>
                    <div className="flex flex-row items-center justify-between gap-4">
                      <button
                        onClick={() =>
                          handleAdvancePhase("revert-to-suggesting")
                        }
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        ← Back to Suggestions
                      </button>
                      <button
                        onClick={() => handleAdvancePhase("complete")}
                        className="rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white hover:bg-black transition-all shadow-sm"
                      >
                        Complete & Reveal →
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Completed Phase */}
              <div className="relative pl-8">
                <div
                  className={`absolute -left-[9px] top-1 h-4 w-4 rounded-full border-2 transition-colors ${
                    normalizedStatus === "completed"
                      ? "border-gray-900 bg-white ring-4 ring-gray-50"
                      : "border-gray-200 bg-white"
                  }`}
                />
                <h3
                  className={`text-lg font-medium ${
                    normalizedStatus === "completed"
                      ? "text-gray-900"
                      : "text-gray-500"
                  }`}
                >
                  4. Completed
                </h3>
                {normalizedStatus === "completed" && (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-6 text-sm">
                      The winner has been revealed. You can reopen voting if
                      needed.
                    </p>
                    <button
                      onClick={() => handleAdvancePhase("revert-to-voting")}
                      className="text-sm font-medium text-gray-900 underline hover:text-gray-600"
                    >
                      Reopen Voting
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Section 2: Details & Deadlines */}
          <div className="grid gap-12 md:grid-cols-2">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Event Details
                </h2>
                {saving && (
                  <span className="text-xs font-medium text-gray-400 animate-pulse">
                    Saving...
                  </span>
                )}
              </div>
              <div className="space-y-6">
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
                    className="w-full border-b border-gray-200 bg-transparent py-2 text-xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
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
                    className="w-full border-b border-gray-200 bg-transparent py-2 text-base text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors resize-none"
                    rows={3}
                  />
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Deadlines
              </h2>
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Suggestion Deadline
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border-b border-gray-200 bg-transparent py-2 text-base text-gray-900 focus:border-gray-900 focus:outline-none transition-colors"
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
                    Optional. Automatically starts voting when reached.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Voting Deadline
                  </label>
                  <input
                    type="datetime-local"
                    className="w-full border-b border-gray-200 bg-transparent py-2 text-base text-gray-900 focus:border-gray-900 focus:outline-none transition-colors"
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
                    Optional. Automatically completes the event when reached.
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
