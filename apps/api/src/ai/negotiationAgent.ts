import { ChatOpenAI } from "@langchain/openai";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { z } from "zod";
import { prisma } from "../core/database.js";

const llm = new ChatOpenAI({
  modelName: "gpt-4o-mini",
  temperature: 0.2,
});

const SalaryLookupSchema = z.object({
  benchmarks: z.array(z.object({
    tier: z.string(),
    roleTitle: z.string(),
    location: z.string(),
    minSalary: z.number(),
    medianSalary: z.number(),
    maxSalary: z.number(),
    totalCompMin: z.number(),
    totalCompMedian: z.number(),
    totalCompMax: z.number(),
    yearsExperience: z.string(),
    sampleSize: z.number(),
  })).describe("Salary benchmarks matching the query"),
});

const NegotiationStrategySchema = z.object({
  openingAnchor: z.number().describe("Recommended initial ask (10-20% above target)"),
  targetNumber: z.number().describe("Realistic target based on data"),
  walkAwayPoint: z.number().describe("Minimum acceptable offer"),
  keyNegotiationLevers: z.array(z.object({
    lever: z.string(),
    impact: z.string(),
    priority: z.enum(["high", "medium", "low"]),
  })),
  talkingPoints: z.array(z.object({
    point: z.string(),
    dataSupport: z.string(),
    timing: z.enum(["early", "mid", "closing"]),
  })),
  competingOfferStrategy: z.object({
    shouldUse: z.boolean(),
    howToPresent: z.string(),
    risks: z.array(z.string()),
  }),
  estimatedImprovement: z.string().describe("Expected improvement range (e.g., 8-15%)"),
});

const OfferAnalysisSchema = z.object({
  offerComponents: z.object({
    baseSalary: z.object({
      value: z.number(),
      percentile: z.string().describe("Where does this fall in benchmark (25th, 50th, 75th, etc)"),
      marketMatch: z.string().describe("below-market, market, above-market"),
    }),
    bonus: z.object({
      target: z.number().optional(),
      max: z.number().optional(),
      percentile: z.string(),
    }),
    equity: z.object({
      annualValue: z.number().optional(),
      totalValue: z.number().optional(),
      vestingSchedule: z.string().optional(),
      strikePrice: z.number().optional(),
    }),
    signingBonus: z.number().optional(),
    totalComp: z.object({
      value: z.number(),
      percentile: z.string(),
    }),
  }),
  strengths: z.array(z.string()),
  gaps: z.array(z.object({
    area: z.string(),
    impact: z.string(),
    howToAddress: z.string(),
  })),
  overallAssessment: z.string(),
  recommendedNextSteps: z.array(z.string()),
});

export async function lookupSalaryBenchmarks(
  roleTitle: string,
  location: string,
  yearsExperience: number
): Promise<any> {
  const expBucket = yearsExperience < 1 ? "0-1" 
    : yearsExperience < 3 ? "1-3" 
    : yearsExperience < 5 ? "3-5" 
    : yearsExperience < 10 ? "5-10" 
    : "10+";

  const benchmarks = await prisma.salaryBenchmark.findMany({
    where: {
      roleTitle: { contains: roleTitle, mode: 'insensitive' },
      location: { contains: location, mode: 'insensitive' },
      yearsExperience: expBucket,
    },
    orderBy: { medianSalary: 'desc' },
    take: 10,
  });

  if (benchmarks.length === 0) {
    const fallback = await prisma.salaryBenchmark.findFirst({
      where: {
        roleTitle: { contains: roleTitle, mode: 'insensitive' },
      },
      orderBy: { medianSalary: 'desc' },
    });
    
    if (fallback) {
      return [{
        ...fallback,
        location: location,
        yearsExperience: expBucket,
      }];
    }
  }

  return benchmarks;
}

export async function getCompanyIntelligence(companyName: string): Promise<any> {
  return await prisma.companyIntelligence.findFirst({
    where: {
      name: { contains: companyName, mode: 'insensitive' }
    }
  });
}

