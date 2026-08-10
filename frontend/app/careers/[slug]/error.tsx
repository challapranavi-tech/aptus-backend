"use client";

import { Container } from "@/components/ui";
import Link from "next/link";
import { useEffect } from "react";

/**
 * Catches transient Odoo/API failures from getJob() (data/jobs.ts throws
 * on purpose so a real outage isn't mistaken for a 404). Covers both this
 * page and the nested apply/ page — neither has its own error boundary.
 */
export default function CareerError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[careers] page error", error);
  }, [error]);

  return (
    <div className="section-padding">
      <Container size="sm">
        <div className="text-center">
          <p className="text-primary" style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}>
            Error
          </p>
          <h1 className="mt-2 tracking-tight" style={{ fontSize: "var(--text-3xl)", fontWeight: 600 }}>
            Couldn&apos;t load this job
          </h1>
          <p className="mt-4 text-muted-foreground">
            We hit a temporary issue reaching our job listings. Please try again in a moment.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={() => reset()}
              className="text-primary hover:underline"
              style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
            >
              Try again
            </button>
            <Link
              href="/careers"
              className="text-primary hover:underline"
              style={{ fontSize: "var(--text-sm)", fontWeight: 500 }}
            >
              Back to Careers
            </Link>
          </div>
        </div>
      </Container>
    </div>
  );
}
