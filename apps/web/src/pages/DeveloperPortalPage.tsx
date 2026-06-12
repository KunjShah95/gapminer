import { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/authFetch";
import {
  Key,
  Copy,
  Check,
  Plus,
  Trash2,
  AlertCircle,
  BarChart3,
  Shield,
  ExternalLink,
  Loader2,
  X,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  Input,
  StatCard,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface ApiKey {
  id: string;
  name: string;
  masked_key: string;
  permissions: string;
  created_at: string;
  last_used_at: string | null;
}

interface UsageStats {
  activeKeys: number;
  totalRequests: number;
  activeDays: number;
  last30Days: number;
}

export default function DeveloperPortalPage() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const token = getAuthToken();
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const [keysRes, usageRes] = await Promise.all([
        fetch("/api/v1/developer/keys", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/v1/developer/usage", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      if (keysRes.ok) {
        const data = await keysRes.json();
        setKeys(data.keys || []);
      }
      if (usageRes.ok) {
        const data = await usageRes.json();
        setUsage(data);
      }
    } catch {
      setError("Failed to load developer data");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateKey = async () => {
    const token = getAuthToken();
    if (!token || !newKeyName.trim()) return;

    setError(null);
    try {
      const res = await fetch("/api/v1/developer/keys", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create key");
      }

      const data = await res.json();
      setCreatedKey(data.key);
      setNewKeyName("");
      setShowCreateForm(false);
      fetchData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleRevokeKey = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    if (!confirm("Revoke this API key? This cannot be undone.")) return;

    try {
      const res = await fetch(`/api/v1/developer/keys/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setKeys((prev) => prev.filter((k) => k.id !== id));
      }
    } catch {
      setError("Failed to revoke key");
    }
  };

  const handleCopyKey = async () => {
    if (createdKey) {
      await navigator.clipboard.writeText(createdKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <PageShell maxWidth="lg">
      <PageHeader
        icon={<Key size={22} />}
        title="Developer Portal"
        description="Manage API keys, track usage, and integrate GapMiner into your tools"
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-error" />
            <p className="flex-1 text-sm text-error">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)}>
              <X size={16} />
            </Button>
          </div>
        </Card>
      )}

      {/* Usage stats — show '-' while loading or before data arrives */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Keys"
          value={loading ? "-" : (usage?.activeKeys ?? 0)}
          icon={<Key size={18} />}
        />
        <StatCard
          label="Requests (30d)"
          value={loading ? "-" : (usage?.last30Days ?? 0)}
          icon={<BarChart3 size={18} />}
        />
        <StatCard
          label="Total Requests"
          value={loading ? "-" : (usage?.totalRequests ?? 0)}
          icon={<BarChart3 size={18} />}
        />
        <StatCard
          label="Active Days"
          value={loading ? "-" : (usage?.activeDays ?? 0)}
          icon={<Shield size={18} />}
        />
      </div>

      {/* API Keys */}
      <Card padding="lg" className="mb-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-on-surface">API Keys</h2>
            <p className="text-sm text-on-surface-variant">
              Keys are prefixed with <code className="rounded bg-surface-container-low px-1.5 py-0.5 font-mono text-xs">gpm_</code> — store them securely
            </p>
          </div>
          <Button
            onClick={() => {
              setShowCreateForm(true);
              setCreatedKey(null);
            }}
          >
            <Plus size={16} />
            Create Key
          </Button>
        </div>

        {/* Create form */}
        {showCreateForm && (
          <div className="mb-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
            {createdKey ? (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Shield size={18} className="text-primary" />
                  <span className="font-bold text-on-surface">Key Created</span>
                </div>
                <div className="mb-2 rounded-xl border border-outline-variant/15 bg-surface-container-high p-3 font-mono text-sm break-all">
                  {createdKey}
                </div>
                <p className="mb-3 text-xs text-error">
                  ⚠️ This key will not be shown again. Copy it now.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleCopyKey}>
                    {copied ? <Check size={14} /> : <Copy size={14} />}
                    {copied ? "Copied!" : "Copy Key"}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setCreatedKey(null);
                      setShowCreateForm(false);
                    }}
                  >
                    Done
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Key Name"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., CI Pipeline, VS Code Extension"
                    onKeyDown={(e) => e.key === "Enter" && handleCreateKey()}
                  />
                </div>
                <Button
                  onClick={handleCreateKey}
                  disabled={!newKeyName.trim()}
                >
                  Generate
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Key list */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-8 text-on-surface-variant">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Loading...
          </div>
        ) : keys.length === 0 ? (
          <div className="py-8 text-center text-sm text-on-surface-variant">
            <Key className="mx-auto mb-3 h-8 w-8 opacity-40" />
            <p>No API keys yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="flex items-center justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-on-surface">{key.name}</span>
                    <Badge tone="default" className="text-[9px]">
                      {key.permissions}
                    </Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-xs text-on-surface-variant">
                    <code className="rounded bg-surface-container px-1.5 py-0.5 font-mono">
                      {key.masked_key}
                    </code>
                    <span>
                      Created{" "}
                      {new Date(key.created_at).toLocaleDateString()}
                    </span>
                    {key.last_used_at && (
                      <span>
                        Last used{" "}
                        {new Date(key.last_used_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeKey(key.id)}
                  className="text-error hover:text-error"
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* API Documentation */}
      <Card padding="lg">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-bold text-on-surface">
          <ExternalLink size={18} className="text-primary" />
          API Documentation
        </h2>
        <div className="space-y-4 text-sm text-on-surface-variant">
          <div>
            <h3 className="mb-1 font-bold text-on-surface">Skill Data</h3>
            <p className="mb-2">Get demand scores and trend data for any tech skill.</p>
            <code className="block rounded-xl bg-surface-container-low p-3 font-mono text-xs">
              GET https://api.gapminer.com/api/v1/public/skills/React
            </code>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-on-surface">Embeddable Badges</h3>
            <p className="mb-2">
              Display skill badges on your personal website or GitHub README.
            </p>
            <code className="block rounded-xl bg-surface-container-low p-3 font-mono text-xs">
              {`<img src="https://api.gapminer.com/api/v1/public/badge/skill/React.svg?style=flat" />`}
            </code>
          </div>
          <div>
            <h3 className="mb-1 font-bold text-on-surface">Swagger Docs</h3>
            <p className="mb-2">
              Full API reference with interactive playground.
            </p>
            <code className="block rounded-xl bg-surface-container-low p-3 font-mono text-xs">
              https://api.gapminer.com/api-docs
            </code>
          </div>
        </div>
        <div className="mt-6 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <p className="text-xs text-primary">
            💡 Tip: Use the{" "}
            <code className="rounded bg-primary/10 px-1 py-0.5 font-mono">
              X-API-Key
            </code>{" "}
            header to access private API endpoints programmatically.
          </p>
        </div>
      </Card>
    </PageShell>
  );
}
