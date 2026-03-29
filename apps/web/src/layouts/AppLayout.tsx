import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import {
  LayoutDashboard, Search, Map, User, CreditCard,
  Sparkles, LogOut, Bell, ChevronDown, Menu, X,
  TrendingUp, GraduationCap, Settings, Shield, Activity,
  FileText, Target
} from 'lucide-react'
import { useState } from 'react'

const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/analyze', label: 'New Analysis', icon: Search },
  { path: '/negotiate', label: 'Negotiate', icon: Target },
  { path: '/latex', label: 'LaTeX Editor', icon: FileText },
  { path: '/roadmap/rm_001', label: 'My Roadmaps', icon: GraduationCap },
  { path: '/pricing', label: 'Upgrade Plan', icon: CreditCard },
]

export default function AppLayout() {
  const { user, logout } = useAuthStore()
  const location = useLocation()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className="bg-surface text-on-surface min-h-screen flex font-body selection:bg-primary/30 selection:text-primary-fixed">
      {/* ── Sidebar (Desktop) ─────────────────────────────────── */}
      <aside className="w-80 border-r border-outline-variant/15 flex flex-col bg-surface-container-low hidden lg:flex sticky top-0 h-screen overflow-y-auto shrink-0">
        <div className="p-10">
          <Link to="/" className="text-2xl font-black tracking-tighter text-[#f9f5fd] flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl primary-gradient flex items-center justify-center text-on-primary-fixed shadow-lg shadow-primary/20">
              <Sparkles size={20} />
            </div>
            Gapminer
          </Link>
        </div>
        
        <nav className="flex-grow px-6 space-y-2">
          <div className="text-[10px] font-black text-outline uppercase tracking-[0.2em] px-4 mb-4 opacity-60">Main Terminal</div>
          {NAV_ITEMS.map((item) => {
            const active = location.pathname === item.path
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-4 px-5 py-4 rounded-[1.5rem] transition-all group relative ${
                  active ? 'bg-primary/10 text-primary shadow-[inset_0_0_0_1px_rgba(176,162,255,0.2)]' : 'text-on-surface-variant hover:bg-surface-container-high'
                }`}
              >
                <item.icon size={20} className={active ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary transition-colors'} />
                <span className={`font-bold text-sm tracking-tight ${active ? 'skew-x-[-2deg]' : ''}`}>{item.label}</span>
                {active && (
                  <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                )}
              </Link>
            )
          })}

          <div className="h-4"></div>
          <div className="text-[10px] font-black text-outline uppercase tracking-[0.2em] px-4 mb-4 opacity-60">System Core</div>
          <Link to="/profile" className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-on-surface-variant hover:bg-surface-container-high transition-all">
            <Settings size={20} />
            <span className="text-sm font-bold tracking-tight">Account Settings</span>
          </Link>
        </nav>

        {/* Quota Card */}
        {user && (
          <div className="m-6 p-6 rounded-[2rem] bg-surface-container-high border border-outline-variant/10">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black text-outline uppercase tracking-widest">Analysis Engine</span>
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">{user.plan}</span>
            </div>
            <div className="flex justify-between items-end mb-2">
              <div className="text-2xl font-black tracking-tighter">{user.analysesUsed}<span className="text-outline text-sm font-light">/{user.analysesLimit}</span></div>
              <div className="text-[9px] font-bold text-outline uppercase pb-1">Usage</div>
            </div>
            <div className="h-1.5 w-full bg-surface-container rounded-full overflow-hidden mb-5">
              <div
                className="h-full primary-gradient transition-all duration-1000"
                style={{ width: `${(user.analysesUsed / user.analysesLimit) * 100}%` }}
              ></div>
            </div>
            <Link to="/pricing" className="glass w-full border border-outline-variant/20 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest block text-center hover:bg-surface-container-highest transition-all">
              Manage Access
            </Link>
          </div>
        )}

        <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low/50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-5 py-4 rounded-[1.5rem] text-error/70 hover:bg-error/5 transition-all group"
          >
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold tracking-tight uppercase tracking-widest">Terminate Session</span>
          </button>
        </div>
      </aside>

      {/* ── Sidebar (Mobile) ─────────────────────────────────── */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-surface/80 backdrop-blur-md" onClick={() => setSidebarOpen(false)} />
        <aside className={`absolute left-0 top-0 bottom-0 w-80 bg-surface-container-low border-r border-outline-variant/20 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 flex justify-between items-center">
             <Link to="/" className="text-2xl font-black tracking-tighter text-[#f9f5fd] flex items-center gap-3">
              <Sparkles className="text-primary" size={24} />
              Gapminer
            </Link>
            <button className="p-2 text-outline" onClick={() => setSidebarOpen(false)}>
              <X size={24} />
            </button>
          </div>
          {/* Mobile Nav Items */}
          <nav className="p-4 space-y-1">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="flex items-center gap-4 px-6 py-4 rounded-2xl text-on-surface-variant font-bold text-sm uppercase tracking-widest"
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} />
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
      </div>

      {/* ── Main Content ───────────────────────────────────── */}
      <div className="flex-grow flex flex-col min-w-0">
        <header className="h-20 lg:h-24 px-8 flex items-center justify-between bg-surface/40 backdrop-blur-xl sticky top-0 z-40 lg:hidden">
          <button className="p-2 text-on-surface lg:hidden" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <Link to="/" className="text-xl font-black tracking-tighter lg:hidden">Gapminer</Link>
          <div className="w-10 h-10 rounded-full primary-gradient flex items-center justify-center text-on-primary-fixed shadow-lg border-2 border-surface">
            {user?.name?.charAt(0)}
          </div>
        </header>

        {/* Global Toolbar (Desktop only, subtle) */}
        <header className="h-24 px-12 flex items-center justify-between bg-transparent hidden lg:flex shrink-0">
          <div className="flex-grow"></div>
          <div className="flex items-center gap-6">
             <button className="glass w-10 h-10 rounded-xl flex items-center justify-center text-outline hover:text-primary transition-all border border-outline-variant/10">
              <Bell size={18} />
            </button>
            <div className="h-10 w-px bg-outline-variant/15"></div>
            <div className="flex items-center gap-4 group cursor-pointer">
              <div className="text-right">
                <div className="text-sm font-black tracking-tight skew-x-[-2deg]">{user?.name}</div>
                <div className="text-[10px] font-black text-primary uppercase tracking-widest leading-none">{user?.plan} plan</div>
              </div>
              <div className="w-10 h-10 rounded-xl primary-gradient flex items-center justify-center text-on-primary-fixed font-black shadow-xl border-2 border-surface group-hover:scale-110 transition-transform">
                {user?.name?.charAt(0)}
              </div>
            </div>
          </div>
        </header>

        <main className="flex-grow flex flex-col">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
