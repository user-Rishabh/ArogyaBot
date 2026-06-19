import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import Landing   from './pages/Landing'
import Login     from './pages/Login'
import Signup    from './pages/Signup'
import Dashboard from './pages/Dashboard'
import Chat      from './pages/Chat'
import Onboarding from './pages/Onboarding'

function ProtectedRoute({ children, allowOnboardingOnly = false }) {
  const { user, loading, profileComplete } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center transition-colors duration-300">
        <div className="flex gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce-dot dot-1" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce-dot dot-2" />
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-bounce-dot dot-3" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Redirect to onboarding if profile is not complete
  if (!profileComplete && !allowOnboardingOnly) {
    return <Navigate to="/onboarding" replace />
  }

  // Redirect to dashboard if profile is complete but trying to visit onboarding
  if (profileComplete && allowOnboardingOnly) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"          element={<Landing />} />
      <Route path="/login"     element={<Login />} />
      <Route path="/signup"    element={<Signup />} />
      <Route
        path="/onboarding"
        element={
          <ProtectedRoute allowOnboardingOnly={true}>
            <Onboarding />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chat/:sessionId?"
        element={
          <ProtectedRoute>
            <Chat />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}

