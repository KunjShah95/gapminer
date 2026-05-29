import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  GitCompare,
  RotateCcw,
  Plus,
  X,
  Save,
  AlertCircle,
  Minus,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  EmptyState,
  Input,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

export default function ResumeVersionsPage() {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
  const [diffResult, setDiffResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showNewVersion, setShowNewVersion] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [changeSummary, setChangeSummary] = useState("");
  const resumeId = "demo-resume-id";

  useEffect(() => {
    fetchVersions();
  }, []);

  const fetchVersions = async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/resume-versions/${resumeId}/versions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => []);
        setVersions(data);
      }
    } catch (err) {
      console.error("Failed to fetch versions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompare = async (versionId1: string, versionId2: string) => {
    const token = getAuthToken();
    if (!token) return;

    const v1 = versions.find((v) => v.id === versionId1);
    const v2 = versions.find((v) => v.id === versionId2);
    if (!v1 || !v2) return;

    try {
      const res = await fetch("/api/v1/resume-versions/diff", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content1: v1.content, content2: v2.content }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setDiffResult(data);
      }
    } catch (err) {
      setError("Failed to compare versions");
    }
  };

  const handleCreateVersion = async () => {
    const token = getAuthToken();
    if (!token || !newContent.trim()) return;

    try {
      const res = await fetch(`/api/v1/resume-versions/${resumeId}/version`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newContent, changeSummary }),
      });
      if (res.ok) {
        setShowNewVersion(false);
        setNewContent("");
        setChangeSummary("");
        fetchVersions();
      }
    } catch (err) {
      setError("Failed to create version");
    }
  };

  const handleRestore = async (versionId: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/resume-versions/${resumeId}/restore`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ versionId }),
      });
      if (res.ok) {
        fetchVersions();
      }
    } catch (err) {
      setError("Failed to restore version");
    }
  };

  return (
    <PageShell maxWidth="lg">
      <PageHeader
        title="Resume Version Control"
        description="Track changes, compare versions, and restore previous iterations"
        icon={<Clock size={22} />}
        actions={
          <Button onClick={() => setShowNewVersion(true)}>
            <Plus size={18} />
            New Version
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="flex-1 text-sm text-error">{error}</p>
            <button
              type="button"
              onClick={() => setError(null)}
              className="text-error/60 hover:text-error"
            >
              <X size={16} />
            </button>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-3 lg:col-span-1">
          <h2 className="mb-3 font-bold text-on-surface">Version history</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-on-surface-variant">
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
              Loading...
            </div>
          ) : versions.length === 0 ? (
            <EmptyState
              icon={<Clock size={28} />}
              title="No versions yet"
              description="Create your first version to start tracking changes"
              action="New version"
              onAction={() => setShowNewVersion(true)}
            />
          ) : (
            versions.map((version, i) => (
              <button
                key={version.id}
                type="button"
                onClick={() =>
                  setSelectedVersion(
                    version.id === selectedVersion ? null : version.id,
                  )
                }
                className={cn(
                  "w-full rounded-xl border p-4 text-left transition-all",
                  selectedVersion === version.id
                    ? "border-primary/40 bg-primary/10"
                    : "glass-card hover:border-primary/25",
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
                      {versions.length - i}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">
                        {version.change_summary || `Version ${versions.length - i}`}
                      </p>
                      <p className="text-xs text-on-surface-variant">
                        {new Date(version.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  {selectedVersion === version.id && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRestore(version.id);
                      }}
                      className="rounded-lg p-1.5 text-primary hover:bg-primary/15"
                      title="Restore this version"
                    >
                      <RotateCcw size={14} />
                    </button>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="lg:col-span-2">
          {selectedVersion && (
            <Card>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-bold text-on-surface">Version content</h2>
                {versions.length >= 2 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const idx = versions.findIndex((v) => v.id === selectedVersion);
                      if (idx < versions.length - 1) {
                        handleCompare(selectedVersion, versions[idx + 1].id);
                      }
                    }}
                  >
                    <GitCompare size={16} />
                    Compare with previous
                  </Button>
                )}
              </div>
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap rounded-xl border border-outline-variant/15 bg-surface-container-high p-4 font-mono text-sm text-on-surface-variant">
                {versions.find((v) => v.id === selectedVersion)?.content}
              </pre>
            </Card>
          )}

          {diffResult && (
            <Card className="mt-6">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-on-surface">
                <GitCompare size={18} className="text-primary" />
                Version comparison
              </h2>
              <div className="mb-4 grid grid-cols-3 gap-4">
                <StatCard label="Lines added" value={diffResult.addedLines} />
                <StatCard label="Lines removed" value={diffResult.removedLines} />
                <StatCard label="Similarity" value={`${diffResult.similarity}%`} />
              </div>
              <div className="max-h-64 space-y-2 overflow-y-auto">
                {diffResult.changes.slice(0, 20).map((change: any, i: number) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-start gap-2 rounded-lg p-2 font-mono text-sm",
                      change.type === "added"
                        ? "border border-emerald-500/20 bg-emerald-500/10 text-emerald-300"
                        : "border border-error/20 bg-error/10 text-red-300",
                    )}
                  >
                    {change.type === "added" ? (
                      <Plus size={14} className="mt-0.5 shrink-0" />
                    ) : (
                      <Minus size={14} className="mt-0.5 shrink-0" />
                    )}
                    {change.content}
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showNewVersion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowNewVersion(false)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="glass-card w-full max-w-2xl p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-on-surface">Create new version</h2>
                <button
                  type="button"
                  onClick={() => setShowNewVersion(false)}
                  className="rounded-lg p-1 text-outline hover:bg-surface-container-high"
                >
                  <X size={20} />
                </button>
              </div>
              <Textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Paste your resume content..."
                rows={10}
                className="mb-4"
              />
              <Input
                type="text"
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                placeholder="What changed in this version? (optional)"
                className="mb-4"
              />
              <Button
                onClick={handleCreateVersion}
                disabled={!newContent.trim()}
                className="w-full"
              >
                <Save size={16} />
                Save version
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
