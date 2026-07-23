"use client";

import { publicApiBase } from "@/lib/api-base";
import { Button, Container } from "@/components/ui";
import {
  JOB_PAGE_SIZE,
  normalizeCareerJob,
  type CareerJob,
  type JobListResult,
} from "@shared/lib/career-jobs";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

function MetaIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d={path} />
    </svg>
  );
}
const ICON_DEPT = "M3 21h18M5 21V7l7-4 7 4v14M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01";
const ICON_LOC = "M12 21s-7-6.5-7-11a7 7 0 0 1 14 0c0 4.5-7 11-7 11zM12 10a2 2 0 1 0 0 .001";
const ICON_TYPE = "M20 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2";

function JobCard({ job }: { job: CareerJob }) {
  return (
    <article className="aptus-job-card">
      <div className="aptus-job-card__header">
        <span className="aptus-job-card__tag">{job.department}</span>
        <span className="aptus-job-card__id">JOB_ID_{job.id}</span>
      </div>
      <h3 className="aptus-job-card__title">
        <Link href={`/careers/${job.slug}`}>{job.title}</Link>
      </h3>
      <div className="aptus-job-card__meta">
        <span><MetaIcon path={ICON_LOC} />{job.location}</span>
        <span><MetaIcon path={ICON_TYPE} />{job.jobType}</span>
      </div>
      <p className="aptus-job-card__desc">{job.description}</p>
      <span className="aptus-job-card__cta">
        View details
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <path d="M5 12h14M13 6l6 6-6 6" />
        </svg>
      </span>
    </article>
  );
}

function Skeletons() {
  return (
    <div className="aptus-careers-grid" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="aptus-job-skeleton">
          <div className="aptus-skel" style={{ height: 20, width: "40%" }} />
          <div className="aptus-skel" style={{ height: 24, width: "80%", marginTop: 14 }} />
          <div className="aptus-skel" style={{ height: 14, width: "55%", marginTop: 14 }} />
          <div className="aptus-skel" style={{ height: 12, width: "100%", marginTop: 16 }} />
          <div className="aptus-skel" style={{ height: 12, width: "90%", marginTop: 8 }} />
          <div className="aptus-skel" style={{ height: 12, width: "70%", marginTop: 8 }} />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="aptus-careers-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4.3-4.3" />
        <path d="M8 11h6" />
      </svg>
      <h3>{searching ? "No results for your search" : "No Current Openings"}</h3>
      <p>
        {searching
          ? "Try adjusting or clearing your filters."
          : "We don't have open roles right now. Please check back soon."}
      </p>
    </div>
  );
}

interface InitialFilters {
  q?: string;
  department?: string;
  location?: string;
}

interface Props {
  initial: JobListResult | null;
  initialFilters?: InitialFilters;
}

