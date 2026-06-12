import { useState, useEffect } from "react";
import { getAuthToken } from "@/lib/authFetch";
import {
  Shield,
  Users,
  Activity,
  BarChart3,
  TrendingUp,
  Cpu,
  AlertCircle,
  Search,
  RefreshCw,
  FileText,
} from "lucide-react";
import {
  PageShell,
  PageHeader,
  Card,
  Badge,
  StatCard,
  Button,
} from "@/components/ui";
import { cn } from "@/lib/utils";

interface AdminStats {
  totalUsers?: number;
  activeUsers?: number;
  totalAnalyses?: number;
  analysesToday?: number;
  totalResumes?: number;
  premiumUsers?: number;
}

interface UserSummary {
  id: string;
  email: string;
  name: string;
  plan: string;
  analyses_used: number;
  created_at: string;
  is_active: boolean;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Backend enforces admin role via requireAdmin middleware

  useEffect(() => {
    fetchAdminData();
  }, []);

  async function fetchAdminData() {
    const token = getAuthToken();
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const [statsRes, usersRes] = await Promise.all([
        fetch("/api/v1/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/v1/admin/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
      if (statsRes.ok) setStats(await statsRes.json());
      if (usersRes.ok) setUsers(await usersRes.json());
      if (!statsRes.ok || !usersRes.ok) {
        const errData = await statsRes.json().catch(() => ({}));
        setError(errData.error || "Access denied. Admin role required.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }

  const filteredUsers = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const statCards = [
    { label: "Total Users", value: stats?.totalUsers || 0, icon: Users, color: "primary" },
    { label: "Active Users", value: stats?.activeUsers || 0, icon: Activity, color: "success" },
    { label: "Total Analyses", value: stats?.totalAnalyses || 0, icon: BarChart3, color: "info" },
    { label: "Analyses Today", value: stats?.analysesToday || 0, icon: TrendingUp, color: "tertiary" },
    { label: "Premium Users", value: stats?.premiumUsers || 0, icon: Shield, color: "warning" },
    { label: "Resumes", value: stats?.totalResumes || 0, icon: FileText, color: "primary" },
  ];

  const statIconColors: Record<string, string> = {
    primary: "text-primary",
    tertiary: "text-violet-300",
    success: "text-emerald-400",
    info: "text-sky-400",
    warning: "text-amber-400",
  };

  return (
    <PageShell maxWidth="full">
      <PageHeader
        icon={<Shield size={22} />}
        title="Admin Dashboard"
        description="System overview, user management, and analytics"
        badge="Admin"
        actions={
          <Button variant="outline" size="sm" onClick={fetchAdminData} loading={loading}>
            <RefreshCw size={14} />
            Refresh
          </Button>
        }
      />

      {error && (
        <Card className="mb-6 border-error/30 bg-error/10" padding="md">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-error" />
            <div className="flex-1 text-sm text-error">{error}</div>
          </div>
        </Card>
      )}

      {/* Stats */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
        {statCards.map((stat, idx) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={<stat.icon className={cn("h-5 w-5", statIconColors[stat.color] || "text-primary")} />}
          />
        ))}
      </div>

      {/* Users table */}
      <Card padding="lg">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-on-surface">
            <Users size={20} className="text-primary" />
            User Management
          </h3>
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-outline" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search users..."
              className="gm-input w-full pl-10 text-sm"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Cpu size={24} className="animate-pulse text-primary/30" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="py-12 text-center text-sm text-outline">
            {searchQuery ? "No users match your search" : "No users found"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-separate border-spacing-y-2">
              <thead>
                <tr className="text-[10px] font-black uppercase tracking-widest text-outline">
                  <th className="pb-3 pl-4">User</th>
                  <th className="pb-3">Email</th>
                  <th className="pb-3">Plan</th>
                  <th className="pb-3">Analyses</th>
                  <th className="pb-3">Joined</th>
                  <th className="pb-3 pr-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="group">
                    <td className="rounded-l-2xl bg-surface-container/20 py-4 pl-4 group-hover:bg-surface-container/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 font-black text-sm text-primary">
                          {u.name?.charAt(0) || "?"}
                        </div>
                        <span className="text-sm font-bold text-on-surface">
                          {u.name || "Unnamed"}
                        </span>
                      </div>
                    </td>
                    <td className="bg-surface-container/20 py-4 group-hover:bg-surface-container/40 transition-colors">
                      <span className="text-xs text-on-surface-variant">{u.email}</span>
                    </td>
                    <td className="bg-surface-container/20 py-4 group-hover:bg-surface-container/40 transition-colors">
                      <Badge tone={u.plan === "pro" || u.plan === "teams" ? "primary" : "default"}>
                        {u.plan || "free"}
                      </Badge>
                    </td>
                    <td className="bg-surface-container/20 py-4 group-hover:bg-surface-container/40 transition-colors">
                      <span className="text-xs font-bold text-on-surface">{u.analyses_used}</span>
                    </td>
                    <td className="bg-surface-container/20 py-4 group-hover:bg-surface-container/40 transition-colors">
                      <span className="text-xs text-on-surface-variant">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="rounded-r-2xl bg-surface-container/20 py-4 pr-4 group-hover:bg-surface-container/40 transition-colors">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            "h-2 w-2 rounded-full",
                            u.is_active ? "bg-emerald-400" : "bg-outline/30",
                          )}
                        />
                        <span className="text-[10px] font-bold uppercase text-outline">
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </PageShell>
  );
}
