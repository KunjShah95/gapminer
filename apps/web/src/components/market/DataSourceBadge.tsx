const SOURCE_LABELS: Record<string, { label: string; className: string }> = {
  catalog: {
    label: "Verified catalog",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  database: {
    label: "Skill taxonomy",
    className: "bg-blue-100 text-blue-800 border-blue-200",
  },
  transformer: {
    label: "AI embedding signal",
    className: "bg-violet-100 text-violet-800 border-violet-200",
  },
  estimated: {
    label: "Estimated",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
};

export default function DataSourceBadge({
  source,
}: {
  source?: string;
}) {
  const key = source || "estimated";
  const meta = SOURCE_LABELS[key] ?? SOURCE_LABELS.estimated;
  return (
    <span
      className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${meta.className}`}
      title={`Data source: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
}
