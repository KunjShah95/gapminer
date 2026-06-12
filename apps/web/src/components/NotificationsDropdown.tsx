import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useNotificationStore } from "@/stores/notificationStore";
import {
  Bell,
  Check,
  CheckCheck,
  FileText,
  Cpu,
  Info,
  Clock,
} from "lucide-react";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, typeof Bell> = {
  analysis_complete: Cpu,
  resume_parsed: FileText,
  system: Info,
  reminder: Clock,
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export default function NotificationsDropdown() {
  const {
    notifications,
    unreadCount,
    loading,
    dropdownOpen,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    setDropdownOpen,
  } = useNotificationStore();

  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (dropdownOpen && notifications.length === 0) {
      fetchNotifications();
    }
  }, [dropdownOpen, fetchNotifications, notifications.length]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [dropdownOpen, setDropdownOpen]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/15 text-outline hover:text-primary transition-colors"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-error px-1 text-[9px] font-bold text-on-error shadow-lg">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {dropdownOpen && (
        <div className="absolute right-0 top-full mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-2xl border border-outline-variant/15 bg-surface-container-high shadow-2xl shadow-black/30 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-outline-variant/10 px-5 py-4">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-primary" />
              <h3 className="text-sm font-bold text-on-surface">Notifications</h3>
              {unreadCount > 0 && (
                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {unreadCount} new
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline"
              >
                <CheckCheck size={12} />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell size={24} className="mx-auto mb-2 text-outline/30" />
                <p className="text-xs text-outline">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const Icon = typeIcons[notification.type] || Bell;
                return (
                  <div
                    key={notification.id}
                    className={cn(
                      "flex items-start gap-3 border-b border-outline-variant/5 px-5 py-4 transition-colors hover:bg-surface-container/50 cursor-pointer",
                      !notification.read && "bg-primary/[0.02]",
                    )}
                    onClick={() => {
                      if (!notification.read) markAsRead(notification.id);
                    }}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg",
                        notification.type === "analysis_complete" && "bg-primary/10 text-primary",
                        notification.type === "resume_parsed" && "bg-emerald-500/10 text-emerald-400",
                        notification.type === "system" && "bg-amber-500/10 text-amber-400",
                        notification.type === "reminder" && "bg-violet-500/10 text-violet-400",
                      )}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-bold text-on-surface leading-tight">
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[9px] text-outline">
                          {timeAgo(notification.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-on-surface-variant leading-relaxed line-clamp-2">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <div className="mt-1 flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="text-[9px] text-outline hover:text-primary transition-colors"
                          >
                            Mark read
                          </button>
                        </div>
                      )}
                      {notification.link && (
                        <Link
                          to={notification.link}
                          onClick={(e) => e.stopPropagation()}
                          className="mt-1 inline-block text-[9px] font-bold text-primary hover:underline"
                        >
                          View details →
                        </Link>
                      )}
                    </div>
                    {!notification.read && (
                      <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
