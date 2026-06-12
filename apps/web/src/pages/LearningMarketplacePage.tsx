import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Star, Clock, GraduationCap,
  ExternalLink, ChevronLeft, ChevronRight, AlertCircle, Sparkles, BookOpen
} from "lucide-react";
import { PageShell, PageHeader, Card, Badge, Button, EmptyState } from "@/components/ui";
import { getAuthToken } from "@/lib/authFetch";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  provider: string;
  url: string;
  price: string;
  rating: number;
  ratingCount: number;
  category: string;
  skills: string[];
  description: string;
  imageUrl: string;
  duration: string;
  level: string;
}

interface CoursesResponse {
  data: Course[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface RecsResponse {
  skillGaps: string[];
  recommendations: (Course & { matchScore: number })[];
  total: number;
}

const PROVIDERS = ["All", "Coursera", "Udemy", "LinkedIn Learning"] as const;
const CATEGORIES = ["All", "Frontend", "Backend", "DevOps", "Data Science", "AI/ML", "Soft Skills"] as const;
const LEVELS = ["All", "Beginner", "Intermediate", "Advanced"] as const;
const PRICE_OPTIONS = ["All", "Free", "Paid"] as const;

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={size}
          className={cn(
            s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-outline/40",
          )}
        />
      ))}
    </span>
  );
}

function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function providerBadgeTone(provider: string): "primary" | "warning" | "info" | "default" {
  switch (provider) {
    case "Coursera": return "primary";
    case "Udemy": return "warning";
    case "LinkedIn Learning": return "info";
    default: return "default";
  }
}

function levelBadgeTone(level: string): "primary" | "success" | "info" | "default" {
  switch (level) {
    case "Beginner": return "success";
    case "Intermediate": return "primary";
    case "Advanced": return "info";
    default: return "default";
  }
}

function CourseCard({ course }: { course: Course }) {
  return (
    <a
      href={course.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block"
    >
      <Card padding="md" hover className="relative flex h-full flex-col transition-all duration-300">
        <div className="pointer-events-none absolute -right-12 -top-12 h-24 w-24 rounded-full primary-gradient opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-15" />
        <div className="relative z-10 flex flex-1 flex-col">
          <div className="mb-3 flex items-start justify-between gap-2">
            <Badge tone={providerBadgeTone(course.provider)}>{course.provider}</Badge>
            {course.price && (
              <span className={cn(
                "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold tracking-tight",
                course.price === "Free"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-surface-container-high text-on-surface-variant",
              )}>
                {course.price}
              </span>
            )}
          </div>
          <h3 className="mb-2 text-sm font-bold leading-snug text-on-surface transition-colors group-hover:text-primary">
            {course.title}
          </h3>
          <div className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <StarRating rating={course.rating} />
            <span className="text-[11px] font-semibold text-on-surface-variant">
              {course.rating}
            </span>
            <span className="text-[10px] text-outline">
              ({formatCount(course.ratingCount)})
            </span>
          </div>
          {course.skills.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-1.5">
              {course.skills.slice(0, 3).map((skill) => (
                <span
                  key={skill}
                  className="rounded-md bg-primary/8 px-1.5 py-0.5 text-[10px] font-medium text-primary"
                >
                  {skill}
                </span>
              ))}
              {course.skills.length > 3 && (
                <span className="rounded-md bg-surface-container-high px-1.5 py-0.5 text-[10px] font-medium text-outline">
                  +{course.skills.length - 3}
                </span>
              )}
            </div>
          )}
          <div className="mt-auto flex items-center justify-between gap-2 border-t border-outline-variant/10 pt-3">
            <span className="flex items-center gap-1 text-[11px] text-on-surface-variant">
              <Clock size={12} />
              {course.duration}
            </span>
            <Badge tone={levelBadgeTone(course.level)} className="text-[9px]">{course.level}</Badge>
          </div>
        </div>
        <div className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg bg-surface/60 opacity-0 backdrop-blur-sm transition-opacity duration-300 group-hover:opacity-100">
          <ExternalLink size={14} className="text-primary" />
        </div>
      </Card>
    </a>
  );
}

