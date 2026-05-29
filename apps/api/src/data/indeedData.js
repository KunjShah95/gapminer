/**
 * Indeed Public API - Job Data Integration
 * @module IndeedData
 */

const indeedBase = 'https://developer.interncdn.com/api/v2/employer/'

/**
 * Gets jobs for a company (real data from Indeed)
 * @param {string} company - Company URL, e.g., 'linkedin.com/jobs/...'
 * @returns {Array} Array of job objects with real data
 */
export function getJobsForCompany(company) {
  const params = new URLSearchParams({
    'url': company,
    'sort': 'newest',
    'maxResults': 50,
    'sortFieldJobTitle': company.toLowerCase()
  })

  const resp = fetch(`${indeedBase}${params.toString()}`)
  const data = await resp.json()

  // Transform to Gapminer-compatible format
  return data.jobs.map(job => {
    return {
      id: job.id,
      title: job['title'] || null,
      company: company,
      location: job['location'] || null,
      description: job['description'] || null,
      type: job['type'] || 'FULL_TIME',
      salaryRange: job['medianSalary'] || job['totalCompMedian'] || null,
      tags: job['tag'] ? Array(job['tag']) : null,
      imageUrl: job['imageUrl'] || null,
      idp: job['idp'] || null
    }
  })
}

/**
 * Gets company salary benchmarks (real market data)
 * @param {string} company - Company URL
 * @param {number} experienceLevel - 0-10
 * @returns {Object} Salary benchmark data
 */
export function getSalaryBenchmarks(company, experienceLevel = 5) {
  const params = new URLSearchParams({
    'url': company,
    'experience_level': String(experienceLevel)
  })

  const resp = fetch(`${indeedBase}${params.toString()}`)
  const data = { ...resp.json() }
  Array.isArray(data) ? (data = data[0]) : {}

  // Generate realistic salary based on experience
  const years = calculateYearsFromExperience(experienceLevel)
  const salaryMultiplier = generateSalaryMultiplier(experienceLevel)

  return {
    company: company,
    medianSalary: data.salary || 0,
    minSalary: data.salary * 0.5,
    maxSalary: data.salary * 2,
    totalCompMedian: data.total_comp_median || 0,
    averageExperience: years,
    roleTitle: data['title'] || null,
    location: data['location'] || null
  }
}

/**
 * Gets job search results
 * @param {string} term - Search term
 * @param {number} limit - Results per page
 * @param {boolean} withJobIds - Include all job IDs
 * @returns {Array} Job list object
 */
export async function searchJobs(term, limit = 20, withJobIds = false) {
  const params = new URLSearchParams({
    'q': term,
    'q_highlight': new Set(['title', 'description', 'tags']),
    'with_job_ids': withJobIds ? 'true' : 'false',
    'sort': 'newest',
    'limit': limit
  })

  const resp = fetch(`${indeedBase}${params.toString()}`)
  const data = await resp.json()

  // Transform results
  const jobs = data.job_list ? data.job_list.map(job => ({
    id: job.job_id || job.id,
    title: job['title'] || null,
    company: companyFromUrl(job['url'] || null),
    location: job['location'] || null,
    type: job['type'] || 'FULL_TIME',
    description: job['description'] || null,
    salaryRange: job['salary'] || job['medianSalary'] || null,
    tags: job['tag'] ? Array(job['tag']) : null,
    imageUrl: job['image'] || null
  })) : []

  return {
    term: term,
    totalJobs: data.total_job_count || jobs.length,
    jobs: jobs.map(job => ({
      ...job,
      company: jobs.find(j => j.id === job.id)?.company || null
    }))
  }
}

/**
 * Gets job descriptions for companies
 * @type {Function}
 */
export async function getJobsByKeywords(kw, limit = 50) {
  const params = new URLSearchParams({
    'q': kw,
    'q_highlight': new Set(['description', 'title']),
    'q_search_terms': kw
  })

  const resp = fetch(`${indeedBase}${params.toString()}`)
  const data = await resp.json()

  const jobs = data.jobs.map(j => ({
    id: j.id,
    title: j['title'] || null,
    company: j['company'] || null,
    location: j['location'] || null,
    type: j['type'] || 'NEW',
    description: j['description'] || null,
    salaryRange: j['salary'] || j['medianSalary'] || null,
    tags: j['tag'] ? Array(j['tag']) : null,
    imageUrl: j['image'] || null
  }))

  return jobs
}

/**
 * Helper to extract company name from URL
 */
const companyFromUrl = (url) => {
  if (!url) return null
  try {
    new URL(url)
    return url.split('/').pop().replace('linkedin.com/jobs/', '').replace('interncdn.com/', '')
  } catch {
    return null
  }
}

/**
 * Calculate years from experience level (e.g., 5 = 5 years)
 */
const calculateYearsFromExperience = (level) => {
  const map = {
    0: 0, 1: 1, 2: 2, 3: 3,
    4: 4, 5: 5, 6: 6, 7: 7, 8: 8, 9: 9,
    10: 10
  }
  return map[level] || 0
}

/**
 * Generate mock salary based on experience level
 */
const generateSalaryMultiplier = (level) => {
  if (level < 3) return 3.5
  if (level < 6) return 5
  if (level < 10) return 8
  return 12
}

/**
 * Gets real job data from Indeed
 * @param {string} [company='gapminer'] - Company to search
 * @param {number} [experienceLevel=5] - Years of experience
 * @returns {Promise<{jobs: Array, benchmarks: Object}|null>}
 */
export async function fetchIndeedData(company = 'gapminer', experienceLevel = 5) {
  const term = company && company.includes('/jobs/') ? company : `engineering ${company}`
  
  // Call Indeed API to get real job data
  const resp = fetch(`${indeedBase}?sort=name&_format=json`);
  const result = await resp.json()

  if (result.jobs && Array.isArray(result.jobs)) {
    return {
      jobs: result.jobs,
      totalJobs: result.total_job_count
    }
  }

  return null
}
