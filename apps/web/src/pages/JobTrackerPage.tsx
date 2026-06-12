import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  ExternalLink,
  Trash2,
  Edit3,
  Briefcase,
  Building2,
  MapPin,
  DollarSign,
  X,
  Save,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  Star,
  ThumbsDown,
  Loader2,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";
import OnboardingTooltip from "@/components/onboarding/OnboardingTooltip";
import {
  PageShell,
  PageHeader,
  Card,
  Button,
  Badge,
  StatCard,
  EmptyState,
  Input,
  Textarea,
} from "@/components/ui";
import { cn } from "@/lib/utils";

const STATUSES = [
  { id: "saved", label: "Saved", color: "bg-slate-400", icon: Target },
  { id: "applied", label: "Applied", color: "bg-sky-400", icon: Send },
  { id: "screening", label: "Screening", color: "bg-amber-400", icon: Search },
  {
    id: "interview",
    label: "Interview",
    color: "bg-violet-400",
    icon: Briefcase,
  },
  { id: "offer", label: "Offer", color: "bg-emerald-400", icon: Star },
  {
    id: "accepted",
    label: "Accepted",
    color: "bg-emerald-500",
    icon: CheckCircle2,
  },
  { id: "rejected", label: "Rejected", color: "bg-red-400", icon: ThumbsDown },
];

function Send({ size }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
    </svg>
  );
}

interface JobApplication {
  id: string;
  company: string;
  role: string;
  status: string;
  salary?: number;
  location?: string;
  job_url?: string;
  notes?: string;
  applied_date?: string;
  created_at: string;
}

interface JobFormData {
  company: string;
  role: string;
  status: string;
  salary: string;
  location: string;
  job_url: string;
  notes: string;
  applied_date: string;
}

