import {
  searchJobs as adzunaSearch,
  getSalaryBenchmarks as adzunaBenchmarks,
  fetchIndeedDataFallback,
} from "../services/jobBoardApi.js";

export async function getJobsForCompany(company) {
  const jobs = await adzunaSearch(company, "", 1);
  return jobs.map((j) => ({
    id: j.id,
    title: j.title,
    company: j.company.display_name,
    location: j.location.display_name,
    description: j.description,
    type: j.contract_type || "FULL_TIME",
    salaryRange: j.salary_min > 0 ? j.salary_min : null,
  }));
}

export async function getSalaryBenchmarks(company, experienceLevel = 5) {
  const jobs = await adzunaBenchmarks(company);
  if (jobs.length === 0) return null;
  const salaries = jobs.filter((j) => j.salary_min > 0).map((j) => j.salary_min);
  const median =
    salaries.length > 0
      ? salaries.sort((a, b) => a - b)[Math.floor(salaries.length / 2)]
      : 0;
  return {
    company,
    medianSalary: median,
    minSalary: salaries[0] || 0,
    maxSalary: salaries[salaries.length - 1] || 0,
    totalCompMedian: median,
    averageExperience: experienceLevel,
    roleTitle: jobs[0]?.title || null,
    location: jobs[0]?.location?.display_name || null,
  };
}

export async function searchJobs(term, limit = 20) {
  const jobs = await adzunaSearch(term, "", 1);
  const sliced = jobs.slice(0, limit);
  return {
    term,
    totalJobs: jobs.length,
    jobs: sliced.map((j) => ({
      id: j.id,
      title: j.title,
      company: j.company.display_name,
      location: j.location.display_name,
      type: j.contract_type || "FULL_TIME",
      description: j.description,
      salaryRange: j.salary_min > 0 ? j.salary_min : null,
    })),
  };
}

export async function fetchIndeedData(company = "software engineer", experienceLevel = 5) {
  return fetchIndeedDataFallback(company);
}
