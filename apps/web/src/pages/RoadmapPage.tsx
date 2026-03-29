import { useParams, Link } from 'react-router-dom'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Tooltip as RechartsTooltip
} from 'recharts'
import {
  Map, Download, Share2, BookOpen, Youtube, Globe,
  CheckCircle2, Circle, Clock, TrendingUp, Award,
  ChevronRight, ArrowLeft, Zap, Star, ExternalLink,
  Target, BarChart3, Shield, Activity, GraduationCap
} from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import type { RoadmapMilestone, SkillGap } from '@gapminer/types'

interface AnalysisData {
  id: string
  status: string
  overall_score: number | null
  resume_strength_score: number | null
  ats_score: number | null
  seniority: string
  resumeData?: any
  jdData?: any
  gapAnalysis?: {
    missingSkills?: string[]
    criticalGaps?: string[]
    matchedSkills?: string[]
    matchPercentage?: number
    experienceGap?: string
  }
  roadmap?: {
    steps?: Array<{
      title: string
      description: string
      estimatedTime: string
      week: number
      skills: string[]
      resources: Array<{
        title: string
        url: string
        type: 'video' | 'course' | 'documentation' | 'book' | 'project'
        provider: string
        estimatedHours: number
        isFree: boolean
      }>
    }>
  }
  skillGaps?: any[]
  created_at: string
}

const resourceTypeIcon = (type: string) => {
  switch (type) {
    case 'video': return { icon: Youtube, color: 'text-error' }
    case 'course': return { icon: BookOpen, color: 'text-primary' }
    case 'documentation': return { icon: Globe, color: 'text-tertiary' }
    case 'book': return { icon: Star, color: 'text-secondary' }
    case 'project': return { icon: Zap, color: 'text-primary' }
    default: return { icon: Globe, color: 'text-outline' }
  }
}

