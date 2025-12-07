"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import axios from "axios";

interface Suggestion {
  id: string;
  title: string;
  description: string;
}

interface Vote {
  suggestion_id: string;
  points: number;
}

export default function VotePage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [votes, setVotes] = useState<Map<string, number>>(new Map());
  const [remainingPoints, setRemainingPoints] = useState(10); // Default, should be fetched from picklejar settings

  // This is a placeholder for the member's ID.
  const memberId = "c7a8c5e2-3b9e-4b8a-9c8a-8e7f6a5d4b3c";

  useEffect(() => {
    if (id) {
      const fetchSuggestions = async () => {
        try {
          const res = await axios.get(
            `${process.env.NEXT_PUBLIC_API_URL}/api/suggestions/${id}/suggestions`,
          );
          setSuggestions(res.data);
        } catch (error) {
          console.error("Failed to fetch suggestions:", error);
        }
      };
      // In a real app, you would fetch the picklejar details to get the points_per_voter
      // For now, we'll just use the default of 10
      fetchSuggestions();
    }
  }, [id]);

  const handleVoteChange = (suggestionId: string, points: number) => {
    const newVotes = new Map(votes);
    newVotes.set(suggestionId, points);

    let totalPoints = 0;
    newVotes.forEach((p) => (totalPoints += p));

    if (totalPoints > 10) {
      // Handle error - too many points
      return;
    }

    setVotes(newVotes);
    setRemainingPoints(10 - totalPoints);
  };

  const handleSubmitVotes = async () => {
    const votesToSubmit: Vote[] = Array.from(votes.entries())
      .filter(([, points]) => points > 0)
      .map(([suggestion_id, points]) => ({ suggestion_id, points }));

    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/api/votes/${id}/vote?member_id=${memberId}`,
        { votes: votesToSubmit },
      );
      router.push(`/pj/${id}/results`);
    } catch (error) {
      console.error("Failed to submit votes:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-4">Vote on Suggestions</h1>
      <div className="mb-4 p-4 bg-blue-100 rounded-lg">
        <h2 className="text-2xl font-bold">
          Remaining Points: {remainingPoints}
        </h2>
      </div>
      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className="p-4 border rounded-lg flex justify-between items-center"
          >
            <div>
              <h3 className="text-xl font-semibold">{suggestion.title}</h3>
              <p>{suggestion.description}</p>
            </div>
            <input
              type="number"
              min="0"
              max={remainingPoints + (votes.get(suggestion.id) || 0)}
              value={votes.get(suggestion.id) || 0}
              onChange={(e) =>
                handleVoteChange(suggestion.id, parseInt(e.target.value, 10))
              }
              className="w-20 p-2 border rounded"
            />
          </div>
        ))}
      </div>
      <button
        onClick={handleSubmitVotes}
        disabled={remainingPoints !== 0}
        className="mt-8 w-full bg-green-500 text-white py-3 px-4 rounded-md hover:bg-green-600 disabled:bg-gray-400"
      >
        Submit Votes
      </button>
    </div>
  );
}