interface FilterSelectProps {
  label: string;
  icon: React.ReactNode;
  value: string;
  options: readonly string[];
  onChange: (value: string) => void;
}

function FilterSelect({ label, icon, value, options, onChange }: FilterSelectProps) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-outline">
        {icon}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 appearance-none rounded-xl border border-outline-variant/15 bg-surface-container-high pl-9 pr-8 text-xs font-semibold text-on-surface outline-none transition-all hover:border-outline-variant/30 focus:border-primary/50"
      >
        <option value="">{label}</option>
        {options.map((opt) => (
          <option key={opt} value={opt === "All" ? "" : opt}>
            {opt}
          </option>
        ))}
      </select>
      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-outline">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

const FILTERS_COLLAPSED_KEY = "learn-marketplace-filters-collapsed";

export default function LearningMarketplacePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get("q") || "");
  const [debouncedQ, setDebouncedQ] = useState(searchParams.get("q") || "");
  const [filtersVisible, setFiltersVisible] = useState(() => {
    return window.innerWidth >= 768;
  });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(searchInput), 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const setParam = useCallback((key: string, value: string) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (value) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      if (key !== "page") next.set("page", "1");
      return next;
    });
  }, [setSearchParams]);

  const q = searchParams.get("q") || "";
  const provider = searchParams.get("provider") || "";
  const category = searchParams.get("category") || "";
  const level = searchParams.get("level") || "";
  const price = searchParams.get("price") || "";
  const page = parseInt(searchParams.get("page") || "1", 10);

  const apiParams = useMemo(() => {
    const p = new URLSearchParams();
    if (q) p.set("q", q);
    if (provider) p.set("provider", provider);
    if (category) p.set("category", category);
    if (level) p.set("level", level);
    if (price === "free") p.set("maxPrice", "0");
    if (page > 1) p.set("page", String(page));
    return p.toString();
  }, [q, provider, category, level, price, page]);

  const coursesQuery = useQuery<CoursesResponse>({
    queryKey: ["courses", apiParams],
    queryFn: () => fetch(`/api/v1/courses?${apiParams}`).then((r) => r.json()),
    placeholderData: (prev) => prev,
  });

  const analysesQuery = useQuery<any[]>({
    queryKey: ["analyses"],
    queryFn: async () => {
      const token = getAuthToken();
      if (!token) return [];
      const res = await fetch("/api/v1/analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.ok ? res.json() : [];
    },
    staleTime: 1000 * 60 * 2,
  });

  const skillGaps = useMemo(() => {
    if (!analysesQuery.data || analysesQuery.data.length === 0) return [];
    const latest = analysesQuery.data[0] as Record<string, any>;
    return latest?.top_gaps?.map((g: Record<string, any>) => g.skill) || [];
  }, [analysesQuery.data]);

  const recsQuery = useQuery<RecsResponse>({
    queryKey: ["course-recs", skillGaps],
    queryFn: () =>
      fetch("/api/v1/courses/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillGaps }),
      }).then((r) => r.json()),
    enabled: skillGaps.length > 0,
    staleTime: 1000 * 60 * 5,
  });

  const courses = coursesQuery.data?.data || [];
  const pagination = coursesQuery.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 1 };
  const recommendations = recsQuery.data?.recommendations || [];
  const loading = coursesQuery.isLoading;

  return (
    <PageShell>
      <PageHeader
        icon={<GraduationCap size={22} />}
        title="Learning Marketplace"
        description="Discover courses to close your skill gaps"
        badge="Learn"
      />

      <div className="mb-8 space-y-2">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline"
          />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search courses..."
            className="h-12 w-full rounded-2xl border border-outline-variant/15 bg-surface-container-high pl-11 pr-4 text-sm font-medium text-on-surface outline-none transition-all placeholder:text-outline hover:border-outline-variant/30 focus:border-primary/50 focus:shadow-[0_0_0_3px_rgba(59,91,219,0.1)]"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => { setSearchInput(""); setParam("q", ""); }}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <FilterSelect
              label="Provider"
              icon={<BookOpen size={14} />}
              value={provider}
              options={PROVIDERS}
              onChange={(v) => setParam("provider", v)}
            />
            <FilterSelect
              label="Category"
              icon={<GraduationCap size={14} />}
              value={category}
              options={CATEGORIES}
              onChange={(v) => setParam("category", v)}
            />
            <FilterSelect
              label="Level"
              icon={<Clock size={14} />}
              value={level}
              options={LEVELS}
              onChange={(v) => setParam("level", v)}
            />
            <FilterSelect
              label="Price"
              icon={<Sparkles size={14} />}
              value={price}
              options={PRICE_OPTIONS}
              onChange={(v) => setParam("price", v)}
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const next = new URLSearchParams();
              setSearchParams(next);
              setSearchInput("");
              setDebouncedQ("");
            }}
            className="flex h-10 shrink-0 items-center gap-1.5 rounded-xl px-3 text-[11px] font-bold uppercase tracking-wider text-outline transition-colors hover:bg-surface-container-high hover:text-on-surface"
          >
            Clear
          </button>
        </div>
      </div>

      {recommendations.length > 0 && (
        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} className="text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Recommended Based on Your Skill Gaps</h2>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {recommendations.map((course) => (
              <div key={course.id} className="w-72 shrink-0">
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        </section>
      )}

      {analysesQuery.isFetched && analysesQuery.data && analysesQuery.data.length === 0 && (
        <Card padding="lg" className="mb-10 border-primary/20">
          <div className="flex flex-col items-center gap-3 text-center sm:flex-row sm:text-left">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <AlertCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface">No personalized recommendations yet</h3>
              <p className="mt-1 text-sm text-on-surface-variant">
                Complete an analysis to get personalized course recommendations tailored to your skill gaps.
              </p>
            </div>
            <Link
              to="/analyze"
              className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold primary-gradient text-on-primary-fixed shadow-lg shadow-primary/25 transition-all hover:scale-[1.02]"
            >
              Analyze Your Resume
            </Link>
          </div>
        </Card>
      )}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} padding="md">
              <div className="space-y-3 animate-pulse">
                <div className="h-4 w-20 rounded bg-surface-container-highest" />
                <div className="h-4 w-full rounded bg-surface-container-highest" />
                <div className="h-3 w-3/4 rounded bg-surface-container-highest" />
                <div className="flex gap-1.5">
                  <div className="h-5 w-14 rounded bg-surface-container-highest" />
                  <div className="h-5 w-16 rounded bg-surface-container-highest" />
                  <div className="h-5 w-12 rounded bg-surface-container-highest" />
                </div>
                <div className="flex justify-between">
                  <div className="h-3 w-16 rounded bg-surface-container-highest" />
                  <div className="h-3 w-14 rounded bg-surface-container-highest" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={28} />}
          title="No courses found"
          description="Try adjusting your filters or search terms to find what you're looking for."
        />
      ) : (
        <>
          <div className="mb-6 flex items-center justify-between">
            <p className="text-xs text-on-surface-variant">
              Showing <span className="font-semibold text-on-surface">{courses.length}</span> of{" "}
              <span className="font-semibold text-on-surface">{pagination.total}</span> courses
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setParam("page", String(page - 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/15 text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                .filter((p) => {
                  if (pagination.totalPages <= 7) return true;
                  if (p === 1 || p === pagination.totalPages) return true;
                  if (Math.abs(p - page) <= 1) return true;
                  return false;
                })
                .map((p, i, arr) => (
                  <span key={p} className="flex items-center gap-1">
                    {i > 0 && arr[i - 1] !== p - 1 && (
                      <span className="px-1 text-outline">...</span>
                    )}
                    <button
                      type="button"
                      onClick={() => setParam("page", String(p))}
                      className={cn(
                        "flex h-9 min-w-[2.25rem] items-center justify-center rounded-xl text-xs font-bold transition-all",
                        p === page
                          ? "primary-gradient text-on-primary-fixed shadow-lg shadow-primary/20"
                          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
                      )}
                    >
                      {p}
                    </button>
                  </span>
                ))}
              <button
                type="button"
                disabled={page >= pagination.totalPages}
                onClick={() => setParam("page", String(page + 1))}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-outline-variant/15 text-on-surface-variant transition-all hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </PageShell>
  );
}
