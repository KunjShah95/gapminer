import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Plus, Download, Save, Eye, RefreshCw, AlertCircle, X, Loader2 } from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  EmptyState,
} from "@/components/ui";
import ResumeSection from "@/components/resume/ResumeSection";
import type { ResumeSectionData } from "@/components/resume/ResumeSection";
import ResumeTemplatePicker from "@/components/resume/ResumeTemplatePicker";
import type { TemplateId } from "@/components/resume/ResumeTemplatePicker";
import ResumePreview from "@/components/resume/ResumePreview";
import { cn } from "@/lib/utils";

type SectionType = ResumeSectionData["type"];

const STORAGE_KEY = "gapminer-resume-builder";

const SECTION_TYPES: { type: SectionType; label: string }[] = [
  { type: "summary", label: "Summary" },
  { type: "experience", label: "Experience" },
  { type: "education", label: "Education" },
  { type: "skills", label: "Skills" },
  { type: "projects", label: "Projects" },
  { type: "certifications", label: "Certifications" },
];

let counter = 0;
function uid() {
  counter += 1;
  return `s-${Date.now()}-${counter}`;
}

function createDefaultSections(): ResumeSectionData[] {
  return [
    { id: uid(), type: "summary", title: "Professional Summary", entries: [{ text: "" }] },
    { id: uid(), type: "experience", title: "Experience", entries: [] },
    { id: uid(), type: "education", title: "Education", entries: [] },
    { id: uid(), type: "skills", title: "Skills", entries: [{ tags: "" }] },
    { id: uid(), type: "projects", title: "Projects", entries: [] },
    { id: uid(), type: "certifications", title: "Certifications", entries: [] },
  ];
}

function loadFromStorage(): { template: TemplateId; sections: ResumeSectionData[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data && data.template && Array.isArray(data.sections)) {
      return data as any;
    }
    return null;
  } catch {
    return null;
  }
}

function saveToStorage(data: { template: TemplateId; sections: ResumeSectionData[] }) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded — silent */
  }
}

type SectionWithoutId = Omit<ResumeSectionData, "id">;

const SECTION_ENTRY_DEFAULTS: Record<SectionType, Record<string, string>> = {
  summary: { text: "" },
  experience: { company: "", role: "", startDate: "", endDate: "", bullets: "" },
  education: { school: "", degree: "", field: "", startDate: "", endDate: "", gpa: "" },
  skills: { tags: "" },
  projects: { name: "", description: "", tech: "", link: "" },
  certifications: { name: "", issuer: "", date: "" },
  custom: { value: "" },
};

