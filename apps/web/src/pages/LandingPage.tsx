import { Link } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { ArrowRight, ArrowUpRight, Check, ChevronDown } from 'lucide-react'

/* ─────────────────────────────────────────────
   DESIGN TOKENS (keep everything consistent)
   Palette: #090909 ink | #E8C547 gold | #F5F0E8 cream | #1A1A1A charcoal
───────────────────────────────────────────── */

// Animated counter (triggers once on scroll into view)
function Counter({ target, suffix = '', prefix = '' }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true
        const t0 = performance.now()
        const dur = 1800
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1)
          const eased = 1 - Math.pow(1 - p, 4)
          setCount(Math.floor(eased * target))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{prefix}{count}{suffix}</span>
}

// Typewriter effect
function Typewriter({ words }: { words: string[] }) {
  const [idx, setIdx] = useState(0)
  const [displayed, setDisplayed] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[idx % words.length]
    if (!deleting && displayed.length < word.length) {
      const t = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 80)
      return () => clearTimeout(t)
    }
    if (!deleting && displayed.length === word.length) {
      const t = setTimeout(() => setDeleting(true), 2000)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length > 0) {
      const t = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45)
      return () => clearTimeout(t)
    }
    if (deleting && displayed.length === 0) {
      setDeleting(false)
      setIdx(i => i + 1)
    }
  }, [displayed, deleting, idx, words])

  return (
    <span className="text-[#E8C547]">
      {displayed}
      <span className="animate-pulse">|</span>
    </span>
  )
}

// Marquee tape
function Tape({ items }: { items: string[] }) {
  const repeated = [...items, ...items, ...items]
  return (
    <div className="overflow-hidden border-y border-[#E8C547]/20 py-3">
      <div
        className="flex gap-12 whitespace-nowrap"
        style={{ animation: 'marquee 28s linear infinite' }}
      >
        {repeated.map((item, i) => (
          <span key={i} className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 flex items-center gap-12">
            {item}
            <span className="text-[#E8C547]/30">◆</span>
          </span>
        ))}
      </div>
    </div>
  )
}

