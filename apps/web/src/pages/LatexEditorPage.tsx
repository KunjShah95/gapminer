import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Play, Download, Save, Settings,
  Sparkles, History, Search, Layout, Sidebar,
  ChevronRight, ChevronLeft, MoreHorizontal,
  Plus, Trash2, Folder, ExternalLink, Send, Bot, X
} from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { materialDark } from '@uiw/codemirror-theme-material'
import Latex from 'react-latex-next'
import 'katex/dist/katex.min.css'
import { useChat } from '@ai-sdk/react'
import { cn } from '@/lib/utils' // Assuming this utility exists, otherwise I'll define it simple

const INITIAL_LATEX = `\\documentclass{article}
\\usepackage[utf8]{inputenc}

\\title{Software Engineering Career Roadmap}
\\author{Gapminer AI}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This document outlines my career progression strategy based on AI analysis of current market trends and my skill sets.

\\section{Core Skills}
\\begin{itemize}
    \\item Rust \\& Systems Programming
    \\item WebAssembly
    \\item gRPC \\& Backend Architecture
    \\item Kubernetes
\\end{itemize}

\\section{Goal: Senior Staff Engineer}
Focus on distributed systems and high-throughput networking.

\\end{document}
`

export default function LatexEditorPage() {
  const [latex, setLatex] = useState(INITIAL_LATEX)
  const [isCompiling, setIsCompiling] = useState(false)
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showOptimizationPanel, setShowOptimizationPanel] = useState(false)
  const [optimizationData, setOptimizationData] = useState<any>(null)
  const [activeFile, setActiveFile] = useState('main.tex')
  const [showAi, setShowAi] = useState(false)
  const { id } = useParams<{ id: string }>()
  const [isSaving, setIsSaving] = useState(false)

  // Load from DB
  useEffect(() => {
    if (id) {
      const token = localStorage.getItem('token')
      fetch(`/api/v1/resume/details/${id}`, { // Assuming a details endpoint or adapting logic
           headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.resumeText) setLatex(data.resumeText)
        if (data.name) setActiveFile(data.name)
      })
      .catch(err => console.error("Load failed:", err))
    }
  }, [id])

  // Save to DB
  const handleSave = async () => {
    if (!id) {
      alert("No document ID found. Save only available for existing analysis artifacts.")
      return
    }
    setIsSaving(true)
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/v1/resume/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ resumeText: latex, name: activeFile })
      })
      if (response.ok) {
        alert("Saved successfully")
      }
    } catch (err) {
      console.error("Save failed:", err)
    } finally {
      setIsSaving(false)
    }
  }

  // Vercel AI SDK Integration
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/v1/chat', // Unified API endpoint
    initialMessages: [
      { id: '1', role: 'system', content: 'You are an expert LaTeX assistant. Help the user write professional documents.' }
    ]
  } as any) as any

  // Simulated compilation
  const handleCompile = () => {
    setIsCompiling(true)
    setTimeout(() => setIsCompiling(false), 1200)
  }

  const handleOptimizeATS = async () => {
    setIsOptimizing(true);
    try {
      const response = await fetch('/api/v1/agent/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          resumeText: latex, // For now passing current latex, but ideally we'd pass raw resume content
          jobDescriptionText: "Senior Software Engineer with Rust and Distributed Systems expertise" // Mock for now
        }),
      });
      const data = await response.json();
      if (data.status === 'success') {
        setOptimizationData(data.optimization);
        setLatex(data.optimization.optimizedLatex);
        setShowOptimizationPanel(true);
      }
    } catch (err) {
      console.error("Optimization failed:", err);
    } finally {
      setIsOptimizing(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-low overflow-hidden font-body text-on-surface">
      {/* ── Editor Toolbar ──────────────────────────────────── */}
      <header className="h-14 border-b border-outline-variant/15 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-md z-30 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-colors"
          >
            <Sidebar size={18} />
          </button>
          <div className="h-4 w-px bg-outline-variant/30"></div>
          <div className="flex items-center gap-2 px-3 py-1 bg-surface-container border border-outline-variant/10 rounded-xl">
            <FileText size={14} className="text-primary" />
            <span className="text-xs font-bold tracking-tight">{activeFile}</span>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-colors">
              <History size={16} />
            </button>
            <button className="p-1.5 hover:bg-surface-container-high rounded-lg text-outline transition-colors">
              <Search size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAi(!showAi)}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all border",
              showAi ? "bg-primary/20 border-primary text-primary" : "bg-surface-container border-outline-variant/10 text-on-surface-variant hover:border-primary/30"
            )}
          >
            <Sparkles size={14} className={isLoading ? "animate-spin" : ""} />
            AI Assistant
          </button>
          
          <button
            onClick={handleOptimizeATS}
            disabled={isOptimizing}
            className={cn(
              "flex items-center gap-2 px-4 py-1.5 rounded-xl font-bold text-xs transition-all border",
              "bg-tertiary/10 border-tertiary/30 text-tertiary hover:bg-tertiary/20"
            )}
          >
            <Bot size={14} className={isOptimizing ? "animate-spin" : ""} />
            {isOptimizing ? "Optimizing..." : "Optimize for ATS"}
          </button>
          <div className="h-4 w-px bg-outline-variant/30"></div>
          <button
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 px-5 py-2 primary-gradient text-on-primary-fixed rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all"
          >
            <Play size={14} fill="currentColor" />
            {isCompiling ? 'Compiling...' : 'Recompile'}
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="p-2 glass border border-outline-variant/20 rounded-xl text-outline hover:text-primary transition-all flex items-center gap-2 px-3"
          >
            <Save size={18} className={isSaving ? "animate-pulse" : ""} />
            <span className="text-[10px] font-black uppercase tracking-tight">Save</span>
          </button>
          <button className="p-2 glass border border-outline-variant/20 rounded-xl text-outline hover:text-primary transition-all">
            <Download size={18} />
          </button>
        </div>
      </header>

      {/* ── Main Workspace Area ──────────────────────────────── */}
      <div className="flex-grow flex overflow-hidden relative">
        {/* Left Drawer (File Tree) */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 280, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-outline-variant/15 bg-surface-container-low flex flex-col shrink-0"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-8 px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-outline">Project Files</h3>
                  <button className="p-1 text-primary hover:bg-primary/5 rounded">
                    <Plus size={16} />
                  </button>
                </div>
                <div className="space-y-1">
                  {[
                    { name: 'main.tex', active: true },
                    { name: 'references.bib', active: false },
                    { name: 'resume.cls', active: false },
                    { name: 'images/', isFolder: true },
                  ].map((file) => (
                    <div
                      key={file.name}
                      onClick={() => !file.isFolder && setActiveFile(file.name)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-2.5 rounded-2xl cursor-pointer transition-all border border-transparent",
                        file.active ? "bg-primary/10 text-primary border-primary/20" : "text-on-surface-variant hover:bg-surface-container"
                      )}
                    >
                      {file.isFolder ? <Folder size={16} /> : <FileText size={16} />}
                      <span className="text-sm font-semibold tracking-tight">{file.name}</span>
                      {file.active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-auto p-6 border-t border-outline-variant/10">
                <div className="glass bg-surface-container-high p-4 rounded-2xl border border-outline-variant/20">
                  <div className="flex items-center gap-3 mb-2">
                    <Layout size={16} className="text-tertiary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-outline">Document Info</span>
                  </div>
                  <div className="text-[11px] font-medium text-on-surface-variant leading-relaxed">
                    Lines: {latex.split('\\n').length}<br />
                    Words: {latex.split(/\\s+/).length}<br />
                    Chars: {latex.length}
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Right Drawer (Optimization Panel) */}
        <AnimatePresence>
          {showOptimizationPanel && (
            <motion.aside
              initial={{ x: -400, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -400, opacity: 0 }}
              className="absolute left-72 top-14 bottom-0 w-[400px] border-r border-outline-variant/15 bg-surface/95 backdrop-blur-3xl z-40 overflow-hidden shadow-2xl"
            >
              <div className="p-8 h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h3 className="text-sm font-black tracking-tight skew-x-[-2deg]">ATS Optimization</h3>
                    <p className="text-[10px] font-bold text-tertiary uppercase tracking-widest mt-1">Suggested Bullet Improvements</p>
                  </div>
                  <button onClick={() => setShowOptimizationPanel(false)} className="text-outline hover:text-on-surface transition-colors p-2">
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-grow overflow-auto custom-scrollbar space-y-6 pr-2">
                  {optimizationData?.bulletPointImprovements.map((imp: any, idx: number) => (
                    <div key={idx} className="glass bg-surface-container-high p-5 rounded-3xl border border-outline-variant/10 group hover:border-tertiary/30 transition-all">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-5 h-5 rounded-lg bg-tertiary/20 flex items-center justify-center text-tertiary text-[10px] font-bold">
                          {idx + 1}
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-outline">Refinement Strategy</span>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <div className="text-[9px] font-bold text-error/60 uppercase tracking-widest mb-1">Original</div>
                          <div className="text-xs text-on-surface-variant italic opacity-60 leading-relaxed font-medium">"{imp.original}"</div>
                        </div>
                        
                        <div className="h-px bg-outline-variant/10"></div>
                        
                        <div>
                          <div className="text-[9px] font-bold text-success uppercase tracking-widest mb-1">Optimized</div>
                          <div className="text-xs text-on-surface font-semibold leading-relaxed">"{imp.improved}"</div>
                        </div>
                        
                        <div className="bg-tertiary/5 p-3 rounded-2xl border border-tertiary/10">
                          <p className="text-[10px] text-tertiary font-medium leading-relaxed">
                            <span className="font-black">RATIONALE:</span> {imp.reason}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-6 mt-auto">
                   <button 
                    onClick={() => {
                      setLatex(optimizationData.optimizedLatex);
                      handleCompile();
                    }}
                    className="w-full py-4 bg-tertiary/20 border border-tertiary/30 text-tertiary rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-tertiary hover:text-on-tertiary transition-all"
                   >
                     Re-Apply Full Optimization
                   </button>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Middle Area (Editor) */}
        <section className="flex-grow flex flex-col min-w-0 bg-[#263238] shadow-[inset_0_0_80px_rgba(0,0,0,0.2)]">
          <div className="flex-grow overflow-auto custom-scrollbar">
            <CodeMirror
              value={latex}
              height="100%"
              theme={materialDark}
              onChange={(value) => setLatex(value)}
              className="text-sm selection:bg-primary/30"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
              }}
            />
          </div>

          {/* AI Assistance Popover */}
          <AnimatePresence>
            {showAi && (
              <motion.div
                initial={{ y: 200, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 200, opacity: 0 }}
                className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[600px] max-w-[90%] z-40"
              >
                <div className="glass bg-surface-container-highest/90 border border-primary/30 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] backdrop-blur-3xl overflow-hidden">
                  <div className="p-2 border-b border-outline-variant/20 flex items-center justify-between px-6 bg-primary/5">
                    <div className="flex items-center gap-3 py-3">
                      <div className="w-8 h-8 rounded-xl primary-gradient flex items-center justify-center text-on-primary-fixed shadow-lg">
                        <Bot size={16} />
                      </div>
                      <div>
                        <div className="text-xs font-black tracking-tight skew-x-[-2deg]">AI Writing Assistant</div>
                        <div className="text-[9px] font-bold text-primary uppercase tracking-[0.2em] opacity-80">Connected to Vercel AI SDK</div>
                      </div>
                    </div>
                    <button onClick={() => setShowAi(false)} className="text-outline hover:text-on-surface transition-colors p-2">
                      <X size={18} />
                    </button>
                  </div>
                  
                  <div className="max-h-64 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {messages.length === 1 && (
                      <div className="text-center py-8 text-on-surface-variant italic font-light opacity-60">
                        Ask me to generate a section, fix errors, or suggest improvements...
                      </div>
                    )}
                    {messages.slice(1).map((m: any) => (
                      <div key={m.id} className={cn(
                        "flex gap-4",
                        m.role === 'user' ? "flex-row-reverse" : ""
                      )}>
                        <div className={cn(
                          "max-w-[80%] p-4 rounded-3xl text-sm leading-relaxed",
                          m.role === 'user' 
                            ? "bg-primary text-on-primary shadow-lg shadow-primary/10 rounded-tr-sm" 
                            : "bg-surface-container-high border border-outline-variant/20 rounded-tl-sm text-on-surface-variant"
                        )}>
                          {m.role === 'assistant' ? (
                            <div className="prose prose-invert max-w-none prose-sm leading-relaxed">
                              <Latex>{m.content}</Latex>
                            </div>
                          ) : (
                            m.content
                          )}
                        </div>
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex gap-4">
                        <div className="bg-surface-container-high border border-outline-variant/20 p-4 rounded-3xl rounded-tl-sm animate-pulse">
                          <div className="flex gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-75"></span>
                            <span className="w-1.5 h-1.5 rounded-full bg-primary/50 animate-bounce delay-150"></span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <form onSubmit={handleSubmit} className="p-4 bg-surface-container-low/50 border-t border-outline-variant/10">
                    <div className="relative">
                      <input
                        value={input}
                        onChange={handleInputChange}
                        placeholder="Draft a 'Technical Skills' section..."
                        className="w-full bg-surface-container border border-outline-variant/20 rounded-2xl py-4 pl-6 pr-14 text-sm focus:outline-none focus:border-primary/50 transition-all placeholder:text-outline/40 font-medium"
                      />
                      <button 
                        type="submit"
                        className="absolute right-2 top-2 bottom-2 w-10 h-10 primary-gradient rounded-xl flex items-center justify-center text-on-primary shadow-lg hover:scale-105 active:scale-95 transition-all"
                      >
                        <Send size={18} />
                      </button>
                    </div>
                  </form>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right Area (Preview) */}
        <section className="flex-grow flex flex-col bg-surface border-l border-outline-variant/20 relative">
          {/* Preview Tab Header */}
          <div className="h-10 px-4 border-b border-outline-variant/10 bg-surface-container-high flex items-center gap-2">
            <div className="px-3 py-1 bg-surface rounded-t-lg border-x border-t border-outline-variant/10 text-[10px] font-bold text-primary flex items-center gap-2">
              <Play size={10} />
              PDF PREVIEW
            </div>
            <div className="h-4 w-px bg-outline-variant/20 mx-2"></div>
            <button className="text-[10px] font-bold text-outline hover:text-on-surface transition-colors flex items-center gap-1">
              LOGS
            </button>
          </div>

          {/* Compilation Indicator */}
          <AnimatePresence>
            {isCompiling && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface/60 backdrop-blur-sm"
              >
                <div className="w-16 h-16 rounded-3xl bg-primary/20 flex items-center justify-center relative">
                  <div className="absolute inset-0 border-2 border-primary rounded-3xl animate-ping opacity-25"></div>
                  <Sparkles size={32} className="text-primary animate-pulse" />
                </div>
                <div className="mt-6 text-center">
                  <div className="text-sm font-black tracking-widest text-primary animate-pulse">GENERATING ARTIFACTS</div>
                  <div className="text-[10px] font-bold text-outline uppercase tracking-widest mt-2">{activeFile} render in progress</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Preview Scrollable */}
          <div className={cn(
            "flex-grow overflow-auto p-12 bg-surface-container-low transition-all duration-700",
            isCompiling ? "scale-[0.98] blur-sm grayscale-[0.5]" : "scale-100"
          )}>
            <div className="mx-auto w-[210mm] min-h-[297mm] bg-white text-black p-[25mm] shadow-[0_20px_60px_rgba(0,0,0,0.1)] rounded-sm border border-outline-variant/10 transform-gpu origin-top">
              <div className="prose prose-slate max-w-none latex-preview">
                <Latex>{latex}</Latex>
              </div>
            </div>
          </div>
          
          {/* Preview zoom controls */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2 glass p-2 rounded-2xl border border-outline-variant/10 z-10 shadow-xl">
             <button className="w-8 h-8 flex items-center justify-center text-outline hover:text-primary transition-colors">
              <Settings size={16} />
            </button>
            <div className="h-4 w-px bg-outline-variant/30"></div>
            <span className="text-[10px] font-black tracking-widest px-2 opacity-60 uppercase">100% (FIT)</span>
            <div className="h-4 w-px bg-outline-variant/30"></div>
            <button className="w-8 h-8 flex items-center justify-center text-outline hover:text-primary transition-colors">
              <ExternalLink size={16} />
            </button>
          </div>
        </section>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(176,162,255,0.1);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(176,162,255,0.2);
        }
        
        .latex-preview h1 { font-size: 2.25rem !important; font-weight: 800 !important; border-bottom: 2px solid #eee; padding-bottom: 0.5rem; margin-bottom: 1rem; }
        .latex-preview h2 { font-size: 1.5rem !important; font-weight: 700 !important; margin-top: 2rem !important; border-left: 4px solid #b0a2ff; padding-left: 1rem; }
        .latex-preview p { line-height: 1.6; color: #334155; }
        .latex-preview ul { margin-top: 1rem; list-style-type: none; padding-left: 1.5rem; }
        .latex-preview li { margin-bottom: 0.5rem; position: relative; }
        .latex-preview li::before { content: "•"; color: #b0a2ff; position: absolute; left: -1.2rem; font-weight: bold; }

        .cm-editor {
          height: 100% !important;
          font-family: 'JetBrains Mono', 'Fira Code', monospace !important;
        }
        .cm-scroller {
           scrollbar-width: thin;
           scrollbar-color: rgba(176,162,255,0.1) transparent;
        }
      `}</style>
    </div>
  )
}

