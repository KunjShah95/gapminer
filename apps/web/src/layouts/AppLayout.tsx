import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useOnboardingStore } from "@/stores/onboardingStore";
import OnboardingWizard from "@/components/onboarding/OnboardingWizard";
import NotificationsDropdown from "@/components/NotificationsDropdown";
import {
  LayoutDashboard,
  Search,
  Map,
  CreditCard,
  Sparkles,
  LogOut,
  Bell,
  Menu,
  X,
  TrendingUp,
  GraduationCap,
  Settings,
  FileText,
  Target,
  Briefcase,
  Linkedin,
  History,
  BarChart2,
  MessageSquare,
  Star,
  Globe,
  PenTool,
  Mic,
  Users,
  Rocket,
  Bot,
  Shield,
  Key,
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const NAV_SECTIONS = [
  {
    title: "Core",
    items: [
      { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { path: "/analyze", label: "New Analysis", icon: Search },
      { path: "/pricing", label: "Upgrade", icon: CreditCard },
    ],
  },
  {
    title: "Career tools",
    items: [
      { path: "/latex", label: "LaTeX Editor", icon: FileText },
      { path: "/resume/builder", label: "Resume Builder", icon: FileText },
      { path: "/cover-letter", label: "Cover Letter", icon: PenTool },
      { path: "/linkedin", label: "LinkedIn", icon: Linkedin },
      { path: "/interview", label: "Interview", icon: Mic },
      { path: "/negotiate", label: "Negotiate", icon: Target },
      { path: "/negotiation-roleplay", label: "Role-play", icon: MessageSquare },
      { path: "/ats", label: "ATS Score", icon: Target },
    ],
  },
  {
    title: "Developer",
    items: [
      { path: "/dev", label: "Developer Portal", icon: Key },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/career-path", label: "Career Path", icon: Map },
      { path: "/market-demand", label: "Market Demand", icon: Globe },
      { path: "/benchmark", label: "Benchmark", icon: BarChart2 },
      { path: "/jobs/browse", label: "Job Board", icon: Search },
      { path: "/recommendations", label: "Jobs Match", icon: Star },
      { path: "/chat", label: "AI Chat", icon: Bot },
    ],
  },
  {
    title: "Tracking",
    items: [
      { path: "/jobs", label: "Applications", icon: Briefcase },
      { path: "/progress", label: "Progress", icon: TrendingUp },
      { path: "/resume-versions", label: "Versions", icon: History },
    ],
  },
  {
    title: "Enterprise",
    items: [
      { path: "/recruiter", label: "Recruiter", icon: Users },
      { path: "/admin", label: "Admin", icon: Shield },
    ],
  },
];

function NavLink({
  item,
  active,
  onClick,
}: {
  item: (typeof NAV_SECTIONS)[0]["items"][0];
  active: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      to={item.path}
      onClick={onClick}
      className={cn(
        "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all",
        active
          ? "bg-primary/15 text-primary shadow-[inset_0_0_0_1px_rgba(108,71,255,0.25)]"
          : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface",
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
      )}
      <Icon
        size={18}
        className={cn(
          active ? "text-primary" : "text-outline group-hover:text-primary",
        )}
      />
      {item.label}
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { completedSteps, wizardCompleted } = useOnboardingStore();
  const navigate = useNavigate();

  const onboardingProgress = Math.min(100, (completedSteps.length / 5) * 100);
  const showOnboardingBanner = !wizardCompleted && completedSteps.length < 5;

  // Hide role-gated nav items for unauthorized users
  const isAdmin = user?.role === "ADMIN";
  const isRecruiter = user?.role === "RECRUITER" || user?.role === "ADMIN";

  return (
    <>
      <div className="border-b border-outline-variant/10 p-6">
        <Link
          to="/"
          className="flex items-center gap-3"
          onClick={onNavigate}
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl primary-gradient shadow-lg shadow-primary/20">
            <Sparkles size={20} className="text-on-primary-fixed" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight">Gapminer</span>
            <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
              Career OS
            </p>
          </div>
        </Link>
      </div>

      {/* Onboarding progress banner */}
      {showOnboardingBanner && (
        <Link
          to="/dashboard"
          onClick={onNavigate}
          className="mx-4 mt-4 rounded-2xl border border-primary/20 bg-primary/5 p-4 transition-all hover:bg-primary/10"
        >
          <div className="mb-3 flex items-center gap-2">
            <Rocket size={14} className="text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Getting Started
            </span>
            <span className="ml-auto text-[10px] font-bold text-on-surface-variant">
              {completedSteps.length}/5
            </span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full rounded-full primary-gradient transition-all duration-700"
              style={{ width: `${onboardingProgress}%` }}
            />
          </div>
          <p className="mt-2 text-[10px] text-on-surface-variant">
            {completedSteps.length === 0
              ? "Complete setup to unlock all features"
              : completedSteps.length >= 4
                ? "Almost done! One step left"
                : `${5 - completedSteps.length} steps remaining`}
          </p>
        </Link>
      )}

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {NAV_SECTIONS.map((section) => {
          // Filter role-gated items for unauthorized users
          const items = section.title === "Enterprise"
            ? section.items.filter((item) => {
                if (item.path === "/admin" && !isAdmin) return false;
                if (item.path === "/recruiter" && !isRecruiter) return false;
                return true;
              })
            : section.items;

          if (items.length === 0) return null;

          return (
            <div key={section.title}>
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-outline/80">
                {section.title}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => (
                  <NavLink
                    key={item.path}
                    item={item}
                    active={
                      location.pathname === item.path ||
                      location.pathname.startsWith(item.path + "/")
                    }
                    onClick={onNavigate}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <div className="border-t border-outline-variant/10 pt-4">
          <NavLink
            item={{
              path: "/profile",
              label: "Settings",
              icon: Settings,
            }}
            active={location.pathname === "/profile"}
            onClick={onNavigate}
          />
        </div>
      </nav>

      {user && (
        <div className="m-4 rounded-2xl border border-outline-variant/10 bg-surface-container-high p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-outline">
              Usage
            </span>
            <span className="text-[10px] font-bold uppercase text-primary">
              {user.plan}
            </span>
          </div>
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-2xl font-black">
              {user.analysesUsed}
              <span className="text-sm font-normal text-outline">
                /{user.analysesLimit}
              </span>
            </span>
          </div>
          <div className="mb-3 h-1.5 overflow-hidden rounded-full bg-surface-container">
            <div
              className="h-full primary-gradient transition-all duration-700"
              style={{
                width: `${Math.min(100, (user.analysesUsed / user.analysesLimit) * 100)}%`,
              }}
            />
          </div>
          <Link
            to="/pricing"
            onClick={onNavigate}
            className="block w-full rounded-xl border border-outline-variant/15 py-2 text-center text-[10px] font-bold uppercase tracking-widest hover:bg-surface-container-highest"
          >
            Upgrade plan
          </Link>
        </div>
      )}

      <div className="border-t border-outline-variant/10 p-4">
        <button
          type="button"
          onClick={() => {
            logout();
            navigate("/");
            onNavigate?.();
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-error/80 transition-colors hover:bg-error/10"
        >
          <LogOut size={18} />
          Sign out
        </button>
      </div>
    </>
  );
}

export default function AppLayout() {
  const { user } = useAuthStore();
  const { wizardCompleted } = useOnboardingStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [analysesCount, setAnalysesCount] = useState(-1);
  const [loading, setLoading] = useState(true);

  // Check if user has any analyses to determine if wizard should show
  useEffect(() => {
    async function checkAnalyses() {
      try {
        const token = useAuthStore.getState().token;
        if (!token) {
          setLoading(false);
          return;
        }
        const res = await fetch("/api/v1/analysis", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json().catch(() => []);
          setAnalysesCount(Array.isArray(data) ? data.length : 0);
        }
      } catch {
        /* silent */
      } finally {
        setLoading(false);
      }
    }
    if (user && analysesCount === -1) checkAnalyses();
  }, [user]);

  // Show wizard if user has no analyses and hasn't completed it
  const showWizard = !wizardCompleted && !loading && analysesCount === 0;

  return (
    <>
      <OnboardingWizard open={showWizard} />
      <div className="flex min-h-screen bg-surface font-body text-on-surface">
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-outline-variant/10 bg-surface-container-low lg:flex">
        <SidebarContent />
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="absolute bottom-0 left-0 top-0 flex w-72 flex-col bg-surface-container-low shadow-2xl">
            <div className="flex justify-end p-4">
              <button
                type="button"
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-2 text-outline hover:bg-surface-container-high"
              >
                <X size={22} />
              </button>
            </div>
            <SidebarContent onNavigate={() => setSidebarOpen(false)} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-outline-variant/10 bg-surface/80 px-4 backdrop-blur-xl lg:px-8">
          <button
            type="button"
            className="rounded-lg p-2 lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={22} />
          </button>
          <Link to="/dashboard" className="text-lg font-black lg:hidden">
            Gapminer
          </Link>
          <div className="hidden flex-1 lg:block" />
          <div className="flex items-center gap-3">
            <NotificationsDropdown />
            <Link
              to="/profile"
              className="flex items-center gap-2 rounded-xl border border-outline-variant/10 bg-surface-container-high px-2 py-1.5 pr-3"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg primary-gradient text-xs font-black text-on-primary-fixed">
                {user?.name?.charAt(0) ?? "?"}
              </div>
              <div className="hidden text-left sm:block">
                <p className="text-xs font-bold leading-none">{user?.name}</p>
                <p className="text-[10px] text-primary">{user?.plan} plan</p>
              </div>
            </Link>
          </div>
        </header>

        <main className="flex flex-1 flex-col">
          <Outlet />
        </main>
      </div>
    </div>
    </>
  );
}
