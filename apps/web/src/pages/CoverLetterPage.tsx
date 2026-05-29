import { useState, useRef } from "react";
import {
  FileText,
  Download,
  Copy,
  Check,
  Upload,
  Link as LinkIcon,
  Briefcase,
  Building2,
  Sparkles,
  AlertCircle,
  RefreshCw,
  Edit3,
  Save,
  X,
} from "lucide-react";
import { safeReadJson } from "@/lib/authFetch";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

type Tone = "professional" | "casual" | "enthusiastic";

interface CoverLetterFormData {
  resumeText: string;
  jobDescription: string;
  companyName: string;
  tone: Tone;
  jobUrl: string;
}

interface GeneratedCoverLetter {
  letter: string;
  highlights: string[];
  metadata: {
    generatedAt: string;
    model: string;
  };
}

export function CoverLetterPage() {
  const [formData, setFormData] = useState<CoverLetterFormData>({
    resumeText: "",
    jobDescription: "",
    companyName: "",
    tone: "professional",
    jobUrl: "",
  });

  const [generatedLetter, setGeneratedLetter] = useState<GeneratedCoverLetter | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedLetter, setEditedLetter] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      setFormData((prev) => ({ ...prev, resumeText: text }));
    } catch {
      setError("Failed to read file. Please try again.");
    }
  };

  const handleScrapeJob = async () => {
    if (!formData.jobUrl) {
      setError("Please enter a job posting URL");
      return;
    }

    setIsScraping(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.jobUrl }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch job description");
      }

      const data = await safeReadJson<any>(response, {});
      setFormData((prev) => ({
        ...prev,
        jobDescription: data.description || data.text || "",
        companyName: data.company || prev.companyName,
      }));
    } catch {
      setError("Failed to fetch job description from URL. Please paste the description manually.");
    } finally {
      setIsScraping(false);
    }
  };

  const handleGenerate = async () => {
    if (!formData.resumeText.trim() || !formData.jobDescription.trim()) {
      setError("Please provide both resume text and job description");
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: formData.resumeText,
          jobDescription: formData.jobDescription,
          companyName: formData.companyName,
          tone: formData.tone,
        }),
      });

      if (!response.ok) {
        const errorData = await safeReadJson<any>(response, {});
        throw new Error(errorData.error || "Failed to generate cover letter");
      }

      const data = await safeReadJson<any>(response, {});
      const letterData: GeneratedCoverLetter = {
        letter: data.coverLetter || data.coverLetter?.letter || "",
        highlights: data.coverLetter?.highlights || data.highlights || [],
        metadata: data.metadata || {
          generatedAt: new Date().toISOString(),
          model: "LaMini-Flan-T5-783m",
        },
      };
      setGeneratedLetter(letterData);
      setEditedLetter(letterData.letter);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    const textToCopy = isEditing ? editedLetter : generatedLetter?.letter || "";
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Failed to copy to clipboard");
    }
  };

  const handleDownload = (format: "txt" | "pdf") => {
    const text = isEditing ? editedLetter : generatedLetter?.letter || "";
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cover-letter-${formData.companyName || "generated"}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleStartEdit = () => {
    setEditedLetter(generatedLetter?.letter || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    setGeneratedLetter((prev) =>
      prev ? { ...prev, letter: editedLetter } : null,
    );
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setEditedLetter(generatedLetter?.letter || "");
    setIsEditing(false);
  };

  const handleRegenerate = () => {
    handleGenerate();
  };

  const toneOptions: { value: Tone; label: string; description: string }[] = [
    {
      value: "professional",
      label: "Professional",
      description: "Formal and business-like tone",
    },
    {
      value: "enthusiastic",
      label: "Enthusiastic",
      description: "Energetic and passionate tone",
    },
    {
      value: "casual",
      label: "Casual",
      description: "Friendly and conversational tone",
    },
  ];

  const canGenerate =
    Boolean(formData.resumeText.trim()) && Boolean(formData.jobDescription.trim());

  return (
    <PageShell maxWidth="2xl">
      <PageHeader
        badge="AI Writing"
        title="Cover Letter Generator"
        description="Generate tailored cover letters that highlight your relevant experience for any job application."
        icon={<Sparkles className="h-6 w-6" />}
      />

      {error && (
        <Card
          padding="md"
          className="mb-6 border-error/30 bg-error/10"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <div className="flex-1">
              <p className="text-sm font-bold text-error">Error</p>
              <p className="mt-0.5 text-sm text-on-surface-variant">{error}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} aria-label="Dismiss">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr] lg:items-start">
        {/* Sidebar — inputs */}
        <aside className="space-y-4 lg:sticky lg:top-6">
          <Card padding="md">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                Job Details
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="gm-label">Job Posting URL (optional)</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <LinkIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
                    <input
                      type="url"
                      name="jobUrl"
                      value={formData.jobUrl}
                      onChange={handleInputChange}
                      placeholder="https://company.com/job"
                      className="gm-input pl-10"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={handleScrapeJob}
                    disabled={isScraping || !formData.jobUrl}
                    loading={isScraping}
                  >
                    {!isScraping && <Upload className="h-4 w-4" />}
                    Fetch
                  </Button>
                </div>
              </div>

              <Textarea
                label="Job Description *"
                name="jobDescription"
                value={formData.jobDescription}
                onChange={handleInputChange}
                placeholder="Paste the job description here..."
                rows={4}
              />

              <Input
                label="Target Company"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder="e.g., Acme Corporation"
              />
            </div>
          </Card>

          <Card padding="md">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface">
                  Your Resume
                </h2>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-3.5 w-3.5" />
                Upload
              </Button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.pdf,.doc,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Textarea
              label="Resume Text *"
              name="resumeText"
              value={formData.resumeText}
              onChange={handleInputChange}
              placeholder="Paste your resume content here..."
              rows={6}
            />
          </Card>

          <Card padding="md">
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-on-surface">
              Tone
            </h2>
            <div className="space-y-2">
              {toneOptions.map((option) => (
                <label
                  key={option.value}
                  className={cn(
                    "flex cursor-pointer flex-col rounded-xl border p-3 transition-all",
                    formData.tone === option.value
                      ? "border-primary/50 bg-primary/10"
                      : "border-outline-variant/20 bg-surface-container-low hover:border-outline-variant/40",
                  )}
                >
                  <input
                    type="radio"
                    name="tone"
                    value={option.value}
                    checked={formData.tone === option.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <span className="text-sm font-bold text-on-surface">{option.label}</span>
                  <span className="mt-0.5 text-xs text-on-surface-variant">
                    {option.description}
                  </span>
                </label>
              ))}
            </div>
          </Card>

          <Button
            type="button"
            size="lg"
            className="w-full"
            onClick={handleGenerate}
            disabled={!canGenerate}
            loading={isGenerating}
          >
            {!isGenerating && <Sparkles className="h-5 w-5" />}
            {isGenerating ? "Generating..." : "Generate Cover Letter"}
          </Button>
        </aside>

        {/* Main — preview */}
        <main className="min-h-[480px]">
          {generatedLetter ? (
            <Card padding="lg" className="h-full">
              <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-on-surface">Your Cover Letter</h2>
                  {generatedLetter.metadata && (
                    <p className="mt-1 text-xs text-on-surface-variant">
                      Generated{" "}
                      {new Date(generatedLetter.metadata.generatedAt).toLocaleDateString()}{" "}
                      · {generatedLetter.metadata.model}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {!isEditing ? (
                    <Button variant="ghost" size="sm" onClick={handleStartEdit} title="Edit">
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  ) : (
                    <>
                      <Button variant="ghost" size="sm" onClick={handleSaveEdit} title="Save">
                        <Save className="h-4 w-4 text-emerald-400" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={handleCancelEdit} title="Cancel">
                        <X className="h-4 w-4 text-error" />
                      </Button>
                    </>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    title="Regenerate"
                  >
                    <RefreshCw className={cn("h-4 w-4", isGenerating && "animate-spin")} />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy">
                    {copied ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <div className="group relative">
                    <Button variant="ghost" size="sm" title="Download">
                      <Download className="h-4 w-4" />
                    </Button>
                    <div className="invisible absolute right-0 top-full z-10 mt-1 min-w-[140px] rounded-xl border border-outline-variant/20 bg-surface-container-high opacity-0 shadow-xl transition-all group-hover:visible group-hover:opacity-100">
                      <button
                        type="button"
                        onClick={() => handleDownload("txt")}
                        className="block w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-highest first:rounded-t-xl"
                      >
                        Download TXT
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownload("pdf")}
                        className="block w-full px-4 py-2 text-left text-sm text-on-surface hover:bg-surface-container-highest last:rounded-b-xl"
                      >
                        Download PDF
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {generatedLetter.highlights.length > 0 && (
                <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-primary">
                    Key Highlights
                  </h3>
                  <ul className="list-inside list-disc space-y-1 text-sm text-on-surface-variant">
                    {generatedLetter.highlights.map((highlight, index) => (
                      <li key={index}>{highlight}</li>
                    ))}
                  </ul>
                </div>
              )}

              {isEditing ? (
                <Textarea
                  value={editedLetter}
                  onChange={(e) => setEditedLetter(e.target.value)}
                  rows={16}
                  className="min-h-[320px] font-serif leading-relaxed"
                />
              ) : (
                <div className="whitespace-pre-wrap rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 font-serif text-sm leading-relaxed text-on-surface">
                  {generatedLetter.letter}
                </div>
              )}
            </Card>
          ) : (
            <Card
              padding="lg"
              className="flex h-full min-h-[480px] flex-col items-center justify-center text-center"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl primary-gradient-subtle text-primary">
                <Building2 className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-on-surface">Preview appears here</h3>
              <p className="mt-2 max-w-sm text-sm text-on-surface-variant">
                Fill in your resume and job details in the sidebar, then generate a personalized
                cover letter.
              </p>
              <Badge tone="primary" className="mt-4">
                AI-powered
              </Badge>
            </Card>
          )}
        </main>
      </div>
    </PageShell>
  );
}
