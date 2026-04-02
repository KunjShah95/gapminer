// Central config — reads from .env, provides typed defaults
// Mirrors pydantic-settings Settings class from config.py

const parseList = (val, defaults) => {
  if (!val) return defaults;
  try {
    return JSON.parse(val);
  } catch {
    return val.split(",").map((s) => s.trim());
  }
};

export const config = {
  // App
  APP_NAME: process.env.APP_NAME ?? "GapMiner",
  DEBUG: process.env.DEBUG === "true",
  PORT: parseInt(process.env.PORT ?? "8000", 10),
  SECRET_KEY:
    process.env.SECRET_KEY ?? "change-me-in-production-use-secrets-manager",
  ACCESS_TOKEN_EXPIRE_MINUTES: parseInt(
    process.env.ACCESS_TOKEN_EXPIRE_MINUTES ?? String(60 * 24 * 7),
    10,
  ),

  // Database (Postgres)
  DATABASE_URL:
    process.env.DATABASE_URL ??
    "postgresql://postgres:postgres@localhost:5432/gapminer",

  // Redis (future use)
  REDIS_URL: process.env.REDIS_URL ?? "redis://localhost:6379/0",

  // Ollama
  OLLAMA_BASE_URL: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
  OLLAMA_MODEL: process.env.OLLAMA_MODEL ?? "llama3.1:8b",

  // Storage
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID ?? "",
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY ?? "",
  AWS_BUCKET_NAME: process.env.AWS_BUCKET_NAME ?? "gapminer-resumes",
  AWS_REGION: process.env.AWS_REGION ?? "us-east-1",

  // Auth
  AUTH_PROVIDER: process.env.AUTH_PROVIDER ?? "internal",
  SUPABASE_URL: process.env.SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY ?? "",

  // CORS
  CORS_ORIGINS: parseList(process.env.CORS_ORIGINS, [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://gapminer.dev",
  ]),

  // Monitoring
  SENTRY_DSN: process.env.SENTRY_DSN ?? "",

  // Encryption / retention
  RESUME_ENCRYPTION_KEY:
    process.env.RESUME_ENCRYPTION_KEY ?? "generate-32-byte-key-in-production",
  RESUME_RETENTION_DAYS: parseInt(
    process.env.RESUME_RETENTION_DAYS ?? "30",
    10,
  ),

  // Firecrawl (Web Scraping)
  FIRECRAWL_API_KEY: process.env.FIRECRAWL_API_KEY ?? "",

  // SERP API (for job searches)
  SERP_API_KEY: process.env.SERP_API_KEY ?? "",

  // OpenAI (for Whisper and GPT-4)
  OPENAI_API_KEY: process.env.OPENAI_API_KEY ?? "",

  // Transformers (HuggingFace)
  TRANSFORMERS_CACHE_DIR: process.env.TRANSFORMERS_CACHE_DIR ?? "./models",
  TRANSFORMERS_NER_MODEL:
    process.env.TRANSFORMERS_NER_MODEL ?? "Xenova/bert-base-NER",
  TRANSFORMERS_EMBEDDING_MODEL:
    process.env.TRANSFORMERS_EMBEDDING_MODEL ?? "Xenova/all-MiniLM-L6-v2",
  TRANSFORMERS_GENERATION_MODEL:
    process.env.TRANSFORMERS_GENERATION_MODEL ?? "Xenova/LaMini-Flan-T5-783m",

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ?? "",
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY ?? "",
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  STRIPE_PRICE_PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY ?? "",
  STRIPE_PRICE_TEAMS_MONTHLY: process.env.STRIPE_PRICE_TEAMS_MONTHLY ?? "",
  FRONTEND_URL: process.env.FRONTEND_URL ?? "http://localhost:3000",
};
