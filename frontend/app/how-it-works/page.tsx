"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronDown } from "lucide-react";

const steps = [
  {
    title: "Create & Share",
    description:
      "Start a new PickleJar for your event. You get a single link to share with your group. No accounts required for guests—they just need the link.",
  },
  {
    title: "Collect Suggestions",
    description:
      'Everyone tosses their ideas into the jar. "Thai food," "Bowling," "Movie night"—anything goes. You can set a deadline so people know when to act.',
  },
  {
    title: "Vote with Points",
    description:
      'Instead of a simple "yes/no," everyone gets a budget of points. Spend them all on your favorite option, or spread them out to support multiple ideas.',
  },
  {
    title: "See the Winner",
    description:
      "Once voting closes, the results are revealed instantly. The option with the most points wins. No arguments, just a decision.",
  },
];

export default function HowItWorksPage() {
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  return (
    <main className="min-h-screen bg-white px-6 py-12 text-gray-900">
      <div className="mx-auto max-w-2xl">
        <div className="mb-16">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-4">
            How it works
          </h1>
          <p className="text-xl text-gray-600 font-light">
            Stop the group chat spiral. Make decisions in 4 simple steps.
          </p>
        </div>

        <div className="relative border-l-2 border-gray-100 ml-3 space-y-8 pb-12">
          {steps.map((step, index) => {
            const isExpanded = expandedStep === index;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={index}
                className={`relative pl-8 pr-4 py-3 rounded-xl cursor-pointer group transition-all duration-300 hover:bg-gray-50 ${
                  isExpanded ? "bg-gray-50" : ""
                }`}
                onClick={() => setExpandedStep(isExpanded ? null : index)}
              >
                {/* Marker */}
                <div
                  className={`absolute -left-[9px] top-5 h-4 w-4 rounded-full border-2 transition-colors duration-300 ${
                    isExpanded
                      ? "border-gray-900 bg-gray-900"
                      : "border-gray-900 bg-white"
                  } ring-4 ring-white group-hover:scale-110`}
                />

                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-2xl font-light text-gray-900 group-hover:text-gray-600 transition-colors">
                    {index + 1}. {step.title}
                  </h3>
                  <ChevronDown
                    className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  />
                </div>
                <p className="text-gray-600 leading-relaxed">
                  {step.description}
                </p>

                {/* Video Placeholder */}
                <div
                  className={`grid transition-all duration-300 ease-in-out ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100 mt-6"
                      : "grid-rows-[0fr] opacity-0 mt-0"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div className="aspect-video w-full rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200">
                      <div className="flex flex-col items-center gap-2 text-gray-400">
                        <Play size={32} />
                        <span className="text-sm font-medium">Video Demo</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-16">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-4 text-lg font-medium text-white shadow-lg hover:bg-black hover:-translate-y-0.5 transition-all"
          >
            Start a PickleJar ↵
          </Link>
        </div>
      </div>
    </main>
  );
}
