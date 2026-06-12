import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  Play,
  Download,
  Save,
  Sparkles,
  Layout,
  Plus,
  Folder,
  Send,
  Bot,
  X,
  PanelRightOpen,
  PanelRightClose,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  SplitSquareHorizontal,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import CodeMirror from "@uiw/react-codemirror";
import { materialDark } from "@uiw/codemirror-theme-material";
import { useChat } from "@ai-sdk/react";
import { cn } from "@/lib/utils";

// ─── Initial LaTeX template (Overleaf-like) ────────────────
const INITIAL_LATEX = `\\documentclass[11pt]{article}
\\usepackage[utf8]{inputenc}
\\usepackage{amsmath, amssymb, amsthm}
\\usepackage{graphicx}
\\usepackage{hyperref}
\\usepackage{geometry}
\\geometry{margin=1in}

\\title{Software Engineering Career Roadmap}
\\author{Gapminer AI}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
This document outlines my career progression strategy based on AI analysis of current market trends and my skill sets.

\\subsection{Current Focus Areas}
\\begin{itemize}
    \\item Distributed Systems \\& Scalable Architecture
    \\item Advanced Rust Programming
    \\item Systems Programming with WebAssembly
    \\item gRPC \\& Event-Driven Architecture
\\end{itemize}

\\section{Career Objectives}

\\subsection{Short-term (6 months)}
\\begin{enumerate}
    \\item Master Kubernetes operator patterns
    \\item Contribute to an open-source Rust project
    \\item Achieve AWS Solutions Architect certification
\\end{enumerate}

\\subsection{Long-term (2 years)}
\\begin{enumerate}
    \\item Lead distributed systems team
    \\item Publish technical research on performance optimization
    \\item Build a production-grade WebAssembly runtime
\\end{enumerate}

\\section{Skills Matrix}

\\begin{tabular}{|l|c|c|}
\\hline
\\textbf{Skill} & \\textbf{Proficiency} & \\textbf{Priority} \\\\
\\hline
Rust & Advanced & High \\\\
Kubernetes & Intermediate & High \\\\
WebAssembly & Intermediate & Medium \\\\
Distributed Systems & Advanced & High \\\\
Machine Learning & Beginner & Low \\\\
\\hline
\\end{tabular}

\\section{Learning Resources}
\\begin{itemize}
    \\item \\href{https://doc.rust-lang.org/book/}{The Rust Programming Language} - Official Book
    \\item \\href{https://kubernetes.io/docs/}{Kubernetes Documentation} - CNCF
    \\item \\href{https://webassembly.org/}{WebAssembly Specification} - W3C
\\end{itemize}

\\end{document}
`;

// ─── File type for project explorer ─────────────────────────
interface ProjectFile {
  name: string;
  isFolder?: boolean;
  children?: ProjectFile[];
  content?: string;
}

const DEFAULT_FILES: ProjectFile[] = [
  { name: "main.tex", content: INITIAL_LATEX },
  { name: "references.bib", content: "% Add your references here\n" },
  { name: "images/", isFolder: true, children: [] },
];

// ─── Auto-save debounce ────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

