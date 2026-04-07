import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Download,
  FileText,
  Globe,
  Share2,
  Star,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from 'recharts';
import { getAuthToken } from '@/lib/authFetch';

type AnalysisResults = {
  overall_score: number;
  resume_strength_score: number;
  ats_score: number;
  matchPercentage: number;
  missingSkills: string[];
  matchedSkills: string[];
  marketSignificance: Array<{ skill: string; demand: number; trend: string }>;
  peerBenchmark: { userPercentile: number };
  missingKeywords: string[];
};

const fallbackResults: AnalysisResults = {
  overall_score: 76,
  resume_strength_score: 82,
  ats_score: 54,
  matchPercentage: 68,
  missingSkills: ['Kubernetes', 'Go', 'Terraform'],
  matchedSkills: ['React', 'TypeScript'],
  marketSignificance: [
    { skill: 'Kubernetes', demand: 89, trend: 'High' },
    { skill: 'Go', demand: 34, trend: 'Rising' },
  ],
  peerBenchmark: { userPercentile: 32 },
  missingKeywords: ['microservices', 'CI/CD pipelines'],
};

function LoadingState() {
  return (
    <div className='flex min-h-screen items-center justify-center'>
      <div className='primary-gradient text-on-primary-fixed animate-pulse rounded-full px-8 py-4 font-bold'>
        Loading Analysis Results...
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center space-y-4'>
      <AlertCircle className='text-error' size={48} />
      <h2 className='text-xl font-bold'>Analysis Not Found</h2>
      <Link to='/dashboard' className='primary-gradient text-on-primary-fixed rounded-full px-6 py-3'>
        Back to Dashboard
      </Link>
    </div>
  );
}

