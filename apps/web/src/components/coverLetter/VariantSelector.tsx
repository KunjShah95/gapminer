import { useState } from "react";
import {
  Copy,
  Check,
  Download,
  Send,
  BarChart3,
  RefreshCw,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Variant {
  id: string;
  variantName: string;
  content: string;
  tone: string;
  status: string;
  createdAt: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  loading?: boolean;
  onRegenerate?: () => void;
  onTrackOutcome?: (variantId: string, status: "sent" | "rejected" | "interview") => void;
}

function ToneBadge({ tone }: { tone: string }) {
  const map: Record<string, { label: string; tone: "primary" | "warning" | "success" }> = {
    professional: { label: "Professional", tone: "primary" },
    enthusiastic: { label: "Enthusiastic", tone: "warning" },
    "skill-focused": { label: "Skill-Focused", tone: "success" },
    casual: { label: "Casual", tone: "default" as any },
  };
  const meta = map[tone] || { label: tone, tone: "default" as any };
  return <Badge tone={meta.tone as any}>{meta.label}</Badge>;
}

export default function VariantSelector({
  variants,
  loading = false,
  onRegenerate,
  onTrackOutcome,
}: VariantSelectorProps) {
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [copied, setCopied] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);

  const currentVariant = variants[selectedIdx];

  const handleCopy = async () => {
    if (!currentVariant) return;
    await navigator.clipboard.writeText(currentVariant.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTrack = async (status: "sent" | "rejected" | "interview") => {
    if (!currentVariant || !onTrackOutcome) return;
    setTrackingStatus(status);
    await onTrackOutcome(currentVariant.id, status);
    setTimeout(() => setTrackingStatus(null), 2000);
  };

  if (loading) {
    return (
      <Card padding="lg" className="flex min-h-[300px] items-center justify-center">
        <div className="flex items-center gap-2 text-on-surface-variant">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Generating variants...
        </div>
      </Card>
    );
  }

  if (variants.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Variant tabs */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 rounded-xl border border-outline-variant/15 bg-surface-container-low p-1">
          {variants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setSelectedIdx(i)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition-all",
                i === selectedIdx
                  ? "bg-primary text-on-primary-fixed shadow-lg"
                  : "text-on-surface-variant hover:text-on-surface",
              )}
            >
              {v.variantName}
            </button>
          ))}
        </div>

        {variants.length > 1 && (
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <button
              type="button"
              onClick={() => setSelectedIdx(Math.max(0, selectedIdx - 1))}
              disabled={selectedIdx === 0}
              className="rounded p-1 hover:bg-surface-container-high disabled:opacity-30"
            >
              <ChevronLeft size={14} />
            </button>
            <span>
              {selectedIdx + 1} / {variants.length}
            </span>
            <button
              type="button"
              onClick={() => setSelectedIdx(Math.min(variants.length - 1, selectedIdx + 1))}
              disabled={selectedIdx === variants.length - 1}
              className="rounded p-1 hover:bg-surface-container-high disabled:opacity-30"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Variant content */}
      {currentVariant && (
        <Card padding="lg">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <ToneBadge tone={currentVariant.tone} />
              <span className="text-xs text-on-surface-variant">
                Created {new Date(currentVariant.createdAt).toLocaleDateString()}
              </span>
              <span
                className={cn(
                  "text-[10px] font-bold uppercase",
                  currentVariant.status === "interview"
                    ? "text-emerald-400"
                    : currentVariant.status === "rejected"
                      ? "text-error"
                      : currentVariant.status === "sent"
                        ? "text-primary"
                        : "text-outline",
                )}
              >
                {currentVariant.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-1">
              <Button variant="ghost" size="sm" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => {
                const blob = new Blob([currentVariant.content], { type: "text/plain" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `cover-letter-${currentVariant.variantName.toLowerCase()}.txt`;
                a.click();
                URL.revokeObjectURL(url);
              }}>
                <Download className="h-4 w-4" />
              </Button>
              {onRegenerate && (
                <Button variant="ghost" size="sm" onClick={onRegenerate}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>

          <div className="whitespace-pre-wrap rounded-xl border border-outline-variant/15 bg-surface-container-low p-6 font-serif text-sm leading-relaxed text-on-surface">
            {currentVariant.content}
          </div>

          {/* Outcome tracking */}
          {onTrackOutcome && (
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-outline-variant/10 pt-4">
              <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
                Track outcome:
              </span>
              {(["sent", "rejected", "interview"] as const).map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => handleTrack(status)}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-all",
                    trackingStatus === status
                      ? "border-primary bg-primary text-on-primary-fixed"
                      : "border-outline-variant/20 hover:border-primary/40 text-on-surface-variant",
                  )}
                >
                  {status === "sent" ? "Sent" : status === "rejected" ? "Rejected" : "Got Interview"}
                </button>
              ))}
              {trackingStatus && (
                <span className="text-[10px] text-primary font-bold">
                  ✓ Tracked
                </span>
              )}
            </div>
          )}

          {/* A/B Stats hint */}
          {variants.length > 1 && (
            <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 text-xs text-primary">
                <BarChart3 size={14} />
                <span>
                  <strong>A/B Testing:</strong> Track which variant performs best. Try different tones for different roles.
                </span>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
