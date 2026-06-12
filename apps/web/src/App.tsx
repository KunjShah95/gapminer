import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState, lazy } from "react";
import { useAuthStore, initializeAuth } from "@/stores/authStore";
import ErrorBoundary from "@/components/ErrorBoundary";
import PublicLayout from "@/components/public/PublicLayout";
import LandingPage from "@/pages/LandingPage";
import AboutPage from "@/pages/AboutPage";
import FeaturesPage from "@/pages/FeaturesPage";
import AuthPage from "@/pages/AuthPage";
import SuspensePage from "@/components/SuspensePage";
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const AnalysisResultsPage = lazy(() => import("@/pages/AnalysisResultsPage"));
const AnalyzerPage = lazy(() => import("@/pages/AnalyzerPage"));
const RoadmapPage = lazy(() => import("@/pages/RoadmapPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const PricingPage = lazy(() => import("@/pages/PricingPage"));
const LatexEditorPage = lazy(() => import("@/pages/LatexEditorPage"));
const InterviewSimulationPage = lazy(() => import("@/pages/InterviewSimulationPage"));
const RecruiterDashboardPage = lazy(() => import("@/pages/RecruiterDashboardPage"));
const NegotiationCompanionPage = lazy(() => import("@/pages/NegotiationCompanionPage"));
const CoverLetterPage = lazy(() => import("@/pages/CoverLetterPage"));
const JobTrackerPage = lazy(() => import("@/pages/JobTrackerPage"));
const SkillProgressPage = lazy(() => import("@/pages/SkillProgressPage"));
const LinkedInOptimizerPage = lazy(() => import("@/pages/LinkedInOptimizerPage"));
const ResumeVersionsPage = lazy(() => import("@/pages/ResumeVersionsPage"));
const BenchmarkPage = lazy(() => import("@/pages/BenchmarkPage"));
const NegotiationRoleplayPage = lazy(() => import("@/pages/NegotiationRoleplayPage"));
const RecommendationsPage = lazy(() => import("@/pages/RecommendationsPage"));
const MarketDemandPage = lazy(() => import("@/pages/MarketDemandPage"));
const CareerPathPage = lazy(() => import("@/pages/CareerPathPage"));
const ChatPage = lazy(() => import("@/pages/ChatPage"));
const AdminDashboardPage = lazy(() => import("@/pages/AdminDashboardPage"));
const DeveloperPortalPage = lazy(() => import("@/pages/DeveloperPortalPage"));
import AppLayout from "@/layouts/AppLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <ErrorBoundary>{children}</ErrorBoundary>;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    async function init() {
      if (token && !user) {
        await initializeAuth();
      }
      setIsInitialized(true);
    }
    init();
  }, [token, user]);

  if (!isInitialized && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <AuthInitializer>
      <AppRoutes />
    </AuthInitializer>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public pages with shared layout */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/features" element={<FeaturesPage />} />
        <Route path="/pricing" element={<SuspensePage><PricingPage /></SuspensePage>} />
      </Route>

      {/* Auth */}
      <Route path="/login" element={<AuthPage />} />
      <Route path="/auth" element={<AuthPage />} />

      {/* Protected App Routes */}
      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <SuspensePage><Dashboard /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <SuspensePage><AnalyzerPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/latex/:id?"
          element={
            <ProtectedRoute>
              <SuspensePage><LatexEditorPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/results/:id"
          element={
            <ProtectedRoute>
              <SuspensePage><AnalysisResultsPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap/:id"
          element={
            <ProtectedRoute>
              <SuspensePage><RoadmapPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <SuspensePage><ProfilePage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <SuspensePage><InterviewSimulationPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute>
              <SuspensePage><RecruiterDashboardPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/negotiate"
          element={
            <ProtectedRoute>
              <SuspensePage><NegotiationCompanionPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute>
              <SuspensePage><CoverLetterPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <SuspensePage><JobTrackerPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <SuspensePage><SkillProgressPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/linkedin"
          element={
            <ProtectedRoute>
              <SuspensePage><LinkedInOptimizerPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-versions"
          element={
            <ProtectedRoute>
              <SuspensePage><ResumeVersionsPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/benchmark"
          element={
            <ProtectedRoute>
              <SuspensePage><BenchmarkPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/negotiation-roleplay"
          element={
            <ProtectedRoute>
              <SuspensePage><NegotiationRoleplayPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <SuspensePage><RecommendationsPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/market-demand"
          element={
            <ProtectedRoute>
              <SuspensePage><MarketDemandPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/career-path"
          element={
            <ProtectedRoute>
              <SuspensePage><CareerPathPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <SuspensePage><ChatPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <SuspensePage><AdminDashboardPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
        <Route
          path="/dev"
          element={
            <ProtectedRoute>
              <SuspensePage><DeveloperPortalPage /></SuspensePage>
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