export async function generateNegotiationStrategy(
  roleTitle: string,
  location: string,
  yearsExperience: number,
  currentOffer: any,
  competingOffers: any[],
  companyName?: string
): Promise<any> {
  const benchmarks = await lookupSalaryBenchmarks(roleTitle, location, yearsExperience);
  const companyIntel = companyName ? await getCompanyIntelligence(companyName) : null;
  
  const baseSalary = currentOffer?.base || 0;
  const bonus = currentOffer?.bonus || 0;
  const stock = currentOffer?.stock || 0;
  const signing = currentOffer?.signing || 0;
  const currentTotal = baseSalary + bonus + stock + signing;

  const marketMedian = benchmarks[0]?.totalCompMedian || currentTotal;
  const targetNumber = Math.round(marketMedian * 1.1);
  const openingAnchor = Math.round(marketMedian * 1.15);
  const walkAwayPoint = Math.round(marketMedian * 0.95);

  const response = await llm.withStructuredOutput(NegotiationStrategySchema).invoke([
    new SystemMessage(`
      You are a senior technical recruiter and compensation expert. 
      Generate a data-driven negotiation strategy.
      
      INCLUDE:
      1. Specific dollar amounts based on market data
      2. Quantified talking points with data support
      3. Risk assessment for competing offers
      4. Timeline recommendations
      
      COMPANY INTELLIGENCE:
      ${companyIntel ? JSON.stringify(companyIntel) : "No specific company data available"}
    `),
    new HumanMessage(`
      Role: ${roleTitle}
      Location: ${location}
      Experience: ${yearsExperience} years
      Current Offer: ${JSON.stringify(currentOffer)}
      Competing Offers: ${JSON.stringify(competingOffers)}
      Market Benchmarks: ${JSON.stringify(benchmarks)}
      Current Total Comp: ${currentTotal}
      Market Median: ${marketMedian}
    `)
  ]);

  return {
    benchmarkData: benchmarks,
    companyIntel,
    strategy: response,
  };
}

export async function analyzeOffer(
  offerDetails: any,
  roleTitle: string,
  location: string,
  yearsExperience: number
): Promise<any> {
  const benchmarks = await lookupSalaryBenchmarks(roleTitle, location, yearsExperience);
  const marketMedian = benchmarks[0];
  
  const baseSalary = offerDetails.base || 0;
  const bonus = offerDetails.bonus || 0;
  const stock = offerDetails.stock || 0;
  const signing = offerDetails.signing || 0;
  const totalComp = baseSalary + bonus + stock + signing;

  const response = await llm.withStructuredOutput(OfferAnalysisSchema).invoke([
    new SystemMessage(`
      You are a compensation analyst. Analyze the offer against market data.
      Identify specific gaps and provide actionable next steps.
    `),
    new HumanMessage(`
      Offer Details: ${JSON.stringify(offerDetails)}
      Role: ${roleTitle}
      Location: ${location}
      Experience: ${yearsExperience} years
      Market Benchmarks: ${JSON.stringify(benchmarks)}
      Calculated Total: ${totalComp}
    `)
  ]);

  return {
    analysis: response,
    benchmarks,
  };
}

export async function getSalaryDataForRole(
  roleTitle: string,
  location: string,
  yearsExperience: number
): Promise<any> {
  const expBucket = yearsExperience < 1 ? "0-1" 
    : yearsExperience < 3 ? "1-3" 
    : yearsExperience < 5 ? "3-5" 
    : yearsExperience < 10 ? "5-10" 
    : "10+";

  const dbBenchmarks = await prisma.salaryBenchmark.findMany({
    where: {
      roleTitle: { contains: roleTitle, mode: 'insensitive' },
      yearsExperience: expBucket,
    },
    orderBy: { companyTier: 'asc' },
  });

  if (dbBenchmarks.length > 0) {
    return dbBenchmarks;
  }

  const generalRole = roleTitle.toLowerCase().split(' ')[0];
  const fallback = await prisma.salaryBenchmark.findMany({
    where: {
      roleTitle: { contains: generalRole, mode: 'insensitive' },
    },
    take: 5,
  });

  return fallback;
}
