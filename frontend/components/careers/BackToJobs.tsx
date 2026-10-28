"use client";

import { useRouter } from "next/navigation";

/** Back affordance that returns to the previous (filtered) listing state. */
export function BackToJobs({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      type="button"
      className={className}
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push("/careers");
      }}
    >
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M19 12H5M11 18l-6-6 6-6" />
      </svg>
      Back to all jobs
    </button>
  );
}
