"use client";

import Link from "next/link";
import { Share2, Lightbulb, Vote, Trophy } from "lucide-react";

export default function HowItWorksPage() {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-12 text-gray-900">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            How PickleJar Works
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Stop the group chat spiral. Make decisions in 4 simple steps.
          </p>
        </div>

        <div className="space-y-12">
          {/* Step 1 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                1. Create & Share
              </h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Start a new PickleJar for your event. You get a single link to
                share with your group. No accounts required for guests—they just
                need the link.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
              <Lightbulb className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                2. Collect Suggestions
              </h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Everyone tosses their ideas into the jar. "Thai food," "Bowling,"
                "Movie night"—anything goes. You can set a deadline so people
                know when to act.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600">
              <Vote className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                3. Vote with Points
              </h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Instead of a simple "yes/no," everyone gets a budget of points.
                Spend them all on your favorite option, or spread them out to
                support multiple ideas.
              </p>
            </div>
          </div>

          {/* Step 4 */}
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 text-emerald-600">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                4. See the Winner
              </h3>
              <p className="mt-2 text-gray-600 leading-relaxed">
                Once voting closes, the results are revealed instantly. The
                option with the most points wins. No arguments, just a decision.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-full bg-gray-900 px-8 py-3 text-base font-medium text-white shadow-lg hover:bg-black transition-all"
          >
            Start a PickleJar
          </Link>
        </div>
      </div>
    </main>
  );
}
