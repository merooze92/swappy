import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext.jsx'
import { AddSkillForm, IncomingRequestsForm, ManageSkillsForm, ProviderRegistrationForm } from './forms/ProviderForms.jsx'
import { AdminLoginForm, PlatformManagementForm, SkillCategoryManagementForm, UserManagementForm } from './forms/AdminForms.jsx'
import { FeedbackForm, SeekerRegistrationForm, SkillExchangeRequestForm, SkillSearchRequestForm } from './forms/SeekerForms.jsx'
import {
  DashboardHome,
  DashboardLayout,
  ExchangeListPage,
  ProfilePage,
  ProtectedRoute,
} from './pages/Dashboards.jsx'
import LandingPage from './pages/LandingPage.jsx'
import './App.css'

function NotFound() {
  return (
    <main className="not-found-page container py-5">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
      <a className="btn btn-primary" href="/">Return to SWAPPY home</a>
    </main>
  )
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<div className="auth-page"><AdminLoginForm /></div>} />
      <Route path="/admin/login" element={<div className="auth-page"><AdminLoginForm /></div>} />
      <Route path="/seeker/register" element={<div className="auth-page"><SeekerRegistrationForm /></div>} />
      <Route path="/provider/register" element={<div className="auth-page"><ProviderRegistrationForm /></div>} />

      <Route
        path="/seeker"
        element={<ProtectedRoute role="seeker"><DashboardLayout role="seeker" /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome role="seeker" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="search" element={<SkillSearchRequestForm />} />
        <Route path="requests" element={<SkillSearchRequestForm />} />
        <Route path="exchanges" element={<ExchangeListPage role="seeker" />} />
        <Route path="exchanges/new" element={<SkillExchangeRequestForm />} />
        <Route path="feedback" element={<FeedbackForm />} />
      </Route>

      <Route
        path="/provider"
        element={<ProtectedRoute role="provider"><DashboardLayout role="provider" /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome role="provider" />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="skills" element={<AddSkillForm />} />
        <Route path="skills/manage" element={<ManageSkillsForm />} />
        <Route path="requests" element={<IncomingRequestsForm />} />
        <Route path="exchanges" element={<ExchangeListPage role="provider" />} />
        <Route path="feedback" element={<FeedbackForm />} />
      </Route>

      <Route
        path="/admin"
        element={<ProtectedRoute role="admin"><DashboardLayout role="admin" /></ProtectedRoute>}
      >
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<DashboardHome role="admin" />} />
        <Route path="users" element={<UserManagementForm />} />
        <Route path="skills" element={<SkillCategoryManagementForm />} />
        <Route path="platform" element={<PlatformManagementForm />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  )
}
