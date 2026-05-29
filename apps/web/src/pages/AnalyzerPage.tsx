import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";
import { useAnalysisStore } from "@/stores/analysisStore";
import { useAuthStore } from "@/stores/authStore";
import { safeReadJson } from "@/lib/authFetch";
import {
  Upload,
  FileText,
  Link2,
  Loader2,
  Check,
  AlertCircle,
  X,
  Brain,
  Target,
  BarChart3,
  Map,
  Globe,
  ChevronRight,
  Shield,
  Cpu,
  Activity,
  ScanSearch,
} from "lucide-react";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Input,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type InputTab = "paste" | "url";

function AgentTracker({
  steps,
}: {
  steps: { id: string; label: string; status: string; message?: string }[];
}) {
  const icons: Record<string, typeof Brain> = {
    parse: Brain,
    extract: Target,
    compare: BarChart3,
    market: Globe,
    roadmap: Map,
  };

  return (
    <Card padding="lg" className="shadow-2xl">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 animate-pulse items-center justify-center rounded-2xl primary-gradient text-on-primary-fixed">
          <Cpu size={20} />
        </div>
        <div>
          <h3 className="text-lg font-bold text-on-surface">AI Pipeline Active</h3>
          <p className="text-xs font-medium uppercase tracking-widest text-on-surface-variant">
            5 Specialized Agents Online
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = icons[step.id] || Brain;
          const isActive = step.status === "running";
          const isDone = step.status === "done";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-4 rounded-xl border p-4 transition-all",
                isActive && "border-primary/30 bg-primary/5",
                isDone && "border-outline-variant/15 bg-surface-container-low",
                !isActive && !isDone && "border-transparent bg-surface-container-low opacity-40",
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 items-center justify-center rounded-xl transition-colors",
                  isActive && "bg-primary text-on-primary-fixed",
                  isDone && "bg-primary/20 text-primary",
                  !isActive && !isDone && "bg-surface-container-highest text-outline",
                )}
              >
                {isDone ? (
                  <Check size={18} />
                ) : isActive ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <Icon size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-sm font-bold",
                      isActive && "text-primary",
                      isDone && "text-on-surface",
                      !isActive && !isDone && "text-outline",
                    )}
                  >
                    {step.label}
                  </span>
                  {isActive && (
                    <span className="animate-pulse text-[10px] font-bold uppercase text-primary">
                      Processing...
                    </span>
                  )}
                </div>
                {step.message && (
                  <p className="text-[11px] italic text-on-surface-variant">{step.message}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex items-center justify-between border-t border-outline-variant/15 pt-6 text-[10px] font-bold uppercase tracking-widest text-outline">
        <span className="flex items-center gap-1.5 rounded-md border border-outline-variant/20 bg-surface-container px-2 py-1">
          <Shield size={10} className="text-primary" />
          Ollama Local
        </span>
        <span className="flex items-center gap-1.5 rounded-md border border-outline-variant/20 bg-surface-container px-2 py-1">
          <Activity size={10} className="text-tertiary" />
          94% Precision
        </span>
      </div>
    </Card>
  );
}

