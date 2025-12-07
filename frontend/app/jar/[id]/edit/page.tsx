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

        <div className="space-y-12">
          {/* Section 1: Phase Management (Top Priority) */}
          <section className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-10">
              <h2 className="text-lg font-semibold text-gray-900">
                Phase Management
              </h2>
              <p className="text-sm text-gray-500">
                Move your event through these stages.
              </p>
            </div>

            {/* Visual Stepper */}
            <div className="relative flex items-center justify-between mb-12 px-2">
              {/* Connecting Line */}
              <div className="absolute left-0 top-4 h-0.5 w-full -translate-y-1/2 bg-gray-100" />

              {/* Steps */}
              {["setup", "suggesting", "voting", "completed"].map(
                (step, index) => {
                  const isActive = normalizedStatus === step;
                  const phases = ["setup", "suggesting", "voting", "completed"];
                  const currentIndex = phases.indexOf(normalizedStatus);
                  const isPast = currentIndex > index;

                  return (
                    <div
                      key={step}
                      className="relative z-10 flex flex-col items-center gap-3"
                    >
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition-all duration-300 ${
                          isActive
                            ? "border-gray-900 bg-gray-900 text-white scale-110 shadow-md"
                            : isPast
                              ? "border-gray-900 bg-white text-gray-900"
                              : "border-gray-200 bg-white text-gray-300"
                        }`}
                      >
                        {isPast ? (
                          <span className="text-xs font-bold">✓</span>
                        ) : (
                          <span className="text-xs font-bold">{index + 1}</span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-widest ${
                          isActive ? "text-gray-900" : "text-gray-400"
                        }`}
                      >
                        {step}
                      </span>
                    </div>
                  );
                },
              )}
            </div>

            {/* Actions */}
            <div className="flex flex-col items-center justify-center gap-4 border-t border-gray-100 pt-8">
              {normalizedStatus === "setup" && (
                <div className="text-center">
                  <p className="mb-6 text-sm text-gray-600">
                    Your PickleJar is created. When you&apos;re ready for people
                    to add ideas, start the suggesting phase.
                  </p>
                  <button
                    onClick={() => handleAdvancePhase("start-suggesting")}
                    className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-black transition-all hover:-translate-y-0.5 shadow-lg"
                  >
                    Start Suggesting →
                  </button>
                </div>
              )}

              {normalizedStatus === "suggesting" && (
                <div className="flex w-full items-center justify-between">
                  <button
                    onClick={() => handleAdvancePhase("revert-to-setup")}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    ← Back to Setup
                  </button>
                  <div className="text-right">
                    <button
                      onClick={() => handleAdvancePhase("start-voting")}
                      className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-black transition-all hover:-translate-y-0.5 shadow-lg"
                    >
                      Start Voting →
                    </button>
                  </div>
                </div>
              )}

              {normalizedStatus === "voting" && (
                <div className="flex w-full items-center justify-between">
                  <button
                    onClick={() => handleAdvancePhase("revert-to-suggesting")}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                  >
                    ← Back to Suggestions
                  </button>
                  <button
                    onClick={() => handleAdvancePhase("complete")}
                    className="rounded-full bg-gray-900 px-8 py-3 text-sm font-medium text-white hover:bg-black transition-all hover:-translate-y-0.5 shadow-lg"
                  >
                    Complete & Reveal →
                  </button>
                </div>
              )}

              {normalizedStatus === "completed" && (
                <div className="text-center">
                  <p className="mb-4 text-sm text-gray-600">
                    Event is complete. Results are visible to everyone.
                  </p>
                  <button
                    onClick={() => handleAdvancePhase("revert-to-voting")}
                    className="text-sm font-medium text-gray-500 hover:text-gray-900 underline"
                  >
                    Reopen Voting
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* Section 2: Details & Deadlines */}
          <div className="grid gap-12 md:grid-cols-2">
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Event Details
              </h2>
              <form onSubmit={handleSaveDetails} className="space-y-6">
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

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-2 text-sm font-medium text-white shadow-sm hover:bg-black transition-colors disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </form>
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
                    Optional. Displayed to users during suggestion phase.
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
                    Optional. Displayed to users during voting phase.
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
