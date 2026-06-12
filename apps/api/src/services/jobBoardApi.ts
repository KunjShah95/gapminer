import { config } from "../core/config.js";

const ADZUNA_BASE = `https://api.adzuna.com/v1/api/jobs`;

export interface AdzunaJob {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  salary_min: number;
  salary_max: number;
  salary_is_predicted: string;
  category: { label: string; tag: string };
  redirect_url: string;
  contract_type: string;
  contract_time: string;
  created: string;
}

interface AdzunaResponse {
  count: number;
  results: AdzunaJob[];
}

function isConfigured(): boolean {
  return !!(config.ADZUNA_APP_ID && config.ADZUNA_API_KEY);
}

function buildParams(extra: Record<string, string | number>): URLSearchParams {
  const params = new URLSearchParams({
    app_id: config.ADZUNA_APP_ID,
    app_key: config.ADZUNA_API_KEY,
    results_per_page: "50",
    "content-type": "application/json",
    ...Object.fromEntries(
      Object.entries(extra).map(([k, v]) => [k, String(v)]),
    ),
  });
  return params;
}

async function request<T>(
  path: string,
  params: URLSearchParams,
): Promise<T | null> {
  if (!isConfigured()) {
    console.warn("[jobBoardApi] Adzuna not configured (ADZUNA_APP_ID / ADZUNA_API_KEY)");
    return null;
  }
  try {
    const url = `${ADZUNA_BASE}${path}?${params.toString()}`;
    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.error(`[jobBoardApi] Adzuna HTTP ${res.status} for ${url}`);
      return null;
    }
    return (await res.json()) as T;
  } catch (err) {
    console.error("[jobBoardApi] Request failed:", (err as Error).message);
    return null;
  }
}

export async function searchJobs(
  what: string,
  where = "",
  page = 1,
  country = config.ADZUNA_COUNTRY,
): Promise<AdzunaJob[]> {
  const params = buildParams({ what, results_per_page: 50, page });
  if (where) params.set("where", where);
  const data = await request<AdzunaResponse>(`/${country}/search/${page}`, params);
  return data?.results ?? [];
}

export async function searchJobsByCategory(
  category: string,
  what = "",
  page = 1,
  country = config.ADZUNA_COUNTRY,
): Promise<AdzunaJob[]> {
  const params = buildParams({ results_per_page: 50, page, category });
  if (what) params.set("what", what);
  const data = await request<AdzunaResponse>(`/${country}/search/${page}`, params);
  return data?.results ?? [];
}

export async function getSalaryBenchmarks(
  role: string,
  location = "",
): Promise<AdzunaJob[]> {
  return searchJobs(role, location, 1);
}

export async function searchJobsByCompany(
  company: string,
  page = 1,
  country = config.ADZUNA_COUNTRY,
): Promise<AdzunaJob[]> {
  return searchJobs(company, "", page, country);
}

export function extractSalaryRange(jobs: AdzunaJob[]): {
  min: number;
  median: number;
  max: number;
  sampleSize: number;
} {
  const salaries = jobs
    .map((j) => (j.salary_min > 0 ? j.salary_min : null))
    .filter((s): s is number => s !== null);
  if (salaries.length === 0) {
    return { min: 0, median: 0, max: 0, sampleSize: 0 };
  }
  salaries.sort((a, b) => a - b);
  const mid = Math.floor(salaries.length / 2);
  return {
    min: salaries[0],
    median: salaries.length % 2 === 0 ? (salaries[mid - 1] + salaries[mid]) / 2 : salaries[mid],
    max: salaries[salaries.length - 1],
    sampleSize: salaries.length,
  };
}

export function aggregateByRole(jobs: AdzunaJob[]): Map<string, AdzunaJob[]> {
  const grouped = new Map<string, AdzunaJob[]>();
  for (const job of jobs) {
    const key = job.title.toLowerCase().trim();
    const existing = grouped.get(key) ?? [];
    existing.push(job);
    grouped.set(key, existing);
  }
  return grouped;
}

export async function fetchIndeedDataFallback(
  role: string,
  location = "",
): Promise<{ jobs: any[]; totalJobs: number } | null> {
  const jobs = await searchJobs(role, location);
  if (jobs.length === 0) return null;
  return {
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      description: j.description,
      salaryRange: j.salary_min > 0 ? `${j.salary_min}-${j.salary_max}` : null,
      type: j.contract_type || "FULL_TIME",
    })),
    totalJobs: jobs.length,
  };
}
