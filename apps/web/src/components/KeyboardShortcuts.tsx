import { useEffect } from "react";

interface ShortcutEntry {
  keys: string;
  action: string;
}

const SHORTCUTS: ShortcutEntry[] = [
  { keys: "g then d", action: "Dashboard" },
  { keys: "g then a", action: "Analyzer" },
  { keys: "g then r", action: "Roadmap" },
  { keys: "g then j", action: "Job Tracker" },
  { keys: "g then c", action: "Chat" },
  { keys: "/", action: "Search" },
  { keys: "?", action: "Show this help" },
];

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function KeyboardShortcuts({ open, onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-outline-variant/15 bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-1 text-xl font-black text-on-surface">
          Keyboard Shortcuts
        </h2>
        <p className="mb-6 text-sm text-on-surface-variant">
          Navigate faster with your keyboard
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-outline-variant/10 text-left text-[10px] font-bold uppercase tracking-widest text-outline">
              <th className="pb-2">Shortcut</th>
              <th className="pb-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {SHORTCUTS.map((s) => (
              <tr
                key={s.keys}
                className="border-b border-outline-variant/5 last:border-0"
              >
                <td className="py-2.5">
                  <kbd className="rounded-lg border border-outline-variant/20 bg-surface-container-high px-2.5 py-1 font-mono text-xs font-bold text-primary">
                    {s.keys}
                  </kbd>
                </td>
                <td className="py-2.5 text-on-surface-variant">
                  {s.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-4 text-[10px] text-outline">
          Press{" "}
          <kbd className="rounded border border-outline-variant/20 px-1.5 py-0.5 font-mono text-[10px]">
            Escape
          </kbd>{" "}
          to close
        </p>
      </div>
    </div>
  );
}
