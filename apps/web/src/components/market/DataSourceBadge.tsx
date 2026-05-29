import Badge from "@/components/ui/Badge";

type Tone = "default" | "primary" | "success" | "warning" | "error" | "info";

const SOURCE_LABELS: Record<string, { label: string; tone: Tone }> = {
  catalog: { label: "Verified catalog", tone: "success" },
  database: { label: "Skill taxonomy", tone: "info" },
  transformer: { label: "AI embedding signal", tone: "primary" },
  estimated: { label: "Estimated", tone: "warning" },
};

export default function DataSourceBadge({
  source,
}: {
  source?: string;
}) {
  const key = source || "estimated";
  const meta = SOURCE_LABELS[key] ?? SOURCE_LABELS.estimated;
  return (
    <Badge tone={meta.tone} className="rounded-md tracking-wide" title={`Data source: ${meta.label}`}>
      {meta.label}
    </Badge>
  );
}