export default function JobTrackerPage() {
  const [jobs, setJobs] = useState<JobApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobApplication | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [formData, setFormData] = useState<JobFormData>({
    company: "",
    role: "",
    status: "saved",
    salary: "",
    location: "",
    job_url: "",
    notes: "",
    applied_date: new Date().toISOString().split("T")[0],
  });

  const fetchJobs = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);

      const res = await fetch(`/api/v1/jobs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => []);
        setJobs(data);
      }
    } catch (err) {
      console.error("Failed to fetch jobs:", err);
    } finally {
      setLoading(false);
    }
  }, [search]);

  const fetchStats = useCallback(async () => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch("/api/v1/jobs/stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        setStats(data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, [fetchJobs, fetchStats]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = getAuthToken();
    if (!token) return;

    try {
      const method = editingJob ? "PUT" : "POST";
      const url = editingJob ? `/api/v1/jobs/${editingJob.id}` : "/api/v1/jobs";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
        }),
      });

      if (res.ok) {
        setShowForm(false);
        setEditingJob(null);
        setFormData({
          company: "",
          role: "",
          status: "saved",
          salary: "",
          location: "",
          job_url: "",
          notes: "",
          applied_date: new Date().toISOString().split("T")[0],
        });
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to save job:", err);
    }
  };

  const handleDelete = async (id: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/jobs/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to delete job:", err);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    const token = getAuthToken();
    if (!token) return;

    try {
      const res = await fetch(`/api/v1/jobs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        fetchJobs();
        fetchStats();
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const filteredJobs = jobs.filter(
    (job) =>
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.role.toLowerCase().includes(search.toLowerCase()) ||
      (job.notes || "").toLowerCase().includes(search.toLowerCase()),
  );

  const groupedJobs = STATUSES.reduce(
    (acc, status) => {
      acc[status.id] = filteredJobs.filter((j) => j.status === status.id);
      return acc;
    },
    {} as Record<string, JobApplication[]>,
  );

  return (
    <PageShell maxWidth="2xl">
      <OnboardingTooltip
        pageKey="jobs"
        icon="📋"
        title="Track your applications"
        description="Keep tabs on every job application. Update status, add notes, and never lose track of where you've applied."
      />

      <PageHeader
        title="Job Application Tracker"
        description="Track your job applications through the entire pipeline"
        icon={<Briefcase size={22} />}
        actions={
          <Button onClick={() => setShowForm(true)} className="text-xs sm:text-sm">
            <Plus size={16} className="sm:size-[18px]" />
            <span className="hidden sm:inline">Add Application</span>
            <span className="sm:hidden">Add</span>
          </Button>
        }
      />

      {stats && (
        <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total" value={stats.total || 0} icon={<Briefcase size={18} />} />
          <StatCard label="Interviews" value={stats.interview || 0} icon={<Clock size={18} />} />
          <StatCard label="Offers" value={stats.offer || 0} icon={<Star size={18} />} />
          <StatCard
            label="Interview rate"
            value={`${stats.interview_rate || 0}%`}
            icon={<TrendingUp size={18} />}
          />
        </div>
      )}

      <div className="mb-6">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-outline"
            size={18}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by company or role..."
            className="gm-input w-full pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-on-surface-variant">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          Loading...
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {STATUSES.map((status) => {
            const statusJobs = groupedJobs[status.id] || [];
            return (
              <div
                key={status.id}
                className="rounded-xl border border-outline-variant/15 bg-surface-container-high p-3"
              >
                <div className="mb-3 flex items-center gap-2">
                  <div className={cn("h-3 w-3 rounded-full", status.color)} />
                  <h3 className="text-sm font-bold text-on-surface">{status.label}</h3>
                  <span className="text-xs text-on-surface-variant">
                    ({statusJobs.length})
                  </span>
                </div>
                <div className="space-y-2">
                  {statusJobs.map((job) => (
                    <Card key={job.id} padding="sm" hover className="!p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-bold text-on-surface">{job.role}</h4>
                          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
                            <Building2 size={12} />
                            {job.company}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingJob(job);
                              setFormData({
                                company: job.company,
                                role: job.role,
                                status: job.status,
                                salary: job.salary?.toString() || "",
                                location: job.location || "",
                                job_url: job.job_url || "",
                                notes: job.notes || "",
                                applied_date: job.applied_date?.split("T")[0] || "",
                              });
                              setShowForm(true);
                            }}
                            className="rounded p-1 text-outline hover:text-primary"
                          >
                            <Edit3 size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(job.id)}
                            className="rounded p-1 text-outline hover:text-error"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      {job.location && (
                        <div className="mb-1 flex items-center gap-1 text-xs text-on-surface-variant">
                          <MapPin size={12} />
                          {job.location}
                        </div>
                      )}
                      {job.salary && (
                        <div className="mb-1 flex items-center gap-1 text-xs text-on-surface-variant">
                          <DollarSign size={12} />$
                          {job.salary.toLocaleString()}
                        </div>
                      )}
                      {job.job_url && (
                        <a
                          href={job.job_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mb-2 flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          <ExternalLink size={12} />
                          View posting
                        </a>
                      )}
                      <div className="mt-2 border-t border-outline-variant/15 pt-2">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className="gm-input w-full py-1.5 text-xs"
                        >
                          {STATUSES.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 p-3 pt-16 sm:items-center sm:p-4 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false);
              setEditingJob(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card max-h-[85vh] w-full max-w-lg overflow-y-auto p-5 sm:p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-black text-on-surface">
                  {editingJob ? "Edit Application" : "Add Application"}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingJob(null);
                  }}
                  className="rounded-lg p-1 text-outline hover:bg-surface-container-high hover:text-on-surface"
                >
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Company *"
                    type="text"
                    value={formData.company}
                    onChange={(e) =>
                      setFormData({ ...formData, company: e.target.value })
                    }
                    required
                  />
                  <Input
                    label="Role *"
                    type="text"
                    value={formData.role}
                    onChange={(e) =>
                      setFormData({ ...formData, role: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="gm-label">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value })
                    }
                    className="gm-input w-full"
                  >
                    {STATUSES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Salary"
                    type="number"
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                  />
                  <Input
                    label="Location"
                    type="text"
                    value={formData.location}
                    onChange={(e) =>
                      setFormData({ ...formData, location: e.target.value })
                    }
                  />
                </div>
                <Input
                  label="Job URL"
                  type="url"
                  value={formData.job_url}
                  onChange={(e) =>
                    setFormData({ ...formData, job_url: e.target.value })
                  }
                />
                <Input
                  label="Applied date"
                  type="date"
                  value={formData.applied_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      applied_date: e.target.value,
                    })
                  }
                />
                <Textarea
                  label="Notes"
                  value={formData.notes}
                  onChange={(e) =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  rows={3}
                />
                <div className="flex gap-3 pt-2">
                  <Button type="submit" className="flex-1">
                    <Save size={16} />
                    {editingJob ? "Update" : "Save"}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowForm(false);
                      setEditingJob(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </PageShell>
  );
}
