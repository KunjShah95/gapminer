import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, GripVertical, Plus, Trash2, MoveUp, MoveDown } from "lucide-react";
import { Input, Textarea, Button } from "@/components/ui";

export interface ResumeSectionData {
  id: string;
  type: "summary" | "experience" | "education" | "skills" | "projects" | "certifications" | "custom";
  title: string;
  entries: Record<string, string>[];
}

interface Props {
  section: ResumeSectionData;
  index: number;
  total: number;
  onChange: (id: string, data: Partial<ResumeSectionData>) => void;
  onEntryChange: (sectionId: string, entryIndex: number, field: string, value: string) => void;
  onAddEntry: (sectionId: string) => void;
  onRemoveEntry: (sectionId: string, entryIndex: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onRemove: (id: string) => void;
}

function EntryCard({
  children,
  label,
  onRemove,
  showRemove,
}: {
  children: React.ReactNode;
  label: string;
  onRemove: () => void;
  showRemove: boolean;
}) {
  return (
    <div className="rounded-lg border border-outline-variant/15 bg-surface-container-low p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wider text-outline">{label}</span>
        {showRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="rounded p-0.5 text-error/60 hover:bg-error/10 hover:text-error"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function SectionRenderer({ section, onEntryChange, onAddEntry, onRemoveEntry }: {
  section: ResumeSectionData;
  onEntryChange: (sectionId: string, entryIndex: number, field: string, value: string) => void;
  onAddEntry: (sectionId: string) => void;
  onRemoveEntry: (sectionId: string, entryIndex: number) => void;
}) {
  const set = (i: number, f: string, v: string) => onEntryChange(section.id, i, f, v);

  if (section.type === "summary") {
    return (
      <Textarea
        value={section.entries[0]?.text ?? ""}
        onChange={(e) => set(0, "text", e.target.value)}
        placeholder="Write a brief professional summary..."
        rows={4}
      />
    );
  }

  if (section.type === "skills") {
    return (
      <Input
        value={section.entries[0]?.tags ?? ""}
        onChange={(e) => set(0, "tags", e.target.value)}
        placeholder="e.g., JavaScript, React, Node.js, TypeScript"
        hint="Separate skills with commas"
      />
    );
  }

  if (section.type === "experience") {
    return (
      <div className="space-y-3">
        {section.entries.map((entry, i) => (
          <EntryCard key={i} label={`Position ${i + 1}`} onRemove={() => onRemoveEntry(section.id, i)} showRemove={section.entries.length > 1}>
            <Input value={entry.company ?? ""} onChange={(e) => set(i, "company", e.target.value)} placeholder="Company" />
            <Input value={entry.role ?? ""} onChange={(e) => set(i, "role", e.target.value)} placeholder="Job Title" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={entry.startDate ?? ""} onChange={(e) => set(i, "startDate", e.target.value)} placeholder="Start Date" />
              <Input value={entry.endDate ?? ""} onChange={(e) => set(i, "endDate", e.target.value)} placeholder="End Date" />
            </div>
            <Textarea value={entry.bullets ?? ""} onChange={(e) => set(i, "bullets", e.target.value)} placeholder="Bullet points (one per line)" rows={3} />
          </EntryCard>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onAddEntry(section.id)} className="w-full">
          <Plus size={14} /> Add Position
        </Button>
      </div>
    );
  }

  if (section.type === "education") {
    return (
      <div className="space-y-3">
        {section.entries.map((entry, i) => (
          <EntryCard key={i} label={`Education ${i + 1}`} onRemove={() => onRemoveEntry(section.id, i)} showRemove={section.entries.length > 1}>
            <Input value={entry.school ?? ""} onChange={(e) => set(i, "school", e.target.value)} placeholder="School / University" />
            <Input value={entry.degree ?? ""} onChange={(e) => set(i, "degree", e.target.value)} placeholder="Degree" />
            <div className="grid grid-cols-2 gap-2">
              <Input value={entry.field ?? ""} onChange={(e) => set(i, "field", e.target.value)} placeholder="Field of Study" />
              <Input value={entry.gpa ?? ""} onChange={(e) => set(i, "gpa", e.target.value)} placeholder="GPA (optional)" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Input value={entry.startDate ?? ""} onChange={(e) => set(i, "startDate", e.target.value)} placeholder="Start Date" />
              <Input value={entry.endDate ?? ""} onChange={(e) => set(i, "endDate", e.target.value)} placeholder="End Date" />
            </div>
          </EntryCard>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onAddEntry(section.id)} className="w-full">
          <Plus size={14} /> Add Education
        </Button>
      </div>
    );
  }

  if (section.type === "projects") {
    return (
      <div className="space-y-3">
        {section.entries.map((entry, i) => (
          <EntryCard key={i} label={`Project ${i + 1}`} onRemove={() => onRemoveEntry(section.id, i)} showRemove={section.entries.length > 1}>
            <Input value={entry.name ?? ""} onChange={(e) => set(i, "name", e.target.value)} placeholder="Project Name" />
            <Textarea value={entry.description ?? ""} onChange={(e) => set(i, "description", e.target.value)} placeholder="Description" rows={2} />
            <Input value={entry.tech ?? ""} onChange={(e) => set(i, "tech", e.target.value)} placeholder="Technologies used" hint="Comma separated" />
            <Input value={entry.link ?? ""} onChange={(e) => set(i, "link", e.target.value)} placeholder="Link (optional)" />
          </EntryCard>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onAddEntry(section.id)} className="w-full">
          <Plus size={14} /> Add Project
        </Button>
      </div>
    );
  }

  if (section.type === "certifications") {
    return (
      <div className="space-y-3">
        {section.entries.map((entry, i) => (
          <EntryCard key={i} label={`Certification ${i + 1}`} onRemove={() => onRemoveEntry(section.id, i)} showRemove={section.entries.length > 1}>
            <Input value={entry.name ?? ""} onChange={(e) => set(i, "name", e.target.value)} placeholder="Certification Name" />
            <Input value={entry.issuer ?? ""} onChange={(e) => set(i, "issuer", e.target.value)} placeholder="Issuing Organization" />
            <Input value={entry.date ?? ""} onChange={(e) => set(i, "date", e.target.value)} placeholder="Date Obtained" />
          </EntryCard>
        ))}
        <Button variant="ghost" size="sm" onClick={() => onAddEntry(section.id)} className="w-full">
          <Plus size={14} /> Add Certification
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {section.entries.map((entry, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={entry.value ?? ""}
            onChange={(e) => set(i, "value", e.target.value)}
            placeholder="Content..."
          />
          {section.entries.length > 1 && (
            <button type="button" onClick={() => onRemoveEntry(section.id, i)} className="shrink-0 rounded p-1.5 text-error/60 hover:bg-error/10 hover:text-error">
              <Trash2 size={14} />
            </button>
          )}
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => onAddEntry(section.id)} className="w-full">
        <Plus size={14} /> Add Entry
      </Button>
    </div>
  );
}

export default function ResumeSection({
  section,
  index,
  total,
  onChange,
  onEntryChange,
  onAddEntry,
  onRemoveEntry,
  onMoveUp,
  onMoveDown,
  onRemove,
}: Props) {
  const [collapsed, setCollapsed] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const [editingTitle, setEditingTitle] = useState(false);
  const [localTitle, setLocalTitle] = useState(section.title);

  useEffect(() => {
    setLocalTitle(section.title);
  }, [section.title]);

  const commitTitle = () => {
    setEditingTitle(false);
    if (localTitle.trim() && localTitle !== section.title) {
      onChange(section.id, { title: localTitle.trim() });
    } else {
      setLocalTitle(section.title);
    }
  };

  const typeLabel: Record<string, string> = {
    summary: "Summary",
    experience: "Work Experience",
    education: "Education",
    skills: "Skills",
    projects: "Projects",
    certifications: "Certifications",
    custom: "Custom",
  };

  return (
    <div className="rounded-xl border border-outline-variant/15 bg-surface-container-low transition-all">
      <div className="flex items-center gap-2 px-4 py-3">
        <GripVertical size={16} className="shrink-0 text-outline/40" />
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex flex-1 items-center gap-2 text-left"
        >
          {editingTitle ? (
            <input
              ref={titleRef}
              value={localTitle}
              onChange={(e) => setLocalTitle(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => { if (e.key === "Enter") commitTitle(); if (e.key === "Escape") { setLocalTitle(section.title); setEditingTitle(false); } }}
              className="bg-transparent text-sm font-bold text-on-surface outline-none border-b border-primary/40"
              autoFocus
            />
          ) : (
            <span
              className="text-sm font-bold text-on-surface cursor-pointer hover:text-primary"
              onClick={() => { setEditingTitle(true); setTimeout(() => titleRef.current?.focus(), 0); }}
            >
              {section.title}
            </span>
          )}
          <span className="rounded bg-surface-container-high px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-outline">
            {typeLabel[section.type] ?? section.type}
          </span>
        </button>

        <div className="flex items-center gap-0.5">
          <button type="button" onClick={() => onMoveUp(index)} disabled={index === 0} className="rounded p-1 text-outline/60 hover:bg-surface-container-high hover:text-on-surface disabled:opacity-30">
            <MoveUp size={14} />
          </button>
          <button type="button" onClick={() => onMoveDown(index)} disabled={index === total - 1} className="rounded p-1 text-outline/60 hover:bg-surface-container-high hover:text-on-surface disabled:opacity-30">
            <MoveDown size={14} />
          </button>
          <button type="button" onClick={() => onRemove(section.id)} className="rounded p-1 text-error/60 hover:bg-error/10 hover:text-error">
            <Trash2 size={14} />
          </button>
          <button type="button" onClick={() => setCollapsed(!collapsed)} className="rounded p-1 text-outline/60 hover:bg-surface-container-high">
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className="border-t border-outline-variant/10 px-4 py-3">
          <SectionRenderer
            section={section}
            onEntryChange={onEntryChange}
            onAddEntry={onAddEntry}
            onRemoveEntry={onRemoveEntry}
          />
        </div>
      )}
    </div>
  );
}
