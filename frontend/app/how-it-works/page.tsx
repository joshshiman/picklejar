"use client";

import { useState } from "react";
import Link from "next/link";
import { Play, ChevronDown } from "lucide-react";

const steps = [
  {
    title: "Create & Share",
    description:
      "Spin up a fresh PickleJar, name the hangout, and blast the single share link. Everyone joins from that jar—no downloads, no accounts.",
  },
  {
    title: "Fill the Pickle Jar",
    description:
      "Every crew member drops pickles into the jar—Thai food, bowling, movie night, whatever. Add a pickle drop deadline so folks know when to toss theirs in.",
  },
  {
    title: "Vote on Pickles",
    description:
      "When it's voting time, everyone gets a stash of pickle points. Pile them onto one favorite pickle or spread the love across a few contenders.",
  },
  {
    title: "Crown the Winning Pickle",
    description:
      "When voting wraps, the jar crowns the top pickle instantly. Highest points wins and the group chat can finally chill.",
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
            Break the group chat spiral. Pick a plan in four pickle-powered
            steps.
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
