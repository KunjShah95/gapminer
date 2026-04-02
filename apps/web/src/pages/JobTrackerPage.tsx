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
  Calendar,
  ChevronDown,
  X,
  Save,
  TrendingUp,
  Target,
  CheckCircle2,
  Clock,
  AlertCircle,
  Star,
  ThumbsDown,
  Handshake,
} from "lucide-react";
import { getAuthToken } from "@/lib/authFetch";

const STATUSES = [
  { id: "saved", label: "Saved", color: "bg-gray-500", icon: Target },
  { id: "applied", label: "Applied", color: "bg-blue-500", icon: Send },
  { id: "screening", label: "Screening", color: "bg-yellow-500", icon: Search },
  {
    id: "interview",
    label: "Interview",
    color: "bg-purple-500",
    icon: Briefcase,
  },
  { id: "offer", label: "Offer", color: "bg-green-500", icon: Star },
  {
    id: "accepted",
    label: "Accepted",
    color: "bg-emerald-500",
    icon: CheckCircle2,
  },
  { id: "rejected", label: "Rejected", color: "bg-red-500", icon: ThumbsDown },
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
        const data = await res.json();
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
        const data = await res.json();
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
      job.role.toLowerCase().includes(search.toLowerCase()),
  );

  const groupedJobs = STATUSES.reduce(
    (acc, status) => {
      acc[status.id] = filteredJobs.filter((j) => j.status === status.id);
      return acc;
    },
    {} as Record<string, JobApplication[]>,
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Job Application Tracker
            </h1>
            <p className="text-gray-600 mt-1">
              Track your job applications through the entire pipeline
            </p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} />
            Add Application
          </button>
        </div>

        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-gray-600 mb-1">
                <Briefcase size={16} />
                <span className="text-sm">Total</span>
              </div>
              <p className="text-2xl font-bold">{stats.total || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-blue-600 mb-1">
                <Clock size={16} />
                <span className="text-sm">Interviews</span>
              </div>
              <p className="text-2xl font-bold">{stats.interview || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-green-600 mb-1">
                <Star size={16} />
                <span className="text-sm">Offers</span>
              </div>
              <p className="text-2xl font-bold">{stats.offer || 0}</p>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <TrendingUp size={16} />
                <span className="text-sm">Interview Rate</span>
              </div>
              <p className="text-2xl font-bold">{stats.interview_rate || 0}%</p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by company or role..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {STATUSES.map((status) => {
              const statusJobs = groupedJobs[status.id] || [];
              const Icon = status.icon;
              return (
                <div key={status.id} className="bg-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${status.color}`} />
                    <h3 className="font-semibold text-sm">{status.label}</h3>
                    <span className="text-xs text-gray-500">
                      ({statusJobs.length})
                    </span>
                  </div>
                  <div className="space-y-2">
                    {statusJobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-white rounded-lg p-3 border border-gray-200 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-sm">{job.role}</h4>
                            <div className="flex items-center gap-1 text-gray-500 text-xs">
                              <Building2 size={12} />
                              {job.company}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <button
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
                                  applied_date:
                                    job.applied_date?.split("T")[0] || "",
                                });
                                setShowForm(true);
                              }}
                              className="p-1 text-gray-400 hover:text-blue-600"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(job.id)}
                              className="p-1 text-gray-400 hover:text-red-600"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                        {job.location && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <MapPin size={12} />
                            {job.location}
                          </div>
                        )}
                        {job.salary && (
                          <div className="flex items-center gap-1 text-gray-500 text-xs mb-1">
                            <DollarSign size={12} />$
                            {job.salary.toLocaleString()}
                          </div>
                        )}
                        {job.job_url && (
                          <a
                            href={job.job_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-blue-600 text-xs hover:underline"
                          >
                            <ExternalLink size={12} />
                            View posting
                          </a>
                        )}
                        <div className="mt-2 pt-2 border-t border-gray-100">
                          <select
                            value={job.status}
                            onChange={(e) =>
                              handleStatusChange(job.id, e.target.value)
                            }
                            className="w-full text-xs border border-gray-200 rounded px-2 py-1"
                          >
                            {STATUSES.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.label}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
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
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={() => {
                setShowForm(false);
                setEditingJob(null);
              }}
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">
                    {editingJob ? "Edit Application" : "Add Application"}
                  </h2>
                  <button
                    onClick={() => {
                      setShowForm(false);
                      setEditingJob(null);
                    }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <X size={20} />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Company *
                      </label>
                      <input
                        type="text"
                        value={formData.company}
                        onChange={(e) =>
                          setFormData({ ...formData, company: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Role *
                      </label>
                      <input
                        type="text"
                        value={formData.role}
                        onChange={(e) =>
                          setFormData({ ...formData, role: e.target.value })
                        }
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setFormData({ ...formData, status: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      {STATUSES.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Salary
                      </label>
                      <input
                        type="number"
                        value={formData.salary}
                        onChange={(e) =>
                          setFormData({ ...formData, salary: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={formData.location}
                        onChange={(e) =>
                          setFormData({ ...formData, location: e.target.value })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Job URL
                    </label>
                    <input
                      type="url"
                      value={formData.job_url}
                      onChange={(e) =>
                        setFormData({ ...formData, job_url: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Applied Date
                    </label>
                    <input
                      type="date"
                      value={formData.applied_date}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          applied_date: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) =>
                        setFormData({ ...formData, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button
                      type="submit"
                      className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                    >
                      <Save size={16} />
                      {editingJob ? "Update" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowForm(false);
                        setEditingJob(null);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
