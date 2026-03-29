# Gapminer

## Precision AI Career Intelligence Platform

Gapminer is an AI-powered career development platform that helps professionals identify skill gaps, benchmark against job market requirements, and generate personalized learning roadmaps. It uses a multi-agent AI orchestrator to analyze resumes and job descriptions, providing actionable insights in under 60 seconds.

## Features

### Core Analysis Engine

- **Multi-Agent Pipeline**: 5 specialized AI agents working in parallel:
  - Document Parser: Extracts and normalizes resume/job description content
  - Skill Extractor: Identifies skills, technologies, and competencies
  - Gap Analyzer: Compares candidate profile against job requirements
  - Market Intelligence: Provides salary insights and demand data
  - Roadmap Generator: Creates personalized learning paths

- **Resume Analysis**: Upload PDF/DOCX or paste text for instant analysis
- **Job Description Scraping**: Paste LinkedIn, Indeed, or company career page URLs
- **Skill Gap Visualization**: Radar charts showing competency coverage across domains
- **Peer Benchmarking**: Compare your profile against other candidates
- **ATS Optimization**: Keyword matching and scoring

### Career Tools

- **Personalized Roadmaps**: Week-by-week learning plans with curated resources
- **LaTeX Resume Editor**: AI-assisted professional resume builder with live preview
- **Interview Simulation**: Practice technical interviews with AI feedback
- **Negotiation Companion**: Salary benchmarks and negotiation strategies
- **Recruiter Dashboard**: Enterprise talent intelligence and candidate ranking

### Privacy-First Architecture

- All AI processing runs via local Ollama instances
- 100% encrypted data transmission
- Auto-deletion of resumes after 30 days

## Tech Stack

| Layer                | Technology                              |
| -------------------- | --------------------------------------- |
| **Frontend**         | React 18, TypeScript, Vite, TailwindCSS |
| **State Management** | Zustand, React Query                    |
| **UI Components**    | Framer Motion, Recharts, Lucide Icons   |
| **Backend API**      | FastAPI (Python), Prisma ORM            |
| **Database**         | PostgreSQL 16                           |
| **Caching**          | Redis 7                                 |
| **AI Engine**        | Ollama (local LLM)                      |
| **Infrastructure**   | Docker, Kubernetes, Terraform           |

## Project Structure

```text
gapminer/
├── apps/
│   ├── web/                 # React frontend application
│   │   ├── src/
│   │   │   ├── pages/       # Page components (Landing, Dashboard, Analyzer, etc.)
│   │   │   ├── stores/      # Zustand state stores
│   │   │   ├── lib/         # Utilities
│   │   │   └── main.tsx     # App entry point
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   └── api/                 #  backend
│       ├── src/
│       │   ├── ai/          # Multi-agent pipeline implementation
│       │   ├── api/         # REST endpoints
│       │   ├── core/        # Configuration and utilities
│       │   └── services/    # Business logic
│       ├── prisma/          # Database schema
│       └── package.json
│
├── packages/
│   └── types/               # Shared TypeScript type definitions
│
├── infra/
│   ├── docker-compose.yml   # Local development environment
│   ├── k8s/                 # Kubernetes manifests
│   └── terraform/           # Cloud infrastructure (Azure)
│
├── package.json             # Root workspace config
├── turbo.json               # Turborepo configuration
└── README.md
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- Docker & Docker Compose
- 4GB+ available RAM (for Ollama)

### Quick Start

1. **Clone and install dependencies**

   ```bash
   cd gapminer
   npm install
   ```

2. **Start the development environment**

   ```bash
   docker-compose up -d
   ```

3. **Run the application**

   ```bash
   # Development mode with hot reload
   npm run dev

   # Or run specific apps
   npm run web     # Frontend only (port 5173)
   npm run api     # Backend only (port 8000)
   ```

4. **Access the application**
   - Frontend: <http://localhost:5173>
   - API: <http://localhost:8000>
   - API Docs: <http://localhost:8000/docs>

### Available Scripts

| Command         | Description                            |
| --------------- | -------------------------------------- |
| `npm run dev`   | Start all apps in development mode     |
| `npm run build` | Build all apps for production          |
| `npm run lint`  | Run linting across all packages        |
| `npm run test`  | Run tests                              |
| `npm run clean` | Clean build artifacts and node_modules |

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get JWT token

### Analysis

- `POST /api/v1/agent/analyze` - Start resume/job analysis
- `GET /api/v1/analysis` - List user's analyses
- `GET /api/v1/analysis/:id` - Get analysis details

### Resume

- `POST /api/v1/agent/parse` - Parse resume document
- `GET /api/v1/resumes` - List user's resumes
- `POST /api/v1/resumes` - Upload new resume

### Job Descriptions

- `POST /api/v1/agent/scrape` - Scrape job description from URL
- `GET /api/v1/jobs` - List saved job descriptions

### Roadmaps

- `GET /api/v1/roadmaps/:id` - Get roadmap details
- `PUT /api/v1/roadmaps/:id/progress` - Update milestone status

## Pricing Plans

| Plan      | Price  | Features                                              |
| --------- | ------ | ----------------------------------------------------- |
| **Free**  | $0/mo  | 1 analysis/month, basic radar chart                   |
| **Pro**   | $12/mo | Unlimited analysis, ATS optimizer, verified resources |
| **Teams** | $49/mo | Up to 10 members, market intelligence dashboard       |

## Architecture

### Multi-Agent Pipeline Flow

```diagram
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Document  │────▶│    Skill    │────▶│    Gap      │────▶│    Market   │────▶│   Roadmap   │
│   Parser    │     │   Extractor │     │   Analyzer  │     │Intelligence │     │  Generator  │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
      │                   │                   │                   │                   │
      ▼                   ▼                   ▼                   ▼                   ▼
   Extracts            Identifies         Compares           Enriches with       Generates
   text, formatting    skills, tech,      against job       salary, demand      personalized
   and experience      competencies      requirements      data                learning path
```

### Data Privacy

- All AI inference runs on local Ollama instances (no data leaves your infrastructure)
- PostgreSQL stores user data with encrypted passwords
- Redis caches session data with configurable TTL
- Resume files are auto-deleted after 30 days (configurable)

## Deployment

### Production Deployment (Azure)

```bash
# Infrastructure setup
cd infra/terraform
terraform init
terraform plan -var="environment=prod"
terraform apply

# Build and deploy
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml push
```

### Kubernetes Deployment

```bash
kubectl apply -f infra/k8s/
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

- Documentation: <https://docs.gapminer.ai>
- Issues: <https://github.com/gapminer/issues>
- Email: <support@gapminer.ai>