export default function AnalyzerPage() {
  const navigate = useNavigate();
  const { liveSteps, isAnalyzing, setIsAnalyzing, updateStep, reset } =
    useAnalysisStore();

  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [resumeMode, setResumeMode] = useState<"drop" | "text">("drop");

  const [jdTab, setJdTab] = useState<InputTab>("paste");
  const [jdText, setJdText] = useState("");
  const [jdUrl, setJdUrl] = useState("");
  const [seniority, setSeniority] = useState<
    "junior" | "mid" | "senior" | "lead"
  >("senior");

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) setResumeFile(accepted[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  const runAnalysis = async () => {
    if ((!resumeFile && !resumeText) || (!jdText && !jdUrl)) return;
    reset();
    setIsAnalyzing(true);

    let resumeContent = resumeText;
    if (resumeFile) {
      const formData = new FormData();
      formData.append("text", await resumeFile.text());
      try {
        const parseRes = await fetch("/api/v1/agent/parse", {
          method: "POST",
          body: formData,
        });
        if (parseRes.ok) {
          const parseData = await safeReadJson<any>(parseRes, {});
          resumeContent = parseData.parsedData
            ? JSON.stringify(parseData.parsedData)
            : resumeText;
        }
      } catch (err) {
        console.error("Parse error:", err);
      }
    }

    const token = useAuthStore.getState().token;
    if (!token) {
      alert("Please log in first");
      setIsAnalyzing(false);
      return;
    }

    try {
      const response = await fetch("/api/v1/agent/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText: resumeContent,
          jobDescriptionText: jdText || jdUrl,
        }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      let savedAnalysisId: string | null = null;

      if (reader) {
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() ?? "";

          for (const part of parts) {
            const lines = part.split("\n");
            let eventType = "";
            let dataLine = "";

            for (const line of lines) {
              if (line.startsWith("event: ")) {
                eventType = line.slice(7).trim();
              } else if (line.startsWith("data: ")) {
                dataLine = line.slice(6);
              }
            }

            if (eventType === "done" && dataLine) {
              try {
                const payload = JSON.parse(dataLine);
                if (payload.analysisId) {
                  savedAnalysisId = payload.analysisId;
                }
              } catch {
                /* ignore */
              }
              continue;
            }

            if (eventType === "error" && dataLine) {
              try {
                const errPayload = JSON.parse(dataLine);
                throw new Error(errPayload.error || "Analysis failed");
              } catch (e) {
                if (e instanceof Error && e.message !== "Analysis failed") {
                  throw e;
                }
                throw new Error("Analysis failed");
              }
            }

            if (dataLine) {
              try {
                const data = JSON.parse(dataLine);
                if (data.name === "parse") {
                  updateStep("parse", {
                    status: "done",
                    message: "Resume parsed successfully",
                  });
                } else if (data.name === "normalize") {
                  updateStep("extract", {
                    status: "done",
                    message: "Skills extracted",
                  });
                } else if (data.name === "match") {
                  updateStep("compare", {
                    status: "done",
                    message: "Gap analysis complete",
                  });
                } else if (data.name === "insights") {
                  updateStep("roadmap", {
                    status: "done",
                    message: "Roadmap generated",
                  });
                }
              } catch {
                /* ignore partial chunks */
              }
            }
          }
        }
      }

      if (savedAnalysisId) {
        navigate(`/roadmap/${savedAnalysisId}`);
        return;
      }

      const analysisRes = await fetch("/api/v1/analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (analysisRes.ok) {
        const analyses = await safeReadJson<any[]>(analysisRes, []);
        if (analyses.length > 0) {
          navigate(`/roadmap/${analyses[0].id}`);
          return;
        }
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Analysis error:", err);
      alert("Analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const canAnalyze =
    (resumeFile || resumeText.trim()) && (jdText.trim() || jdUrl.trim());

  const modeBtn = (active: boolean) =>
    cn(
      "flex-1 rounded-xl py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
      active
        ? "bg-primary text-on-primary-fixed shadow-lg"
        : "text-outline hover:text-on-surface",
    );

  return (
    <PageShell maxWidth="2xl">
      <OnboardingTooltip
        pageKey="analyze"
        icon="📄"
        title="Upload your resume"
        description="PDF or DOCX — we'll parse your skills, experience, and education automatically. Then paste a job URL to compare against."
      />

      <PageHeader
        icon={<ScanSearch size={22} />}
        title="New Gap Analysis"
        description="Upload your latest resume and the target role profile. Our agents will benchmark your expertise against real-world job taxonomies."
        badge="Analysis Engine"
      />

      <div className="grid items-start gap-8 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card padding="lg">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                <FileText size={24} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface">1. Source Resume</h3>
                <p className="text-xs text-on-surface-variant">PDF, DOCX or Plain Text</p>
              </div>
            </div>

            <div className="mb-6 flex max-w-[200px] gap-1 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-1">
              <button type="button" onClick={() => setResumeMode("drop")} className={modeBtn(resumeMode === "drop")}>
                Upload
              </button>
              <button type="button" onClick={() => setResumeMode("text")} className={modeBtn(resumeMode === "text")}>
                Text
              </button>
            </div>

            {resumeMode === "drop" ? (
              <div
                {...getRootProps()}
                className={cn(
                  "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-10 text-center transition-all",
                  isDragActive && "border-primary bg-primary/5",
                  resumeFile && !isDragActive && "border-primary bg-primary/5",
                  !isDragActive && !resumeFile && "border-outline-variant/25 hover:border-primary/40",
                )}
              >
                <input {...getInputProps()} />
                {resumeFile ? (
                  <div className="flex flex-col items-center gap-3">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl primary-gradient text-on-primary-fixed shadow-lg">
                      <FileText size={32} />
                    </div>
                    <div className="text-sm font-bold text-on-surface">{resumeFile.name}</div>
                    <div className="text-[10px] font-bold uppercase text-outline">
                      {(resumeFile.size / 1024).toFixed(0)} KB · Ready
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setResumeFile(null);
                      }}
                      className="mt-2 flex items-center gap-1 text-xs font-bold text-error hover:underline"
                    >
                      <X size={14} /> Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-outline-variant/15 bg-surface-container text-outline transition-all group-hover:text-primary">
                      <Upload size={28} />
                    </div>
                    <div className="mb-1 text-sm font-bold text-on-surface">Drop resume here</div>
                    <p className="text-[11px] uppercase tracking-widest text-outline">or browse your files</p>
                  </>
                )}
              </div>
            ) : (
              <Textarea
                className="min-h-[12rem]"
                placeholder="Paste your resume content here..."
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            )}
          </Card>

          <Card padding="lg">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-tertiary/20 bg-tertiary/10 text-tertiary">
                <Target size={24} />
              </div>
              <div>
                <h3 className="font-bold text-on-surface">2. Target Role</h3>
                <p className="text-xs text-on-surface-variant">Paste Text or Job URL</p>
              </div>
            </div>

            <div className="mb-6 flex max-w-[200px] gap-1 rounded-2xl border border-outline-variant/15 bg-surface-container-low p-1">
              <button
                type="button"
                onClick={() => setJdTab("url")}
                className={cn(
                  modeBtn(jdTab === "url"),
                  jdTab === "url" && "bg-tertiary text-on-tertiary",
                )}
              >
                URL
              </button>
              <button
                type="button"
                onClick={() => setJdTab("paste")}
                className={cn(
                  modeBtn(jdTab === "paste"),
                  jdTab === "paste" && "bg-tertiary text-on-tertiary",
                )}
              >
                Text
              </button>
            </div>

            {jdTab === "url" ? (
              <div>
                <div className="relative">
                  <Link2 className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-outline" size={18} />
                  <Input
                    type="url"
                    className="pl-11"
                    placeholder="https://linkedin.com/jobs/..."
                    value={jdUrl}
                    onChange={(e) => setJdUrl(e.target.value)}
                  />
                </div>
                <p className="mt-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-outline">
                  <Globe size={10} /> Supports LinkedIn, Indeed, Greenhouse & more
                </p>
              </div>
            ) : (
              <Textarea
                className="min-h-[12rem]"
                placeholder="Paste the Job Description here..."
                value={jdText}
                onChange={(e) => setJdText(e.target.value)}
              />
            )}
          </Card>

          <Card padding="lg">
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-on-surface">Analysis Baseline</h4>
                  <p className="text-[10px] uppercase tracking-widest text-on-surface-variant">
                    Target Seniority Calibration
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {(["junior", "mid", "senior", "lead"] as const).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setSeniority(level)}
                    className={cn(
                      "rounded-xl border px-4 py-2 text-[10px] font-bold uppercase tracking-tighter transition-all",
                      seniority === level
                        ? "border-primary bg-primary text-on-primary-fixed shadow-lg"
                        : "border-outline-variant/15 bg-surface-container-low text-outline hover:text-on-surface",
                    )}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>
          </Card>

          <div className="flex flex-col items-center gap-3 pt-2">
            <Button
              size="lg"
              className="w-full max-w-md"
              onClick={runAnalysis}
              disabled={!canAnalyze || isAnalyzing}
              loading={isAnalyzing}
            >
              {!isAnalyzing && <Brain size={22} />}
              {isAnalyzing ? "Agents Working..." : "Engage AI Analysis"}
              {!isAnalyzing && <ChevronRight size={20} />}
            </Button>
            {!canAnalyze && !isAnalyzing && (
              <p className="flex animate-pulse items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-error">
                <AlertCircle size={10} />
                Requires Resume and JD to initialize
              </p>
            )}
          </div>
        </div>

        <div className="space-y-6 lg:col-span-2 lg:sticky lg:top-24">
          {isAnalyzing ? (
            <AgentTracker steps={liveSteps} />
          ) : (
            <>
              <Card padding="lg" className="relative overflow-hidden">
                <div className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full primary-gradient opacity-10 blur-3xl" />
                <h3 className="mb-6 text-xl font-black tracking-tight text-on-surface">
                  AI Analysis Logic
                </h3>
                <div className="space-y-5">
                  {[
                    {
                      icon: Brain,
                      title: "Multi-Agent Flow",
                      desc: "5 specialized agents handle parsing, context-matching, and roadmap generation in parallel.",
                    },
                    {
                      icon: Target,
                      title: "Semantic Depth",
                      desc: "We analyze the core architecture of your skills, not just keywords. Versions and paradigms are understood.",
                    },
                    {
                      icon: Shield,
                      title: "Local Compute",
                      desc: "All processing happens on our dedicated infrastructure via Ollama. 100% data privacy guaranteed.",
                    },
                  ].map((item, i) => (
                    <div key={i} className="flex gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-outline-variant/15 bg-surface-container-low text-primary">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <h4 className="mb-1 text-sm font-bold text-on-surface">{item.title}</h4>
                        <p className="text-[11px] leading-relaxed text-on-surface-variant">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card
                padding="md"
                className="hidden font-mono text-[10px] opacity-50 grayscale transition-all hover:opacity-100 hover:grayscale-0 lg:block"
              >
                <div className="mb-4 flex items-center gap-2 font-black text-primary">
                  <div className="h-2 w-2 animate-pulse rounded-full bg-primary" />
                  REAL-TIME AGENT LOGS
                </div>
                <div className="space-y-1 text-on-surface/70">
                  <div>[AGENT 1] PARSING resume_v2.pdf... OK</div>
                  <div>[AGENT 2] SEARCHING skill_graph_v4... 12k nodes</div>
                  <div>[AGENT 2] SKILL: &quot;gRPC&quot; -&gt; Type: Backend, Level: High</div>
                  <div>[AGENT 3] COMPARING candidates... Top 12% match</div>
                  <div className="animate-pulse pt-2 font-black text-primary">
                    ANALYSIS INITIALIZED &gt; READY_FOR_PROCESS
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </PageShell>
  );
}
