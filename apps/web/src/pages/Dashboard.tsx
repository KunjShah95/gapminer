import { Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  Search, TrendingUp, Clock, CheckCircle2, ArrowRight,
  FileText, BarChart3, Zap, Plus, ChevronRight,
  LayoutDashboard, FileSearch, GraduationCap, User, Settings,
  LogOut, Bell, Sparkles, Target, Activity, History as HistoryIcon
} from 'lucide-react'
import type { Analysis } from '@gapminer/types'
import { useEffect, useState } from 'react'

interface DashboardAnalysis {
  id: string
  status: string
  overall_score: number
  created_at: string
}

function ScoreCircle({ score }: { score: number | undefined }) {
  const validScore = score ?? 0
  const color = validScore >= 80 ? 'text-primary' : validScore >= 60 ? 'text-tertiary' : 'text-error'
  const bgColor = validScore >= 80 ? 'bg-primary/10' : validScore >= 60 ? 'bg-tertiary/10' : 'bg-error/10'
  
  return (
    <div className={`w-14 h-14 rounded-full ${bgColor} flex items-center justify-center relative group`}>
      <svg className="w-full h-full -rotate-90 absolute">
        <circle
          cx="28" cy="28" r="24"
          fill="none" stroke="currentColor" strokeWidth="4"
          className="text-surface-container-highest"
        />
        <circle
          cx="28" cy="28" r="24"
          fill="none" stroke="currentColor" strokeWidth="4"
          strokeDasharray={2 * Math.PI * 24}
          strokeDashoffset={2 * Math.PI * 24 * (1 - validScore / 100)}
          strokeLinecap="round"
          className={`${color} transition-all duration-1000 ease-out`}
        />
      </svg>
      <span className={`text-sm font-bold skew-x-[-2deg] ${color}`}>{score ?? '-'}</span>
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [analyses, setAnalyses] = useState<DashboardAnalysis[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAnalyses() {
      const token = useAuthStore.getState().token;
      if (!token) {
        console.error('No token found')
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/v1/analysis', {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAnalyses(data)
        }
      } catch (err) {
        console.error('Failed to fetch analyses:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAnalyses()
  }, [])

  const avgScore = analyses.length > 0 
    ? Math.round(analyses.reduce((a, b) => a + (b.overall_score ?? 0), 0) / analyses.length)
    : 0

  return (
    <div className="flex-grow overflow-y-auto">
      <div className="p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Welcome CTA */}
          <div className="relative group overflow-hidden bg-surface-container-highest rounded-[2.5rem] border border-outline-variant/20">
            <div className="absolute top-0 right-0 w-[400px] h-full primary-gradient opacity-10 blur-[80px] -mr-40 pointer-events-none"></div>
            <div className="p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
              <div className="max-w-xl">
                <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest mb-4 inline-block">New Version 2.0</span>
                <h1 className="text-3xl font-extrabold tracking-tighter mb-4 font-headline">Ready for your next analysis?</h1>
                <p className="text-on-surface-variant leading-relaxed font-light mb-6">
                  Our new 5-agent pipeline now supports real-time market indexing. Upload your latest resume to see how you rank against today's top engineering roles.
                </p>
                <Link to="/analyze" className="primary-gradient text-on-primary-fixed px-8 py-3.5 rounded-2xl font-bold inline-flex items-center gap-2 shadow-xl hover:shadow-primary/20 transition-all active:scale-95">
                  <Plus size={20} />
                  Start New Analysis
                </Link>
              </div>
              <div className="flex-shrink-0 grid grid-cols-2 gap-3">
                {[
                  { label: 'Analyses', val: analyses.length, icon: Activity, color: 'text-primary' },
                  { label: 'Avg Match', val: `${avgScore}%`, icon: Target, color: 'text-tertiary' },
                  { label: 'Complete', val: analyses.filter(a => a.status === 'complete').length, icon: Zap, color: 'text-error' },
                  { label: 'Plan', val: user?.plan?.toUpperCase() || 'FREE', icon: Award, color: 'text-secondary' },
                ].map((stat) => (
                  <div key={stat.label} className="glass bg-surface-container p-4 rounded-3xl border border-outline-variant/10 text-center w-32">
                    <stat.icon className={`${stat.color} mx-auto mb-2`} size={18} />
                    <div className="text-lg font-black tracking-tighter">{stat.val}</div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent History */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <HistoryIcon className="text-primary" size={20} />
                  Analysis History
                </h3>
                <Link to="/analyze" className="text-xs font-bold text-primary hover:underline transition-all">View All →</Link>
              </div>
              
              <div className="space-y-4">
                {loading ? (
                  <div className="glass bg-surface-container-high p-6 rounded-[2rem] border border-outline-variant/15 text-center py-12">
                    <div className="animate-pulse text-on-surface-variant">Loading analyses...</div>
                  </div>
                ) : analyses.length === 0 ? (
                  <div className="glass bg-surface-container-high p-6 rounded-[2rem] border border-outline-variant/15 text-center py-12">
                    <p className="text-on-surface-variant mb-4">No analyses yet</p>
                    <Link to="/analyze" className="text-primary font-bold hover:underline">Start your first analysis</Link>
                  </div>
                ) : (
                  analyses.map((analysis) => (
                    <div key={analysis.id} className="glass bg-surface-container-high p-6 rounded-[2rem] border border-outline-variant/15 hover:border-primary/30 transition-all group">
                      <div className="flex items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <ScoreCircle score={analysis.overall_score} />
                          <div>
                            <h4 className="font-bold text-lg mb-1 group-hover:text-primary transition-colors">Job Application Analysis</h4>
                            <div className="flex items-center gap-3 text-xs text-on-surface-variant font-light">
                              <span className="flex items-center gap-1"><Clock size={12} /> {new Date(analysis.created_at).toLocaleDateString()}</span>
                              <span className="w-1 h-1 rounded-full bg-outline/30"></span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                analysis.status === 'complete' ? 'bg-tertiary/20 text-tertiary' : 
                                analysis.status === 'failed' ? 'bg-error/20 text-error' :
                                'bg-primary/20 text-primary'
                              }`}>{analysis.status}</span>
                            </div>
                          </div>
                        </div>
                        {analysis.status === 'complete' && (
                          <Link
                            to={`/analysis/${analysis.id}`}
                            className="glass w-12 h-12 rounded-2xl flex items-center justify-center text-on-surface-variant hover:bg-primary hover:text-on-primary-fixed transition-all border border-outline-variant/20 group-hover:shadow-lg"
                          >
                            <ArrowRight size={20} />
                          </Link>
                        )}
                      </div>
                      {analysis.overall_score !== null && (
                        <div className="mt-4 pt-4 border-t border-outline-variant/10">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-on-surface-variant">Match Percentage</span>
                            <span className={`font-bold ${
                              (analysis.overall_score ?? 0) >= 80 ? 'text-primary' :
                              (analysis.overall_score ?? 0) >= 60 ? 'text-tertiary' : 'text-error'
                            }`}>{analysis.overall_score}%</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Sidebar Widgets */}
            <div className="space-y-8">
              {/* Profile Card */}
              <div className="glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 p-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 primary-gradient opacity-10 rounded-full blur-3xl -tr-10"></div>
                <div className="text-center">
                  <div className="w-20 h-20 rounded-[2rem] primary-gradient mx-auto mb-4 flex items-center justify-center text-on-primary-fixed text-3xl font-black shadow-primary/20 shadow-xl border-4 border-surface">
                    {user?.name?.charAt(0)}
                  </div>
                  <h4 className="font-bold text-xl">{user?.name}</h4>
                  <p className="text-sm text-on-surface-variant font-light mb-6">{user?.plan?.toUpperCase()} Plan Active</p>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-outline px-1">
                      <span>Analysis Usage</span>
                      <span>{user?.analysesUsed} / {user?.analysesLimit}</span>
                    </div>
                    <div className="h-2 w-full bg-surface-container rounded-full overflow-hidden border border-outline-variant/10">
                      <div
                        className="h-full primary-gradient transition-all duration-1000"
                        style={{ width: `${((user?.analysesUsed || 0) / (user?.analysesLimit || 1)) * 100}%` }}
                      ></div>
                    </div>
                  </div>

                  <Link to="/profile" className="w-full glass border border-outline-variant/20 py-3 rounded-2xl font-bold text-sm block hover:bg-surface-container-highest transition-all">
                    Upgrade to Pro
                  </Link>
                </div>
              </div>

              {/* Top Gaps Widget */}
              <div className="glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 p-8">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Zap className="text-error" size={20} />
                  Top Skill Gaps
                </h3>
                <div className="space-y-4">
                  {loading ? (
                    <div className="animate-pulse h-20 bg-surface-container rounded-2xl"></div>
                  ) : (analyses[0] as any)?.top_gaps?.length > 0 ? (
                    (analyses[0] as any).top_gaps.map((gap: any, i: number) => (
                      <div key={i} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${gap.severity === 'critical' ? 'bg-error animate-pulse shadow-[0_0_8px_rgba(255,110,132,0.8)]' : 'bg-tertiary'}`}></div>
                          <span className="text-sm font-semibold group-hover:text-primary transition-colors">{gap.skill}</span>
                        </div>
                        <span className="text-[10px] font-bold text-outline opacity-60 uppercase tracking-tighter">{gap.market_demand || 0}% Demand</span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-on-surface-variant text-center py-4">No gaps identified yet.</p>
                  )}
                </div>
                {analyses.length > 0 && (
                  <Link to={`/roadmap/${analyses[0].id}`} className="w-full mt-6 text-xs font-bold text-primary hover:underline text-center block">
                    Explore Details →
                  </Link>
                )}
              </div>

              {/* Resume Vault */}
              <div className="glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 p-8">
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <FileText className="text-primary" size={20} />
                  Latest Resume
                </h3>
                <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/10 flex items-center gap-4 hover:border-primary/20 transition-all cursor-pointer">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <FileSearch size={20} />
                  </div>
                  <div className="overflow-hidden">
                    <div className="text-xs font-bold truncate">Default Analysis Resume</div>
                    <div className="text-[10px] text-outline">Used in {analyses.length} reports</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
      </div>
    </div>
  )
}

function Award(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="8" r="6" />
      <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" />
    </svg>
  )
}
