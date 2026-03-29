import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import LandingPage from '@/pages/LandingPage'
import AuthPage from '@/pages/AuthPage'
import Dashboard from '@/pages/Dashboard'
import AnalyzerPage from '@/pages/AnalyzerPage'
import RoadmapPage from '@/pages/RoadmapPage'
import ProfilePage from '@/pages/ProfilePage'
import PricingPage from '@/pages/PricingPage'
import LatexEditorPage from '@/pages/LatexEditorPage'
import InterviewSimulationPage from '@/pages/InterviewSimulationPage'
import RecruiterDashboardPage from '@/pages/RecruiterDashboardPage'
import NegotiationCompanionPage from '@/pages/NegotiationCompanionPage'
import AppLayout from '@/layouts/AppLayout'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
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
        <Route path="/dashboard" element={
          <ProtectedRoute><Dashboard /></ProtectedRoute>
        } />
        <Route path="/analyze" element={
          <ProtectedRoute><AnalyzerPage /></ProtectedRoute>
        } />
        <Route path="/latex/:id?" element={
          <ProtectedRoute><LatexEditorPage /></ProtectedRoute>
        } />
        <Route path="/roadmap/:id" element={
          <ProtectedRoute><RoadmapPage /></ProtectedRoute>
        } />
        <Route path="/profile" element={
          <ProtectedRoute><ProfilePage /></ProtectedRoute>
        } />
        <Route path="/interview" element={
          <ProtectedRoute><InterviewSimulationPage /></ProtectedRoute>
        } />
        <Route path="/recruiter" element={
          <ProtectedRoute><RecruiterDashboardPage /></ProtectedRoute>
        } />
        <Route path="/negotiate" element={
          <ProtectedRoute><NegotiationCompanionPage /></ProtectedRoute>
        } />
      </Route>


      {/* 404 */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
