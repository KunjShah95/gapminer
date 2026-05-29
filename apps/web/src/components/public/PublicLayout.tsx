import { Outlet, Link, useLocation } from "react-router-dom";
import { Sparkles } from "lucide-react";

const NAV_LINKS = [
  { path: "/", label: "Home" },
  { path: "/about", label: "About Us" },
  { path: "/features", label: "Features" },
  { path: "/pricing", label: "Pricing" },
] as const;

export default function PublicLayout() {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface selection:bg-primary/30">
      <nav className="fixed top-0 z-50 w-full border-b border-outline-variant/10 bg-surface/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl primary-gradient text-on-primary-fixed shadow-lg shadow-primary/20">
              <Sparkles size={16} />
            </div>
            <div className="leading-tight">
              <span className="block text-sm font-black">Gapminer</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-on-surface-variant">
                Career OS
              </span>
            </div>
          </Link>
          <div className="hidden gap-8 md:flex">
            {NAV_LINKS.map(({ path, label }) => (
              <Link
                key={path}
                to={path}
                className={`text-sm transition ${
                  isActive(path)
                    ? "text-on-surface font-semibold"
                    : "text-on-surface-variant hover:text-on-surface"
                }`}
              >
                {label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/auth?mode=login"
              className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high sm:block"
            >
              Sign in
            </Link>
            <Link
              to="/auth?mode=signup"
              className="primary-gradient rounded-full px-5 py-2.5 text-sm font-bold text-on-primary-fixed shadow-lg shadow-primary/20"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-outline-variant/10 px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 lg:flex-row">
          <span className="font-black">Gapminer Career OS</span>
          <nav className="flex flex-wrap justify-center gap-5">
            {[...NAV_LINKS, { path: "/auth?mode=login", label: "Sign In" }].map(
              ({ path, label }) => (
                <Link
                  key={path}
                  to={path}
                  className="text-xs font-bold uppercase tracking-wider text-outline hover:text-on-surface"
                >
                  {label}
                </Link>
              ),
            )}
          </nav>
          <p className="text-xs text-outline">© 2025 Gapminer</p>
        </div>
      </footer>
    </div>
  );
}