export function CareersListing({ initial, initialFilters }: Props) {
  const [q, setQ] = useState(initialFilters?.q ?? "");
  const [department, setDepartment] = useState(initialFilters?.department ?? "");
  const [location, setLocation] = useState(initialFilters?.location ?? "");
  const [page, setPage] = useState(1);

  const [jobs, setJobs] = useState<CareerJob[]>(initial?.jobs ?? []);
  const [total, setTotal] = useState(initial?.total ?? 0);
  const [departments, setDepartments] = useState<string[]>(initial?.departments ?? []);
  const [locations, setLocations] = useState<string[]>(initial?.locations ?? []);
  const [loading, setLoading] = useState(initial === null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [failed, setFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const firstRender = useRef(true);
  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchJobs = useCallback(
    async (opts: { page: number; append: boolean }) => {
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (department) sp.set("department", department);
      if (location) sp.set("location", location);
      sp.set("page", String(opts.page));
      sp.set("pageSize", String(JOB_PAGE_SIZE));

      if (opts.append) setLoadingMore(true);
      else setLoading(true);
      setFailed(false);
      try {
        const res = await fetch(`${publicApiBase()}/api/careers/jobs?${sp.toString()}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("bad status");
        const data = (await res.json()) as JobListResult;
        const jobs = data.jobs.map(normalizeCareerJob);
        // Never keep SSR leftovers when the live API responds — Odoo is source of truth.
        setTotal(data.total);
        setDepartments(data.departments);
        setLocations(data.locations);
        setJobs((prev) => (opts.append ? [...prev, ...jobs] : jobs));
      } catch {
        // No mock/fallback jobs — show empty openings state when the backend is unreachable.
        setFailed(true);
        if (!opts.append) {
          setJobs([]);
          setTotal(0);
          setDepartments([]);
          setLocations([]);
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [q, department, location],
  );

  // Always refresh once on mount so a stale SSR empty list cannot hide new Odoo jobs.
  useEffect(() => {
    fetchJobs({ page: 1, append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount-only refresh
  }, []);

  // Refetch (page 1) when filters/search change — debounced for search input.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      // Sync filters to the URL (without a Next navigation) so a job detail
      // page's Back returns to this exact filtered/searched state.
      const sp = new URLSearchParams();
      if (q) sp.set("q", q);
      if (department) sp.set("department", department);
      if (location) sp.set("location", location);
      const qs = sp.toString();
      window.history.replaceState(null, "", qs ? `/careers?${qs}` : "/careers");

      setPage(1);
      fetchJobs({ page: 1, append: false });
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
  }, [q, department, location, fetchJobs]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchJobs({ page: nextPage, append: true });
  };

  const hasFilters = Boolean(q || department || location);
  const canLoadMore = jobs.length < total;

  const clearAll = () => {
    setQ("");
    setDepartment("");
    setLocation("");
  };

  const filterControls = (
    <>
      <select
        className="aptus-careers-select"
        value={department}
        onChange={(e) => setDepartment(e.target.value)}
        aria-label="Filter by department"
      >
        <option value="">All departments</option>
        {departments.map((d) => (
          <option key={d} value={d}>{d}</option>
        ))}
      </select>
      <select
        className="aptus-careers-select"
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        aria-label="Filter by location"
      >
        <option value="">All locations</option>
        {locations.map((l) => (
          <option key={l} value={l}>{l}</option>
        ))}
      </select>
    </>
  );

  return (
    <Container size="site" className="pb-10">
      <div className="aptus-careers-toolbar">
        <div className="aptus-careers-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.3-4.3" />
          </svg>
          <input
            type="search"
            placeholder="Search by title or keyword…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search jobs"
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden items-center gap-3 md:flex md:col-span-3">
          {filterControls}
        </div>

        {/* Mobile filter trigger */}
        <button
          type="button"
          className="aptus-careers-filterbtn md:hidden"
          onClick={() => setDrawerOpen(true)}
          aria-haspopup="dialog"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M4 6h16M7 12h10M10 18h4" />
          </svg>
          Filters{hasFilters ? " ·" : ""}
        </button>
      </div>

      {hasFilters && (
        <div className="aptus-careers-chips">
          {q && <FilterChip label={`“${q}”`} onClear={() => setQ("")} />}
          {department && <FilterChip label={department} onClear={() => setDepartment("")} />}
          {location && <FilterChip label={location} onClear={() => setLocation("")} />}
          <button type="button" className="aptus-careers-chip" onClick={clearAll}>
            Clear all
          </button>
        </div>
      )}

      {!loading && (
        <p className="aptus-careers-count" aria-live="polite">
          {total} open {total === 1 ? "role" : "roles"}
        </p>
      )}

      {loading ? (
        <Skeletons />
      ) : jobs.length === 0 ? (
        <>
          {failed && (
            <div className="aptus-banner aptus-banner--error" role="alert">
              We couldn&apos;t load openings from the server.{" "}
              <button
                type="button"
                className="underline"
                onClick={() => fetchJobs({ page: 1, append: false })}
              >
                Retry
              </button>
            </div>
          )}
          {/* Never invent roles when the API fails — empty openings only. */}
          <EmptyState searching={hasFilters && !failed} />
        </>
      ) : (
        <>
          <div className="aptus-careers-grid">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
          {canLoadMore && (
            <div className="aptus-careers-more">
              <Button
                type="button"
                variant="secondary"
                onClick={loadMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading…" : "Load more roles"}
              </Button>
            </div>
          )}
        </>
      )}

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div
            className="aptus-careers-drawer-backdrop"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="aptus-careers-drawer" role="dialog" aria-label="Filters" aria-modal="true">
            <div className="flex items-center justify-between">
              <strong className="text-lg">Filters</strong>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close filters"
                className="text-2xl leading-none"
              >
                ✕
              </button>
            </div>
            <div>
              <label htmlFor="drawer-dept">Department</label>
              <select
                id="drawer-dept"
                className="aptus-careers-select"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              >
                <option value="">All departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="drawer-loc">Location</label>
              <select
                id="drawer-loc"
                className="aptus-careers-select"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              >
                <option value="">All locations</option>
                {locations.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>
            <div className="mt-auto flex gap-3">
              <Button type="button" variant="ghost" onClick={clearAll} className="flex-1">
                Clear
              </Button>
              <Button type="button" onClick={() => setDrawerOpen(false)} className="flex-1">
                Show {total} roles
              </Button>
            </div>
          </div>
        </>
      )}
    </Container>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="aptus-careers-chip">
      {label}
      <button type="button" onClick={onClear} aria-label={`Remove ${label} filter`}>
        ✕
      </button>
    </span>
  );
}
