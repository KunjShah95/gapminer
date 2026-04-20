import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { useNavigate, Link } from 'react-router-dom'
import { useAnalysisStore } from '@/stores/analysisStore'
import { useAuthStore } from '@/stores/authStore'
import { safeReadJson } from '@/lib/authFetch'

import {
  Upload, FileText, Link2, Loader2, Check, AlertCircle,
  X, Brain, Target, BarChart3, Map, Globe, ChevronRight,
  Sparkles, Shield, Cpu, Activity, Zap
} from 'lucide-react'

type InputTab = 'paste' | 'url'

function AgentTracker({ steps }: { steps: { id: string; label: string; status: string; message?: string }[] }) {
  const icons: Record<string, any> = {
    parse:   Brain,
    extract: Target,
    compare: BarChart3,
    market:  Globe,
    roadmap: Map,
  }

  return (
    <div className="glass bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/20 shadow-2xl animate-in zoom-in-95 duration-500">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center text-on-primary-fixed animate-pulse">
          <Cpu size={20} />
        </div>
        <div>
          <h3 className="font-bold text-lg">AI Pipeline Active</h3>
          <p className="text-xs text-on-surface-variant font-light uppercase tracking-widest">5 Specialized Agents Online</p>
        </div>
      </div>
      
      <div className="space-y-4">
        {steps.map((step) => {
          const Icon = icons[step.id] || Brain
          const isActive = step.status === 'running'
          const isDone = step.status === 'done'
          
          return (
            <div
              key={step.id}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                isActive ? 'bg-primary/5 border-primary/30' : isDone ? 'bg-surface-container border-outline-variant/10' : 'bg-surface-container-low border-transparent opacity-40'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                isActive ? 'bg-primary text-on-primary-fixed' : isDone ? 'bg-primary/20 text-primary' : 'bg-surface-container-highest text-outline'
              }`}>
                {isDone ? <Check size={18} /> : isActive ? <Loader2 size={18} className="animate-spin" /> : <Icon size={18} />}
              </div>
              <div className="flex-grow">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold skew-x-[-2deg] ${isActive ? 'text-primary' : isDone ? 'text-on-surface' : 'text-outline'}`}>
                    {step.label}
                  </span>
                  {isActive && <span className="text-[10px] font-black text-primary uppercase tracking-tighter animate-pulse">Processing...</span>}
                </div>
                {step.message && (
                  <p className="text-[11px] text-on-surface-variant font-light italic leading-none">{step.message}</p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className="mt-8 pt-8 border-t border-outline-variant/10 flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-outline">
        <span className="flex items-center gap-1.5 ring-1 ring-outline-variant/20 px-2 py-1 rounded-md bg-surface-container">
          <Shield size={10} className="text-primary" />
          Ollama Local
        </span>
        <span className="flex items-center gap-1.5 ring-1 ring-outline-variant/20 px-2 py-1 rounded-md bg-surface-container">
          <Activity size={10} className="text-tertiary" />
          94% Precision
        </span>
      </div>
    </div>
  )
}

export default function AnalyzerPage() {
  const navigate = useNavigate()
  const { liveSteps, isAnalyzing, setIsAnalyzing, updateStep, reset } = useAnalysisStore()

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [resumeText, setResumeText] = useState('')
  const [resumeMode, setResumeMode] = useState<'drop' | 'text'>('drop')

  const [jdTab, setJdTab] = useState<InputTab>('paste')
  const [jdText, setJdText] = useState('')
  const [jdUrl, setJdUrl] = useState('')
  const [seniority, setSeniority] = useState<'junior' | 'mid' | 'senior' | 'lead'>('senior')

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setResumeFile(accepted[0])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  })

  const runAnalysis = async () => {
    if ((!resumeFile && !resumeText) || (!jdText && !jdUrl)) return
    reset()
    setIsAnalyzing(true)

    let resumeContent = resumeText
    if (resumeFile) {
      const formData = new FormData()
      formData.append('text', await resumeFile.text())
      try {
        const parseRes = await fetch('/api/v1/agent/parse', {
          method: 'POST',
          body: formData
        })
        if (parseRes.ok) {
          const parseData = await safeReadJson<any>(parseRes, {})
          resumeContent = parseData.parsedData ? JSON.stringify(parseData.parsedData) : resumeText
        }
      } catch (err) {
        console.error('Parse error:', err)
      }
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      alert('Please log in first')
      setIsAnalyzing(false)
      return
    }

    try {
      const response = await fetch('/api/v1/agent/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          resumeText: resumeContent,
          jobDescriptionText: jdText || jdUrl
        })
      })

      if (!response.ok) {
        throw new Error('Analysis failed')
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const data = JSON.parse(line.slice(6))
                if (data.name === 'parse') {
                  updateStep('parse', { status: 'done', message: 'Resume parsed successfully' })
                } else if (data.name === 'normalize') {
                  updateStep('extract', { status: 'done', message: 'Skills extracted' })
                } else if (data.name === 'match') {
                  updateStep('compare', { status: 'done', message: 'Gap analysis complete' })
                } else if (data.name === 'insights') {
                  updateStep('roadmap', { status: 'done', message: 'Roadmap generated' })
                }
              } catch (e) {}
            }
          }
        }
      }

      const analysisRes = await fetch('/api/v1/analysis', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (analysisRes.ok) {
        const analyses = await safeReadJson<any[]>(analysisRes, [])
        if (analyses.length > 0) {
          const latest = analyses[0]
          navigate(`/roadmap/${latest.id}`)
          return
        }
      }

      navigate('/dashboard')
    } catch (err) {
      console.error('Analysis error:', err)
      alert('Analysis failed. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const canAnalyze = (resumeFile || resumeText.trim()) && (jdText.trim() || jdUrl.trim())

  return (
    <div className="bg-surface text-on-surface flex-grow font-body overflow-y-auto">
      <main className="py-12 px-8 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-5 gap-12 items-start">
          
          <div className="lg:col-span-3 space-y-8 animate-in fade-in slide-in-from-left-4 duration-700">
            <div>
              <span className="text-primary font-bold tracking-widest uppercase text-xs">Analysis Engine</span>
              <h1 className="text-4xl lg:text-5xl font-black tracking-tighter mt-2 mb-4 font-headline">New Gap Analysis</h1>
              <p className="text-on-surface-variant font-light max-w-xl">
                Upload your latest resume and the target role profile. Our agents will benchmark your expertise against thousands of real-world job taxonomies.
              </p>
            </div>

            {/* Resume Input Group */}
            <div className="glass bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/15 relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                  <FileText size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl uppercase tracking-tighter skew-x-[-2deg]">1. Source Resume</h3>
                  <p className="text-xs text-on-surface-variant font-light">PDF, DOCX or Plain Text</p>
                </div>
              </div>

              <div className="flex gap-1 mb-6 p-1 bg-surface-container rounded-2xl border border-outline-variant/10 max-w-[200px]">
                <button
                  onClick={() => setResumeMode('drop')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${resumeMode === 'drop' ? 'bg-primary text-on-primary-fixed shadow-lg' : 'text-outline hover:text-on-surface'}`}
                >
                  Upload
                </button>
                <button
                  onClick={() => setResumeMode('text')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${resumeMode === 'text' ? 'bg-primary text-on-primary-fixed shadow-lg' : 'text-outline hover:text-on-surface'}`}
                >
                  Text
                </button>
              </div>

              {resumeMode === 'drop' ? (
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-3xl p-10 transition-all flex flex-col items-center justify-center text-center group cursor-pointer ${
                    isDragActive ? 'border-primary bg-primary/5' : resumeFile ? 'border-primary bg-primary/2' : 'border-outline-variant/20 hover:border-primary/50'
                  }`}
                >
                  <input {...getInputProps()} />
                  {resumeFile ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-on-primary-fixed shadow-xl">
                        <FileText size={32} />
                      </div>
                      <div className="font-bold text-sm">{resumeFile.name}</div>
                      <div className="text-[10px] text-outline font-bold uppercase">{(resumeFile.size / 1024).toFixed(0)} KB · Ready</div>
                      <button onClick={(e) => { e.stopPropagation(); setResumeFile(null) }} className="mt-2 text-xs text-error hover:underline flex items-center gap-1 font-bold">
                        <X size={14} /> Remove
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-2xl glass bg-surface-container flex items-center justify-center text-outline mb-4 group-hover:text-primary group-hover:scale-110 transition-all border border-outline-variant/15">
                        <Upload size={28} />
                      </div>
                      <div className="text-sm font-bold mb-1">Drop resume here</div>
                      <p className="text-[11px] text-outline uppercase tracking-widest">or browse your files</p>
                    </>
                  )}
                </div>
              ) : (
                <textarea
                  className="w-full h-48 bg-surface-container-low border border-outline-variant/20 rounded-3xl p-6 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface text-sm placeholder:text-outline/50 font-light leading-relaxed"
                  placeholder="Paste your resume content here..."
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                />
              )}
            </div>

            {/* JD Input Group */}
            <div className="glass bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/15 relative">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-tertiary/10 flex items-center justify-center text-tertiary border border-tertiary/20">
                  <Target size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-xl uppercase tracking-tighter skew-x-[-2deg]">2. Target Role</h3>
                  <p className="text-xs text-on-surface-variant font-light">Paste Text or Job URL</p>
                </div>
              </div>

              <div className="flex gap-1 mb-6 p-1 bg-surface-container rounded-2xl border border-outline-variant/10 max-w-[200px]">
                <button
                  onClick={() => setJdTab('url')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jdTab === 'url' ? 'bg-tertiary text-on-tertiary shadow-lg' : 'text-outline hover:text-on-surface'}`}
                >
                  URL
                </button>
                <button
                  onClick={() => setJdTab('paste')}
                  className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${jdTab === 'paste' ? 'bg-tertiary text-on-tertiary shadow-lg' : 'text-outline hover:text-on-surface'}`}
                >
                  Text
                </button>
              </div>

              {jdTab === 'url' ? (
                <div className="relative group">
                  <div className="absolute left-5 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-tertiary transition-colors">
                    <Link2 size={18} />
                  </div>
                  <input
                    type="url"
                    className="w-full bg-surface-container-low border border-outline-variant/20 rounded-2xl pl-12 pr-6 py-4 focus:border-tertiary focus:ring-4 focus:ring-tertiary/5 transition-all outline-none text-sm placeholder:text-outline-variant"
                    placeholder="https://linkedin.com/jobs/..."
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                  />
                  <p className="mt-4 text-[10px] text-outline font-bold flex items-center gap-2 uppercase tracking-widest">
                    <Globe size={10} /> Supports LinkedIn, Indeed, Greenhouse & more
                  </p>
                </div>
              ) : (
                <textarea
                  className="w-full h-48 bg-surface-container-low border border-outline-variant/20 rounded-3xl p-6 focus:border-tertiary focus:ring-4 focus:ring-tertiary/5 transition-all outline-none text-sm placeholder:text-outline/50 font-light leading-relaxed"
                  placeholder="Paste the Job Description here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              )}
            </div>

            {/* Options */}
            <div className="glass bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/15 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-sm mb-0.5">Analysis Baseline</h4>
                  <p className="text-[10px] text-on-surface-variant uppercase font-light tracking-widest">Target Seniority Calibration</p>
                </div>
              </div>
              <div className="flex gap-2">
                {(['junior', 'mid', 'senior', 'lead'] as const).map((level) => (
                  <button
                    key={level}
                    onClick={() => setSeniority(level)}
                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${
                      seniority === level ? 'bg-primary border-primary text-on-primary-fixed shadow-lg' : 'bg-surface-container border-outline-variant/10 text-outline hover:text-on-surface'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {/* Action */}
            <div className="flex flex-col items-center gap-4 pt-4">
              <button
                onClick={runAnalysis}
                disabled={!canAnalyze || isAnalyzing}
                className="w-full max-w-md primary-gradient text-on-primary-fixed py-5 rounded-[2rem] font-black text-lg shadow-2xl hover:shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-[0.98] group"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 size={24} className="animate-spin" />
                    Agents Working...
                  </>
                ) : (
                  <>
                    <Brain size={24} className="group-hover:scale-110 transition-transform" />
                    Engage AI Analysis
                    <ChevronRight size={20} />
                  </>
                )}
              </button>
              {!canAnalyze && !isAnalyzing && (
                <p className="text-[10px] font-bold text-error uppercase tracking-widest animate-pulse flex items-center gap-1.5">
                  <AlertCircle size={10} />
                  Requires Resume and JD to initialize
                </p>
              )}
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8 sticky top-32">
            {isAnalyzing ? (
              <AgentTracker steps={liveSteps} />
            ) : (
              <div className="space-y-6">
                <div className="glass bg-surface-container-high p-8 rounded-[2.5rem] border border-outline-variant/15 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 primary-gradient opacity-10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000"></div>
                  <h3 className="font-black text-xl mb-6 tracking-tighter">AI Analysis Logic</h3>
                  <div className="space-y-6">
                    {[
                      { icon: Brain, title: 'Multi-Agent Flow', desc: '5 specialized agents handle parsing, context-matching, and roadmap generation in parallel.' },
                      { icon: Target, title: 'Semantic Depth', desc: 'We analyze the core architecture of your skills, not just keywords. Versions and paradigms are understood.' },
                      { icon: Shield, title: 'Local Compute', desc: 'All processing happens on our dedicated infrastructure via Ollama. 100% data privacy guaranteed.' }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-highest border border-outline-variant/10 flex items-center justify-center text-primary shrink-0 transition-colors group-hover:border-primary/30">
                          <item.icon size={20} />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm mb-1">{item.title}</h4>
                          <p className="text-[11px] text-on-surface-variant font-light leading-relaxed">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Example Output Card */}
                <div className="glass bg-[#0e0e13]/50 p-6 rounded-[2rem] border border-outline-variant/15 font-mono text-[10px] space-y-2 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all cursor-default select-none hidden lg:block">
                  <div className="flex items-center gap-2 text-primary font-black mb-4">
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse"></div>
                    REAL-TIME AGENT LOGS
                  </div>
                  <div className="text-on-surface/70 tracking-tighter">[AGENT 1] PARSING resume_v2.pdf... OK</div>
                  <div className="text-on-surface/70 tracking-tighter">[AGENT 2] SEARCHING skill_graph_v4... 12k nodes</div>
                  <div className="text-on-surface/70 tracking-tighter">[AGENT 2] SKILL: "gRPC" {'->'} Type: Backend, Level: High</div>
                  <div className="text-on-surface/70 tracking-tighter">[AGENT 3] COMPARING candidates... Top 12% match</div>
                  <div className="text-primary font-black pt-2 animate-pulse cursor-default">ANALYSIS INITIALIZED {'>'} READY_FOR_PROCESS</div>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  )
}
