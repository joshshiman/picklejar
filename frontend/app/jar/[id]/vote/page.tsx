"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { useToast } from "../../../components/ToastProvider";

interface Suggestion {
  id: string;
  title: string;
  description: string;
}

interface Vote {
  suggestion_id: string;
  points: number;
}

interface PickleJar {
  id: string;
  title: string;
  description?: string | null;
  points_per_voter: number;
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = params.id as string;
  const { addToast } = useToast();

  const [picklejar, setPicklejar] = useState<PickleJar | null>(null);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [votes, setVotes] = useState<Map<string, number>>(new Map());
  const [remainingPoints, setRemainingPoints] = useState<number | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);

  const totalPointsAllowed = picklejar?.points_per_voter ?? null;

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

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const [jarRes, suggestionsRes] = await Promise.all([
          axios.get<PickleJar>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}`,
          ),
          axios.get<Suggestion[]>(
            `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggestions`,
          ),
        ]);

        const jar = jarRes.data;
        setPicklejar(jar);
        setSuggestions(suggestionsRes.data);

        if (jar.points_per_voter != null) {
          setRemainingPoints(jar.points_per_voter);
        }
      } catch (error) {
        console.error("Failed to load voting data:", error);
      }
    };

    fetchData();
  }, [id]);

  const handleVoteChange = (suggestionId: string, points: number) => {
    if (totalPointsAllowed == null) return;

    const safePoints = Number.isNaN(points) || points < 0 ? 0 : points;

    const newVotes = new Map(votes);
    newVotes.set(suggestionId, safePoints);

    let totalPoints = 0;
    newVotes.forEach((p) => {
      totalPoints += p;
    });

    if (totalPoints > totalPointsAllowed) {
      // Ignore changes that would exceed the allowed budget
      return;
    }

    setVotes(newVotes);
    setRemainingPoints(totalPointsAllowed - totalPoints);
  };

  const handleSubmitVotes = async () => {
    if (remainingPoints == null || totalPointsAllowed == null) {
      return;
    }

    if (!memberId) {
      addToast("You must join the PickleJar first.", "error");
      router.push(`/jar/${id}`);
      return;
    }

    const votesToSubmit: Vote[] = Array.from(votes.entries())
      .filter(([, points]) => points > 0)
      .map(([suggestion_id, points]) => ({ suggestion_id, points }));

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/votes/${id}/vote?member_id=${memberId}`,
        { votes: votesToSubmit },
      );
      router.push(`/jar/${id}`);
    } catch (error) {
      console.error("Failed to submit votes:", error);
      addToast("Failed to submit votes. Please try again.", "error");
    }
  };

  const effectiveRemaining = remainingPoints ?? 0;

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <header className="mb-12 space-y-4">
          <button
            type="button"
            onClick={() => router.push(`/jar/${id}`)}
            className="group inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900"
          >
            <span className="text-lg font-normal text-gray-400 transition-colors group-hover:text-gray-900">
              ←
            </span>
            Back to jar
          </button>
          <div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900 mb-4">
              Vote
            </h1>
            <p className="text-xl text-gray-600 font-light">
              Distribute your points across the pickles you like best.
            </p>
          </div>
        </header>

        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm py-6 border-b border-gray-100 mb-8">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-3">
              <span className="text-5xl font-bold text-gray-900">
                {totalPointsAllowed == null ? "…" : effectiveRemaining}
              </span>
              <span className="text-sm font-medium uppercase tracking-wider text-gray-500">
                Points Left
              </span>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-400">
                Budget: {totalPointsAllowed ?? "…"}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8 pb-24">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="flex items-start justify-between gap-6 py-2"
            >
              <div className="flex-1 pt-2">
                <h3 className="text-2xl font-light text-gray-900">
                  {suggestion.title}
                </h3>
                {suggestion.description && (
                  <p className="mt-2 text-gray-500">{suggestion.description}</p>
                )}
              </div>
              <div className="flex flex-col items-end">
                <input
                  type="number"
                  min={0}
                  max={
                    totalPointsAllowed != null
                      ? (remainingPoints ?? 0) + (votes.get(suggestion.id) || 0)
                      : undefined
                  }
                  value={votes.get(suggestion.id) ?? 0}
                  onChange={(e) =>
                    handleVoteChange(
                      suggestion.id,
                      parseInt(e.target.value, 10),
                    )
                  }
                  className="w-24 border-b-2 border-gray-200 bg-transparent py-2 text-right text-3xl font-light text-gray-900 focus:border-gray-900 focus:outline-none transition-colors"
                />
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-6">
          <div className="mx-auto max-w-3xl">
            <button
              onClick={handleSubmitVotes}
              disabled={totalPointsAllowed == null || effectiveRemaining !== 0}
              className="w-full rounded-md bg-gray-900 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all disabled:bg-gray-300 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
            >
              {effectiveRemaining === 0
                ? "Submit Votes ↵"
                : `Spend ${effectiveRemaining} more points`}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
