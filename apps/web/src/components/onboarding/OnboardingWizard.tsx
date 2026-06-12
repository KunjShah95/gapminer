import { useState, useCallback, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useDropzone } from "react-dropzone";
import { useOnboardingStore } from "@/stores/onboardingStore";
import { useAuthStore } from "@/stores/authStore";
import { getAuthToken } from "@/lib/authFetch";
import {
  Upload,
  FileText,
  Loader2,
  Check,
  AlertCircle,
  X,
  Brain,
  Target,
  Sparkles,
  Linkedin,
  ChevronRight,
  Globe,
  Shield,
  Cpu,
  Activity,
  ScanSearch,
  Clock,
  RefreshCw,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OnboardingWizardProps {
  open: boolean;
}

// ─── Agent Tracker (reused from AnalyzerPage) ──────────────────────────────
function AgentTracker({
  steps,
}: {
  steps: { id: string; label: string; status: string; message?: string }[];
}) {
  const icons: Record<string, typeof Brain> = {
    parse: Brain,
    extract: Target,
    compare: Loader2,
    market: Globe,
    roadmap: Brain,
  };

  return (
    <div className="bg-surface-container rounded-2xl border border-outline-variant/15 p-5">
      <div className="mb-5 flex items-center gap-3">
        <div className="flex h-9 w-9 animate-pulse items-center justify-center rounded-xl bg-primary text-on-primary-fixed">
          <Cpu size={18} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-on-surface">AI Pipeline Active</h4>
          <p className="text-[10px] font-medium uppercase tracking-widest text-on-surface-variant">
            5 Specialized Agents Online
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {steps.map((step) => {
          const Icon = icons[step.id] || Brain;
          const isActive = step.status === "running";
          const isDone = step.status === "done";

          return (
            <div
              key={step.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border p-3 transition-all",
                isActive && "border-primary/30 bg-primary/5",
                isDone && "border-outline-variant/15 bg-surface-container-low",
                !isActive && !isDone && "border-transparent bg-surface-container-low opacity-40",
              )}
            >
              <div
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-lg transition-colors shrink-0",
                  isActive && "bg-primary text-on-primary-fixed",
                  isDone && "bg-primary/20 text-primary",
                  !isActive && !isDone && "bg-surface-container-highest text-outline",
                )}
              >
                {isDone ? (
                  <Check size={16} />
                ) : isActive ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Icon size={16} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      "text-xs font-bold",
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
                  <p className="text-[10px] italic text-on-surface-variant mt-0.5">
                    {step.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-outline">
        <span className="flex items-center gap-1 rounded-md border border-outline-variant/20 bg-surface-container px-2 py-1">
          <Shield size={9} className="text-primary" />
          Ollama Local
        </span>
        <span className="flex items-center gap-1 rounded-md border border-outline-variant/20 bg-surface-container px-2 py-1">
          <Activity size={9} className="text-tertiary" />
          94% Precision
        </span>
      </div>
    </div>
  );
}

// ─── Parsing Progress (for resume upload step) ────────────────────────────
function ParsingProgress({
  status,
  message,
  file,
  onRetry,
}: {
  status: string | null;
  message: string;
  file: File | null;
  onRetry: () => void;
}) {
  if (!status) return null;

  const steps = [
    { id: "upload", label: "Upload Document", status: status === "uploading" ? "running" : status === "pending" || status === "parsing" || status === "completed" ? "done" : "pending" },
    { id: "parse", label: "Extract Text", status: status === "parsing" ? "running" : status === "completed" ? "done" : status === "failed" || status === "uploading" || !status ? "pending" : "pending" },
    { id: "extract", label: "Identify Skills", status: status === "completed" ? "done" : status === "parsing" ? "pending" : "pending" },
  ];

  return (
    <div className="space-y-2 mt-4">
      {steps.map((step) => {
        const isActive = step.status === "running";
        const isDone = step.status === "done";
        const isPending = !isActive && !isDone;

        return (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-3 rounded-xl border p-3 transition-all",
              isActive && "border-primary/30 bg-primary/5",
              isDone && "border-outline-variant/15 bg-surface-container-low",
              isPending && "border-transparent bg-surface-container-low opacity-40",
            )}
          >
            <div
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-lg shrink-0 transition-colors",
                isActive && "bg-primary text-on-primary-fixed",
                isDone && "bg-primary/20 text-primary",
                isPending && "bg-surface-container-highest text-outline",
              )}
            >
              {isDone ? (
                <Check size={14} />
              ) : isActive ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <FileText size={14} />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <span
                className={cn(
                  "text-xs font-bold",
                  isActive && "text-primary",
                  isDone && "text-on-surface",
                  isPending && "text-outline",
                )}
              >
                {step.label}
              </span>
              {isActive && message && (
                <p className="text-[10px] italic text-on-surface-variant mt-0.5">{message}</p>
              )}
            </div>
          </div>
        );
      })}

      {status === "failed" && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-error/20 bg-error/5 py-2.5 text-xs font-bold text-error transition-all hover:bg-error/10"
        >
          <RefreshCw size={14} />
          Retry Parsing
        </button>
      )}
    </div>
  );
}

