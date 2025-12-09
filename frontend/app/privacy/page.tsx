import type { Metadata } from "next";
import Link from "next/link";

const sections = [
  {
    title: "Personal information we collect",
    paragraphs: [
      "We may collect personal identification information in a variety of ways, including when you create a jar, submit suggestions, vote, fill out a form, or interact with other Site experiences.",
      "Depending on the feature, you might be asked for details such as your name or email address. Connecting a personal calendar is optional; we never store your calendar events on our servers. You may always visit PickleJar anonymously, though it could limit certain Site functionality.",
    ],
  },
  {
    title: "Non-personal information",
    paragraphs: [
      "We may collect non-personal identification information such as browser type, device model, operating system, referral source, and other technical metadata about how you access the Site. This helps us understand usage patterns and improve reliability.",
    ],
  },
  {
    title: "Cookies & analytics",
    paragraphs: [
      "PickleJar may use cookies to remember preferences and keep you signed in. You can disable cookies in your browser, but some features may not behave as expected.",
      "We also leverage third-party analytics providers (including Google Analytics) to understand aggregate interactions. You can opt out of Google Analytics tracking with the Google Analytics Opt-out Browser Add-on: https://tools.google.com/dlpage/gaoptout. Read more about Google's practices at https://policies.google.com/privacy.",
    ],
  },
  {
    title: "How we use information",
    bullets: [
      {
        heading: "Operate PickleJar",
        detail:
          "Deliver core functionality, render pages correctly, and maintain service reliability.",
      },
      {
        heading: "Improve the experience",
        detail:
          "Incorporate user feedback, experiment safely, and guide product decisions.",
      },
      {
        heading: "Communicate with you",
        detail:
          "Send transactional updates or product notices that you can opt out of at any time.",
      },
    ],
  },
  {
    title: "Protecting your data",
    paragraphs: [
      "We adopt reasonable safeguards for data collection, storage, and processing to protect against unauthorized access, alteration, disclosure, or destruction of your personal information, credentials, or vote data.",
    ],
  },
  {
    title: "Sharing information",
    paragraphs: [
      "We do not sell, trade, or rent personal identification information. We may share anonymized, aggregated statistics with trusted partners for the limited purposes described above.",
    ],
  },
  {
    title: "Policy updates",
    paragraphs: [
      "We may update this policy from time to time. Please review it periodically to stay informed about how we are protecting the information we collect.",
    ],
  },
  {
    title: "Acceptance of terms",
    paragraphs: [
      "By using PickleJar, you signify acceptance of this policy. If you do not agree, please discontinue use of the Site. Continued use following posted changes constitutes acceptance of those changes.",
    ],
  },
  {
    title: "Contact us",
    paragraphs: [
      "Have questions about this Privacy Policy or your data? Send us feedback and we will get back to you.",
    ],
  },
];

const FEEDBACK_FORM_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ??
  "https://forms.gle/picklejar-feedback";

export const metadata: Metadata = {
  title: "Privacy Policy – PickleJar",
  description: "Learn how PickleJar collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-white px-6 py-12">
      <div className="mx-auto max-w-4xl space-y-12 text-gray-900">
        <header className="space-y-4">
          <p className="text-sm text-gray-500">Last updated: April 24, 2018</p>
          <h1 className="text-4xl font-light">Privacy Policy</h1>
          <p className="text-lg text-gray-600">
            Your privacy matters to us. This page explains what we collect, why
            we collect it, and how you remain in control when using the
            PickleJar site located at https://picklejar.app (the "Site").
          </p>
        </header>

        <section className="space-y-10">
          {sections.map((section) => (
            <article key={section.title} className="space-y-4">
              <h2 className="text-2xl font-semibold">{section.title}</h2>
              {section.paragraphs?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="leading-relaxed text-gray-700 whitespace-pre-line"
                >
                  {paragraph}
                </p>
              ))}
              {section.bullets && (
                <ul className="list-disc space-y-3 pl-6 text-gray-700">
                  {section.bullets.map((bullet) => (
                    <li key={bullet.heading}>
                      <span className="font-medium text-gray-900">
                        {bullet.heading}:{" "}
                      </span>
                      {bullet.detail}
                    </li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </section>

        <section className="rounded-lg bg-gray-50 p-6 text-sm text-gray-700">
          <p>
            Need help or want to share feedback?{" "}
            <a
              href={FEEDBACK_FORM_URL}
              target="_blank"
              rel="noreferrer"
              className="font-medium underline underline-offset-4 hover:text-gray-900"
            >
              Reach out →
            </a>
          </p>
        </section>

        <div>
          <Link
            href="/"
            className="inline-flex items-center text-sm font-medium text-gray-600 underline underline-offset-4 hover:text-gray-900"
          >
            ← Back to PickleJar
          </Link>
        </div>
      </div>
    </main>
  );
}
