import { cn } from "@/lib/utils";
import type { ResumeSectionData } from "./ResumeSection";
import type { TemplateId } from "./ResumeTemplatePicker";

interface ResumePreviewProps {
  sections: ResumeSectionData[];
  template: TemplateId;
}

function templateClasses(template: TemplateId) {
  switch (template) {
    case "modern":
      return {
        container: "font-sans",
        header: "bg-primary text-white",
        headerName: "text-2xl font-bold tracking-tight",
        headerTitle: "text-sm opacity-90",
        divider: "border-primary/30",
        sectionTitle: "text-xs font-bold uppercase tracking-widest text-primary",
        accentBg: "bg-primary/5",
        accentBorder: "border-l-2 border-primary",
      };
    case "classic":
      return {
        container: "font-serif",
        header: "bg-amber-900 text-amber-50",
        headerName: "text-2xl font-bold",
        headerTitle: "text-sm italic opacity-80",
        divider: "border-amber-700/30",
        sectionTitle: "text-xs font-bold uppercase tracking-wider text-amber-900",
        accentBg: "bg-amber-50/50",
        accentBorder: "border-l-2 border-amber-700",
      };
    case "minimal":
      return {
        container: "font-sans",
        header: "bg-white border-b-2 border-gray-900",
        headerName: "text-2xl font-light tracking-wide text-gray-900",
        headerTitle: "text-xs text-gray-500",
        divider: "border-gray-200",
        sectionTitle: "text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400",
        accentBg: "bg-gray-50",
        accentBorder: "",
      };
    case "creative":
      return {
        container: "font-sans",
        header: "bg-gradient-to-r from-fuchsia-600 to-violet-600 text-white",
        headerName: "text-2xl font-black tracking-tight",
        headerTitle: "text-sm font-medium opacity-90",
        divider: "border-fuchsia-300/30",
        sectionTitle: "text-xs font-black uppercase tracking-widest text-fuchsia-600",
        accentBg: "bg-gradient-to-r from-fuchsia-50 to-violet-50",
        accentBorder: "border-l-2 border-fuchsia-500",
      };
  }
}

function ResumeEntry({
  entry,
  type,
  tc,
  index,
}: {
  entry: Record<string, string>;
  type: string;
  tc: ReturnType<typeof templateClasses>;
  index: number;
}) {
  if (type === "summary") {
    return <p className="text-xs leading-relaxed text-gray-700">{entry.text}</p>;
  }

  if (type === "experience") {
    return (
      <div className={cn(index > 0 && "mt-3", "pb-3", index > 0 && "border-t border-gray-100 pt-3")}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">{entry.role}</p>
            <p className="text-xs text-gray-600">{entry.company}</p>
          </div>
          <p className="shrink-0 text-[10px] text-gray-400">
            {entry.startDate}{entry.startDate && entry.endDate && " – "}{entry.endDate}
          </p>
        </div>
        {entry.bullets && (
          <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-[11px] text-gray-600">
            {entry.bullets.split("\n").filter(Boolean).map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  if (type === "education") {
    return (
      <div className={cn(index > 0 && "mt-2")}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-bold text-gray-900">{entry.school}</p>
            <p className="text-xs text-gray-600">
              {entry.degree}{entry.degree && entry.field && " in "}{entry.field}
              {entry.gpa ? ` — GPA: ${entry.gpa}` : ""}
            </p>
          </div>
          <p className="shrink-0 text-[10px] text-gray-400">
            {entry.startDate}{entry.startDate && entry.endDate && " – "}{entry.endDate}
          </p>
        </div>
      </div>
    );
  }

  if (type === "skills") {
    return (
      <div className="flex flex-wrap gap-1.5">
        {(entry.tags ?? "").split(",").filter(Boolean).map((tag, i) => (
          <span key={i} className={cn("rounded-full px-2.5 py-0.5 text-[10px] font-medium", tc.accentBg, "text-gray-700")}>
            {tag.trim()}
          </span>
        ))}
      </div>
    );
  }

  if (type === "projects") {
    return (
      <div className={cn(index > 0 && "mt-3", "pb-3", index > 0 && "border-t border-gray-100 pt-3")}>
        <div className="flex items-start justify-between">
          <p className="text-sm font-bold text-gray-900">{entry.name}</p>
          {entry.link && <a href={entry.link} target="_blank" rel="noreferrer" className="text-[10px] text-blue-600 underline">Link</a>}
        </div>
        <p className="mt-0.5 text-[11px] leading-relaxed text-gray-600">{entry.description}</p>
        {entry.tech && <p className="mt-0.5 text-[10px] text-gray-400">Tech: {entry.tech}</p>}
      </div>
    );
  }

  if (type === "certifications") {
    return (
      <div className={cn(index > 0 && "mt-2")}>
        <p className="text-sm font-bold text-gray-900">{entry.name}</p>
        <p className="text-xs text-gray-600">
          {entry.issuer}{entry.issuer && entry.date ? " • " : ""}{entry.date}
        </p>
      </div>
    );
  }

  return <p className="text-xs text-gray-700">{entry.value}</p>;
}

export default function ResumePreview({ sections, template }: ResumePreviewProps) {
  const tc = templateClasses(template);
  const hasData = sections.some((s) =>
    s.entries.some((e) => Object.values(e).some((v) => v && v.trim())),
  );

  if (!hasData) {
    return (
      <div className="flex aspect-[210/297] flex-col items-center justify-center rounded-xl border-2 border-dashed border-outline-variant/20 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-bold text-gray-400">Your resume preview</p>
        <p className="mt-1 text-xs text-gray-300">Add content to see a live preview</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "w-full overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-gray-200",
        tc.container,
      )}
    >
      <div className={cn("px-6 py-5", tc.header)}>
        <h1 className={tc.headerName}>Your Name</h1>
        <p className={tc.headerTitle}>Professional Title</p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] opacity-80">
          <span>email@example.com</span>
          <span>(555) 123-4567</span>
          <span>linkedin.com/in/you</span>
          <span>Portfolio</span>
        </div>
      </div>

      <div className="p-6">
        {sections
          .filter((s) => s.entries.some((e) => Object.values(e).some((v) => v && v.trim())))
          .map((section) => (
            <div key={section.id} className={cn("mb-5 last:mb-0")}>
              <div className={cn("mb-2 flex items-center gap-3")}>
                <h2 className={tc.sectionTitle}>{section.title}</h2>
                <hr className={cn("flex-1", tc.divider)} />
              </div>
              {section.type === "summary" ? (
                <ResumeEntry entry={section.entries[0]} type={section.type} tc={tc} index={0} />
              ) : (
                section.entries
                  .filter((e) => Object.values(e).some((v) => v && v.trim()))
                  .map((entry, i) => (
                    <ResumeEntry key={i} entry={entry} type={section.type} tc={tc} index={i} />
                  ))
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