function MilestoneCard({ milestone, index }: { milestone: RoadmapMilestone; index: number }) {
  const [expanded, setExpanded] = useState(index === 0)
  const [status, setStatus] = useState<'not_started' | 'learning' | 'completed'>(milestone.status)

  const statusColors = {
    not_started: 'text-outline',
    learning: 'text-tertiary',
    completed: 'text-primary',
  }

  return (
    <div className={`flex gap-6 group ${status === 'completed' ? 'opacity-80' : ''}`}>
      <div className="flex flex-col items-center">
        <div className="w-12 h-12 rounded-2xl bg-surface-container-highest border border-outline-variant/20 flex flex-col items-center justify-center text-[10px] font-black uppercase tracking-tighter leading-none">
          <span className="text-outline">Wk</span>
          <span className="text-on-surface text-lg">{milestone.week}</span>
        </div>
        <div className="w-px flex-grow bg-outline-variant/20 my-2 group-last:hidden" />
      </div>

      <div className="flex-grow pb-12">
        <div className={`glass bg-surface-container-high rounded-[2rem] border border-outline-variant/15 transition-all overflow-hidden ${expanded ? 'shadow-2xl' : 'hover:border-primary/30 cursor-pointer'}`}>
          <div className="p-6 md:p-8" onClick={() => setExpanded(!expanded)}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-bold text-xl font-headline tracking-tighter">{milestone.title}</h3>
                  <span className={`px-2 py-0.5 rounded-lg bg-surface-container text-[9px] font-black uppercase tracking-widest border border-outline-variant/10 ${statusColors[status]}`}>
                    {status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant font-light">
                  <span className="flex items-center gap-1"><Clock size={12} /> {milestone.estimatedHours}h Total</span>
                  <span className="flex items-center gap-1"><BookOpen size={12} /> {milestone.resources.length} Modules</span>
                </div>
              </div>
              <button
                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${status === 'completed' ? 'primary-gradient text-on-primary-fixed' : 'glass border border-outline-variant/20 text-outline hover:text-primary'}`}
                onClick={(e) => { e.stopPropagation(); setStatus(status === 'completed' ? 'not_started' : status === 'learning' ? 'completed' : 'learning') }}
              >
                {status === 'completed' ? <CheckCircle2 size={20} /> : status === 'learning' ? <Activity size={20} className="animate-pulse" /> : <Circle size={20} />}
              </button>
            </div>

            {expanded && (
              <div className="mt-8 animate-in fade-in slide-in-from-top-2 duration-500">
                <p className="text-sm text-on-surface-variant leading-relaxed font-light mb-8 lg:max-w-2xl">
                  {milestone.description}
                </p>

                <div className="flex flex-wrap gap-2 mb-8">
                  {milestone.skills.map(s => (
                    <span key={s} className="px-3 py-1.5 rounded-xl bg-surface-container border border-outline-variant/10 text-[10px] font-bold text-on-surface uppercase tracking-tighter">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-outline uppercase tracking-widest px-1">Curated Resources</h4>
                  {milestone.resources.map(res => {
                    const { icon: Icon, color } = resourceTypeIcon(res.type)
                    return (
                      <a
                        key={res.title}
                        href={res.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-4 p-4 rounded-[1.5rem] bg-surface-container-lowest border border-outline-variant/10 hover:border-primary/20 transition-all group/res"
                      >
                        <div className={`w-10 h-10 rounded-xl bg-surface-container flex items-center justify-center ${color}`}>
                          <Icon size={18} />
                        </div>
                        <div className="flex-grow">
                          <div className="text-sm font-bold group-hover/res:text-primary transition-colors">{res.title}</div>
                          <div className="text-[10px] text-outline font-medium tracking-wide flex items-center gap-2">
                            <span>{res.provider}</span>
                            <span className="w-1 h-1 rounded-full bg-outline/20"></span>
                            <span>{res.estimatedHours}h</span>
                            <span className="w-1 h-1 rounded-full bg-outline/20"></span>
                            <span className={res.isFree ? 'text-primary' : 'text-secondary'}>{res.isFree ? 'FREE' : 'PAID'}</span>
                          </div>
                        </div>
                        <ExternalLink size={14} className="text-outline group-hover/res:text-primary transition-colors" />
                      </a>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function RoadmapPage() {
  const { id } = useParams()
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchAnalysis() {
      const token = localStorage.getItem('token')
      if (!token || !id) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/v1/analysis/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          setAnalysis(data)
        } else {
          setError('Analysis not found')
        }
      } catch (err) {
        setError('Failed to load analysis')
      } finally {
        setLoading(false)
      }
    }
    fetchAnalysis()
  }, [id])

  const radarData = useMemo(() => {
    if (!analysis?.skillGaps || analysis.skillGaps.length === 0) {
      return []
    }
    return analysis.skillGaps.slice(0, 6).map(g => ({
      subject: g.skill,
      A: g.radar_score || 0,
      fullMark: 100
    }))
  }, [analysis])

  const milestones: RoadmapMilestone[] = useMemo(() => {
    return (analysis as any)?.roadmap?.steps?.map((step: any, i: number) => ({
      id: `ms_${i + 1}`,
      week: step.week || i + 1,
      title: step.title,
      description: step.description,
      skills: step.skills || [],
      resources: step.resources || [],
      estimatedHours: parseInt(step.estimatedTime) || 10,
      status: 'not_started' as const
    })) || []
  }, [analysis])

  const missing = analysis?.gapAnalysis?.missingSkills || []
  const matchPercentage = analysis?.gapAnalysis?.matchPercentage ?? analysis?.overall_score ?? 0

  if (loading) {
    return (
      <div className="bg-surface text-on-surface min-h-screen font-body flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-on-surface-variant">Loading analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !analysis) {
    return (
      <div className="bg-surface text-on-surface min-h-screen font-body flex items-center justify-center">
        <div className="text-center">
          <p className="text-error mb-4">{error || 'Analysis not found'}</p>
          <Link to="/dashboard" className="text-primary hover:underline">Go to Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-grow overflow-y-auto">
      <main className="py-12 px-8 max-w-7xl mx-auto">
        {/* Page Actions */}
        <div className="flex justify-between items-center mb-12 animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="w-10 h-10 rounded-xl glass border border-outline-variant/10 flex items-center justify-center text-outline hover:text-primary transition-all">
              <ArrowLeft size={18} />
            </Link>
            <div className="h-8 w-px bg-outline-variant/15"></div>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-on-primary-fixed shadow-lg shadow-primary/20">
                <GraduationCap size={18} />
              </div>
              <div>
                <h2 className="text-lg font-black tracking-tight skew-x-[-2deg]">Gap Analysis</h2>
                <p className="text-[10px] text-primary uppercase font-black tracking-widest">{analysis.seniority} Tier</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button className="glass px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-outline-variant/20 hover:bg-surface-container-highest transition-all flex items-center gap-2">
              <Share2 size={14} /> Share
            </button>
            <button className="primary-gradient text-on-primary-fixed px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:shadow-primary/20 transition-all flex items-center gap-2">
              <Download size={14} /> Export
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          
          {/* Timeline Section */}
          <div className="lg:col-span-2 space-y-12 animate-in fade-in slide-in-from-left-4 duration-700">
            <div>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mb-4 font-headline">Personalized Roadmap</h1>
              <p className="text-on-surface-variant font-light max-w-xl">
                {milestones.length > 0 
                  ? `Your personalized ${milestones.length}-step learning path to bridge the gap and land your target role.`
                  : 'Complete an analysis to see your personalized roadmap.'}
              </p>
            </div>

            <div className="space-y-4">
              {milestones.length > 0 ? milestones.map((ms, i) => (
                <MilestoneCard key={ms.id} milestone={ms} index={i} />
              )) : (
                <div className="glass bg-surface-container-high p-8 rounded-[2rem] text-center">
                  <p className="text-on-surface-variant">No roadmap generated yet. Run an analysis first.</p>
                </div>
              )}
            </div>

            {milestones.length > 0 && (
              <div className="glass bg-primary/5 p-10 rounded-[2.5rem] border border-primary/20 text-center relative overflow-hidden group">
                <div className="absolute inset-0 primary-gradient opacity-5 animate-pulse"></div>
                <div className="relative z-10 flex flex-col items-center">
                  <Award className="text-primary mb-4" size={48} />
                  <h3 className="text-2xl font-bold font-headline tracking-tight mb-2">Certification Project</h3>
                  <p className="text-sm text-on-surface-variant font-light mb-8 max-w-md">
                    Complete a project implementing these skills to validate your roadmap.
                  </p>
                  <button className="primary-gradient text-on-primary-fixed px-8 py-3.5 rounded-2xl font-black text-sm shadow-xl hover:shadow-primary/20 transition-all active:scale-[0.98]">
                    Initialize Capstone
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Analysis Sidebar */}
          <aside className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-700">
            {/* Score Card */}
            <div className="glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 primary-gradient opacity-10 rounded-full blur-3xl"></div>
              <div className="text-center">
                <div className="text-[10px] font-black text-outline uppercase tracking-widest mb-6">Aggregate Match</div>
                <div className="text-6xl font-black tracking-tighter text-gradient mb-2 skew-x-[-2deg]">{matchPercentage}%</div>
                <div className="text-xs font-bold text-primary bg-primary/10 py-1 px-3 rounded-full inline-block mb-10 tracking-widest uppercase">{analysis.seniority} Tier</div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/10">
                    <div className="text-xl font-black">{analysis.resume_strength_score ?? '-'}%</div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-tighter">Resume</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/10">
                    <div className="text-xl font-black">{analysis.ats_score ?? '-'}%</div>
                    <div className="text-[10px] text-outline font-bold uppercase tracking-tighter">ATS Opt</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Radar View */}
            <div className="glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest text-outline">
                <TrendingUp size={16} className="text-primary" />
                Category Coverage
              </h3>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(var(--color-outline), 0.1)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: 'var(--color-on-surface-variant)', fontSize: 10, fontWeight: 700 }}
                    />
                    <Radar
                      name="Expertise"
                      dataKey="A"
                      stroke="var(--color-primary)"
                      fill="var(--color-primary)"
                      fillOpacity={0.15}
                      strokeWidth={2}
                    />
                    <RechartsTooltip
                      contentStyle={{
                        background: 'var(--color-surface-container-high)',
                        border: '1px solid var(--color-outline-variant)',
                        borderRadius: '12px',
                        fontSize: '10px'
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Skill Inventory */}
            <div className="glass bg-surface-container-high rounded-[2.5rem] border border-outline-variant/15 p-8">
              <h3 className="font-bold text-sm mb-6 flex items-center gap-2 uppercase tracking-widest text-outline">
                <Activity size={16} className="text-tertiary" />
                Skill Gap Inventory
              </h3>
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] font-black text-outline uppercase tracking-widest mb-3 px-1">MISSING SKILLS</div>
                  <div className="space-y-2">
                    {missing.length > 0 ? missing.map((skill: string, idx: number) => (
                      <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-surface-container border border-outline-variant/10">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 rounded-full bg-error"></div>
                          <span className="text-xs font-bold">{skill}</span>
                        </div>
                        <span className="text-[10px] font-bold text-outline uppercase">Gap</span>
                      </div>
                    )) : (
                      <p className="text-[10px] text-on-surface-variant text-center py-2">No gaps identified</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </aside>

        </div>
      </main>
    </div>
  )
}
