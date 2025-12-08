'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import axios from 'axios';

interface Result {
  suggestion_id: string;
  title: string;
  description: string;
  total_points: number;
  is_winner: boolean;
}

export default function ResultsPage() {
  const params = useParams();
  const id = params.id as string;
  const [results, setResults] = useState<Result[]>([]);
  const [winner, setWinner] = useState<Result | null>(null);

  useEffect(() => {
    if (id) {
      const fetchResults = async () => {
        try {
          const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/picklejars/${id}/results`);
          const sortedResults = res.data.sort((a: Result, b: Result) => b.total_points - a.total_points);
          setResults(sortedResults);
          setWinner(sortedResults.find((r: Result) => r.is_winner) || null);
        } catch (error) {
          console.error('Failed to fetch results:', error);
        }
      };
      fetchResults();
    }
  }, [id]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold mb-8 text-center">Results</h1>

      {winner && (
        <div className="mb-8 p-6 bg-green-100 border-2 border-green-500 rounded-lg text-center">
          <h2 className="text-3xl font-bold text-green-800">🎉 Winner! 🎉</h2>
          <p className="text-2xl mt-2">{winner.title}</p>
          <p className="text-lg">{winner.description}</p>
          <p className="text-2xl font-bold mt-2">{winner.total_points} Points</p>
        </div>
      )}

      <div className="space-y-4">
        {results.map((result, index) => (
          <div
            key={result.suggestion_id}
            className={`p-4 border rounded-lg ${result.is_winner ? 'bg-yellow-100' : ''}`}
          >
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className="text-2xl font-bold mr-4">{index + 1}.</span>
                <div>
                  <h3 className="text-xl font-semibold">{result.title}</h3>
                  <p>{result.description}</p>
                </div>
              </div>
              <span className="text-xl font-bold">{result.total_points} points</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
