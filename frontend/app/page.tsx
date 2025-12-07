import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 p-8">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-green-600">🥒 PickleJar</h1>
        <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
          Group Hangouts Made Easy. Democratically.
        </p>
        <div className="mt-8">
          <Link
            href="/create"
            className="px-8 py-4 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 transition-colors"
          >
            Create a PickleJar
          </Link>
        </div>
      </div>
    </main>
  );
}
