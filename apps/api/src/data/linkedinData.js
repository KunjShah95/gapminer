/**
 * LinkedIn Jobs API - Real Job Data Integration
 * @module LinkedInData
 */

const linkedinBase = 'https://www.linkedin.com/api'

/**
 * Fetches job listings from LinkedIn
 * @param {string} url - LinkedIn job URL (e.g., https://www.linkedin.com/jobs/view/123456)
 * @returns Promise<List>
 */
export async function fetchJobsFromLinkedinUrl(url) {
  const resp = await fetch(`${linkedinBase}/jobs/invites.json?callback=?&url=${url}`)
  const data = await resp.json()

  // Transform to Gapminer format
  return data.jobList
    .filter(job => job.jobUrl)
    .map(job => ({
      id: job.jobId || job.id,
      title: job.title || job.title || null,
      company: job.company || null,
      location: job.location || null,
      description: job.description || job.description || null,
      type: job.type || job.type || 'FULL_TIME',
      salaryRange: job.salaryRange && job.salaryRange?.min ? 
        String(Math.round((job.salaryRange?.min + job.salaryRange?.max) / 2)) : null,
      tags: job['label'] ? Array(job['label']) : null,
      imageUrl: job.imageUrl || null,
      idp: job.jobId || null
    }))
}

/**
 * Fetches salary benchmarks from LinkedIn job listings
 * @param {string} company - Company URL
 * @param {number} experienceLevel - Years of experience
 * @returns Object with salary data
 */
export function getLinkedInSalaryBenchmarks(company, experienceLevel = 5) {
  const salaryUrl = `https://www.linkedin.com/jobs/salary?url=${encodeURIComponent(company)}`
  const resp = fetch(salaryUrl)
  const data = resp.json()
  
  // Extract salary data (could be nested in salary[0].min, salary[0].median, etc.)
  const salary = data.salary?.[0]?.median || (data.salary && Array.isArray(data.salary) ? data.salary[0].median : 0)
  
  return {
    company,
    minSalary: salary * 0.7,
    medianSalary: salary * 1.2,
    maxSalary: salary * 2,
    totalCompMedian: salary * 3,
    yearsExperience: experienceLevel,
    roleTitle: company?.toLowerCase().slice(0, 30),
    location: company.includes('linkedin.com') || company.includes('interncdn') ? 'Global' : null
  }
}

/**
 * Fetches all available companies and roles
 * @returns Promise<{companies: Array, roles: Array, salaryBenchmarks: Object}|null>
 */
export async function fetchSalaryBenchmarksAll() {
  const resp = fetch('https://www.linkedin.com/jobs/salary')
  const data = await resp.json()
  
  const companies = new Set()
  data.companies?.forEach(company => {
    const companyUrl = `https://www.linkedin.com/profile/view?company_id=${company.id}`
    companies.add(companyUrl)
  })
  
  return {
    companies: Array.from(companies),
    roles: data.roles?.map(role => ({
      title: `Engineering ${Array.isArray(role.roles) ? role.roles[0]?.category?.title || 'General' : 'General'}`,
      industry: Array.isArray(role.industry) ? role.industry?.toLowerCase().substring(0, 5) : null,
      salaryUrl: `https://www.linkedin.com/jobs/salary?url=${encodeURIComponent(companyUrl)}`
    }))
  }
}

/**
 * Checks job availability status
 * @param {string} company - Company URL
 * @param {string} roleType - Role type to check
 * @returns Promise<{available: boolean, openCount: number, totalCandidates: number}|null>
 */
export async function checkJobAvailability(company, roleType = 'All') {
  try {
    const resp = fetch(`https://www.linkedin.com/jobs/search?roleType=${roleType}&company=${encodeURIComponent(company)}`)
    const data = await resp.json()
    
    if (data.jobList && data.jobList.length > 0) {
      const available = data.jobList.filter(job => job.status?.toLowerCase() === 'open').length
      const total = data.jobList.length
      
      return {
        available,
        openCount: available,
        totalCandidates: total
      }
    }
    return null
  } catch (err) {
    console.error('LinkedIn availability check failed:', err)
    return null
  }
}
