import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import { ToastProvider } from "./components/ToastProvider";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

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
        </ToastProvider>
      </body>
    </html>
  );
}
