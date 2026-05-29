# Attempt to enable pgvector on local PostgreSQL for Gapminer.
# PostgreSQL 18 on Windows requires a matching pgvector build from:
# https://github.com/pgvector/pgvector/releases
#
# Usage (from repo root):
#   $env:PGPASSWORD = 'YOUR_PASSWORD'
#   .\apps\api\scripts\setup-pgvector.ps1 -Database gapminer_prod

param(
  [string]$Database = "gapminer_prod",
  [string]$User = "postgres",
  [string]$Host = "localhost",
  [int]$Port = 5432
)

$ErrorActionPreference = "Stop"

Write-Host "Gapminer pgvector setup" -ForegroundColor Cyan
Write-Host "Database: $Database on ${Host}:${Port}"

$extCheck = & psql -U $User -h $Host -p $Port -d $Database -tAc "SELECT 1 FROM pg_available_extensions WHERE name = 'vector';" 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host "psql failed. Ensure PostgreSQL bin is on PATH and PGPASSWORD is set." -ForegroundColor Red
  exit 1
}

if (-not $extCheck.Trim()) {
  Write-Host ""
  Write-Host "pgvector is NOT available in this PostgreSQL installation." -ForegroundColor Yellow
  Write-Host "Gapminer will use JSONB embeddings + pg_cosine_similarity (already working)."
  Write-Host ""
  Write-Host "To install native pgvector on Windows:" -ForegroundColor White
  Write-Host "  1. Download pgvector release matching your PostgreSQL major version"
  Write-Host "  2. Copy vector.dll to PostgreSQL lib/ and vector.control + vector--*.sql to share/extension/"
  Write-Host "  3. Re-run this script"
  Write-Host ""
  exit 0
}

& psql -U $User -h $Host -p $Port -d $Database -c "CREATE EXTENSION IF NOT EXISTS vector;"
if ($LASTEXITCODE -ne 0) {
  Write-Host "CREATE EXTENSION failed — DLL may be missing from PostgreSQL lib folder." -ForegroundColor Red
  exit 1
}

& psql -U $User -h $Host -p $Port -d $Database -c @"
ALTER TABLE resumes ADD COLUMN IF NOT EXISTS embedding vector(384);
ALTER TABLE job_descriptions ADD COLUMN IF NOT EXISTS embedding vector(384);
"@

Write-Host "pgvector enabled. Restart the API and run: npm run db:init" -ForegroundColor Green
