import { Navigate, Route, Routes } from 'react-router-dom'
import { AppLayout } from '@/layouts/AppLayout'
import LandingPage from '@/pages/LandingPage'
import RequireAuth from '@/auth/RequireAuth'
import DiscoverPage from '@/pages/DiscoverPage'
import MatchesPage from '@/pages/MatchesPage'
import LeaderboardPage from '@/pages/LeaderboardPage'
import ProfilePage from '@/pages/ProfilePage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected app routes */}
      <Route path="/app" element={<AppLayout />}>
        <Route index element={<Navigate to="discover" replace />} />
        <Route path="discover" element={<DiscoverPage />} />
        <Route
          path="matches"
          element={
            <RequireAuth>
              <MatchesPage />
            </RequireAuth>
          }
        />
        <Route path="leaderboard" element={<LeaderboardPage />} />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />
      </Route>

      {/* Redirect old routes to new structure */}
      <Route path="/discover" element={<Navigate to="/app/discover" replace />} />
      <Route path="/matches" element={<Navigate to="/app/matches" replace />} />
      <Route path="/leaderboard" element={<Navigate to="/app/leaderboard" replace />} />
      <Route path="/profile" element={<Navigate to="/app/profile" replace />} />

      {/* Fallback route */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
