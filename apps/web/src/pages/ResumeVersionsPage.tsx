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
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-600" />
              Resume Version Control
            </h1>
            <p className="text-gray-600 mt-1">
              Track changes, compare versions, and restore previous iterations
            </p>
          </div>
          <button
            onClick={() => setShowNewVersion(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            New Version
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700">{error}</p>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-400"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-gray-900 mb-3">
              Version History
            </h2>
            {loading ? (
              <p className="text-gray-500">Loading...</p>
            ) : versions.length === 0 ? (
              <p className="text-gray-500 text-sm">
                No versions yet. Create your first version!
              </p>
            ) : (
              versions.map((version, i) => (
                <button
                  key={version.id}
                  onClick={() =>
                    setSelectedVersion(
                      version.id === selectedVersion ? null : version.id,
                    )
                  }
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedVersion === version.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 bg-white hover:border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                        {versions.length - i}
                      </div>
                      <div>
                        <p className="font-medium text-sm">
                          {version.change_summary ||
                            `Version ${versions.length - i}`}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(version.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    {selectedVersion === version.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRestore(version.id);
                        }}
                        className="p-1.5 text-blue-600 hover:bg-blue-100 rounded"
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
              <div className="bg-white rounded-xl border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-semibold">Version Content</h2>
                  {versions.length >= 2 && (
                    <button
                      onClick={() => {
                        const idx = versions.findIndex(
                          (v) => v.id === selectedVersion,
                        );
                        if (idx < versions.length - 1) {
                          handleCompare(selectedVersion, versions[idx + 1].id);
                        }
                      }}
                      className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                    >
                      <GitCompare size={16} />
                      Compare with previous
                    </button>
                  )}
                </div>
                <pre className="whitespace-pre-wrap text-sm text-gray-700 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  {versions.find((v) => v.id === selectedVersion)?.content}
                </pre>
              </div>
            )}

            {diffResult && (
              <div className="bg-white rounded-xl border border-gray-200 p-6 mt-6">
                <h2 className="font-semibold mb-4 flex items-center gap-2">
                  <GitCompare size={18} className="text-blue-600" />
                  Version Comparison
                </h2>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {diffResult.addedLines}
                    </p>
                    <p className="text-xs text-green-700">Lines Added</p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-red-600">
                      {diffResult.removedLines}
                    </p>
                    <p className="text-xs text-red-700">Lines Removed</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {diffResult.similarity}%
                    </p>
                    <p className="text-xs text-blue-700">Similarity</p>
                  </div>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {diffResult.changes
                    .slice(0, 20)
                    .map((change: any, i: number) => (
                      <div
                        key={i}
                        className={`flex items-start gap-2 p-2 rounded text-sm font-mono ${
                          change.type === "added"
                            ? "bg-green-50 text-green-800"
                            : "bg-red-50 text-red-800"
                        }`}
                      >
                        {change.type === "added" ? (
                          <Plus size={14} className="flex-shrink-0 mt-0.5" />
                        ) : (
                          <Minus size={14} className="flex-shrink-0 mt-0.5" />
                        )}
                        {change.content}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showNewVersion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => setShowNewVersion(false)}
            >
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-white rounded-xl p-6 w-full max-w-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Create New Version</h2>
                  <button
                    onClick={() => setShowNewVersion(false)}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Paste your resume content..."
                  rows={10}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 resize-y"
                />
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="What changed in this version? (optional)"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                />
                <button
                  onClick={handleCreateVersion}
                  disabled={!newContent.trim()}
                  className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  <Save size={16} />
                  Save Version
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