// ─── Main Wizard ────────────────────────────────────────────────────────────
export default function OnboardingWizard({ open }: OnboardingWizardProps) {
  const navigate = useNavigate();
  const { completeWizard, completeStep } = useOnboardingStore();
  const [step, setStep] = useState(1);
  const [profile, setProfile] = useState({
    currentRole: "",
    experienceLevel: "",
    targetRole: "",
    topSkills: "",
    linkedInUrl: "",
  });
  const [saving, setSaving] = useState(false);

  // Resume upload state
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadedResumeId, setUploadedResumeId] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [parsingStatus, setParsingStatus] = useState<string | null>(null);
  const [parsingMessage, setParsingMessage] = useState("");
  const pollingRef = useRef<number | null>(null);

  // Analysis state
  const [jdText, setJdText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisSteps, setAnalysisSteps] = useState<
    { id: string; label: string; status: string; message?: string }[]
  >([
    { id: "parse", label: "Resume Parsing", status: "pending" },
    { id: "extract", label: "Skill Extraction", status: "pending" },
    { id: "compare", label: "Market Comparison", status: "pending" },
    { id: "roadmap", label: "Roadmap Generation", status: "pending" },
  ]);
  const [analysisDone, setAnalysisDone] = useState(false);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Poll for parsing status
  const startPolling = (resumeId: string) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    const poll = async () => {
      try {
        const token = getAuthToken();
        if (!token) return;
        const res = await fetch(`/api/v1/resume/${resumeId}/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setParsingStatus(data.status);
        setParsingMessage(data.message);
        if (data.status === "completed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
          completeStep(2); // Mark "Upload resume" as complete
        } else if (data.status === "failed") {
          if (pollingRef.current) clearInterval(pollingRef.current);
          pollingRef.current = null;
        } else if (data.status === "parsing") {
          setParsingMessage("Extracting text from document...");
        }
      } catch {
        // Silently retry
      }
    };
    poll();
    pollingRef.current = window.setInterval(poll, 1500);
  };

  // Upload resume
  const uploadResume = async (file: File) => {
    setIsUploading(true);
    setParsingStatus("uploading");
    setParsingMessage("Uploading file...");
    try {
      const token = getAuthToken();
      if (!token) {
        setParsingStatus("failed");
        setParsingMessage("Please log in first");
        setIsUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/v1/resume/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUploadedResumeId(data.id);
      setParsingStatus("pending");
      setParsingMessage("Queued for parsing...");
      setIsUploading(false);
      startPolling(data.id);
    } catch (err) {
      setParsingStatus("failed");
      setParsingMessage("Upload failed — please try again");
      setIsUploading(false);
    }
  };

  const onDrop = useCallback((accepted: File[]) => {
    if (accepted[0]) {
      setResumeFile(accepted[0]);
      setParsingStatus(null);
      setParsingMessage("");
      uploadResume(accepted[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "text/plain": [".txt"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
  });

  if (!open) return null;

  // ─── Step 1: Welcome ──────────────────────────────────────────────────────
  const renderStep1 = () => (
    <div className="text-center">
      <div className="text-5xl mb-6">🚀</div>
      <h2 className="text-2xl font-extrabold tracking-tighter mb-3 font-headline">
        Bridge your skills to market demand
      </h2>
      <p className="text-on-surface-variant font-light leading-relaxed mb-8">
        AI-powered analysis. Personalized roadmaps. Real-time market intelligence.
      </p>
      <div className="flex gap-4 justify-center mb-8">
        <div className="bg-surface-container rounded-2xl p-4 flex-1 max-w-[140px]">
          <div className="text-primary text-2xl font-black">93%</div>
          <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
            Match Accuracy
          </div>
        </div>
        <div className="bg-surface-container rounded-2xl p-4 flex-1 max-w-[140px]">
          <div className="text-primary text-2xl font-black">5K+</div>
          <div className="text-[10px] text-outline font-bold uppercase tracking-widest mt-1">
            Roles Indexed
          </div>
        </div>
      </div>
      <p className="text-xs text-on-surface-variant mb-6 flex items-center justify-center gap-2">
        <CheckCircle2 size={14} className="text-primary" />
        <span>5 simple steps to get started</span>
      </p>
      <button
        onClick={() => setStep(2)}
        className="primary-gradient text-on-primary-fixed px-8 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all active:scale-95 mb-3"
      >
        Get Started
      </button>
      <button
        onClick={() => {
          completeWizard();
          navigate("/dashboard");
        }}
        className="block mx-auto text-xs text-on-surface-variant hover:text-primary transition-colors"
      >
        Skip tour — I'll explore on my own
      </button>
    </div>
  );

  // ─── Step 2: Profile + LinkedIn ───────────────────────────────────────────
  const renderStep2 = () => (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline">
        Set up your profile
      </h2>
      <p className="text-on-surface-variant font-light text-sm mb-6">
        Help us personalize your analysis. You can skip or change these later.
      </p>
      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Current Role
          </label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
            placeholder="e.g. Software Engineer"
            value={profile.currentRole}
            onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Experience Level
          </label>
          <select
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface"
            value={profile.experienceLevel}
            onChange={(e) => setProfile({ ...profile, experienceLevel: e.target.value })}
          >
            <option value="">Select level</option>
            <option value="entry">Entry (0-2 years)</option>
            <option value="mid">Mid (3-5 years)</option>
            <option value="senior">Senior (6-9 years)</option>
            <option value="lead">Lead (10+ years)</option>
            <option value="exec">Executive</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Target Role
          </label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
            placeholder="e.g. Senior Software Engineer"
            value={profile.targetRole}
            onChange={(e) => setProfile({ ...profile, targetRole: e.target.value })}
          />
        </div>
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1">
            Top Skills
          </label>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 mt-1 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
            placeholder="React, Node.js, TypeScript"
            value={profile.topSkills}
            onChange={(e) => setProfile({ ...profile, topSkills: e.target.value })}
          />
        </div>

        {/* LinkedIn section */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0A66C2]/15 text-[#0A66C2]">
              <Linkedin size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold text-on-surface">Connect LinkedIn</h4>
              <p className="text-[10px] text-on-surface-variant">
                We'll analyze your existing profile for optimization suggestions
              </p>
            </div>
          </div>
          <input
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50"
            placeholder="https://linkedin.com/in/yourprofile"
            value={profile.linkedInUrl}
            onChange={(e) => setProfile({ ...profile, linkedInUrl: e.target.value })}
          />
          <p className="mt-2 text-[10px] text-on-surface-variant flex items-center gap-1">
            <Shield size={10} className="text-primary" />
            Your profile data stays private — processed locally via Ollama
          </p>
        </div>
      </div>
      <div className="flex gap-3 mt-8">
        <button
          onClick={() => { completeStep(1); setStep(3); }}
          disabled={saving}
          className="flex-1 glass border border-outline-variant/20 py-3.5 rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-all"
        >
          Skip
        </button>
        <button
          onClick={async () => {
            try {
              const token = useAuthStore.getState().token;
              const body: Record<string, string> = {};
              if (profile.currentRole) body.currentRole = profile.currentRole;
              if (profile.experienceLevel) body.experienceLevel = profile.experienceLevel;
              if (profile.targetRole) body.targetRole = profile.targetRole;
              if (profile.topSkills) body.topSkills = profile.topSkills;
              if (profile.linkedInUrl) body.linkedInUrl = profile.linkedInUrl;
              if (Object.keys(body).length > 0) {
                setSaving(true);
                await fetch("/api/v1/auth/me", {
                  method: "PUT",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${useAuthStore.getState().token}`,
                  },
                  body: JSON.stringify(body),
                });
              }
            } catch {
              /* silent fail */
            } finally {
              setSaving(false);
              completeStep(1); // Mark "Complete your profile" as done
              setStep(3);
            }
          }}
          disabled={saving}
          className="flex-[2] primary-gradient text-on-primary-fixed py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all disabled:opacity-50"
        >
          {saving ? "Saving..." : "Continue"}
        </button>
      </div>
    </div>
  );

  // ─── Step 3: Resume Upload ────────────────────────────────────────────────
  const renderStep3 = () => {
    const fileAccepted = parsingStatus === "completed";
    const fileFailed = parsingStatus === "failed";

    return (
      <div>
        <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline">
          Upload your resume
        </h2>
        <p className="text-on-surface-variant font-light text-sm mb-6">
          Upload a PDF, DOCX, or plain text file. We'll extract your skills and experience automatically.
        </p>

        <div
          {...getRootProps()}
          className={cn(
            "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all",
            isDragActive && "border-primary bg-primary/5",
            resumeFile && !isDragActive && !fileFailed && "border-primary bg-primary/5",
            fileFailed && "border-error/30 bg-error/5",
            !isDragActive && !resumeFile && "border-outline-variant/25 hover:border-primary/40",
          )}
        >
          <input {...getInputProps()} />
          {resumeFile && fileAccepted ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400">
                <Check size={28} />
              </div>
              <div className="text-sm font-bold text-on-surface">{resumeFile.name}</div>
              <div className="text-[10px] font-bold uppercase text-emerald-400">Parsed Successfully</div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setResumeFile(null);
                  setParsingStatus(null);
                  setUploadedResumeId(null);
                }}
                className="mt-1 flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-error transition-colors"
              >
                <X size={14} /> Remove
              </button>
            </div>
          ) : resumeFile ? (
            <div className="flex flex-col items-center gap-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                <FileText size={28} />
              </div>
              <div className="text-sm font-bold text-on-surface">{resumeFile.name}</div>
              <div className="text-[10px] font-bold uppercase text-outline">
                {(resumeFile.size / 1024).toFixed(0)} KB
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setResumeFile(null);
                  setParsingStatus(null);
                  setUploadedResumeId(null);
                  if (pollingRef.current) clearInterval(pollingRef.current);
                }}
                className="mt-1 flex items-center gap-1 text-xs font-bold text-on-surface-variant hover:text-error transition-colors"
              >
                <X size={14} /> Remove
              </button>
            </div>
          ) : (
            <>
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl border border-outline-variant/15 bg-surface-container text-outline">
                <Upload size={26} />
              </div>
              <div className="mb-1 text-sm font-bold text-on-surface">Drop resume here</div>
              <p className="text-[11px] uppercase tracking-widest text-outline">
                or browse your files
              </p>
              <div className="mt-4 flex items-center gap-3 text-[10px] text-on-surface-variant">
                <span>PDF</span>
                <span className="h-1 w-1 rounded-full bg-outline/30" />
                <span>DOCX</span>
                <span className="h-1 w-1 rounded-full bg-outline/30" />
                <span>TXT</span>
                <span className="h-1 w-1 rounded-full bg-outline/30" />
                <span>Max 10MB</span>
              </div>
            </>
          )}
        </div>

        <ParsingProgress
          status={parsingStatus}
          message={parsingMessage}
          file={resumeFile}
          onRetry={() => resumeFile && uploadResume(resumeFile)}
        />

        <div className="flex gap-3 mt-8">
          <button
            onClick={() => { setStep(2); }}
            className="flex-1 glass border border-outline-variant/20 py-3.5 rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-all"
          >
            Back
          </button>
          <button
            onClick={() => { setStep(4); }}
            disabled={!fileAccepted}
            className={cn(
              "flex-[2] py-3.5 rounded-2xl font-bold shadow-xl transition-all",
              fileAccepted
                ? "primary-gradient text-on-primary-fixed hover:shadow-primary/20"
                : "bg-surface-container-highest text-outline cursor-not-allowed",
            )}
          >
            Continue
          </button>
        </div>
        <div className="text-center mt-4">
          <button
            onClick={() => {
              completeWizard();
              navigate("/dashboard");
            }}
            className="text-[10px] text-outline hover:text-primary transition-colors font-bold uppercase tracking-widest"
          >
            Skip for now
          </button>
        </div>
        {!fileAccepted && resumeFile && (
          <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-outline">
            Waiting for parsing to complete...
          </p>
        )}
      </div>
    );
  };

  // ─── Step 4: Run Analysis ──────────────────────────────────────────────────
  const renderStep4 = () => (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tighter mb-2 font-headline">
        Run your first analysis
      </h2>
      <p className="text-on-surface-variant font-light text-sm mb-6">
        Paste a target job description below. We'll compare your skills against it and generate a personalized roadmap.
      </p>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold uppercase tracking-widest text-on-surface-variant px-1 mb-2 block">
            Target Job Description
          </label>
          <textarea
            className="w-full bg-surface-container-lowest border border-outline-variant/20 rounded-2xl px-5 py-3.5 focus:border-primary focus:ring-4 focus:ring-primary/5 transition-all outline-none text-on-surface placeholder:text-outline/50 min-h-[140px] resize-y text-sm"
            placeholder="Paste a job description here to compare your skills against..."
            value={jdText}
            onChange={(e) => setJdText(e.target.value)}
          />
        </div>

        {isAnalyzing ? (
          <AgentTracker steps={analysisSteps} />
        ) : analysisDone ? (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto mb-3">
              <CheckCircle2 size={28} />
            </div>
            <h3 className="text-lg font-bold text-on-surface mb-1">Analysis Complete!</h3>
            <p className="text-xs text-on-surface-variant">
              Your personalized roadmap is ready
            </p>
          </div>
        ) : null}
      </div>

      <div className="flex gap-3 mt-8">
        <button
          onClick={() => { setStep(3); }}
          disabled={isAnalyzing}
          className="flex-1 glass border border-outline-variant/20 py-3.5 rounded-2xl font-bold text-sm hover:bg-surface-container-highest transition-all disabled:opacity-50"
        >
          Back
        </button>

        {analysisDone ? (
          <button
            onClick={() => {
              completeStep(3);
              completeStep(4);
              setStep(5);
            }}
            className="flex-[2] primary-gradient text-on-primary-fixed py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all"
          >
            View Your Roadmap
          </button>
        ) : (
          <button
            onClick={async () => {
              if (!jdText.trim()) return;
              setIsAnalyzing(true);
              setAnalysisSteps((prev) =>
                prev.map((s) => ({ ...s, status: s.id === "parse" ? "running" : "pending" })),
              );

              try {
                const token = getAuthToken();
                if (!token) {
                  setIsAnalyzing(false);
                  return;
                }

                // Fetch parsed resume text
                let resumeContent = "";
                if (uploadedResumeId) {
                  const resumeRes = await fetch(`/api/v1/resume/${uploadedResumeId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                  });
                  if (resumeRes.ok) {
                    const data = await resumeRes.json();
                    resumeContent = data.parsed_text || "";
                  }
                }

                const response = await fetch("/api/v1/agent/analyze", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    resumeText: resumeContent,
                    jobDescriptionText: jdText,
                  }),
                });

                if (!response.ok) throw new Error("Analysis failed");

                const reader = response.body?.getReader();
                const decoder = new TextDecoder();

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
                        if (line.startsWith("event: ")) eventType = line.slice(7).trim();
                        else if (line.startsWith("data: ")) dataLine = line.slice(6);
                      }
                      if (dataLine) {
                        try {
                          const data = JSON.parse(dataLine);
                          if (data.name === "parse") {
                            setAnalysisSteps((prev) =>
                              prev.map((s) =>
                                s.id === "parse" ? { ...s, status: "done", message: "Resume parsed" } : s,
                              ),
                            );
                          } else if (data.name === "normalize") {
                            setAnalysisSteps((prev) =>
                              prev.map((s) =>
                                s.id === "parse"
                                  ? { ...s, status: "done" }
                                  : s.id === "extract"
                                    ? { ...s, status: "running", message: "Extracting skills..." }
                                    : s,
                              ),
                            );
                          } else if (data.name === "match") {
                            setAnalysisSteps((prev) =>
                              prev.map((s) =>
                                s.id === "extract"
                                  ? { ...s, status: "done", message: "Skills identified" }
                                  : s.id === "compare"
                                    ? { ...s, status: "running", message: "Comparing against market..." }
                                    : s,
                              ),
                            );
                          } else if (data.name === "insights") {
                            setAnalysisSteps((prev) =>
                              prev.map((s) =>
                                s.id === "compare"
                                  ? { ...s, status: "done", message: "Market match complete" }
                                  : s.id === "roadmap"
                                    ? { ...s, status: "running", message: "Generating upskilling plan..." }
                                    : s,
                              ),
                            );
                          }
                        } catch {
                          /* ignore */
                        }
                      }
                    }
                  }
                }

                setAnalysisSteps((prev) =>
                  prev.map((s) => ({ ...s, status: "done" })),
                );
                completeStep(3);
                setAnalysisDone(true);
              } catch (err) {
                console.error("Analysis error:", err);
                setAnalysisSteps((prev) =>
                  prev.map((s) => ({ ...s, status: s.status === "running" ? "error" : s.status })),
                );
              } finally {
                setIsAnalyzing(false);
              }
            }}
            disabled={!jdText.trim() || isAnalyzing}
            className={cn(
              "flex-[2] py-3.5 rounded-2xl font-bold shadow-xl transition-all",
              jdText.trim() && !isAnalyzing
                ? "primary-gradient text-on-primary-fixed hover:shadow-primary/20"
                : "bg-surface-container-highest text-outline cursor-not-allowed",
            )}
          >
            {isAnalyzing ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Analyzing...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Brain size={18} />
                Run AI Analysis
              </span>
            )}
          </button>
        )}
      </div>

      {!jdText.trim() && !isAnalyzing && (
        <p className="mt-3 text-center text-[10px] font-bold uppercase tracking-widest text-outline">
          Paste a job description to enable analysis
        </p>
      )}
    </div>
  );

  // ─── Step 5: Done ─────────────────────────────────────────────────────────
  const renderStep5 = () => (
    <div className="text-center">
      <div className="flex justify-center mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/20">
          <CheckCircle2 size={40} className="text-emerald-400" />
        </div>
      </div>
      <h2 className="text-2xl font-extrabold tracking-tighter mb-3 font-headline">
        You're all set!
      </h2>
      <p className="text-on-surface-variant font-light leading-relaxed mb-8">
        Your profile is configured and your first analysis is ready. Here's where to go next:
      </p>

      <div className="space-y-3">
        <button
          onClick={() => {
            completeWizard();
            completeStep(4); // Roadmap
            navigate("/dashboard");
          }}
          className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
        >
          <span className="text-2xl">📊</span>
          <div className="flex-1">
            <div className="font-bold group-hover:text-primary transition-colors">
              Dashboard &amp; Roadmap
            </div>
            <div className="text-xs text-on-surface-variant">
              View your analysis results and personalized upskilling plan
            </div>
          </div>
          <ChevronRight size={20} className="text-outline group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => {
            completeWizard();
            completeStep(5); // Career tools
            navigate("/jobs");
          }}
          className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
        >
          <span className="text-2xl">💼</span>
          <div className="flex-1">
            <div className="font-bold group-hover:text-primary transition-colors">
              Job Tracker
            </div>
            <div className="text-xs text-on-surface-variant">
              Track applications, monitor progress, and manage your job search
            </div>
          </div>
          <ChevronRight size={20} className="text-outline group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => {
            completeWizard();
            navigate("/market-demand");
          }}
          className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
        >
          <span className="text-2xl">🌍</span>
          <div className="flex-1">
            <div className="font-bold group-hover:text-primary transition-colors">
              Explore Market Demand
            </div>
            <div className="text-xs text-on-surface-variant">
              See which skills are trending and where your expertise is valued most
            </div>
          </div>
          <ChevronRight size={20} className="text-outline group-hover:text-primary transition-colors" />
        </button>

        <button
          onClick={() => {
            completeWizard();
            navigate("/linkedin");
          }}
          className="w-full glass border border-outline-variant/20 p-4 rounded-2xl flex items-center gap-4 hover:bg-surface-container-higher transition-all text-left group"
        >
          <span className="text-2xl">🔗</span>
          <div className="flex-1">
            <div className="font-bold group-hover:text-primary transition-colors">
              Optimize LinkedIn Profile
            </div>
            <div className="text-xs text-on-surface-variant">
              Get AI-powered suggestions to improve your LinkedIn presence
            </div>
          </div>
          <ChevronRight size={20} className="text-outline group-hover:text-primary transition-colors" />
        </button>
      </div>

      <div className="mt-8">
      <button
        onClick={() => {
          completeWizard();
          completeStep(5);
          navigate("/dashboard");
        }}
        className="primary-gradient text-on-primary-fixed px-10 py-3.5 rounded-2xl font-bold shadow-xl hover:shadow-primary/20 transition-all active:scale-95"
      >
        Go to Dashboard
      </button>
        <p className="mt-3 text-[10px] text-on-surface-variant">
          You can always access everything from the sidebar menu
        </p>
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-surface-container-high border border-outline-variant/20 rounded-[2.5rem] p-8 max-w-lg w-full mx-4 shadow-2xl animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
        {/* Step progress dots */}
        <div className="flex gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={cn(
                "h-1.5 flex-1 rounded-full transition-all duration-500",
                s <= step ? "bg-primary" : "bg-outline/20",
              )}
            />
          ))}
        </div>

        {/* Step indicator */}
        <div className="text-center mb-4">
          <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Step {step} of 5
          </span>
        </div>

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
        {step === 5 && renderStep5()}
      </div>
    </div>
  );
}
