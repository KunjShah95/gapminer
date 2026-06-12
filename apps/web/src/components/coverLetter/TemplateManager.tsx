import { useState } from "react";
import { Plus, FileText, Edit3, Trash2, Save, X, Loader2, Check } from "lucide-react";
import { Button, Card, Input, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Template {
  id: string;
  name: string;
  content: string;
  tone: string;
  targetRole?: string;
  createdAt: string;
}

interface TemplateManagerProps {
  templates: Template[];
  selectedId?: string;
  onSelect: (template: Template) => void;
  onCreate: (data: { name: string; content: string; tone?: string; targetRole?: string }) => Promise<void>;
  onUpdate: (id: string, data: { name?: string; content?: string; tone?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loading?: boolean;
}

export default function TemplateManager({
  templates,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
  loading = false,
}: TemplateManagerProps) {
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newContent, setNewContent] = useState("");
  const [newTone, setNewTone] = useState("professional");
  const [newRole, setNewRole] = useState("");
  const [editName, setEditName] = useState("");
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!newName.trim() || !newContent.trim()) return;
    setSaving(true);
    try {
      await onCreate({ name: newName, content: newContent, tone: newTone, targetRole: newRole || undefined });
      setNewName("");
      setNewContent("");
      setNewTone("professional");
      setNewRole("");
      setShowNewForm(false);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim() || !editContent.trim()) return;
    setSaving(true);
    try {
      await onUpdate(id, { name: editName, content: editContent });
      setEditingId(null);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (template: Template) => {
    setEditingId(template.id);
    setEditName(template.name);
    setEditContent(template.content);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-12 text-on-surface-variant">
        <Loader2 className="h-5 w-5 animate-spin text-primary" />
        Loading templates...
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-outline">
          Templates ({templates.length})
        </h3>
        <Button variant="ghost" size="sm" onClick={() => setShowNewForm(true)}>
          <Plus size={14} />
          New
        </Button>
      </div>

      {/* New template form */}
      {showNewForm && (
        <Card padding="md" className="border-primary/20 bg-primary/5">
          <div className="space-y-3">
            <Input
              label="Template Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Standard SWE Cover Letter"
            />
            <Textarea
              label="Content (use {{placeholders}} for personalization)"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              placeholder="Dear {{Hiring Manager}},..."
              rows={6}
            />
            <div className="flex gap-3">
              <div className="flex-1">
                <select
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value)}
                  className="w-full rounded-xl border border-outline-variant/20 bg-surface-container-low px-3 py-2.5 text-sm"
                >
                  <option value="professional">Professional</option>
                  <option value="enthusiastic">Enthusiastic</option>
                  <option value="casual">Casual</option>
                </select>
              </div>
              <Input
                label="Target Role (optional)"
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                placeholder="e.g., Software Engineer"
              />
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleCreate} disabled={saving || !newName.trim() || !newContent.trim()}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} />}
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowNewForm(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Template list */}
      {templates.length === 0 ? (
        <div className="py-6 text-center text-sm text-on-surface-variant">
          <FileText className="mx-auto mb-2 h-6 w-6 opacity-40" />
          <p>No templates yet. Create one to auto-tailor cover letters.</p>
        </div>
      ) : (
        templates.map((template) => (
          <div
            key={template.id}
            className={cn(
              "cursor-pointer overflow-hidden rounded-xl border transition-all",
              selectedId === template.id
                ? "border-primary/40 bg-primary/5"
                : "border-outline-variant/15 hover:border-outline-variant/30",
            )}
          >
            {editingId === template.id ? (
              <div className="space-y-3 p-4" onClick={(e) => e.stopPropagation()}>
                <Input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  placeholder="Template name"
                />
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={6}
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleUpdate(template.id)} disabled={saving}>
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save size={14} />}
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-3 p-4" onClick={() => onSelect(template)}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <FileText size={14} className="text-primary shrink-0" />
                    <span className="truncate font-bold text-on-surface">{template.name}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-3 text-[10px] text-on-surface-variant">
                    <span className="capitalize">{template.tone}</span>
                    {template.targetRole && <span>· {template.targetRole}</span>}
                    <span>· {new Date(template.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" onClick={() => startEdit(template)}>
                    <Edit3 size={12} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-error hover:text-error"
                    onClick={() => onDelete(template.id)}
                  >
                    <Trash2 size={12} />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}
