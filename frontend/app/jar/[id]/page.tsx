"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import axios from "axios";
import Link from "next/link";
import { format } from "date-fns";
import { Share2, Edit2, Circle, Check, Copy } from "lucide-react";

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
  points_per_voter?: number;
}

interface Member {
  id: string;
  display_name: string | null;
  has_suggested: boolean;
  has_voted: boolean;
}

interface Suggestion {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
}

interface Result {
  suggestion_id: string;
  title: string;
  description: string | null;
  total_points: number;
  is_winner: boolean;
}

function classNames(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export default function PickleJarPage() {
  const params = useParams();
  const id = params.id as string;

  const [picklejar, setPicklejar] = useState<PickleJar | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [phone, setPhone] = useState("");
  const [memberId, setMemberId] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);

  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const [results, setResults] = useState<Result[]>([]);
  const [loadingResults, setLoadingResults] = useState(false);

  const [isSharing, setIsSharing] = useState(false);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined") return "";
    return `${window.location.origin}/jar/${id}`;
  }, [id]);

  const normalizedStatus: PickleJarStatus | "unknown" = useMemo(() => {
    if (!picklejar?.status) return "unknown";
    const s = picklejar.status.toLowerCase();
    if (s === "setup") return "setup";
    if (s === "suggesting") return "suggesting";
    if (s === "voting") return "voting";
    if (s === "completed") return "completed";
    if (s === "cancelled") return "cancelled";
    return "unknown";
  }, [picklejar?.status]);

  // Fetch core jar + members
  useEffect(() => {
    if (!id) return;

    const fetchPicklejar = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
        );
        setPicklejar(res.data);
      } catch (error) {
        console.error("Failed to fetch PickleJar:", error);
      }
    };

    const fetchMembers = async () => {
      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/members`,
        );
        setMembers(res.data);
      } catch (error) {
        console.error("Failed to fetch members:", error);
      }
    };

    fetchPicklejar();
    fetchMembers();

    const storedMemberId = localStorage.getItem(`pj_member_${id}`);
    if (storedMemberId) {
      setMemberId(storedMemberId);
      setIsMember(true);
    }
  }, [id]);

  // Fetch suggestions when in suggesting/voting/completed
  useEffect(() => {
    if (!id) return;
    if (
      normalizedStatus !== "suggesting" &&
      normalizedStatus !== "voting" &&
      normalizedStatus !== "completed"
    ) {
      return;
    }

    const fetchSuggestions = async () => {
      try {
        setLoadingSuggestions(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggestions`,
        );
        setSuggestions(res.data);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
      } finally {
        setLoadingSuggestions(false);
      }
    };

    fetchSuggestions();
  }, [id, normalizedStatus]);

  // Fetch results when completed
  useEffect(() => {
    if (!id) return;
    if (normalizedStatus !== "completed") return;

    const fetchResults = async () => {
      try {
        setLoadingResults(true);
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}/results`,
        );
        const sorted = [...res.data].sort(
          (a: Result, b: Result) => b.total_points - a.total_points,
        );
        setResults(sorted);
      } catch (error) {
        console.error("Failed to fetch results:", error);
      } finally {
        setLoadingResults(false);
      }
    };

    fetchResults();
  }, [id, normalizedStatus]);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return;

    setIsJoining(true);
    setJoinError(null);

    try {
      const joinRes = await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/join`,
        { phone_number: phone.trim() },
      );
      const newMemberId = joinRes.data.id;
      setMemberId(newMemberId);
      localStorage.setItem(`pj_member_${id}`, newMemberId);
      setIsMember(true);

      // Refetch members so counts update
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/members/${id}/members`,
      );
      setMembers(res.data);
      setPhone("");
    } catch (error: any) {
      console.error("Failed to join:", error);
      const msg =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to join this PickleJar.";
      setJoinError(typeof msg === "string" ? msg : "Unable to join.");
    } finally {
      setIsJoining(false);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    setIsSharing(true);
    setCopyState("idle");

    try {
      // Try native share first
      const canShare =
        typeof navigator !== "undefined" &&
        "share" in navigator &&
        typeof (navigator as any).share === "function";

      if (canShare) {
        await (navigator as any).share({
          title: picklejar?.title || "PickleJar",
          text: "Join this PickleJar to suggest and vote on what to do.",
          url: shareUrl,
        });
        setIsSharing(false);
        return;
      }

      // Fallback to clipboard
      if (
        typeof navigator !== "undefined" &&
        navigator.clipboard &&
        navigator.clipboard.writeText
      ) {
        await navigator.clipboard.writeText(shareUrl);
        setCopyState("copied");
        setTimeout(() => setCopyState("idle"), 2500);
      }
    } catch (error) {
      console.error("Error sharing picklejar:", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 2500);
    } catch (error) {
      console.error("Error copying link:", error);
    }
  };

  const isLoading = !picklejar;

  const memberCount = members.length;
  const suggestionCount = suggestions.length;
  const estimatedPointsPerVoter =
    picklejar?.points_per_voter ??
    (suggestionCount > 1 ? Math.max(suggestionCount - 1, 1) : 1);

  const renderStatusBadge = () => {
    if (normalizedStatus === "unknown") return null;

    const isStarted =
      normalizedStatus !== "setup" && normalizedStatus !== "cancelled";

    const labelMap: Record<PickleJarStatus, string> = {
      setup: "Not started",
      suggesting: "Collecting suggestions",
      voting: "Voting in progress",
      completed: "Completed",
      cancelled: "Cancelled",
    };

    return (
      <div className="flex items-center gap-2">
        <Circle
          className={classNames(
            "h-3 w-3 fill-current",
            isStarted ? "text-green-500" : "text-gray-300",
          )}
        />
        <span className="text-sm text-gray-600 font-medium">
          {labelMap[normalizedStatus]}
        </span>
      </div>
    );
  };

  const renderPhaseContent = () => {
    if (!picklejar) {
      return <div className="mt-8 text-gray-500">Loading...</div>;
    }

    if (normalizedStatus === "setup" || normalizedStatus === "unknown") {
      return (
        <div className="mt-8 text-gray-600 text-lg font-light">
          <p>Waiting for the host to start the suggestion phase.</p>
        </div>
      );
    }

    if (normalizedStatus === "suggesting") {
      return (
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-light text-gray-900">Suggestions</h2>
              {picklejar.suggestion_deadline && (
                <p className="text-sm font-medium text-red-600">
                  Ends {format(new Date(picklejar.suggestion_deadline), "PPp")}
                </p>
              )}
            </div>

            <div className="mb-8">
              <Link
                href={
                  memberId
                    ? `/jar/${id}/suggest?member_id=${memberId}`
                    : `/jar/${id}/suggest`
                }
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all"
              >
                + Add a suggestion
              </Link>
            </div>

            <div className="space-y-6">
              {loadingSuggestions && (
                <p className="text-gray-500">Loading suggestions…</p>
              )}
              {!loadingSuggestions && suggestions.length === 0 && (
                <p className="text-gray-500 italic">
                  No suggestions yet. Be the first to add one.
                </p>
              )}
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="border-b border-gray-100 pb-4 last:border-0"
                >
                  <h3 className="text-xl font-medium text-gray-900">
                    {s.title}
                  </h3>
                  {s.description && (
                    <p className="mt-1 text-gray-600">{s.description}</p>
                  )}
                  {s.location && (
                    <p className="mt-2 text-sm text-gray-400">
                      📍 {s.location}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="border-l border-gray-100 pl-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Who&apos;s in ({memberCount})
            </h3>
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm text-gray-700"
                >
                  <span>
                    {m.id === memberId ? "Me" : m.display_name || "Anonymous"}
                  </span>
                  <div className="flex items-center gap-2">
                    {m.has_suggested && (
                      <span
                        className="h-2 w-2 rounded-full bg-blue-500"
                        title="Suggested"
                      ></span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (normalizedStatus === "voting") {
      return (
        <div className="mt-8 grid gap-12 md:grid-cols-3">
          <div className="md:col-span-2">
            <div className="flex items-baseline justify-between mb-6">
              <h2 className="text-2xl font-light text-gray-900">Voting</h2>
              {picklejar.voting_deadline && (
                <p className="text-sm font-medium text-red-600">
                  Ends {format(new Date(picklejar.voting_deadline), "PPp")}
                </p>
              )}
            </div>
            <p className="mb-8 text-gray-600">
              You have{" "}
              <span className="font-semibold text-gray-900">
                {estimatedPointsPerVoter > 0
                  ? estimatedPointsPerVoter
                  : "a few"}{" "}
                points
              </span>{" "}
              to spend.
            </p>

            <div className="mb-8 flex flex-wrap items-center gap-4">
              <Link
                href={
                  memberId
                    ? `/jar/${id}/vote?member_id=${memberId}`
                    : `/jar/${id}/vote`
                }
                className="inline-flex items-center justify-center rounded-md bg-gray-900 px-6 py-3 text-base font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all"
              >
                Go to voting ↵
              </Link>
              <Link
                href={`/jar/${id}/results`}
                className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-6 py-3 text-base font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              >
                View live results
              </Link>
            </div>

            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
                On the ballot
              </h3>
              <div className="space-y-4">
                {loadingSuggestions && (
                  <p className="text-gray-500">Loading suggestions…</p>
                )}
                {!loadingSuggestions && suggestions.length === 0 && (
                  <p className="text-gray-500 italic">
                    No suggestions to vote on yet.
                  </p>
                )}
                {suggestions.map((s) => (
                  <div
                    key={s.id}
                    className="border-b border-gray-100 pb-3 last:border-0"
                  >
                    <h4 className="text-lg font-medium text-gray-900">
                      {s.title}
                    </h4>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-l border-gray-100 pl-6">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-4">
              Votes Cast
            </h3>
            <ul className="space-y-3">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between text-sm text-gray-700"
                >
                  <span>{m.display_name || "Anonymous"}</span>
                  {m.has_voted ? (
                    <span className="text-emerald-600 font-medium">
                      ✓ Voted
                    </span>
                  ) : (
                    <span className="text-gray-400">Waiting...</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      );
    }

    if (normalizedStatus === "completed") {
      const winner = results.find((r) => r.is_winner) || results[0];

      return (
        <div className="mt-8 space-y-12">
          <div className="bg-emerald-50/50 border-l-4 border-emerald-500 p-8">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-emerald-600 mb-2">
              Winner
            </h2>
            {loadingResults && (
              <p className="text-emerald-800">Loading results…</p>
            )}
            {!loadingResults && winner && (
              <>
                <p className="text-4xl font-bold text-gray-900 mb-2">
                  {winner.title}
                </p>
                {winner.description && (
                  <p className="text-xl text-gray-600 mb-4">
                    {winner.description}
                  </p>
                )}
                <p className="text-lg font-medium text-emerald-700">
                  {winner.total_points} points
                </p>
              </>
            )}
            {!loadingResults && !winner && (
              <p className="text-gray-900">No votes recorded yet.</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-6">
              <h3 className="text-2xl font-light text-gray-900">
                Full breakdown
              </h3>
              <Link
                href={`/jar/${id}/results`}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 underline"
              >
                Detailed view
              </Link>
            </div>

            <div className="space-y-2">
              {loadingResults && (
                <p className="text-gray-500">Loading results…</p>
              )}
              {!loadingResults && results.length === 0 && (
                <p className="text-gray-500">No results available.</p>
              )}
              {!loadingResults &&
                results.map((r, index) => (
                  <div
                    key={r.suggestion_id}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-bold text-gray-300 w-8">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="text-lg font-medium text-gray-900">
                          {r.title}
                        </p>
                        {r.description && (
                          <p className="text-sm text-gray-500">
                            {r.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-lg font-bold text-gray-900">
                      {r.total_points}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        </div>
      );
    }

    // Cancelled or fallback
    return (
      <div className="mt-8 text-gray-500">
        <p>This PickleJar is no longer active.</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-3xl">
        {isLoading ? (
          <div className="p-6">
            <p className="text-lg text-gray-500">Loading PickleJar…</p>
          </div>
        ) : (
          <>
            {/* Header: title, description, status, share/edit */}
            <header className="mb-12">
              <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      {renderStatusBadge()}
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                      {picklejar?.title || "Untitled PickleJar"}
                    </h1>
                  </div>
                  {picklejar?.description && (
                    <p className="max-w-2xl text-xl text-gray-600 font-light">
                      {picklejar.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <button
                    type="button"
                    onClick={handleShare}
                    disabled={isSharing}
                    className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors disabled:cursor-wait"
                  >
                    <Share2 className="mr-2 h-4 w-4" />
                    Share
                  </button>
                  <Link
                    href={`/jar/${id}/edit`}
                    className="inline-flex items-center justify-center rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-200 transition-colors"
                  >
                    <Edit2 className="mr-2 h-4 w-4" />
                    Edit
                  </Link>
                </div>
              </div>
            </header>

            {/* Join section (minimal, inline) */}
            {!isMember ? (
              <section className="mt-12 max-w-lg">
                <h2 className="text-2xl font-light text-gray-900 mb-6">
                  Join to participate
                </h2>
                <form onSubmit={handleJoin} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-2">
                      Your Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="555-0123"
                      className="w-full border-b-2 border-gray-200 bg-transparent py-2 text-2xl text-gray-900 placeholder-gray-300 focus:border-gray-900 focus:outline-none transition-colors"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isJoining || !phone.trim()}
                    className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-3 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
                  >
                    {isJoining ? "Joining…" : "Join PickleJar ↵"}
                  </button>
                </form>
                {joinError && (
                  <p className="mt-4 text-sm text-red-600 bg-red-50 inline-block px-3 py-1 rounded">
                    ⚠️ {joinError}
                  </p>
                )}
              </section>
            ) : (
              <>
                {/* Phase-aware section */}
                {renderPhaseContent()}
              </>
            )}

            {/* Share Link Footer */}
            <div className="mt-16 border-t border-gray-100 pt-8 text-center">
              <p className="mb-4 text-sm text-gray-500">
                Share this link with your group
              </p>
              <div className="mx-auto flex items-center justify-center gap-2 rounded-md bg-gray-50 p-1 pr-2 w-fit border border-gray-200">
                <div className="px-3 py-1 text-sm text-gray-600 font-mono max-w-[200px] sm:max-w-md truncate">
                  {shareUrl.replace(/^https?:\/\//, "")}
                </div>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center justify-center rounded bg-white px-2 py-1 text-xs font-medium text-gray-900 shadow-sm hover:bg-gray-50 transition-colors border border-gray-200"
                  title="Copy link"
                >
                  {copyState === "copied" ? (
                    <Check className="h-3 w-3" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