// Radar SVG (pure, hand-crafted — no library)
function RadarGlyph() {
  const skills = [78, 91, 64, 88, 73, 82]
  const labels = ['Frontend', 'Execution', 'Data', 'Backend', 'Soft', 'Strategy']
  const n = skills.length
  const cx = 120, cy = 120, r = 90

  const points = skills.map((v, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    const d = (v / 100) * r + 12
    return [cx + Math.cos(a) * d, cy + Math.sin(a) * d]
  })

  const labelPts = labels.map((_, i) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2
    return [cx + Math.cos(a) * (r + 18), cy + Math.sin(a) * (r + 18)]
  })

  const poly = points.map(p => p.join(',')).join(' ')

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full" aria-hidden>
      {[0.3, 0.55, 0.78, 1].map((ring, ri) => {
        const rr = r * ring
        const pts = Array.from({ length: n }, (_, i) => {
          const a = (Math.PI * 2 * i) / n - Math.PI / 2
          return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]
        })
        return (
          <polygon
            key={ri}
            points={pts.map(p => p.join(',')).join(' ')}
            fill="none"
            stroke="rgba(232,197,71,0.12)"
            strokeWidth="1"
          />
        )
      })}
      {Array.from({ length: n }, (_, i) => {
        const a = (Math.PI * 2 * i) / n - Math.PI / 2
        return (
          <line
            key={i}
            x1={cx} y1={cy}
            x2={cx + Math.cos(a) * r}
            y2={cy + Math.sin(a) * r}
            stroke="rgba(232,197,71,0.1)"
            strokeWidth="1"
          />
        )
      })}
      <polygon
        points={poly}
        fill="rgba(232,197,71,0.15)"
        stroke="#E8C547"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="3.5" fill="#E8C547" />
      ))}
      {labelPts.map(([x, y], i) => (
        <text
          key={i}
          x={x} y={y}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fontWeight="700"
          letterSpacing="1"
          fill="rgba(245,240,232,0.6)"
          style={{ textTransform: 'uppercase' }}
        >
          {labels[i]}
        </text>
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="900" fill="#E8C547">82</text>
      <text x={cx} y={cy + 10} textAnchor="middle" fontSize="7" fontWeight="700" letterSpacing="2" fill="rgba(245,240,232,0.4)">FIT SCORE</text>
    </svg>
  )
}

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0)
  useEffect(() => {
    const h = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', h, { passive: true })
    return () => window.removeEventListener('scroll', h)
  }, [])

  const heroOpacity = Math.max(0, 1 - scrollY / 400)

  return (
    <div
      className="bg-[#090909] text-[#F5F0E8] min-h-screen selection:bg-[#E8C547] selection:text-[#090909]"
      style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        @keyframes marquee { from { transform: translateX(0) } to { transform: translateX(-33.33%) } }
        @keyframes float-slow { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes scanline { 0%{transform:translateY(-100%)} 100%{transform:translateY(100vh)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(32px)} to{opacity:1;transform:translateY(0)} }
        .fade-up { animation: fade-up 0.8s ease forwards; }
        .radar-float { animation: float-slow 6s ease-in-out infinite; }
        .grid-bg {
          background-image: 
            linear-gradient(rgba(232,197,71,0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(232,197,71,0.04) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .text-stroke {
          -webkit-text-stroke: 1.5px rgba(245,240,232,0.2);
          color: transparent;
        }
        .clip-gold { background: linear-gradient(135deg, #E8C547 0%, #F5D76E 50%, #C9A227 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
        .gold-border { border: 1px solid rgba(232,197,71,0.2); }
        .gold-border:hover { border-color: rgba(232,197,71,0.6); }
        .scrim { background: linear-gradient(to right, #090909 0%, transparent 40%, transparent 60%, #090909 100%); }
      `}</style>

      {/* ──── NAV ──────────────────────────────────────────── */}
      <nav className="fixed top-0 z-50 w-full" style={{ background: 'rgba(9,9,9,0.85)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(232,197,71,0.08)' }}>
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#E8C547] rounded-sm flex items-center justify-center">
              <span className="text-[#090909] font-black text-sm">G</span>
            </div>
            <span className="font-black text-[15px] tracking-[-0.02em] text-[#F5F0E8]">GAPMINER</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
            {[['#story', 'The Problem'], ['#engine', 'The Engine'], ['#proof', 'Proof'], ['#pricing', 'Pricing']].map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-[13px] font-medium text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors tracking-wide"
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-4">
            <Link to="/auth?mode=login" className="text-[13px] font-medium text-[#F5F0E8]/40 hover:text-[#F5F0E8] transition-colors">
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="bg-[#E8C547] text-[#090909] px-5 py-2 rounded-sm font-bold text-[13px] hover:bg-[#F5D76E] transition-colors tracking-wide"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ──── HERO ─────────────────────────────────────────── */}
      <section className="relative min-h-screen grid-bg flex flex-col justify-end pb-24 pt-28 overflow-hidden">
        {/* Big ghost number in background */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 select-none pointer-events-none"
          style={{ opacity: heroOpacity * 0.04 }}
        >
          <span className="text-[clamp(200px,30vw,440px)] font-black text-[#E8C547] leading-none">73%</span>
        </div>

        {/* Vertical rule — editorial grid line */}
        <div className="absolute left-[calc(50%-1px)] top-0 bottom-0 w-px bg-[#E8C547]/6 hidden lg:block" />

        <div className="relative max-w-7xl mx-auto px-8 w-full">
          {/* Kicker line */}
          <div className="flex items-center gap-4 mb-10">
            <div className="w-8 h-px bg-[#E8C547]" />
            <span className="text-[11px] font-bold uppercase tracking-[0.3em] text-[#E8C547]">Career Intelligence Platform</span>
          </div>

          {/* Main headline — editorial, asymmetric */}
          <div className="grid lg:grid-cols-[1fr_auto] gap-0 items-end">
            <div>
              <h1 className="font-black leading-[0.88] tracking-[-0.04em] mb-0" style={{ fontSize: 'clamp(56px, 9vw, 140px)' }}>
                <span className="block text-[#F5F0E8]">Your resume</span>
                <span className="block text-stroke">is a lie.</span>
                <span className="block text-[#F5F0E8]">We fix that.</span>
              </h1>
            </div>

            <div className="hidden lg:flex flex-col items-end gap-8 pb-4 max-w-[280px]">
              {/* Live stat */}
              <div className="border-l-2 border-[#E8C547] pl-5">
                <div className="text-[42px] font-black text-[#E8C547] leading-none">73%</div>
                <div className="text-[11px] font-medium text-[#F5F0E8]/40 mt-1 uppercase tracking-widest">of resumes are rejected<br />before a human reads them</div>
              </div>
              <div className="border-l-2 border-[#F5F0E8]/15 pl-5">
                <div className="text-[42px] font-black text-[#F5F0E8] leading-none">6s</div>
                <div className="text-[11px] font-medium text-[#F5F0E8]/40 mt-1 uppercase tracking-widest">average recruiter<br />scan time</div>
              </div>
            </div>
          </div>

          {/* Subheadline + CTA row */}
          <div className="grid lg:grid-cols-[1fr_auto] gap-12 items-end mt-14 pt-10 border-t border-[#F5F0E8]/8">
            <p className="text-[18px] text-[#F5F0E8]/50 font-light leading-relaxed max-w-xl">
              We run five AI agents against your resume and every job you target — then hand you the exact roadmap to close the gap. Not vague feedback. Not motivational noise.{' '}
              <em className="text-[#F5F0E8]/80 not-italic font-medium">Surgical precision.</em>
            </p>
            <div className="flex flex-col gap-4 min-w-[220px]">
              <Link
                to="/auth?mode=signup"
                className="flex items-center justify-between gap-6 bg-[#E8C547] text-[#090909] px-6 py-4 font-black text-[15px] tracking-wide hover:bg-[#F5D76E] transition-all group"
              >
                Analyse My Resume
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <span className="text-[11px] text-[#F5F0E8]/25 font-medium tracking-wider text-center">Free · No card required · 60 seconds</span>
            </div>
          </div>
        </div>

        {/* Scroll cue */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <span className="text-[10px] uppercase tracking-[0.3em] text-[#F5F0E8]">Scroll</span>
          <ChevronDown size={16} className="text-[#E8C547] animate-bounce" />
        </div>
      </section>

      {/* ──── TAPE ─────────────────────────────────────────── */}
      <Tape items={['Skill Gap Analysis', 'AI Roadmap Builder', 'ATS Optimizer', 'Career Path Predictor', 'Peer Benchmarking', 'LaTeX Resume Editor', 'Market Intelligence', 'Negotiation Coach']} />

      {/* ──── THE PROBLEM (STORY) ───────────────────────────── */}
      <section id="story" className="py-40 px-8">
        <div className="max-w-7xl mx-auto">
          {/* Section number */}
          <div className="flex items-center gap-6 mb-20">
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#E8C547]/60">001</span>
            <div className="flex-1 h-px bg-[#F5F0E8]/8" />
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#F5F0E8]/20">The Problem</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-24 items-start">
            {/* Left: editorial text */}
            <div>
              <h2
                className="font-black leading-[0.92] tracking-[-0.03em] mb-12"
                style={{ fontSize: 'clamp(40px, 5.5vw, 84px)' }}
              >
                Most resumes<br />
                are written for<br />
                <span className="clip-gold">the wrong reader.</span>
              </h2>
              <div className="space-y-6 text-[#F5F0E8]/50 text-[17px] font-light leading-relaxed">
                <p>
                  You craft sentences. You worry about fonts. You obsess over the one-page rule. Meanwhile, the actual reader — an ATS algorithm — has already filtered you out because you used "responsible for" instead of "drove."
                </p>
                <p>
                  Gapminer doesn't coach you. It doesn't give you templates. It runs a clinical analysis of your document against real job taxonomies, surfaces the precise delta between where you are and where the role requires you to be, then hands you a step-by-step plan to close it.
                </p>
                <p className="text-[#F5F0E8]/80 font-medium">
                  The gap was always there. You just couldn't see it.
                </p>
              </div>
            </div>

            {/* Right: raw stats as editorial data points */}
            <div className="space-y-0">
              {[
                { n: '73', unit: '%', label: 'Resumes never reach a human eye', note: 'ATS rejection rate, LinkedIn 2024' },
                { n: '6', unit: 's', label: 'Time a recruiter spends on your resume', note: 'The Ladders eye-tracking study' },
                { n: '250', unit: '+', label: 'Applications per average corporate role', note: 'SHRM workforce report' },
                { n: '11', unit: '%', label: 'Candidates who understand their skill gaps', note: 'Gapminer internal benchmark' },
              ].map((stat, i) => (
                <div key={i} className="py-8 border-b border-[#F5F0E8]/8 grid grid-cols-[120px_1fr] gap-6 items-center group cursor-default">
                  <div className="text-[54px] font-black leading-none tracking-[-0.04em] text-[#E8C547] group-hover:scale-105 transition-transform origin-left">
                    <Counter target={parseInt(stat.n)} suffix={stat.unit} />
                  </div>
                  <div>
                    <div className="text-[15px] font-semibold text-[#F5F0E8] leading-snug mb-1">{stat.label}</div>
                    <div className="text-[11px] text-[#F5F0E8]/25 uppercase tracking-wider">{stat.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ──── HOW IT WORKS ─────────────────────────────────── */}
      <section id="engine" className="py-40 px-8 bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-20">
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#E8C547]/60">002</span>
            <div className="flex-1 h-px bg-[#F5F0E8]/8" />
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#F5F0E8]/20">The Engine</span>
          </div>

          <h2 className="font-black tracking-[-0.03em] leading-[0.92] mb-6" style={{ fontSize: 'clamp(38px, 5vw, 80px)' }}>
            Five agents.<br />
            <span className="clip-gold">One verdict.</span>
          </h2>
          <p className="text-[#F5F0E8]/40 text-[18px] font-light mb-20 max-w-xl">
            Each agent is a specialist. Together they run a complete audit of your professional signal in under 60 seconds.
          </p>

          {/* Agent pipeline — horizontal on desktop, vertical on mobile */}
          <div className="grid lg:grid-cols-5 gap-0 relative">
            {/* Connector line */}
            <div className="absolute top-[60px] left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#E8C547]/30 to-transparent hidden lg:block" />

            {[
              { num: '01', name: 'Parser', desc: 'Tears apart your PDF. Reads formatting signals as data — whitespace, hierarchy, density.', color: '#E8C547' },
              { num: '02', name: 'Extractor', desc: 'Maps every skill, tool, and method to a canonical taxonomy of 10,000+ tech identifiers.', color: '#E8C547' },
              { num: '03', name: 'Analyst', desc: 'Cross-references your stack against the job. Outputs a gap matrix with severity scores.', color: '#E8C547' },
              { num: '04', name: 'Pathfinder', desc: 'Generates a sequenced learning roadmap. Ordered by ROI — highest-leverage gaps first.', color: '#E8C547' },
              { num: '05', name: 'Market Intel', desc: 'Layers in live hiring data. Salary bands, trending skills, demand velocity by region.', color: '#E8C547' },
            ].map((agent, i) => (
              <div key={i} className="relative px-6 pt-0 group">
                {/* Node dot */}
                <div className="relative z-10 w-[52px] h-[52px] mb-8 border border-[#E8C547]/30 bg-[#090909] flex items-center justify-center font-black text-[13px] text-[#E8C547] group-hover:bg-[#E8C547] group-hover:text-[#090909] transition-all">
                  {agent.num}
                </div>
                <div className="text-[11px] font-black uppercase tracking-[0.25em] text-[#E8C547]/60 mb-2">{agent.name}</div>
                <p className="text-[14px] text-[#F5F0E8]/40 leading-relaxed">{agent.desc}</p>
              </div>
            ))}
          </div>

          {/* Live radar preview */}
          <div className="mt-24 grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-6">Live output preview</div>
              <div className="radar-float w-full max-w-[340px] mx-auto lg:mx-0">
                <div
                  className="p-8 border border-[#E8C547]/15"
                  style={{ background: 'rgba(232,197,71,0.03)' }}
                >
                  <div className="aspect-square">
                    <RadarGlyph />
                  </div>
                  <div className="grid grid-cols-3 gap-px mt-6">
                    {[['Matched', '82%', '#E8C547'], ['Missing', '12%', '#F87171'], ['Partial', '6%', '#94A3B8']].map(([l, v, c]) => (
                      <div key={l} className="bg-[#111] px-3 py-3 text-center">
                        <div className="text-[10px] uppercase tracking-widest text-[#F5F0E8]/25 mb-1 font-bold">{l}</div>
                        <div className="text-[22px] font-black" style={{ color: c }}>{v}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-0">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-6">Terminal output</div>
              <div
                className="p-8 font-mono text-[13px]"
                style={{ background: '#050505', border: '1px solid rgba(232,197,71,0.15)' }}
              >
                {[
                  { t: 0, text: '> Parsing resume...', color: '#F5F0E8/40' },
                  { t: 1, text: '  ✓ 847 tokens extracted', color: '#4ADE80' },
                  { t: 2, text: '> Running skill extractor...', color: '#F5F0E8/40' },
                  { t: 3, text: '  ✓ 34 unique skills identified', color: '#4ADE80' },
                  { t: 4, text: '> Comparing against JD taxonomy...', color: '#F5F0E8/40' },
                  { t: 5, text: '  ✗ Kubernetes: MISSING [HIGH]', color: '#F87171' },
                  { t: 6, text: '  ✗ System Design: PARTIAL [MED]', color: '#FCD34D' },
                  { t: 7, text: '  ✓ React: STRONG MATCH', color: '#4ADE80' },
                  { t: 8, text: '> Generating roadmap...', color: '#F5F0E8/40' },
                  { t: 9, text: '  ✓ 3 steps · 14h total · ETA 3wk', color: '#4ADE80' },
                  { t: 10, text: '> Analysis complete. Score: 82/100', color: '#E8C547' },
                ].map((line, i) => (
                  <div key={i} className="mb-1.5" style={{ color: line.color.includes('/') ? `rgba(245,240,232,${parseFloat(line.color.split('/')[1]) / 100})` : line.color }}>
                    {line.text}
                  </div>
                ))}
                <div className="mt-4 flex items-center gap-2">
                  <span className="text-[#E8C547]">▋</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ──── FEATURES GRID ─────────────────────────────────── */}
      <section className="py-40 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-20">
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#E8C547]/60">003</span>
            <div className="flex-1 h-px bg-[#F5F0E8]/8" />
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#F5F0E8]/20">The Arsenal</span>
          </div>

          {/* Asymmetric bento — editorial layout */}
          <div className="grid grid-cols-12 gap-4 auto-rows-[200px]">
            {/* Large feature — career path */}
            <div
              className="col-span-12 lg:col-span-7 row-span-2 p-10 flex flex-col justify-between border border-[#F5F0E8]/8 hover:border-[#E8C547]/30 transition-all group"
              style={{ background: 'linear-gradient(135deg, rgba(232,197,71,0.06) 0%, rgba(9,9,9,0) 60%)' }}
            >
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-4">Career Intelligence</div>
                <h3 className="font-black text-[32px] tracking-[-0.02em] leading-tight mb-4">
                  Career Path<br />Predictor
                </h3>
                <p className="text-[15px] text-[#F5F0E8]/40 max-w-xs leading-relaxed">
                  Based on your skills, the AI generates a probability-weighted map of roles you can realistically land — with timelines and what's missing.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                {['Senior Engineer', 'Tech Lead', 'Staff Eng', 'Solutions Arch'].map((role, i) => (
                  <span key={role} className="text-[12px] font-bold px-3 py-1.5 border border-[#F5F0E8]/10 text-[#F5F0E8]/40 group-hover:border-[#E8C547]/30 group-hover:text-[#E8C547]/70 transition-all" style={{ transitionDelay: `${i * 50}ms` }}>
                    {role}
                    <span className="ml-2 text-[#E8C547]/60">{['85%', '65%', '40%', '30%'][i]}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* ATS */}
            <div className="col-span-12 lg:col-span-5 row-span-1 p-8 border border-[#F5F0E8]/8 hover:border-[#E8C547]/30 transition-all group">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-3">Resume Intelligence</div>
              <h3 className="font-black text-[22px] tracking-[-0.02em] mb-2">ATS Keyword Optimizer</h3>
              <p className="text-[13px] text-[#F5F0E8]/35">Rewrites your experience bullets to match the linguistic patterns ATS systems look for. Same story, better signal.</p>
            </div>

            {/* Market Demand */}
            <div className="col-span-12 lg:col-span-5 row-span-1 p-8 border border-[#F5F0E8]/8 hover:border-[#E8C547]/30 transition-all flex flex-col justify-between">
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-3">Market Intelligence</div>
                <h3 className="font-black text-[22px] tracking-[-0.02em] mb-2">Live Demand Heatmap</h3>
              </div>
              <div className="flex gap-2">
                {[['Kubernetes', 91], ['Rust', 78], ['Go', 84], ['MLOps', 88]].map(([skill, score]) => (
                  <div key={skill} className="flex-1 text-center">
                    <div className="text-[11px] text-[#F5F0E8]/30 font-bold uppercase tracking-wider mb-1">{skill}</div>
                    <div className="h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div className="h-full bg-[#E8C547]" style={{ width: `${score}%`, opacity: 0.7 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* LaTeX Editor */}
            <div
              className="col-span-12 lg:col-span-4 row-span-2 p-8 border border-[#F5F0E8]/8 hover:border-[#E8C547]/30 transition-all flex flex-col justify-between group"
              style={{ background: 'rgba(14,14,14,0.8)' }}
            >
              <div>
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-4">Resume Builder</div>
                <h3 className="font-black text-[26px] tracking-[-0.02em] leading-tight mb-4">AI-Powered LaTeX Editor</h3>
                <p className="text-[14px] text-[#F5F0E8]/35 leading-relaxed">Generate beautiful, ATS-proof resumes in LaTeX with AI writing assistance and live PDF preview.</p>
              </div>
              <div className="font-mono text-[11px] bg-[#050505] p-4 border border-[#E8C547]/10">
                <div className="text-[#C084FC] mb-1">{'\\resumeItem{'}</div>
                <div className="text-[#4ADE80] pl-4 mb-1">{'Led 10K → 50K RPS migration'}</div>
                <div className="text-[#E8C547]/40 pl-4 mb-1">{'% AI: add tech stack'}</div>
                <div className="text-[#F5F0E8]/50">{'}'}</div>
              </div>
              <Link to="/latex" className="flex items-center gap-2 text-[13px] font-bold text-[#E8C547] hover:gap-4 transition-all">
                Open Editor <ArrowRight size={14} />
              </Link>
            </div>

            {/* Negotiation */}
            <div className="col-span-12 lg:col-span-4 row-span-1 p-8 border border-[#F5F0E8]/8 hover:border-[#E8C547]/30 transition-all">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-3">Compensation</div>
              <h3 className="font-black text-[22px] tracking-[-0.02em] mb-2">Negotiation Coach</h3>
              <p className="text-[13px] text-[#F5F0E8]/35">Real-time roleplay with an AI that knows the salary bands, your BATNA, and when to walk away.</p>
            </div>

            {/* Peer Bench */}
            <div className="col-span-12 lg:col-span-4 row-span-1 p-8 border border-[#F5F0E8]/8 hover:border-[#E8C547]/30 transition-all">
              <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#E8C547]/60 mb-3">Benchmarking</div>
              <h3 className="font-black text-[22px] tracking-[-0.02em] mb-2">Peer Comparison</h3>
              <p className="text-[13px] text-[#F5F0E8]/35">See how your profile stacks against anonymized candidates targeting the same roles. Know where you rank.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ──── TESTIMONIALS ──────────────────────────────────── */}
      <section id="proof" className="py-40 px-8 bg-[#0E0E0E]">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-20">
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#E8C547]/60">004</span>
            <div className="flex-1 h-px bg-[#F5F0E8]/8" />
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#F5F0E8]/20">Proof</span>
          </div>

          {/* Big pull quote */}
          <div className="mb-20">
            <div className="text-[120px] leading-none text-[#E8C547]/15 font-black select-none">"</div>
            <blockquote className="text-[clamp(24px,3.5vw,52px)] font-black leading-[1.1] tracking-[-0.03em] -mt-12 max-w-4xl">
              Gapminer told me my resume was optimized for a role I had{' '}
              <span className="clip-gold">two years ago</span>.
              That one sentence got me to update everything. I had an offer in 3 weeks.
            </blockquote>
            <div className="flex items-center gap-4 mt-10">
              <div className="w-px h-12 bg-[#E8C547]/30" />
              <div>
                <div className="font-bold text-[15px]">Alex Chen</div>
                <div className="text-[12px] text-[#F5F0E8]/30 uppercase tracking-wider">Lead Engineer · Stripe</div>
              </div>
            </div>
          </div>

          {/* Secondary testimonials — lean and editorial */}
          <div className="grid lg:grid-cols-3 gap-0">
            {[
              {
                quote: "The multi-agent pipeline catches things you'd never notice. It saw that I used 'responsible for' 14 times and explained why that tanked my ATS score.",
                name: 'Sarah Jenkins',
                role: 'Product Designer · Figma',
              },
              {
                quote: "I paid a career coach $400 for what Gapminer gave me for free. The roadmap links were all verified and ranked by what would actually move the needle.",
                name: 'Mark Thompson',
                role: 'DevOps Lead · Datadog',
              },
              {
                quote: "The career path predictor is uncanny. It said I was 40% of the way to a Staff Eng role. Seeing the exact gaps written out made it feel achievable.",
                name: 'Priya Sharma',
                role: 'Senior Engineer · Vercel',
              },
            ].map((t, i) => (
              <div key={i} className={`p-10 ${i < 2 ? 'border-r border-[#F5F0E8]/6' : ''}`}>
                <p className="text-[15px] text-[#F5F0E8]/50 leading-relaxed mb-8 font-light italic">"{t.quote}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[#E8C547] text-[#090909] font-black text-[13px] flex items-center justify-center">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="font-bold text-[13px]">{t.name}</div>
                    <div className="text-[11px] text-[#F5F0E8]/25 uppercase tracking-wider">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── PRICING ───────────────────────────────────────── */}
      <section id="pricing" className="py-40 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-6 mb-20">
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#E8C547]/60">005</span>
            <div className="flex-1 h-px bg-[#F5F0E8]/8" />
            <span className="text-[11px] font-black uppercase tracking-[0.35em] text-[#F5F0E8]/20">Pricing</span>
          </div>

          <div className="grid lg:grid-cols-[1fr_auto] gap-16 items-end mb-16">
            <h2 className="font-black tracking-[-0.03em] leading-[0.92]" style={{ fontSize: 'clamp(40px, 5vw, 80px)' }}>
              One question:<br />
              <span className="clip-gold">what's the gap worth to you?</span>
            </h2>
            <p className="text-[#F5F0E8]/40 text-[15px] max-w-xs font-light leading-relaxed">
              A single salary negotiation win pays for a year of Pro. The ROI math isn't subtle.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-0 border border-[#F5F0E8]/8">
            {[
              {
                name: 'Free',
                price: '$0',
                period: 'forever',
                tag: null,
                items: ['1 analysis per month', 'Basic skill gap radar', 'Community roadmap links', 'ATS score'],
                cta: 'Start free',
                href: '/auth?mode=signup',
                highlight: false,
              },
              {
                name: 'Pro',
                price: '$12',
                period: 'per month',
                tag: 'Most chosen',
                items: ['Unlimited analyses', 'ATS keyword optimizer', 'Verified resource roadmap', 'Career path predictor', 'Peer benchmarking', 'LaTeX editor'],
                cta: 'Go Pro',
                href: '/auth?mode=signup',
                highlight: true,
              },
              {
                name: 'Teams',
                price: '$49',
                period: 'per month',
                tag: null,
                items: ['Up to 10 members', 'Market intelligence dashboard', 'Hiring trend alerts', 'Recruiter CRM', 'Priority support'],
                cta: 'Contact sales',
                href: '/auth',
                highlight: false,
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`p-10 flex flex-col ${i < 2 ? 'border-r border-[#F5F0E8]/8' : ''} ${plan.highlight ? 'bg-[#E8C547]/5' : ''} relative`}
              >
                {plan.tag && (
                  <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#E8C547] text-[#090909] px-3 py-1 text-[11px] font-black uppercase tracking-widest">
                    {plan.tag}
                  </div>
                )}
                <div className="mb-8">
                  <div className="text-[11px] font-black uppercase tracking-[0.3em] text-[#F5F0E8]/30 mb-4">{plan.name}</div>
                  <div className="flex items-baseline gap-2">
                    <span className={`font-black text-[52px] leading-none tracking-[-0.04em] ${plan.highlight ? 'text-[#E8C547]' : ''}`}>{plan.price}</span>
                    <span className="text-[13px] text-[#F5F0E8]/30 font-medium">{plan.period}</span>
                  </div>
                </div>
                <ul className="space-y-3 mb-10 flex-grow">
                  {plan.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-3 text-[14px] text-[#F5F0E8]/60">
                      <Check size={12} className="text-[#E8C547] shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.href}
                  className={`text-center py-4 font-black text-[14px] tracking-wide transition-all ${plan.highlight
                    ? 'bg-[#E8C547] text-[#090909] hover:bg-[#F5D76E]'
                    : 'border border-[#F5F0E8]/15 text-[#F5F0E8]/60 hover:border-[#E8C547]/40 hover:text-[#F5F0E8]'
                    }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──── FINAL CTA ─────────────────────────────────────── */}
      <section className="py-40 px-8 bg-[#0E0E0E] relative overflow-hidden">
        {/* Giant ghost text */}
        <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
          <span className="font-black text-[clamp(100px,18vw,280px)] text-stroke opacity-30 leading-none tracking-[-0.06em]">
            BRIDGE IT.
          </span>
        </div>

        <div className="relative max-w-7xl mx-auto text-center">
          <div className="text-[11px] font-black uppercase tracking-[0.4em] text-[#E8C547]/60 mb-8">Your move</div>
          <h2 className="font-black tracking-[-0.04em] leading-[0.88] mb-10" style={{ fontSize: 'clamp(52px, 8vw, 128px)' }}>
            The gap is real.<br />
            <span className="clip-gold">Close it.</span>
          </h2>
          <p className="text-[#F5F0E8]/35 text-[18px] max-w-lg mx-auto font-light leading-relaxed mb-12">
            60 seconds. Five AI agents. One clear roadmap between where you are and where you want to be.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth?mode=signup"
              className="bg-[#E8C547] text-[#090909] px-10 py-5 font-black text-[16px] tracking-wide hover:bg-[#F5D76E] transition-all flex items-center gap-3 group"
            >
              Analyse My Resume Free
              <ArrowUpRight size={18} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <span className="text-[12px] text-[#F5F0E8]/20 font-medium tracking-wider">No card · No commitment</span>
          </div>
        </div>
      </section>

      {/* ──── FOOTER ────────────────────────────────────────── */}
      <footer className="py-16 px-8 border-t border-[#F5F0E8]/6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[auto_1fr_auto] gap-12 items-center">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-[#E8C547] rounded-sm flex items-center justify-center">
              <span className="text-[#090909] font-black text-sm">G</span>
            </div>
            <span className="font-black text-[15px] tracking-[-0.02em]">GAPMINER</span>
          </div>
          <nav className="flex flex-wrap gap-8 justify-center">
            {[['#story', 'The Problem'], ['#engine', 'The Engine'], ['#proof', 'Proof'], ['#pricing', 'Pricing'], ['/auth', 'Sign In']].map(([href, label]) => (
              <a key={href} href={href} className="text-[12px] text-[#F5F0E8]/25 hover:text-[#F5F0E8]/60 transition-colors uppercase tracking-widest font-bold">
                {label}
              </a>
            ))}
          </nav>
          <div className="text-[11px] text-[#F5F0E8]/15 uppercase tracking-wider font-medium">
            © 2025 Gapminer. Your data stays yours.
          </div>
        </div>
      </footer>
    </div>
  )
}
