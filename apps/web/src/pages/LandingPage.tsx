import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import {
  Brain, Zap, Shield, TrendingUp, Users, Award,
  ArrowRight, Check, Star, Globe, Upload, FileText,
  BarChart3, Map, Sparkles, Target, Clock, Terminal,
  PlayCircle, CheckCircle, MoreVertical, GraduationCap, Cloud,
  GitBranch, FileDown, Share2, LineChart, Type, History, Medal,
  PenTool, FileCode, Wand2, Code, Layers, Send
} from 'lucide-react'

// ─── Stat Counter Component ───
function Counter({ target, duration = 2000 }: { target: number; duration?: number }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          const start = performance.now()
          const animate = (now: number) => {
            const progress = Math.min((now - start) / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            setCount(Math.floor(eased * target))
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
        }
      },
      { threshold: 0.5 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target, duration])

  return <div ref={ref}>{count}</div>
}

const radarSkills = [
  { label: 'Strategy', value: 92 },
  { label: 'Frontend', value: 78 },
  { label: 'Data', value: 64 },
  { label: 'Backend', value: 84 },
  { label: 'Delivery', value: 71 },
  { label: 'Leadership', value: 88 },
]

function SkillRadarPreview({ showSummary = true }: { showSummary?: boolean }) {
  const size = 320
  const center = size / 2
  const radius = 118
  const polygonPoints = radarSkills
    .map((skill, index) => {
      const angle = (Math.PI * 2 * index) / radarSkills.length - Math.PI / 2
      const pointRadius = 28 + (skill.value / 100) * radius
      const x = center + Math.cos(angle) * pointRadius
      const y = center + Math.sin(angle) * pointRadius
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="relative rounded-[1.75rem] border border-outline-variant/15 bg-[#10111a] p-4 shadow-[0_30px_80px_rgba(0,0,0,0.45)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(108,71,255,0.18),transparent_55%)]" />
      <div className="relative flex items-center justify-between mb-3 text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">
        <span>Live skill radar</span>
        <span>Updated moments ago</span>
      </div>
      <div className="relative aspect-square rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] border border-white/5">
        <svg viewBox={`0 0 ${size} ${size}`} className="absolute inset-0 h-full w-full" aria-hidden="true">
          {[0.28, 0.48, 0.68, 0.88].map((ring, ringIndex) => {
            const r = radius * ring
            return <circle key={ringIndex} cx={center} cy={center} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeDasharray={ringIndex === 3 ? '0' : '4 8'} />
          })}
          {radarSkills.map((_, index) => {
            const angle = (Math.PI * 2 * index) / radarSkills.length - Math.PI / 2
            const x = center + Math.cos(angle) * radius
            const y = center + Math.sin(angle) * radius
            return <line key={index} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.08)" />
          })}
          <polygon points={polygonPoints} fill="rgba(108,71,255,0.22)" stroke="rgba(176,162,255,0.95)" strokeWidth="2.5" />
          {radarSkills.map((skill, index) => {
            const angle = (Math.PI * 2 * index) / radarSkills.length - Math.PI / 2
            const pointRadius = 28 + (skill.value / 100) * radius
            const x = center + Math.cos(angle) * pointRadius
            const y = center + Math.sin(angle) * pointRadius
            const labelRadius = radius + 20
            const labelX = center + Math.cos(angle) * labelRadius
            const labelY = center + Math.sin(angle) * labelRadius
            return (
              <g key={skill.label}>
                <circle cx={x} cy={y} r="4.5" fill="#f9f5fd" stroke="#6C47FF" strokeWidth="3" />
                <text x={labelX} y={labelY} fill="rgba(249,245,253,0.88)" fontSize="10" textAnchor="middle" dominantBaseline="middle">
                  {skill.label}
                </text>
              </g>
            )
          })}
          <circle cx={center} cy={center} r="18" fill="#0e0e13" stroke="rgba(255,255,255,0.2)" />
          <text x={center} y={center - 2} fill="#f9f5fd" fontSize="18" fontWeight="700" textAnchor="middle" dominantBaseline="middle">
            82%
          </text>
          <text x={center} y={center + 18} fill="rgba(172,170,177,0.9)" fontSize="8.5" fontWeight="600" textAnchor="middle" dominantBaseline="middle" letterSpacing="1.2">
            FIT SCORE
          </text>
        </svg>
      </div>
      {showSummary ? (
        <div className="relative mt-4 grid grid-cols-3 gap-2 text-xs">
          {[
            { label: 'Matched', value: '82%', tone: 'text-primary' },
            { label: 'Missing', value: '12%', tone: 'text-error' },
            { label: 'Partial', value: '6%', tone: 'text-tertiary' },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/5 bg-white/5 px-3 py-3 text-center backdrop-blur-sm">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.28em] text-on-surface-variant">{item.label}</div>
              <div className={`text-lg font-bold ${item.tone}`}>{item.value}</div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function SkillLandscapePreview() {
  const skills = [
    { label: 'Frontend Systems', value: 88 },
    { label: 'Product Thinking', value: 76 },
    { label: 'Data Literacy', value: 68 },
    { label: 'Execution', value: 91 },
    { label: 'Mentorship', value: 73 },
  ]

  return (
    <div className="relative rounded-[2rem] border border-outline-variant/15 bg-[#11131c] p-5 shadow-[0_30px_80px_rgba(0,0,0,0.35)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.08),transparent_36%),radial-gradient(circle_at_80%_10%,rgba(108,71,255,0.16),transparent_28%),radial-gradient(circle_at_bottom,rgba(252,132,184,0.12),transparent_46%)]" />
      <div className="relative flex items-center justify-between gap-3 border-b border-white/5 pb-4">
        <div>
          <div className="text-xs uppercase tracking-[0.28em] text-on-surface-variant">Competency map</div>
          <div className="mt-1 text-lg font-bold text-on-surface">Deep visual skill mapping</div>
        </div>
        <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
          94% coverage
        </div>
      </div>

      <div className="relative mt-5 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/5 bg-white/5 p-4">
          <div className="mb-4 flex items-center justify-between text-xs text-on-surface-variant">
            <span>Capability balance</span>
            <span>Top 15% peer cohort</span>
          </div>
          <div className="space-y-3">
            {skills.map((skill, index) => (
              <div key={skill.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="text-on-surface">{skill.label}</span>
                  <span className="text-on-surface-variant">{skill.value}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${index % 2 === 0 ? 'bg-gradient-to-r from-primary to-[#9b82ff]' : 'bg-gradient-to-r from-tertiary to-[#ffcae0]'}`}
                    style={{ width: `${skill.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.5rem] border border-white/5 bg-[linear-gradient(180deg,rgba(108,71,255,0.12),rgba(255,255,255,0.02))] p-4">
          <div className="mb-4 text-xs uppercase tracking-[0.28em] text-on-surface-variant">Signal summary</div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'ATS match', value: '89%', tone: 'text-primary' },
              { label: 'Gap risk', value: 'Low', tone: 'text-tertiary' },
              { label: 'Best next step', value: 'SQL + AI', tone: 'text-on-surface' },
              { label: 'Avg lift', value: '+23%', tone: 'text-success' },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/5 bg-black/20 p-3">
                <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.24em] text-on-surface-variant">{item.label}</div>
                <div className={`text-sm font-bold ${item.tone}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-2xl border border-white/5 bg-black/20 p-3 text-sm text-on-surface-variant">
            Gapminer turns a noisy resume into a focused, recruiter-friendly narrative in under a minute.
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="bg-surface text-on-surface selection:bg-primary selection:text-on-primary">
      {/* Top Navigation */}
      <nav className="fixed top-0 w-full z-50 bg-[#19191f]/80 backdrop-blur-xl border-b border-[#48474d]/15 shadow-[0_20px_40px_rgba(0,0,0,0.4)]">
        <div className="flex justify-between items-center px-8 py-4 max-w-7xl mx-auto">
          <div className="text-2xl font-semibold tracking-tighter text-[#f9f5fd] flex items-center gap-2">
            <Sparkles className="text-primary" size={24} />
            Gapminer
          </div>
          <div className="hidden md:flex items-center space-x-8">
            <a className="text-[#acaab1] hover:text-[#f9f5fd] transition-colors font-['Inter'] antialiased tracking-tight" href="#how-it-works">How it Works</a>
            <a className="text-[#acaab1] hover:text-[#f9f5fd] transition-colors font-['Inter'] antialiased tracking-tight" href="#features">Features</a>
            <a className="text-[#acaab1] hover:text-[#f9f5fd] transition-colors font-['Inter'] antialiased tracking-tight" href="#pricing">Pricing</a>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/auth?mode=login" className="text-[#acaab1] hover:text-[#f9f5fd] transition-colors font-medium px-4">Sign In</Link>
            <Link to="/auth?mode=signup" className="primary-gradient text-on-primary-fixed px-6 py-2.5 rounded-full font-semibold scale-95 active:scale-90 transition-transform">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen pt-32 pb-20 px-8 overflow-hidden hero-mesh">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 blur-[120px] rounded-full pointer-events-none"></div>
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass bg-surface-container-low mb-6 border border-outline-variant/15">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(108,71,255,0.8)]"></span>
              <span className="text-xs font-medium tracking-widest uppercase text-on-surface-variant">Powered by local Ollama AI</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tighter leading-[1.1] mb-6 font-headline">
              Know Exactly What's <br />
              <span className="text-gradient">Holding You Back</span>
            </h1>
            <p className="text-xl text-on-surface-variant mb-10 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-light">
              Our 5-agent AI orchestrator deep-scans your profile against thousands of real-world job taxonomies to pinpoint skill gaps in under 60 seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link to="/auth?signup=true" className="primary-gradient text-on-primary-fixed px-8 py-4 rounded-full font-bold text-lg flex items-center justify-center gap-2 group transition-all hover:shadow-[0_0_30px_rgba(117,86,255,0.4)]">
                Analyze My Resume Free
                <ArrowRight className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <button className="glass px-8 py-4 rounded-full font-bold text-lg border border-outline-variant/20 hover:bg-surface-container-high transition-colors flex items-center justify-center gap-2 text-on-surface">
                <PlayCircle />
                Watch Demo
              </button>
            </div>
            <p className="mt-8 text-sm text-outline flex items-center justify-center lg:justify-start gap-2">
              <Shield className="text-sm" size={16} />
              Your data never leaves our servers. 100% encrypted and private.
            </p>
          </div>
          <div className="flex-1 w-full max-w-2xl">
            <div className="relative group">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-3xl opacity-50 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative glass bg-surface-container-highest p-8 rounded-3xl border border-outline-variant/15 shadow-2xl">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="font-bold text-xl">Skill Gap Analysis</h3>
                    <p className="text-sm text-on-surface-variant">Candidate: Senior Product Designer</p>
                  </div>
                  <span className="bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Live View</span>
                </div>
                <div className="flex justify-center mb-8 h-[21rem]">
                  <div className="relative w-full h-full flex items-center justify-center">
                    <div className="w-full max-w-[19rem]">
                      <SkillRadarPreview showSummary={false} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-surface-container p-3 rounded-2xl text-center border border-outline-variant/10">
                    <div className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-tighter">Matched</div>
                    <div className="text-2xl font-bold text-primary">82%</div>
                  </div>
                  <div className="bg-surface-container p-3 rounded-2xl text-center border border-outline-variant/10">
                    <div className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-tighter">Missing</div>
                    <div className="text-2xl font-bold text-error">12%</div>
                  </div>
                  <div className="bg-surface-container p-3 rounded-2xl text-center border border-outline-variant/10">
                    <div className="text-xs text-on-surface-variant mb-1 uppercase font-bold tracking-tighter">Partial</div>
                    <div className="text-2xl font-bold text-tertiary">6%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof Bar */}
      <section className="py-12 border-y border-outline-variant/10 bg-surface-container-lowest/50">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            <div className="text-center md:text-left">
              <p className="text-sm font-bold uppercase tracking-widest text-on-surface-variant mb-2">Trusted by 12,000+ professionals</p>
              <div className="flex flex-wrap justify-center md:justify-start gap-8 opacity-40 grayscale hover:grayscale-0 transition-all duration-500">
                <span className="text-2xl font-black italic tracking-tighter">Google</span>
                <span className="text-2xl font-black italic tracking-tighter">Meta</span>
                <span className="text-2xl font-black italic tracking-tighter">Stripe</span>
                <span className="text-2xl font-black italic tracking-tighter">Airbnb</span>
              </div>
            </div>
            <div className="flex gap-12">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary flex items-center justify-center">
                  <Counter target={60} />
                  <span>sec</span>
                </div>
                <div className="text-xs text-outline uppercase font-bold tracking-widest">Avg Analysis</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary flex items-center justify-center">
                  <Counter target={94} />
                  <span>%</span>
                </div>
                <div className="text-xs text-outline uppercase font-bold tracking-widest">Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary flex items-center justify-center">
                  <Counter target={10} />
                  <span>k+</span>
                </div>
                <div className="text-xs text-outline uppercase font-bold tracking-widest">Skill Taxon</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 01 / How It Works */}
      <section id="how-it-works" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">01 / Process</span>
            <h2 className="text-4xl font-bold mt-2 font-headline">How it Works</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-0 w-full h-px bg-gradient-to-r from-transparent via-outline-variant/20 to-transparent"></div>
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high glass flex items-center justify-center mb-6 border border-primary/20 group-hover:border-primary transition-colors">
                <Upload className="text-primary" size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-on-primary-fixed font-bold shadow-lg">1</div>
              </div>
              <h3 className="text-xl font-bold mb-3">Upload Resume</h3>
              <p className="text-on-surface-variant leading-relaxed">Drop your PDF or DOCX. Our agent parses text, formatting, and implied expertise automatically.</p>
            </div>
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high glass flex items-center justify-center mb-6 border border-outline-variant/15 group-hover:border-primary transition-colors">
                <FileText className="text-primary" size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold border border-outline-variant/15">2</div>
              </div>
              <h3 className="text-xl font-bold mb-3">Paste Job URL</h3>
              <p className="text-on-surface-variant leading-relaxed">Provide any LinkedIn, Indeed, or company career page URL. We scrape the direct hiring requirements.</p>
            </div>
            <div className="relative group">
              <div className="w-16 h-16 rounded-2xl bg-surface-container-high glass flex items-center justify-center mb-6 border border-outline-variant/15 group-hover:border-primary transition-colors">
                <Map className="text-primary" size={32} />
                <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-surface-container-highest flex items-center justify-center text-on-surface font-bold border border-outline-variant/15">3</div>
              </div>
              <h3 className="text-xl font-bold mb-3">Get Roadmap</h3>
              <p className="text-on-surface-variant leading-relaxed">Receive a step-by-step upskilling plan with verified resources to bridge every single gap detected.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 02 / Multi-Agent Pipeline */}
      <section className="py-32 bg-surface-container-low/50 relative">
        <div className="max-w-7xl mx-auto px-8">
          <div className="flex flex-col lg:flex-row gap-20 items-center">
            <div className="flex-1">
              <span className="text-primary font-bold tracking-widest uppercase text-sm">02 / Architecture</span>
              <h2 className="text-4xl font-bold mt-2 mb-8 font-headline">Multi-Agent Intelligence</h2>
              <div className="space-y-6">
                {([] as { title: string; status: string; active: boolean; label?: string; opacity?: string }[]).concat([
                  { title: 'Document Parser', status: 'Parses resume & job description', active: true },
                  { title: 'Skill Extractor', status: 'Extracts skills from documents', active: true },
                  { title: 'Gap Analyzer', status: 'Analyzes skill gaps', active: true },
                  { title: 'Roadmap Generator', status: 'Generates learning path', active: false },
                  { title: 'Market Intelligence', status: 'Provides salary insights', active: false },
                ]).map((agent, i) => (
                  <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl glass bg-surface-container-high border-l-4 ${agent.active ? 'border-primary' : 'border-outline-variant'} ${agent.opacity || ''}`}>
                    <span className={`w-3 h-3 rounded-full ${agent.active ? 'bg-primary animate-pulse' : 'bg-primary/40'}`}></span>
                    <div>
                      <h4 className="font-bold text-sm">{agent.title}</h4>
                      <p className="text-xs text-on-surface-variant">{agent.status}</p>
                    </div>
                    {agent.label ? (
                      <span className="ml-auto text-xs font-mono text-primary">{agent.label}</span>
                    ) : (
                      agent.active && <CheckCircle className="ml-auto text-primary" size={18} />
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex-1 w-full">
              <div className="glass bg-surface-container-highest rounded-3xl p-8 border border-outline-variant/20 shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 p-4">
                  <MoreVertical className="text-on-surface-variant hover:text-primary cursor-pointer" />
                </div>
                <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                  <Terminal className="text-primary" />
                  Analysis Output
                </h3>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-surface-container-low border border-outline-variant/10">
                    <span className="text-on-surface-variant">Skills will appear here</span>
                    <span className="text-tertiary flex items-center gap-1 font-bold">PENDING</span>
                  </div>
                </div>
                <div className="mt-8 pt-8 border-t border-outline-variant/10">
                  <div className="text-xs text-outline mb-2 uppercase font-bold tracking-widest">Recommendation</div>
                  <p className="text-sm text-on-surface-variant italic">Enter your resume and job description to get real-time gap analysis and personalized recommendations.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 03 / Gap Visualization (Radar) */}
      <section className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-surface-container-highest rounded-[3rem] p-12 lg:p-20 border border-outline-variant/15 relative overflow-hidden group">
            <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors pointer-events-none"></div>
            <div className="relative z-10 grid lg:grid-cols-2 gap-16 items-center">
              <div>
                <span className="text-primary font-bold tracking-widest uppercase text-sm">03 / Visualization</span>
                <h2 className="text-4xl lg:text-5xl font-bold mt-2 mb-6 tracking-tight font-headline">Deep Visual <br />Skill Mapping</h2>
                <p className="text-lg text-on-surface-variant mb-10 leading-relaxed font-light">
                  We don't just list gaps; we map them across core domains. Understand your competency in Frontend, Backend, DevOps, Leadership, and CS Fundamentals relative to the local market average.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl glass bg-surface-container border border-outline-variant/10">
                    <div className="text-primary font-bold mb-1">Peer Benchmarking</div>
                    <div className="text-xs text-on-surface-variant">Top 15% of candidates</div>
                  </div>
                  <div className="p-4 rounded-2xl glass bg-surface-container border border-outline-variant/10">
                    <div className="text-primary font-bold mb-1">ATS Optimization</div>
                    <div className="text-xs text-on-surface-variant">Keyword match rate 89%</div>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="w-full max-w-xl">
                  <SkillLandscapePreview />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 04 / Roadmap Preview */}
      <section className="py-32 bg-surface-container-lowest overflow-hidden">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">04 / The Outcome</span>
            <h2 className="text-4xl font-bold mt-2 font-headline">Personalized Upskilling Roadmap</h2>
          </div>
          <div className="relative">
            <div className="absolute top-1/2 left-0 w-full h-1 bg-gradient-to-r from-primary/20 via-primary to-primary/20 -translate-y-1/2 hidden lg:block"></div>
            <div className="grid lg:grid-cols-4 gap-8">
              {[
                { title: 'Kubernetes Basics', desc: 'Master pods, services, and deployments.', duration: '12 Hours', platform: 'Coursera', icon: GraduationCap, highlight: true },
                { title: 'AWS EKS Pro', desc: 'Managing managed clusters on cloud infrastructure.', duration: '8 Hours', platform: 'YouTube', icon: Cloud, offset: 'lg:mt-12' },
                { title: 'Helm Charts', desc: 'Templating complex Kubernetes applications.', duration: '4 Hours', platform: 'Udemy', icon: GitBranch, offset: 'lg:-mt-12' },
                { title: 'Project Submission', desc: 'Build & deploy a microservices app to production.', duration: 'Portfolio', platform: 'GitHub', icon: Award, offset: 'lg:mt-6', special: true },
              ].map((item, i) => (
                <div key={i} className={`relative z-10 ${item.offset || ''}`}>
                  <div className="glass bg-surface-container-high p-6 rounded-3xl border border-outline-variant/20 hover:-translate-y-2 transition-transform h-full flex flex-col">
                    <div className={`w-12 h-12 rounded-2xl ${item.highlight ? 'primary-gradient shadow-[0_0_20px_rgba(117,86,255,0.4)]' : item.special ? 'bg-primary/20' : 'bg-surface-container-highest border border-outline-variant/15'} flex items-center justify-center mb-6`}>
                      <item.icon className={item.highlight ? 'text-on-primary-fixed' : 'text-primary'} size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                    <p className="text-sm text-on-surface-variant mb-6 flex-grow">{item.desc}</p>
                    <div className="flex flex-wrap gap-2 mb-6">
                      <span className="bg-surface-container-highest px-2 py-1 rounded-md text-[10px] text-outline font-bold uppercase tracking-wider">{item.duration}</span>
                      <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider">{item.platform}</span>
                    </div>
                    <button className="text-primary text-sm font-bold flex items-center gap-1 hover:underline">
                      {item.special ? 'Start Lab' : 'View Course'} <ArrowRight size={14} className="rotate-[-45deg]" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-20 flex justify-center gap-4">
            <button className="glass px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-surface-container-high transition-all text-on-surface">
              <FileDown size={20} />
              Export as PDF
            </button>
            <button className="glass px-6 py-3 rounded-full font-bold flex items-center gap-2 hover:bg-surface-container-high transition-all text-on-surface">
              <Share2 size={20} />
              Share Link
            </button>
          </div>
        </div>
      </section>

      {/* 05 / Differentiators */}
      <section id="features" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">05 / Features</span>
            <h2 className="text-4xl font-bold mt-2 font-headline">Smarter Intelligence</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Globe, title: 'JD URL Scraper', desc: 'Simply paste any job link. Our agents bypass cookie walls and scrapers to extract hidden requirements.' },
              { icon: LineChart, title: 'Skills Trend Heatmap', desc: 'See which skills are trending in your niche based on real-time hiring data across the tech industry.' },
              { icon: Users, title: 'Peer Benchmarking', desc: 'Anonymously compare your skill density against other candidates applying for the same roles.' },
              { icon: Type, title: 'ATS Keyword Optimizer', desc: 'Automatically re-word your existing experience to match the specific linguistic patterns ATS systems look for.' },
              { icon: History, title: 'Progress Tracker', desc: 'Connect your learning accounts (Coursera/Udemy) to update your gap analysis in real-time as you learn.' },
              { icon: Medal, title: 'Resume Strength Score', desc: 'Get a single numeric score representing your marketability and likelihood of landing an interview.' },
            ].map((f, i) => (
              <div key={i} className="glass bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10">
                <f.icon className="text-primary mb-4" size={32} />
                <h3 className="font-bold text-xl mb-3">{f.title}</h3>
                <p className="text-on-surface-variant text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 06 / LaTeX Resume Editor */}
      <section className="py-32 px-8 bg-gradient-to-b from-surface-container-low/30 to-surface">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">06 / Resume Builder</span>
            <h2 className="text-4xl font-bold mt-2 font-headline">AI-Powered LaTeX Editor</h2>
            <p className="text-lg text-on-surface-variant mt-4 max-w-2xl mx-auto">
              Generate professional LaTeX resumes with AI assistance. Optimize for ATS, 
              get real-time suggestions, and export to PDF instantly.
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              {[
                { icon: Wand2, title: 'AI Writing Assistant', desc: 'Generate sections, fix errors, or get suggestions by chatting with AI.' },
                { icon: Target, title: 'ATS Optimization', desc: 'Automatically optimize your resume for Applicant Tracking Systems.' },
                { icon: Layers, title: 'Live Preview', desc: 'See your LaTeX compiled to PDF in real-time as you type.' },
                { icon: Code, title: 'Professional Templates', desc: 'Start with expertly crafted LaTeX templates tailored for tech roles.' },
              ].map((feature, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0 border border-primary/20">
                    <feature.icon size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg mb-1">{feature.title}</h3>
                    <p className="text-sm text-on-surface-variant">{feature.desc}</p>
                  </div>
                </div>
              ))}
              <Link 
                to="/latex" 
                className="inline-flex items-center gap-2 mt-6 px-6 py-3 primary-gradient text-on-primary-fixed rounded-full font-bold hover:shadow-[0_0_30px_rgba(117,86,255,0.4)] transition-all"
              >
                <PenTool size={18} />
                Open Editor
                <ArrowRight size={18} />
              </Link>
            </div>
            
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-3xl"></div>
              <div className="relative glass bg-[#263238] rounded-2xl overflow-hidden border border-outline-variant/20 shadow-2xl">
                <div className="flex items-center gap-2 px-4 py-3 bg-[#1e282c] border-b border-outline-variant/10">
                  <div className="flex gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
                    <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  </div>
                  <div className="ml-4 px-3 py-1 bg-[#263238] rounded-md text-xs text-gray-400 font-mono">main.tex</div>
                </div>
                <div className="p-4 font-mono text-sm text-gray-300 overflow-hidden">
                  <div><span className="text-purple-400">\documentclass</span>{'{article}'}</div>
                  <div><span className="text-purple-400">\usepackage</span>{'{amsmath}'}</div>
                  <div className="mt-2"><span className="text-green-400">% AI Generated Section</span></div>
                  <div><span className="text-purple-400">\section</span>{'{Experience}'}</div>
                  <div><span className="text-yellow-400">\resumeItem</span>{'{'}</div>
                  <div className="ml-4">Built scalable microservices handling 10K+ RPS</div>
                  <div className="ml-4 text-gray-500">% AI suggested: add metrics</div>
                  <div className="ml-4 text-green-400">Optimized: 10K+ {'→'} 50,000+ requests/second</div>
                  <div>{'}'}</div>
                  <div><span className="text-yellow-400">\resumeItem</span>{'{'}</div>
                  <div className="ml-4">Led team of 5 engineers across 3 time zones</div>
                  <div>{'}'}</div>
                  <div className="mt-2"><span className="text-purple-400">\end</span>{'{document}'}</div>
                </div>
              </div>
              <div className="absolute -bottom-4 -right-4 bg-tertiary text-on-tertiary px-4 py-2 rounded-full text-xs font-bold shadow-lg">
                <span className="flex items-center gap-1"><Send size={12} /> Try it now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 07 / Testimonials */}
      <section className="py-32 bg-surface-container-low/30 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { name: 'Alex Chen', role: 'Lead Engineer', quote: 'Gapminer correctly identified that my resume was too academic for a lead engineer role. After following the roadmap, I landed a job at Stripe in 3 weeks.' },
              { name: 'Sarah Jenkins', role: 'Product Designer', quote: "The multi-agent pipeline is incredible. It's like having a career coach and a technical recruiter looking at your profile simultaneously." },
              { name: 'Mark Thompson', role: 'DevOps Lead', quote: 'I used the free analysis and it was better than the paid consultant I hired last year. The roadmap links were exactly what I needed.' },
            ].map((t, i) => (
              <div key={i} className="glass p-8 rounded-3xl bg-surface-container border border-outline-variant/20 flex flex-col justify-between">
                <div className="mb-6">
                  <div className="flex text-primary mb-4">
                    {[...Array(5)].map((_, j) => <Star key={j} size={18} fill="currentColor" />)}
                  </div>
                  <p className="text-on-surface-variant italic leading-relaxed font-light">"{t.quote}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-surface-container-highest flex items-center justify-center text-primary font-bold">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-sm">{t.name}</div>
                    <div className="text-xs text-outline">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 08 / Pricing */}
      <section id="pricing" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-primary font-bold tracking-widest uppercase text-sm">08 / Pricing</span>
            <h2 className="text-4xl font-bold mt-2 font-headline">Ready to Bridge the Gap?</h2>
          </div>
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Free */}
            <div className="glass bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 flex flex-col">
              <h3 className="font-bold text-xl mb-2">Free</h3>
              <div className="text-3xl font-bold mb-6">$0<span className="text-sm font-normal text-outline">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['1 Resume analysis / month', 'Basic Skill Gap Radar', 'Community Roadmap'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle className="text-primary" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth?signup=true" className="w-full glass py-3 rounded-full font-bold hover:bg-surface-container-highest transition-colors text-center text-on-surface">Start Free</Link>
            </div>
            {/* Pro */}
            <div className="glass bg-surface-container-high p-8 rounded-3xl border-2 border-primary relative flex flex-col shadow-[0_0_40px_rgba(117,86,255,0.1)]">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-on-primary-fixed px-4 py-1 rounded-full text-xs font-bold uppercase">Most Popular</div>
              <h3 className="font-bold text-xl mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-6">$12<span className="text-sm font-normal text-outline">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Unlimited analysis', 'ATS Keyword Optimizer', 'Verified Resource Roadmap', 'Peer Benchmarking'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle className="text-primary" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth?signup=true" className="w-full primary-gradient text-on-primary-fixed py-3 rounded-full font-bold shadow-lg text-center">Go Pro</Link>
            </div>
            {/* Teams */}
            <div className="glass bg-surface-container-high p-8 rounded-3xl border border-outline-variant/10 flex flex-col">
              <h3 className="font-bold text-xl mb-2">Teams</h3>
              <div className="text-3xl font-bold mb-6">$49<span className="text-sm font-normal text-outline">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-grow">
                {['Up to 10 members', 'Market Intelligence Dashboard', 'Hiring Trend Alerts', 'Priority Support'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-on-surface-variant">
                    <CheckCircle className="text-primary" size={16} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link to="/auth" className="w-full glass py-3 rounded-full font-bold hover:bg-surface-container-highest transition-colors text-center text-on-surface">Contact Sales</Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 px-8">
        <div className="max-w-5xl mx-auto rounded-[3rem] primary-gradient p-12 text-center shadow-[0_0_100px_rgba(117,86,255,0.2)]">
          <h2 className="text-4xl lg:text-5xl font-black text-on-primary-fixed tracking-tight mb-6 font-headline">Stop Guessing. Start Growing.</h2>
          <p className="text-on-primary-fixed/80 text-xl mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Join 12,000+ professionals who use Gapminer to stay ahead of market demands.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/auth?signup=true" className="bg-on-primary-fixed text-primary px-8 py-4 rounded-full font-bold text-lg hover:scale-105 transition-transform">Get Started Free</Link>
            <button className="bg-on-primary-fixed/10 text-on-primary-fixed border border-on-primary-fixed/20 px-8 py-4 rounded-full font-bold text-lg backdrop-blur-sm">View Demo</button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0e0e13] w-full py-12 border-t border-[#48474d]/15">
        <div className="flex flex-col md:flex-row justify-between items-center px-8 max-w-7xl mx-auto gap-8">
          <div className="flex flex-col items-center md:items-start gap-4">
            <div className="text-lg font-bold text-[#f9f5fd] flex items-center gap-2">
              <Sparkles className="text-primary" size={20} />
              Gapminer
            </div>
            <p className="text-sm font-['Inter'] leading-relaxed text-[#acaab1] text-center md:text-left font-light">
              © 2024 Gapminer. Precision AI Career Intelligence.<br />
              <span className="text-xs opacity-60">Your resumes are encrypted &amp; auto-deleted after 30 days.</span>
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-8">
            <a className="text-[#acaab1] hover:text-[#6C47FF] transition-colors text-sm font-['Inter']" href="#">Privacy Policy</a>
            <a className="text-[#acaab1] hover:text-[#6C47FF] transition-colors text-sm font-['Inter']" href="#">Terms of Service</a>
            <a className="text-[#acaab1] hover:text-[#6C47FF] transition-colors text-sm font-['Inter']" href="#">Security</a>
            <a className="text-[#acaab1] hover:text-[#6C47FF] transition-colors text-sm font-['Inter']" href="#">Contact</a>
          </div>
          <div className="flex gap-4">
            <a className="w-10 h-10 rounded-full glass bg-surface-container flex items-center justify-center hover:text-primary transition-colors text-on-surface" href="#">
              <Share2 size={18} />
            </a>
            <a className="w-10 h-10 rounded-full glass bg-surface-container flex items-center justify-center hover:text-primary transition-colors text-on-surface" href="#">
              <Globe size={18} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

