import { searchJobs } from "../services/jobBoardApi.js";

export async function fetchJobsFromLinkedinUrl(url) {
  const company = url.includes("/jobs/view/")
    ? url.split("/jobs/view/")[1]?.split("?")[0] || "software"
    : "software";
  const jobs = await searchJobs(company, "", 1);
  return jobs.slice(0, 10).map((job) => ({
    id: job.id,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    description: job.description,
    type: job.contract_type || "FULL_TIME",
    salaryRange:
      job.salary_min > 0
        ? String(Math.round((job.salary_min + job.salary_max) / 2))
        : null,
  }));
}

export async function getLinkedInSalaryBenchmarks(company, experienceLevel = 5) {
  const jobs = await searchJobs(company, "", 1);
  if (jobs.length === 0) return null;
  const salaries = jobs.filter((j) => j.salary_min > 0).map((j) => j.salary_min);
  const median =
    salaries.length > 0
      ? salaries.sort((a, b) => a - b)[Math.floor(salaries.length / 2)]
      : 0;
  return {
    company,
    minSalary: salaries[0] || 0,
    medianSalary: median,
    maxSalary: salaries[salaries.length - 1] || 0,
    totalCompMedian: median,
    yearsExperience: experienceLevel,
    roleTitle: jobs[0]?.title?.slice(0, 30) || company,
    location: jobs[0]?.location?.display_name || null,
  };
}

export async function fetchSalaryBenchmarksAll() {
  const roles = [
    "software engineer",
    "data scientist",
    "product manager",
    "designer",
    "devops engineer",
  ];
  const result = [];
  for (const role of roles) {
    const data = await getLinkedInSalaryBenchmarks(role);
    if (data) result.push(data);
  }
  return {
    companies: [...new Set(result.map((r) => r.roleTitle))],
    roles: result.map((r) => ({ title: r.roleTitle })),
    salaryBenchmarks: result,
  };
}

export async function checkJobAvailability(company, roleType = "All") {
  const jobs = await searchJobs(company);
  return {
    available: jobs.length > 0,
    openCount: jobs.length,
    totalCandidates: jobs.length,
  };
}
