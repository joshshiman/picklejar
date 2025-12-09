import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ToastProvider } from "./components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

const FEEDBACK_FORM_URL =
  process.env.NEXT_PUBLIC_FEEDBACK_FORM_URL ??
  "https://forms.gle/picklejar-feedback";

export const metadata: Metadata = {
  title: "PickleJar",
  description: "Group Hangouts Made Easy",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased`}>
        <ToastProvider>
          <nav className="border-b border-gray-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-4xl items-center justify-between">
              <Link href="/" className="flex items-center">
                <Image
                  src="/picklejar-logo.png"
                  alt="PickleJar"
                  width={150}
                  height={40}
                  className="h-10 w-auto object-contain"
                  priority
                />
              </Link>
              <div className="flex items-center gap-6">
                <Link
                  href="/how-it-works"
                  className="text-sm font-medium text-gray-600 hover:text-gray-900"
                >
                  How it works
                </Link>
                <Link
                  href="/"
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black"
                >
                  Create
                </Link>
              </div>
            </div>
          </nav>
          {children}
          <footer className="border-t border-gray-200 bg-white px-4 py-6">
            <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 text-sm text-gray-600 md:flex-row md:justify-between">
              <p className="text-center text-gray-500 md:text-left">
                Your privacy is important to us.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4 md:justify-end">
                <Link
                  href="/privacy"
                  className="underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-900"
                >
                  Privacy Policy
                </Link>
                <a
                  href={FEEDBACK_FORM_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="underline decoration-gray-300 underline-offset-4 transition-colors hover:text-gray-900 hover:decoration-gray-900"
                >
                  Share Feedback
                </a>
              </div>
            </div>
          </footer>
        </ToastProvider>
      </body>
    </html>
  );
}
