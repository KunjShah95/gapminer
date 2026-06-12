import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Upload,
  FileText,
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Lightbulb,
  Loader2,
  Target,
  Sparkles,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface ATSScore {
  overall_score: number;
  keyword_match: number;
  formatting_score: number;
  content_score: number;
  missing_keywords: string[];
  present_keywords: string[];
  suggestions: string[];
}

interface ATSHistoryItem {
  id: string;
  overall_score: number;
  created_at: string;
}

function ScoreGauge({ score }: { score: number }) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(score, 100) / 100);
  const color =
    score >= 75
      ? "text-emerald-400"
      : score >= 50
        ? "text-amber-400"
        : "text-error";

  return (
    <div className="relative flex items-center justify-center">
      <svg width="180" height="180" className="-rotate-90">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          className="text-surface-container-highest"
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="14"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(color, "transition-all duration-1000 ease-out")}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className={cn("text-5xl font-black tracking-tight", color)}>
          {score}
        </span>
        <span className="text-xs text-on-surface-variant">/ 100</span>
      </div>
    </div>
  );
}

function BreakdownBar({
  label,
  score,
}: {
  label: string;
  score: number;
}) {
  const color =
    score >= 75
      ? "text-emerald-400"
      : score >= 50
        ? "text-amber-400"
        : "text-error";
  const bgColor =
    score >= 75
      ? "bg-emerald-400"
      : score >= 50
        ? "bg-amber-400"
        : "bg-error";

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-on-surface">{label}</span>
        <span className={cn("font-bold", color)}>{Math.round(score)}%</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-surface-container-highest">
        <div
          className={cn("h-full rounded-full transition-all duration-1000", bgColor)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

export default function ATSPage() {
  const [resumeText, setResumeText] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [score, setScore] = useState<ATSScore | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<ATSHistoryItem[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (historyOpen && history.length === 0) {
      fetchHistory();
    }
  }, [historyOpen]);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    const token = getAuthToken();
    if (!token) {
      setHistoryLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/v1/ats/history", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => []);
        setHistory(data);
      }
    } catch (err) {
      console.error("Failed to fetch ATS history:", err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setResumeText(text || "");
    };
    reader.readAsText(file);
  };

  const handleSubmit = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) return;

    setLoading(true);
    setScore(null);
    const token = getAuthToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/v1/ats/score", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: jobDescription,
        }),
      });

      if (res.ok) {
        const data: ATSScore = await res.json();
        setScore(data);
      } else {
        const data = await res.json().catch(() => ({}));
        if (data.detail) {
          console.error("Scoring error:", data.detail);
        }
      }
    } catch (err) {
      console.error("Failed to score resume:", err);
    } finally {
      setLoading(false);
    }
  };

  const [historyTabOpen, setHistoryTabOpen] = useState(false);

  return (
    <PageShell>
      <PageHeader
        icon={<Target size={22} />}
        title="ATS Resume Scoring"
        description="Score your resume against any job description to optimize for Applicant Tracking Systems"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card padding="lg" className="flex flex-col">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-on-surface">
            <FileText size={18} className="text-primary" />
            Your Resume
          </h3>
          <div className="mb-3">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.docx,.pdf"
              onChange={handleFileUpload}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-outline-variant/20 px-4 py-3 text-sm font-semibold text-on-surface-variant transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-primary"
            >
              <Upload size={16} />
              Upload resume (.txt, .docx, .pdf)
            </button>
          </div>
          <textarea
            value={resumeText}
            onChange={(e) => setResumeText(e.target.value)}
            placeholder="Paste your resume content here..."
            className="gm-textarea min-h-[250px] flex-1 resize-y font-mono text-sm leading-relaxed"
          />
        </Card>

        <Card padding="lg" className="flex flex-col">
          <h3 className="mb-4 flex items-center gap-2 font-bold text-on-surface">
            <Sparkles size={18} className="text-tertiary" />
            Job Description
          </h3>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            placeholder="Paste the job description here..."
            className="gm-textarea min-h-[250px] flex-1 resize-y font-mono text-sm leading-relaxed"
          />
        </Card>
      </div>

      <div className="mt-6 flex justify-center">
        <Button
          onClick={handleSubmit}
          size="lg"
          loading={loading}
          disabled={!resumeText.trim() || !jobDescription.trim()}
        >
          <Target size={18} />
          Score My Resume
        </Button>
      </div>

      <AnimatePresence>
        {score && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-8 space-y-6"
          >
            <Card padding="lg">
              <div className="flex flex-col items-center gap-8 lg:flex-row lg:items-start">
                <div className="shrink-0">
                  <ScoreGauge score={score.overall_score} />
                </div>

                <div className="min-w-0 flex-1 space-y-4">
                  <h3 className="text-lg font-bold text-on-surface">
                    Score Breakdown
                  </h3>
                  <BreakdownBar
                    label="Keyword Match"
                    score={score.keyword_match}
                  />
                  <BreakdownBar
                    label="Formatting"
                    score={score.formatting_score}
                  />
                  <BreakdownBar
                    label="Content Score"
                    score={score.content_score}
                  />
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card padding="lg">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-error">
                  <AlertTriangle size={16} />
                  Missing Keywords ({score.missing_keywords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {score.missing_keywords.length > 0 ? (
                    score.missing_keywords.map((kw, i) => (
                      <Badge key={i} tone="error" className="normal-case tracking-normal">
                        {kw}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-on-surface-variant">
                      No missing keywords — great alignment!
                    </p>
                  )}
                </div>
              </Card>

              <Card padding="lg">
                <h3 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-emerald-400">
                  <CheckCircle size={16} />
                  Present Keywords ({score.present_keywords.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {score.present_keywords.map((kw, i) => (
                    <Badge key={i} tone="success" className="normal-case tracking-normal">
                      {kw}
                    </Badge>
                  ))}
                </div>
              </Card>
            </div>

            <Card padding="lg">
              <h3 className="mb-4 flex items-center gap-2 font-bold text-on-surface">
                <Lightbulb size={20} className="text-tertiary" />
                Improvement Suggestions
              </h3>
              {score.suggestions.length > 0 ? (
                <ol className="space-y-3">
                  {score.suggestions.map((suggestion, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 rounded-xl border border-outline-variant/10 bg-surface-container-low p-4"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-tertiary/15 text-xs font-bold text-tertiary">
                        {i + 1}
                      </span>
                      <span className="text-sm leading-relaxed text-on-surface">
                        {suggestion}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-on-surface-variant">
                  No suggestions — your resume looks strong!
                </p>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mt-10">
        <details
          className="group"
          onToggle={(e) => setHistoryTabOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="flex cursor-pointer items-center gap-3 rounded-xl bg-surface-container-low p-4 transition-all hover:bg-surface-container-high">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-bold text-on-surface">Past Analyses</span>
            <span className="ml-auto text-xs text-on-surface-variant">
              <ChevronDown className="h-4 w-4 group-open:hidden" />
              <ChevronUp className="hidden h-4 w-4 group-open:block" />
            </span>
          </summary>
          {historyTabOpen && (
            <div className="mt-4">
              {historyLoading ? (
                <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <Card padding="md" className="text-center">
                  <p className="text-sm text-on-surface-variant">
                    No past analyses yet
                  </p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => {
                    const hColor =
                      item.overall_score >= 75
                        ? "text-emerald-400"
                        : item.overall_score >= 50
                          ? "text-amber-400"
                          : "text-error";
                    const hBgColor =
                      item.overall_score >= 75
                        ? "bg-emerald-400/10"
                        : item.overall_score >= 50
                          ? "bg-amber-400/10"
                          : "bg-error/10";
                    return (
                      <div
                        key={item.id}
                        className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-low px-4 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-lg font-bold text-sm",
                              hBgColor,
                              hColor,
                            )}
                          >
                            {item.overall_score}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-on-surface">
                              ATS Analysis
                            </p>
                            <p className="text-xs text-on-surface-variant">
                              {new Date(item.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge
                          tone={
                            item.overall_score >= 75
                              ? "success"
                              : item.overall_score >= 50
                                ? "warning"
                                : "error"
                          }
                        >
                          {item.overall_score >= 75
                            ? "Strong"
                            : item.overall_score >= 50
                              ? "Average"
                              : "Weak"}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </details>
      </div>
    </PageShell>
  );
}
