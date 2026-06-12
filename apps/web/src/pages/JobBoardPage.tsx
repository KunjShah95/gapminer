import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  MapPin,
  Heart,
  Briefcase,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Building2,
  Clock,
  DollarSign,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  EmptyState,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface Job {
  id: string;
  title: string;
  company: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  posted_date?: string;
  description: string;
  url?: string;
  saved?: boolean;
}

interface JobSearchResponse {
  jobs: Job[];
  total: number;
  page: number;
  totalPages: number;
}

const DATE_FILTERS = [
  { value: "", label: "Any time" },
  { value: "24h", label: "Last 24 hours" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
];

export default function JobBoardPage() {
  const [query, setQuery] = useState("");
  const [location, setLocation] = useState("");
  const [datePosted, setDatePosted] = useState("");
  const [salaryMin, setSalaryMin] = useState("");
  const [salaryMax, setSalaryMax] = useState("");
  const [page, setPage] = useState(1);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [savingJobs, setSavingJobs] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedQuery(query);
      setPage(1);
    }, 300);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [query]);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (location) params.set("location", location);
      if (datePosted) params.set("date_posted", datePosted);
      if (salaryMin) params.set("salary_min", salaryMin);
      if (salaryMax) params.set("salary_max", salaryMax);
      params.set("page", String(page));
      params.set("limit", "12");

      const res = await fetch(`/api/v1/jobs/search?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data: JobSearchResponse = await res.json().catch(() => ({
          jobs: [],
          total: 0,
          page: 1,
          totalPages: 0,
        }));
        setJobs(data.jobs || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 0);
      } else {
        setJobs([]);
        setTotal(0);
        setTotalPages(0);
      }
    } catch (err) {
      console.error("Failed to search jobs:", err);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, location, datePosted, salaryMin, salaryMax, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const toggleSave = async (jobId: string, currentlySaved: boolean) => {
    const token = getAuthToken();
    if (!token) return;

    setSavingJobs((prev) => new Set(prev).add(jobId));

    try {
      const method = currentlySaved ? "DELETE" : "POST";
      const res = await fetch(`/api/v1/jobs/saved/${jobId}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === jobId ? { ...j, saved: !currentlySaved } : j,
          ),
        );
      }
    } catch (err) {
      console.error("Failed to toggle save:", err);
    } finally {
      setSavingJobs((prev) => {
        const next = new Set(prev);
        next.delete(jobId);
        return next;
      });
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setDebouncedQuery(query);
    setPage(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages: number[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 4) {
      for (let i = 1; i <= 7; i++) pages.push(i);
    } else if (page >= totalPages - 3) {
      for (let i = totalPages - 6; i <= totalPages; i++) pages.push(i);
    } else {
      for (let i = page - 3; i <= page + 3; i++) pages.push(i);
    }

    return (
      <div className="mt-8 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/15 text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronLeft size={16} />
        </button>
        {pages.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPage(p)}
            className={cn(
              "flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold transition-all",
              page === p
                ? "primary-gradient text-on-primary-fixed shadow-lg shadow-primary/25"
                : "border border-outline-variant/15 text-on-surface-variant hover:border-primary/30 hover:text-primary",
            )}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/15 text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        icon={<Briefcase size={22} />}
        title="Job Board"
        description="Search and discover job opportunities that match your skills"
        actions={
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={16} />
            Filters
          </Button>
        }
      />

      <form
        onSubmit={handleSearch}
        className="mb-6 flex flex-col gap-3 sm:flex-row"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Job title, keyword, or company"
            className="gm-input w-full pl-10"
          />
        </div>
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline" />
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Location (city, state, remote)"
            className="gm-input w-full pl-10"
          />
        </div>
        <Button type="submit" className="shrink-0">
          <Search size={16} />
          Search
        </Button>
      </form>

      <div className="flex gap-6">
        <aside
          className={cn(
            "w-64 shrink-0 space-y-5",
            showFilters
              ? "fixed inset-0 z-50 overflow-y-auto bg-surface p-6 lg:static lg:inset-auto lg:z-auto lg:bg-transparent lg:p-0 lg:block"
              : "hidden lg:block",
          )}
        >
          {showFilters && (
            <div className="mb-4 flex items-center justify-between lg:hidden">
              <h3 className="font-bold text-on-surface">Filters</h3>
              <button
                type="button"
                onClick={() => setShowFilters(false)}
                className="rounded-lg p-1 text-outline hover:bg-surface-container-high"
              >
                <X size={20} />
              </button>
            </div>
          )}

          <Card padding="md">
            <h4 className="mb-3 text-sm font-bold text-on-surface">
              Salary Range
            </h4>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={salaryMin}
                onChange={(e) => setSalaryMin(e.target.value)}
                placeholder="Min"
                className="gm-input w-full py-1.5 text-sm"
              />
              <span className="text-outline">-</span>
              <input
                type="number"
                value={salaryMax}
                onChange={(e) => setSalaryMax(e.target.value)}
                placeholder="Max"
                className="gm-input w-full py-1.5 text-sm"
              />
            </div>
          </Card>

          <Card padding="md">
            <h4 className="mb-3 text-sm font-bold text-on-surface">
              Date Posted
            </h4>
            <select
              value={datePosted}
              onChange={(e) => setDatePosted(e.target.value)}
              className="gm-input w-full"
            >
              {DATE_FILTERS.map((df) => (
                <option key={df.value} value={df.value}>
                  {df.label}
                </option>
              ))}
            </select>
          </Card>
        </aside>

        <div className="min-w-0 flex-1">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              Searching jobs...
            </div>
          ) : jobs.length === 0 ? (
            <EmptyState
              icon={<Search size={32} />}
              title="No jobs found"
              description="Try broadening your search terms or adjusting your filters"
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-on-surface-variant">
                Found {total} job{total !== 1 ? "s" : ""}
              </p>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {jobs.map((job) => (
                  <Card
                    key={job.id}
                    padding="md"
                    hover
                    className="group relative"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h3 className="truncate font-bold text-on-surface transition-colors group-hover:text-primary">
                          {job.title}
                        </h3>
                        <div className="mt-0.5 flex items-center gap-1 text-xs text-on-surface-variant">
                          <Building2 size={12} />
                          {job.company}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toggleSave(job.id, !!job.saved)}
                        disabled={savingJobs.has(job.id)}
                        className={cn(
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border transition-all",
                          job.saved
                            ? "border-error/30 bg-error/10 text-error"
                            : "border-outline-variant/15 text-outline hover:border-error/20 hover:bg-error/5 hover:text-error",
                        )}
                      >
                        <Heart
                          size={16}
                          className={cn(job.saved && "fill-error")}
                        />
                      </button>
                    </div>

                    <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-on-surface-variant">
                      {job.location && (
                        <span className="flex items-center gap-1">
                          <MapPin size={12} />
                          {job.location}
                        </span>
                      )}
                      {(job.salary_min || job.salary_max) && (
                        <span className="flex items-center gap-1">
                          <DollarSign size={12} />
                          {job.salary_min
                            ? `$${job.salary_min.toLocaleString()}`
                            : ""}
                          {job.salary_min && job.salary_max ? " - " : ""}
                          {job.salary_max
                            ? `$${job.salary_max.toLocaleString()}`
                            : ""}
                        </span>
                      )}
                      {job.posted_date && (
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {new Date(job.posted_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    <p className="line-clamp-2 text-sm leading-relaxed text-on-surface-variant">
                      {job.description}
                    </p>

                    {job.url && (
                      <a
                        href={job.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                      >
                        View posting
                      </a>
                    )}
                  </Card>
                ))}
              </div>

              {renderPagination()}
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