// ─── Main Component ─────────────────────────────────────────
export default function LatexEditorPage() {
  const { id } = useParams<{ id: string }>();

  // Editor state
  const [latex, setLatex] = useState(INITIAL_LATEX);
  const [previousLatex, setPreviousLatex] = useState(INITIAL_LATEX);
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileError, setCompileError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showAi, setShowAi] = useState(false);
  const [showPdfPreview, setShowPdfPreview] = useState(true);
  const [activeFile, setActiveFile] = useState("main.tex");
  const [files] = useState<ProjectFile[]>(DEFAULT_FILES);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Array<{ line: number; message: string }>>([]);
  const [showValidation, setShowValidation] = useState(false);

  const draftStorageKey = id
    ? `gapminer-latex-draft:${id}`
    : "gapminer-latex-draft:default";

  // ─── Load draft ──────────────────────────────────────────
  useEffect(() => {
    setPdfUrl(null);
    setCompileError(null);
    try {
      const rawDraft = localStorage.getItem(draftStorageKey);
      if (!rawDraft) return;
      const draft = JSON.parse(rawDraft) as { latex?: string; activeFile?: string };
      if (draft.latex) {
        setLatex(draft.latex);
        setPreviousLatex(draft.latex);
      }
      if (draft.activeFile) setActiveFile(draft.activeFile);
    } catch (err) {
      console.error("Draft load failed:", err);
    }
  }, [id]);

  // ─── Cleanup PDF URL on unmount ─────────────────────────
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [pdfUrl]);

  // ─── Auto-save with debounce ─────────────────────────────
  const debouncedLatex = useDebounce(latex, 2000);

  useEffect(() => {
    if (debouncedLatex !== previousLatex) {
      handleAutoSave();
      setPreviousLatex(debouncedLatex);
    }
  }, [debouncedLatex]);

  const handleAutoSave = () => {
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({ latex, activeFile, savedAt: new Date().toISOString() }),
      );
      setLastSaved(new Date());
    } catch {
      // Storage full - silent fail
    }
  };

  // ─── Manual Save ─────────────────────────────────────────
  const handleSave = async () => {
    setIsSaving(true);
    try {
      localStorage.setItem(
        draftStorageKey,
        JSON.stringify({ latex, activeFile, savedAt: new Date().toISOString() }),
      );
      setLastSaved(new Date());
      await new Promise((r) => setTimeout(r, 300)); // subtle feedback
    } catch (err) {
      console.error("Save failed:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Vercel AI SDK Chat ──────────────────────────────────
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
  }: any = (useChat as any)({
    api: "/api/v1/chat",
    initialMessages: [
      {
        id: "1",
        role: "system",
        content:
          "You are an expert LaTeX assistant integrated into a resume editor. Help the user write professional documents, fix LaTeX errors, generate sections, and suggest improvements. Be concise and provide LaTeX code snippets when helpful.",
      },
    ],
  });

  // ─── Compile LaTeX (returns generated URL or null) ────
  const handleCompile = async (source = latex): Promise<string | null> => {
    setIsCompiling(true);
    setCompileError(null);
    setPdfUrl(null);

    try {
      const token = useAuthStore.getState().token;
      const response = await fetch("/api/v1/latex/compile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latexCode: source }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: "Compilation failed" }));
        setCompileError(error.details || error.error || "Unknown compilation error");
        return null;
      }

      const contentType = response.headers.get("content-type") || "";
      let url: string | null = null;

      if (contentType.includes("application/pdf")) {
        const blob = await response.blob();
        url = URL.createObjectURL(blob);
      } else if (contentType.includes("text/html")) {
        const html = await response.text();
        const blob = new Blob([html], { type: "text/html" });
        url = URL.createObjectURL(blob);
      }

      if (url) setPdfUrl(url);
      return url;
    } catch (err: any) {
      setCompileError(err.message || "Compilation system error");
      return null;
    } finally {
      setIsCompiling(false);
    }
  };

  // ─── Validate LaTeX ──────────────────────────────────────
  const handleValidate = async () => {
    try {
      const token = useAuthStore.getState().token;
      const response = await fetch("/api/v1/latex/validate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ latexCode: latex }),
      });
      const data = await response.json();
      if (data.errors) {
        setValidationErrors(data.errors);
        setShowValidation(true);
      }
    } catch {
      // Silent fail
    }
  };

  // ─── Download PDF ────────────────────────────────────────
  const handleDownload = async () => {
    // If we already have a compiled URL, download it directly
    if (pdfUrl) {
      downloadBlob(pdfUrl, activeFile);
      return;
    }

    // Compile first, then download from the returned URL
    const compiledUrl = await handleCompile();
    if (compiledUrl) {
      downloadBlob(compiledUrl, activeFile);
    }
  };

  // Helper: trigger a file download from a blob URL
  const downloadBlob = (url: string, filename: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename.replace(/\.tex$/i, "") || "resume"}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ─── Keyboard shortcuts ──────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleCompile();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [latex]);

  // ─── Auto-compile on significant edit pause ──────────────
  const autoCompileTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use a ref to always have the latest latex value for async callbacks
  const latexRef = useRef(latex);
  latexRef.current = latex;

  const handleLatexChange = useCallback((value: string) => {
    setLatex(value);
    setPdfUrl(null);
    setCompileError(null);

    // Auto-validate after 1.5s of no editing (reads from ref to avoid stale closure)
    if (autoCompileTimeout.current) clearTimeout(autoCompileTimeout.current);
    autoCompileTimeout.current = setTimeout(async () => {
      try {
        const token = useAuthStore.getState().token;
        const response = await fetch("/api/v1/latex/validate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ latexCode: latexRef.current }),
        });
        const data = await response.json();
        if (data.errors) {
          setValidationErrors(data.errors);
          setShowValidation(true);
        }
      } catch {
        // Silent fail
      }
    }, 1500);
  }, []);

  // ─── Render ──────────────────────────────────────────────
  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-[#1a1a2e] overflow-hidden font-body text-[#e0e0e0]">
      {/* ── Top Toolbar ───────────────────────────────────── */}
      <header className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#1e1e2e]/95 backdrop-blur-md z-30 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white/80 transition-colors"
            title="Toggle file sidebar"
          >
            {showSidebar ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2 px-2.5 py-1 bg-white/5 border border-white/10 rounded-lg">
            <FileText size={12} className="text-[#6c5ce7]" />
            <span className="text-xs font-medium text-white/70">{activeFile}</span>
          </div>
          {lastSaved && (
            <span className="text-[10px] text-white/30 hidden sm:inline-flex items-center gap-1">
              <CheckCircle2 size={10} className="text-green-400" />
              Saved {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Validation indicator */}
          {validationErrors.length > 0 && (
            <button
              onClick={() => setShowValidation(!showValidation)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-medium"
            >
              <AlertTriangle size={12} />
              {validationErrors.length} issue{validationErrors.length > 1 ? "s" : ""}
            </button>
          )}

          {/* AI Assistant toggle */}
          <button
            onClick={() => setShowAi(!showAi)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all border",
              showAi
                ? "bg-[#6c5ce7]/20 border-[#6c5ce7]/40 text-[#6c5ce7]"
                : "bg-white/5 border-white/10 text-white/50 hover:text-white/80 hover:border-white/20",
            )}
          >
            <Sparkles size={14} className={isLoading ? "animate-spin" : ""} />
            AI
          </button>

          {/* Recompile */}
          <button
            onClick={() => handleCompile()}
            disabled={isCompiling}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#6c5ce7] hover:bg-[#5a4bd1] text-white rounded-lg text-[11px] font-semibold transition-all disabled:opacity-50 shadow-lg shadow-[#6c5ce7]/20"
          >
            {isCompiling ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Play size={14} fill="currentColor" />
            )}
            {isCompiling ? "Compiling..." : "Recompile"}
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white/80 transition-all"
            title="Save (Ctrl+S)"
          >
            <Save size={16} className={isSaving ? "animate-pulse" : ""} />
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-white/5 rounded-lg text-white/40 hover:text-white/80 transition-all"
            title="Download PDF"
          >
            <Download size={16} />
          </button>

          {/* Toggle preview */}
          <button
            onClick={() => setShowPdfPreview(!showPdfPreview)}
            className={cn(
              "p-1.5 rounded-lg transition-all hidden lg:inline-flex",
              showPdfPreview
                ? "bg-[#6c5ce7]/10 text-[#6c5ce7]"
                : "text-white/40 hover:text-white/80 hover:bg-white/5",
            )}
            title="Toggle preview"
          >
            <SplitSquareHorizontal size={16} />
          </button>
        </div>
      </header>

      {/* ── Main Workspace ────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* ── Left File Sidebar ───────────────────────────── */}
        <AnimatePresence>
          {showSidebar && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 220, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-r border-white/5 bg-[#16162a] flex flex-col shrink-0 overflow-hidden"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/30">
                    Files
                  </h3>
                  <button className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white/60">
                    <Plus size={14} />
                  </button>
                </div>
                <div className="space-y-0.5">
                  {files.map((file) => (
                    <div
                      key={file.name}
                      onClick={() => !file.isFolder && setActiveFile(file.name)}
                      className={cn(
                        "flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all text-sm",
                        file.name === activeFile
                          ? "bg-[#6c5ce7]/10 text-[#6c5ce7] border border-[#6c5ce7]/20"
                          : "text-white/50 hover:bg-white/5 hover:text-white/80",
                      )}
                    >
                      {file.isFolder ? (
                        <Folder size={14} className="shrink-0" />
                      ) : (
                        <FileText size={14} className="shrink-0" />
                      )}
                      <span className="text-xs truncate">{file.name}</span>
                      {file.name === activeFile && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#6c5ce7]" />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Document stats */}
              <div className="mt-auto p-4 border-t border-white/5">
                <div className="bg-white/5 rounded-xl p-3 border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <Layout size={12} className="text-[#fd79a8]" />
                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/30">
                      Document
                    </span>
                  </div>
                  <div className="text-[10px] text-white/40 space-y-0.5 font-medium">
                    <div>Lines: {latex.split("\n").length}</div>
                    <div>Chars: {latex.length}</div>
                    <div>Words: {latex.trim() ? latex.trim().split(/\s+/).length : 0}</div>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Editor Pane ─────────────────────────────────── */}
        <section className={cn(
          "flex flex-col min-w-0 transition-all duration-300",
          showPdfPreview ? "flex-1 lg:w-1/2" : "flex-1",
        )}>
          {/* Validation errors bar */}
          <AnimatePresence>
            {showValidation && validationErrors.length > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-amber-500/5 border-b border-amber-500/10 overflow-hidden"
              >
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                      Validation Issues
                    </span>
                    <button
                      onClick={() => setShowValidation(false)}
                      className="text-white/30 hover:text-white/60"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  {validationErrors.slice(0, 5).map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-[11px]">
                      <span className="text-amber-400 font-mono shrink-0">L{err.line}</span>
                      <span className="text-white/60">{err.message}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* CodeMirror editor */}
          <div className="flex-1 overflow-hidden bg-[#1e1e2e]">
            <CodeMirror
              value={latex}
              height="100%"
              theme={materialDark}
              onChange={handleLatexChange}
              className="text-sm"
              basicSetup={{
                lineNumbers: true,
                foldGutter: true,
                dropCursor: true,
                allowMultipleSelections: true,
                indentOnInput: true,
                bracketMatching: true,
                closeBrackets: true,
                autocompletion: true,
                highlightActiveLine: true,
                highlightSelectionMatches: true,
              }}
            />
          </div>

          {/* Status bar */}
          <div className="h-7 bg-[#1a1a2e] border-t border-white/5 flex items-center justify-between px-4 text-[10px] text-white/30">
            <div className="flex items-center gap-4">
              <span>Ln {latex.split("\n").length}</span>
              <span>UTF-8</span>
              <span>LaTeX</span>
            </div>
            <div className="flex items-center gap-3">
              {isSaving && <span className="text-[#6c5ce7]">Saving...</span>}
              {lastSaved && !isSaving && (
                <span className="text-green-400/60">Saved</span>
              )}
              <button onClick={handleSave} className="hover:text-white/60 transition-colors">
                <Undo2 size={12} />
              </button>
              <button className="hover:text-white/60 transition-colors">
                <Redo2 size={12} />
              </button>
            </div>
          </div>
        </section>

        {/* ── Preview Pane ────────────────────────────────── */}
        <AnimatePresence>
          {showPdfPreview && (
            <motion.section
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: "50%", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="border-l border-white/5 bg-[#1a1a2e] flex flex-col overflow-hidden hidden lg:flex"
            >
              {/* Preview header */}
              <div className="h-10 px-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-3 shrink-0">
                <div className="px-3 py-1 bg-white/5 rounded-md text-[10px] font-medium text-[#6c5ce7] flex items-center gap-1.5 border border-white/5">
                  <Play size={10} />
                  PREVIEW
                </div>
                {compileError && (
                  <span className="text-[10px] text-red-400 flex items-center gap-1">
                    <AlertTriangle size={10} />
                    Error
                  </span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  <button className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white/60">
                    <ZoomOut size={14} />
                  </button>
                  <span className="text-[10px] text-white/30">100%</span>
                  <button className="p-1 hover:bg-white/5 rounded text-white/30 hover:text-white/60">
                    <ZoomIn size={14} />
                  </button>
                </div>
              </div>

              {/* Preview content */}
              <div className="flex-1 overflow-auto bg-[#2c2c2c] flex items-start justify-center p-4">
                {isCompiling ? (
                  <div className="flex flex-col items-center justify-center h-full gap-4">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-2xl bg-[#6c5ce7]/10 flex items-center justify-center">
                        <Loader2 size={28} className="text-[#6c5ce7] animate-spin" />
                      </div>
                      <div className="absolute inset-0 border-2 border-[#6c5ce7]/30 rounded-2xl animate-ping opacity-20" />
                    </div>
                    <div className="text-center">
                      <div className="text-xs font-medium text-[#6c5ce7] animate-pulse">
                        Compiling...
                      </div>
                      <div className="text-[10px] text-white/30 mt-1">Generating PDF</div>
                    </div>
                  </div>
                ) : compileError ? (
                  <div className="w-full max-w-[210mm] bg-[#1e1e2e] rounded-lg border border-red-500/20 p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle size={16} className="text-red-400" />
                      <h3 className="text-sm font-semibold text-red-400">Compilation Error</h3>
                    </div>
                    <pre className="text-xs text-red-300/80 whitespace-pre-wrap font-mono leading-relaxed">
                      {compileError}
                    </pre>
                    <p className="text-[10px] text-white/30 mt-4">
                      Check your LaTeX syntax and try again.
                    </p>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    title="PDF Preview"
                    src={pdfUrl}
                    className="w-[210mm] min-h-[297mm] rounded-sm bg-white shadow-2xl"
                    style={{ border: "none" }}
                  />
                ) : (
                  <div className="w-[210mm] min-h-[297mm] bg-white rounded-sm shadow-2xl p-[25mm] text-black">
                    <div className="flex flex-col items-center justify-center h-full text-center">
                      <div className="w-16 h-16 rounded-full bg-[#6c5ce7]/10 flex items-center justify-center mb-6">
                        <FileText size={32} className="text-[#6c5ce7]" />
                      </div>
                      <h2 className="text-xl font-bold text-gray-800 mb-2">Ready to Preview</h2>
                      <p className="text-sm text-gray-500 max-w-sm">
                        Click <strong className="text-[#6c5ce7]">Recompile</strong> or press{" "}
                        <kbd className="px-2 py-0.5 bg-gray-100 rounded text-xs font-mono">
                          Ctrl+Enter
                        </kbd>{" "}
                        to generate your PDF preview.
                      </p>
                      <button
                        onClick={() => handleCompile()}
                        className="mt-6 px-6 py-2.5 bg-[#6c5ce7] hover:bg-[#5a4bd1] text-white rounded-lg text-sm font-semibold transition-all shadow-lg"
                      >
                        Compile PDF
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── AI Assistant Panel (Overlay) ─────────────────── */}
        <AnimatePresence>
          {showAi && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="absolute bottom-0 left-0 right-0 z-40 h-[40vh] min-h-[300px]"
            >
              <div className="h-full bg-[#1e1e2e]/95 backdrop-blur-2xl border-t border-[#6c5ce7]/20 shadow-2xl flex flex-col rounded-t-2xl overflow-hidden">
                {/* Header */}
                <div className="px-6 py-3 border-b border-white/5 flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#6c5ce7]/20 flex items-center justify-center">
                      <Bot size={14} className="text-[#6c5ce7]" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white/90">AI Writing Assistant</div>
                      <div className="text-[9px] text-white/30">Ask me to write or fix LaTeX</div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowAi(false)}
                    className="p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 1 && (
                    <div className="text-center py-8 text-white/30 italic text-xs">
                      Ask me to generate a section, fix errors, or suggest improvements...
                    </div>
                  )}
                  {messages.slice(1).map((m: any) => (
                    <div key={m.id} className={cn("flex gap-3", m.role === "user" ? "flex-row-reverse" : "")}>
                      <div
                        className={cn(
                          "max-w-[80%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed",
                          m.role === "user"
                            ? "bg-[#6c5ce7] text-white rounded-tr-sm"
                            : "bg-white/5 border border-white/5 text-white/70 rounded-tl-sm",
                        )}
                      >
                        {(m as any).content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3">
                      <div className="bg-white/5 border border-white/5 px-4 py-3 rounded-2xl rounded-tl-sm">
                        <div className="flex gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7]/50 animate-bounce" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7]/50 animate-bounce delay-75" />
                          <span className="w-1.5 h-1.5 rounded-full bg-[#6c5ce7]/50 animate-bounce delay-150" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input */}
                <form
                  onSubmit={handleSubmit}
                  className="px-4 py-3 border-t border-white/5 shrink-0"
                >
                  <div className="relative">
                    <input
                      value={input}
                      onChange={handleInputChange}
                      placeholder="Ask AI to write or fix LaTeX..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-4 pr-11 text-xs focus:outline-none focus:border-[#6c5ce7]/50 transition-all placeholder:text-white/20"
                    />
                    <button
                      type="submit"
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-[#6c5ce7] hover:bg-[#5a4bd1] rounded-lg flex items-center justify-center text-white transition-all"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Styles ────────────────────────────────────────── */}
      <style>{`
        .cm-editor {
          height: 100% !important;
          font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace !important;
          font-size: 13px !important;
        }
        .cm-scroller {
          scrollbar-width: thin;
          scrollbar-color: rgba(108,92,231,0.15) transparent;
        }
        .cm-scroller::-webkit-scrollbar { width: 6px; }
        .cm-scroller::-webkit-scrollbar-track { background: transparent; }
        .cm-scroller::-webkit-scrollbar-thumb { background: rgba(108,92,231,0.15); border-radius: 3px; }
        .cm-scroller::-webkit-scrollbar-thumb:hover { background: rgba(108,92,231,0.3); }
        .cm-gutters { background: #1a1a2e !important; border-right: 1px solid rgba(255,255,255,0.05) !important; }
        .cm-activeLineGutter { background: rgba(108,92,231,0.1) !important; }
        .cm-selectionBackground { background: rgba(108,92,231,0.2) !important; }
        .cm-focused .cm-selectionBackground { background: rgba(108,92,231,0.3) !important; }
        .cm-cursor { border-left-color: #6c5ce7 !important; }
        .cm-matchingBracket { background: rgba(108,92,231,0.2) !important; outline: 1px solid rgba(108,92,231,0.4) !important; }
        iframe { border: none; }
      `}</style>
    </div>
  );
}
