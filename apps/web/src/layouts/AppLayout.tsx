import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
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
} from "lucide-react";
import { useState } from "react";
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
      { path: "/cover-letter", label: "Cover Letter", icon: PenTool },
      { path: "/linkedin", label: "LinkedIn", icon: Linkedin },
      { path: "/interview", label: "Interview", icon: Mic },
      { path: "/negotiate", label: "Negotiate", icon: Target },
      { path: "/negotiation-roleplay", label: "Role-play", icon: MessageSquare },
    ],
  },
  {
    title: "Intelligence",
    items: [
      { path: "/career-path", label: "Career Path", icon: Map },
      { path: "/market-demand", label: "Market Demand", icon: Globe },
      { path: "/benchmark", label: "Benchmark", icon: BarChart2 },
      { path: "/recommendations", label: "Jobs Match", icon: Star },
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
    items: [{ path: "/recruiter", label: "Recruiter", icon: Users }],
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
  const navigate = useNavigate();

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

      <nav className="flex-1 space-y-6 overflow-y-auto p-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-outline/80">
              {section.title}
            </p>
            <div className="space-y-0.5">
              {section.items.map((item) => (
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
        ))}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
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
            <button
              type="button"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-outline-variant/15 text-outline hover:text-primary"
            >
              <Bell size={18} />
            </button>
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
  );
}
