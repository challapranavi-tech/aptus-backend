"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold text-black">Something went wrong</h1>
      <p className="mt-2 max-w-md text-gray-600">
        The page hit an error. Try refreshing, or restart the dev server with{" "}
        <code className="rounded bg-gray-100 px-1">dev.bat</code>.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded bg-aptus-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-aptus-green"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-800 hover:bg-gray-50"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