export default function ResumeBuilderPage() {
  const [template, setTemplate] = useState<TemplateId>("modern");
  const [sections, setSections] = useState<ResumeSectionData[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = loadFromStorage();
    if (saved) {
      setTemplate(saved.template);
      setSections(saved.sections);
    } else {
      setSections(createDefaultSections());
    }
    setInitialized(true);
  }, []);

  const persist = useCallback((tmpl: TemplateId, secs: ResumeSectionData[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      saveToStorage({ template: tmpl, sections: secs });
    }, 500);
  }, []);

  const setTemplateAndSave = useCallback(
    (t: TemplateId) => {
      setTemplate(t);
      persist(t, sections);
    },
    [sections, persist],
  );

  const setSectionsAndSave = useCallback(
    (fn: (prev: ResumeSectionData[]) => ResumeSectionData[]) => {
      setSections((prev) => {
        const next = fn(prev);
        persist(template, next);
        return next;
      });
    },
    [template, persist],
  );

  const handleSectionChange = useCallback(
    (id: string, data: Partial<ResumeSectionData>) => {
      setSectionsAndSave((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...data } : s)),
      );
    },
    [setSectionsAndSave],
  );

  const handleEntryChange = useCallback(
    (sectionId: string, entryIndex: number, field: string, value: string) => {
      setSectionsAndSave((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const entries = s.entries.map((e, i) =>
            i === entryIndex ? { ...e, [field]: value } : e,
          );
          return { ...s, entries };
        }),
      );
    },
    [setSectionsAndSave],
  );

  const handleAddEntry = useCallback(
    (sectionId: string) => {
      setSectionsAndSave((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const defaults = SECTION_ENTRY_DEFAULTS[s.type] ?? { value: "" };
          return { ...s, entries: [...s.entries, { ...defaults }] };
        }),
      );
    },
    [setSectionsAndSave],
  );

  const handleRemoveEntry = useCallback(
    (sectionId: string, entryIndex: number) => {
      setSectionsAndSave((prev) =>
        prev.map((s) => {
          if (s.id !== sectionId) return s;
          const entries = s.entries.filter((_, i) => i !== entryIndex);
          return { ...s, entries };
        }),
      );
    },
    [setSectionsAndSave],
  );

  const handleMoveSection = useCallback(
    (index: number, direction: "up" | "down") => {
      setSectionsAndSave((prev) => {
        const next = [...prev];
        const target = index + (direction === "up" ? -1 : 1);
        if (target < 0 || target >= next.length) return prev;
        [next[index], next[target]] = [next[target], next[index]];
        return next;
      });
    },
    [setSectionsAndSave],
  );

  const handleRemoveSection = useCallback(
    (id: string) => {
      setSectionsAndSave((prev) => prev.filter((s) => s.id !== id));
    },
    [setSectionsAndSave],
  );

  const handleAddSection = useCallback((type: SectionType) => {
    const label = SECTION_TYPES.find((t) => t.type === type)?.label ?? type;
    const defaults = SECTION_ENTRY_DEFAULTS[type] ?? { value: "" };
    const newSection: ResumeSectionData = {
      id: uid(),
      type,
      title: label,
      entries: [{ ...defaults }],
    };
    setSectionsAndSave((prev) => [...prev, newSection]);
    setShowAddMenu(false);
  }, [setSectionsAndSave]);

  const handleNewResume = useCallback(() => {
    setSections(createDefaultSections());
    setTemplate("modern");
    saveToStorage({ template: "modern", sections: createDefaultSections() });
  }, []);

  const handleLoadFromAnalysis = useCallback(async () => {
    const token = getAuthToken();
    if (!token) {
      setError("Please sign in to load from analysis");
      return;
    }

    setLoadingAnalysis(true);
    setError(null);

    try {
      const res = await fetch("/api/v1/analysis", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        setError("No analyses found. Run an analysis first.");
        return;
      }

      const data = await res.json().catch(() => []);
      const list = Array.isArray(data) ? data : data.analyses ?? [];
      if (list.length === 0) {
        setError("No analyses found. Run an analysis first.");
        return;
      }

      const latest = list[0];
      const detailRes = await fetch(`/api/v1/analysis/${latest.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!detailRes.ok) {
        setError("Failed to load analysis details.");
        return;
      }

      const detail = await detailRes.json().catch(() => ({}));
      const result = detail.result ?? detail;

      const loadedSections: ResumeSectionData[] = [];

      if (result.skills_gap?.skills_identified || result.skills) {
        loadedSections.push({
          id: uid(),
          type: "skills",
          title: "Skills",
          entries: [{ tags: (result.skills_gap?.skills_identified ?? result.skills ?? []).join(", ") }],
        });
      }

      if (result.summary || result.profile_summary) {
        loadedSections.push({
          id: uid(),
          type: "summary",
          title: "Professional Summary",
          entries: [{ text: result.summary ?? result.profile_summary ?? "" }],
        });
      }

      if (loadedSections.length > 0) {
        setSections((prev) => {
          const rest = prev.filter(
            (s) => s.type !== "skills" && s.type !== "summary",
          );
          return [...loadedSections, ...rest];
        });
        setError(null);
      } else {
        setError("No skill data found in latest analysis.");
      }
    } catch {
      setError("Failed to load analysis data.");
    } finally {
      setLoadingAnalysis(false);
    }
  }, []);

  const handleExportPdf = useCallback(() => {
    window.print();
  }, []);

  const handleSaveManually = useCallback(() => {
    saveToStorage({ template, sections });
    setError(null);
  }, [template, sections]);

  if (!initialized) {
    return (
      <PageShell maxWidth="xl">
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </PageShell>
    );
  }

  const hasContent = sections.some((s) =>
    s.entries.some((e) => Object.values(e).some((v) => v && v.trim())),
  );

  if (!hasContent) {
    return (
      <PageShell maxWidth="lg">
        <PageHeader
          icon={<FileText size={22} />}
          title="Resume Builder"
          description="Create a professional resume from scratch or import your analysis data"
        />

        {error && (
          <Card padding="md" className="mb-6 border-error/30 bg-error/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <p className="flex-1 text-sm text-error">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-error/60 hover:text-error">
                <X size={16} />
              </button>
            </div>
          </Card>
        )}

        <EmptyState
          icon={<FileText size={32} />}
          title="Build Your Resume"
          description="Start fresh with a blank template or import your skills from a GapMiner analysis"
          action="Start Fresh"
          onAction={handleNewResume}
        />

        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={handleLoadFromAnalysis}
            loading={loadingAnalysis}
          >
            <RefreshCw size={16} />
            Load from Analysis
          </Button>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell maxWidth="xl">
      <div className="print:hidden">
        <PageHeader
          icon={<FileText size={22} />}
          title="Resume Builder"
          description="Build and customize your resume with live preview"
          actions={
            <>
              <Button variant="ghost" size="sm" onClick={handleLoadFromAnalysis} loading={loadingAnalysis}>
                <RefreshCw size={16} />
                Load from Analysis
              </Button>
              <Button variant="ghost" size="sm" onClick={handleNewResume}>
                <FileText size={16} />
                New Resume
              </Button>
              <Button variant="secondary" size="sm" onClick={handleSaveManually}>
                <Save size={16} />
                Save
              </Button>
              <Button size="sm" onClick={handleExportPdf}>
                <Download size={16} />
                Export PDF
              </Button>
            </>
          }
        />

        {error && (
          <Card padding="md" className="mb-6 border-error/30 bg-error/10">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
              <p className="flex-1 text-sm text-error">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-error/60 hover:text-error">
                <X size={16} />
              </button>
            </div>
          </Card>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[380px_1fr]">
        <aside className="space-y-6 print:hidden">
          <Card padding="md">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-outline">Template</h3>
            <ResumeTemplatePicker selected={template} onSelect={setTemplateAndSave} />
          </Card>

          <Card padding="md">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-outline">Sections</h3>
              <div className="relative">
                <Button variant="ghost" size="sm" onClick={() => setShowAddMenu(!showAddMenu)}>
                  <Plus size={14} /> Add Section
                </Button>
                <AnimatePresence>
                  {showAddMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-outline-variant/15 bg-surface-container-low p-1 shadow-xl"
                    >
                      {SECTION_TYPES.map((st) => {
                        const exists = sections.some((s) => s.type === st.type && st.type !== "custom");
                        return (
                          <button
                            key={st.type}
                            type="button"
                            disabled={exists && st.type !== "custom"}
                            onClick={() => handleAddSection(st.type)}
                            className="flex w-full items-center rounded-lg px-3 py-2 text-left text-sm font-medium text-on-surface hover:bg-surface-container-high disabled:cursor-not-allowed disabled:opacity-30"
                          >
                            {st.label}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <div className="space-y-3">
              {sections.map((section, index) => (
                <ResumeSection
                  key={section.id}
                  section={section}
                  index={index}
                  total={sections.length}
                  onChange={handleSectionChange}
                  onEntryChange={handleEntryChange}
                  onAddEntry={handleAddEntry}
                  onRemoveEntry={handleRemoveEntry}
                  onMoveUp={(i) => handleMoveSection(i, "up")}
                  onMoveDown={(i) => handleMoveSection(i, "down")}
                  onRemove={handleRemoveSection}
                />
              ))}
            </div>
          </Card>
        </aside>

        <div className="min-h-0">
          <div className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-outline print:hidden">
            <Eye size={14} /> Preview
          </div>
          <div className="overflow-hidden rounded-xl shadow-sm" id="resume-preview">
            <div style={{ minHeight: "600px" }}>
              <ResumePreview sections={sections} template={template} />
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
