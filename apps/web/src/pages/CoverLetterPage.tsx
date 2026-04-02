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
    } catch (err) {
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

      const data = await response.json();
      setFormData((prev) => ({
        ...prev,
        jobDescription: data.description || data.text || "",
        companyName: data.company || prev.companyName,
      }));
    } catch (err) {
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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to generate cover letter");
      }

      const data = await response.json();
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
    } catch (err) {
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Sparkles className="w-8 h-8 text-blue-600" />
          AI Cover Letter Generator
        </h1>
        <p className="text-gray-600">
          Generate tailored cover letters that highlight your relevant experience
          for any job application. Our AI analyzes your resume and the job
          description to create a personalized letter.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-700 font-medium">Error</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-400 hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-blue-600" />
          Job Details
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Posting URL (optional)
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="url"
                name="jobUrl"
                value={formData.jobUrl}
                onChange={handleInputChange}
                placeholder="https://company.com/job-posting"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <button
              onClick={handleScrapeJob}
              disabled={isScraping || !formData.jobUrl}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
            >
              {isScraping ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Fetching...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  Fetch
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Job Description <span className="text-red-500">*</span>
          </label>
          <textarea
            name="jobDescription"
            value={formData.jobDescription}
            onChange={handleInputChange}
            placeholder="Paste the job description here..."
            rows={5}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            Target Company Name
          </label>
          <input
            type="text"
            name="companyName"
            value={formData.companyName}
            onChange={handleInputChange}
            placeholder="e.g., Acme Corporation"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Your Resume
        </h2>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Resume Text <span className="text-red-500">*</span>
            </label>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <Upload className="w-4 h-4" />
              Upload File
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleFileUpload}
            className="hidden"
          />
          <textarea
            name="resumeText"
            value={formData.resumeText}
            onChange={handleInputChange}
            placeholder="Paste your resume content here, or upload a file..."
            rows={8}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y"
          />
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Tone Selection
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {toneOptions.map((option) => (
            <label
              key={option.value}
              className={`cursor-pointer rounded-lg border-2 p-4 transition-all ${
                formData.tone === option.value
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <input
                type="radio"
                name="tone"
                value={option.value}
                checked={formData.tone === option.value}
                onChange={handleInputChange}
                className="sr-only"
              />
              <div className="font-medium text-gray-900">{option.label}</div>
              <div className="text-sm text-gray-500 mt-1">
                {option.description}
              </div>
            </label>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <button
          onClick={handleGenerate}
          disabled={isGenerating || !formData.resumeText || !formData.jobDescription}
          className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              Generating your cover letter...
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              Generate Cover Letter
            </>
          )}
        </button>
      </div>

      {generatedLetter && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Your Cover Letter
              </h2>
              {generatedLetter.metadata && (
                <p className="text-sm text-gray-500 mt-1">
                  Generated on{" "}
                  {new Date(generatedLetter.metadata.generatedAt).toLocaleDateString()}{" "}
                  using {generatedLetter.metadata.model}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {!isEditing && (
                <button
                  onClick={handleStartEdit}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Edit cover letter"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              )}
              {isEditing && (
                <>
                  <button
                    onClick={handleSaveEdit}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Save changes"
                  >
                    <Save className="w-5 h-5" />
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Cancel editing"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                onClick={handleRegenerate}
                disabled={isGenerating}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                title="Regenerate cover letter"
              >
                <RefreshCw className={`w-5 h-5 ${isGenerating ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={handleCopy}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <div className="relative group">
                <button
                  className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Download"
                >
                  <Download className="w-5 h-5" />
                </button>
                <div className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <button
                    onClick={() => handleDownload("txt")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 first:rounded-t-lg"
                  >
                    Download as TXT
                  </button>
                  <button
                    onClick={() => handleDownload("pdf")}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 last:rounded-b-lg"
                  >
                    Download as PDF
                  </button>
                </div>
              </div>
            </div>
          </div>

          {generatedLetter.highlights && generatedLetter.highlights.length > 0 && (
            <div className="mb-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="text-sm font-medium text-blue-900 mb-2">
                Key Highlights
              </h3>
              <ul className="list-disc list-inside text-sm text-blue-800">
                {generatedLetter.highlights.map((highlight, index) => (
                  <li key={index}>{highlight}</li>
                ))}
              </ul>
            </div>
          )}

          {isEditing ? (
            <textarea
              value={editedLetter}
              onChange={(e) => setEditedLetter(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-y min-h-[300px] font-serif text-gray-700 leading-relaxed"
            />
          ) : (
            <div className="prose prose-gray max-w-none whitespace-pre-wrap text-gray-700 leading-relaxed font-serif p-4 bg-gray-50 rounded-lg">
              {generatedLetter.letter}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