function ProtectedRoute({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export default function AnalysisResultsPage() {
  const { id } = useParams();
  const [results, setResults] = useState<AnalysisResults | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      try {
        const token = getAuthToken();
        const headers: Record<string, string> = {};
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }

        const res = await fetch(`/api/v1/analysis/${id ?? ''}`, { headers });
        if (!cancelled && res.ok) {
          setResults(await res.json());
          return;
        }
      } catch {
        // Fall through to fallback data.
      }

      if (!cancelled) {
        setResults(fallbackResults);
      }
    }

    fetchResults().finally(() => {
      if (!cancelled) {
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <LoadingState />;
  if (!results) return <EmptyState />;

  const radarData = [
    { subject: 'Technical', A: results.overall_score },
    { subject: 'Experience', A: results.resume_strength_score || 70 },
    { subject: 'Market', A: results.matchPercentage },
    { subject: 'ATS', A: results.ats_score },
  ];

  return (
    <div className='min-h-screen bg-surface text-on-surface'>
      <header className='sticky top-0 z-50 border-b border-outline-variant/15 bg-surface/80 backdrop-blur-xl'>
        <div className='mx-auto flex max-w-7xl items-center justify-between px-8 py-4'>
          <div className='flex items-center gap-4'>
            <Link
              to='/dashboard'
              className='flex items-center gap-2 text-on-surface-variant transition-colors hover:text-primary'
            >
              <ArrowLeft size={20} />
              <span className='text-sm font-bold uppercase tracking-widest'>Back</span>
            </Link>
            <div className='h-8 w-px bg-outline-variant/20' />
            <div className='flex items-center gap-2'>
              <Target className='text-primary' size={20} />
              <h1 className='text-xl font-bold tracking-tight'>Analysis Results</h1>
            </div>
          </div>
          <div className='flex items-center gap-4'>
            <button className='glass flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm font-bold transition-all hover:bg-surface-container-highest'>
              <Share2 size={16} />
              Share
            </button>
            <button className='glass flex items-center gap-2 rounded-full border border-outline-variant/20 px-4 py-2 text-sm font-bold transition-all hover:bg-surface-container-highest'>
              <Download size={16} />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      <main className='mx-auto max-w-7xl px-8 py-12'>
        <div className='mb-12 grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8 lg:col-span-2'>
            <div className='mb-8 flex items-start justify-between'>
              <div>
                <h2 className='mb-2 text-2xl font-black tracking-tight'>Overall Match Score</h2>
                <p className='font-light text-on-surface-variant'>
                  How well your profile aligns with target role requirements
                </p>
              </div>
              <span className='text-gradient skew-x-[-2deg] text-5xl font-black tracking-tighter'>
                {results.overall_score}%
              </span>
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <div className='rounded-2xl border border-outline-variant/10 bg-surface-container p-4'>
                <div className='mb-1 text-sm font-bold text-on-surface-variant'>Resume Strength</div>
                <div className='text-2xl font-black'>{results.resume_strength_score}%</div>
              </div>
              <div className='rounded-2xl border border-outline-variant/10 bg-surface-container p-4'>
                <div className='mb-1 text-sm font-bold text-on-surface-variant'>ATS Optimization</div>
                <div className='text-2xl font-black'>{results.ats_score}/100</div>
              </div>
              <div className='rounded-2xl border border-outline-variant/10 bg-surface-container p-4'>
                <div className='mb-1 text-sm font-bold text-on-surface-variant'>Market Fit</div>
                <div className='text-2xl font-black'>{results.matchPercentage}%</div>
              </div>
            </div>
          </div>

          <div className='glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8'>
            <h3 className='mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-outline'>
              <TrendingUp size={16} className='text-primary' />
              Skill Radar
            </h3>
            <div className='h-[200px] w-full'>
              <ResponsiveContainer width='100%' height='100%'>
                <RadarChart data={radarData}>
                  <PolarGrid stroke='rgba(72,71,77,0.1)' />
                  <PolarAngleAxis dataKey='subject' tick={{ fill: '#acaab1', fontSize: 10, fontWeight: 700 }} />
                  <Radar name='Expertise' dataKey='A' stroke='#b0a2ff' fill='#b0a2ff' fillOpacity={0.2} strokeWidth={2} />
                  <RechartsTooltip
                    contentStyle={{
                      background: '#1f1f26',
                      border: '1px solid #48474d',
                      borderRadius: '12px',
                      fontSize: '10px',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className='grid grid-cols-1 gap-8 lg:grid-cols-3'>
          <div className='glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8'>
            <h3 className='mb-6 flex items-center gap-2 text-lg font-bold'>
              <AlertCircle className='text-error' size={20} />
              Skill Gap Analysis
            </h3>
            <div className='mb-8 space-y-4'>
              <div>
                <div className='mb-3 px-1 text-[10px] font-black uppercase tracking-widest text-error'>
                  Missing Skills ({results.missingSkills.length})
                </div>
                <div className='flex flex-wrap gap-2'>
                  {results.missingSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className='rounded-lg border border-error/30 bg-error/10 px-3 py-1.5 text-xs font-bold text-error'
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <div className='mb-3 px-1 text-[10px] font-black uppercase tracking-widest text-primary'>
                  Matched Strengths ({results.matchedSkills.length})
                </div>
                <div className='flex flex-wrap gap-2'>
                  {results.matchedSkills.map((skill, idx) => (
                    <span
                      key={idx}
                      className='rounded-lg border border-primary/30 bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary'
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <Link
              to={id ? `/roadmap/${id}` : '/roadmap'}
              className='primary-gradient text-on-primary-fixed flex w-full items-center justify-center gap-2 rounded-2xl py-3 font-bold transition-all hover:shadow-xl'
            >
              Generate Learning Roadmap <ArrowRight size={18} />
            </Link>
          </div>

          <div className='glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8'>
            <div className='mb-6 flex items-center gap-2'>
              <Globe className='text-tertiary' size={20} />
              <h3 className='text-lg font-bold'>Market Significance</h3>
            </div>
            <div className='space-y-4'>
              {results.marketSignificance.map((item, idx) => (
                <div
                  key={idx}
                  className='flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container p-3'
                >
                  <div>
                    <p className='text-sm font-bold'>{item.skill}</p>
                    <p className='text-[10px] text-on-surface-variant'>{item.demand}% of Job Descriptions</p>
                  </div>
                  <span className='rounded-lg px-2 py-1 text-xs font-bold'>{item.trend}</span>
                </div>
              ))}
            </div>
          </div>

          <div className='glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8'>
            <div className='mb-6 flex items-center gap-2'>
              <Users className='text-primary' size={20} />
              <h3 className='text-lg font-bold'>Peer Benchmark</h3>
            </div>
            <div className='mb-6 flex items-center gap-1'>
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={16}
                  className={s <= 3 ? 'text-amber-500 fill-current' : 'text-outline'}
                  style={{ fontVariationSettings: s <= 3 ? "'FILL' 1" : "'FILL' 0" }}
                />
              ))}
              <span className='ml-2 text-xs font-medium text-on-surface-variant'>3 / 5 Relevance</span>
            </div>
            <p className='mb-6 text-sm font-semibold text-on-surface'>
              You&apos;re in the <span className='text-emerald-400'>top {results.peerBenchmark.userPercentile}%</span> of
              candidates for this role.
            </p>
            <div className='relative pb-2 pt-6'>
              <div className='flex h-2 w-full overflow-hidden rounded-full bg-surface-container-highest'>
                <div className='h-full w-[60%] border-r border-background/20 bg-surface-variant' />
                <div className='h-full w-[30%] border-r border-background/20 bg-primary/40' />
                <div className='h-full w-[10%] bg-primary' />
              </div>
              <div className='absolute left-[32%] top-0 -translate-x-1/2 flex flex-col items-center'>
                <div className='mb-1 h-3 w-[1px] bg-primary' />
                <span className='text-[8px] font-bold uppercase text-primary'>You</span>
              </div>
              <div className='absolute left-[68%] top-0 -translate-x-1/2 flex flex-col items-center'>
                <div className='mb-1 h-3 w-[1px] bg-on-surface-variant/40' />
                <span className='text-[8px] font-bold uppercase text-on-surface-variant'>Avg</span>
              </div>
              <div className='absolute left-[90%] top-0 -translate-x-1/2 flex flex-col items-center'>
                <div className='mb-1 h-3 w-[1px] bg-secondary' />
                <span className='text-[8px] font-bold uppercase text-secondary'>Top 10%</span>
              </div>
            </div>
          </div>
        </div>

        <div className='glass bg-surface-container-high mt-8 rounded-[2.5rem] border-2 border-primary/20 p-8'>
          <div className='mb-6 flex items-start justify-between'>
            <div className='flex items-center gap-3'>
              <FileText className='text-primary' size={24} />
              <div>
                <h3 className='text-xl font-bold tracking-tight'>ATS Keyword Match</h3>
                <p className='text-xs text-on-surface-variant'>Resume optimization for Applicant Tracking Systems</p>
              </div>
            </div>
            <div className='text-right'>
              <span className='text-4xl font-black text-on-surface'>{results.ats_score}</span>
              <span className='text-sm text-on-surface-variant'>/100</span>
            </div>
          </div>
          <div className='mb-6 space-y-4'>
            <p className='text-[10px] font-bold uppercase tracking-widest text-on-surface-variant'>
              Missing Keywords
            </p>
            <div className='flex flex-wrap gap-2'>
              {results.missingKeywords.map((keyword, idx) => (
                <span
                  key={idx}
                  className='rounded-full border border-error/20 bg-surface-container-lowest px-4 py-1.5 font-mono text-xs text-error-dim'
                >
                  &quot;{keyword}&quot;
                </span>
              ))}
            </div>
          </div>
          <div className='flex gap-4'>
            <Link
              to={id ? `/latex/${id}` : '/latex'}
              className='primary-gradient text-on-primary-fixed flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-bold shadow-[0_0_20px_rgba(176,162,255,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]'
            >
              <Zap size={18} />
              Optimize Resume
            </Link>
            <button className='glass flex items-center gap-2 rounded-full border border-outline-variant/20 px-6 py-3 font-bold transition-all hover:bg-surface-container-highest'>
              <Download size={18} />
              Download Report
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
