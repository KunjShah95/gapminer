import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import Dashboard from "@/pages/Dashboard";
import AnalyzerPage from "@/pages/AnalyzerPage";
import RoadmapPage from "@/pages/RoadmapPage";
import ProfilePage from "@/pages/ProfilePage";
import PricingPage from "@/pages/PricingPage";
import LatexEditorPage from "@/pages/LatexEditorPage";
import InterviewSimulationPage from "@/pages/InterviewSimulationPage";
import RecruiterDashboardPage from "@/pages/RecruiterDashboardPage";
import NegotiationCompanionPage from "@/pages/NegotiationCompanionPage";
import { CoverLetterPage } from "@/pages/CoverLetterPage";
import JobTrackerPage from "@/pages/JobTrackerPage";
import SkillProgressPage from "@/pages/SkillProgressPage";
import LinkedInOptimizerPage from "@/pages/LinkedInOptimizerPage";
import ResumeVersionsPage from "@/pages/ResumeVersionsPage";
import BenchmarkPage from "@/pages/BenchmarkPage";
import NegotiationRoleplayPage from "@/pages/NegotiationRoleplayPage";
import RecommendationsPage from "@/pages/RecommendationsPage";
import MarketDemandPage from "@/pages/MarketDemandPage";
import CareerPathPage from "@/pages/CareerPathPage";
import AppLayout from "@/layouts/AppLayout";

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/pricing" element={<PricingPage />} />

      {/* Protected App Routes */}
      <Route element={<AppLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analyze"
          element={
            <ProtectedRoute>
              <AnalyzerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/latex/:id?"
          element={
            <ProtectedRoute>
              <LatexEditorPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/roadmap/:id"
          element={
            <ProtectedRoute>
              <RoadmapPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview"
          element={
            <ProtectedRoute>
              <InterviewSimulationPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recruiter"
          element={
            <ProtectedRoute>
              <RecruiterDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/negotiate"
          element={
            <ProtectedRoute>
              <NegotiationCompanionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cover-letter"
          element={
            <ProtectedRoute>
              <CoverLetterPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/jobs"
          element={
            <ProtectedRoute>
              <JobTrackerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/progress"
          element={
            <ProtectedRoute>
              <SkillProgressPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/linkedin"
          element={
            <ProtectedRoute>
              <LinkedInOptimizerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resume-versions"
          element={
            <ProtectedRoute>
              <ResumeVersionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/benchmark"
          element={
            <ProtectedRoute>
              <BenchmarkPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/negotiation-roleplay"
          element={
            <ProtectedRoute>
              <NegotiationRoleplayPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/recommendations"
          element={
            <ProtectedRoute>
              <RecommendationsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market-demand"
          element={
            <ProtectedRoute>
              <MarketDemandPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/career-path"
          element={
            <ProtectedRoute>
              <CareerPathPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
