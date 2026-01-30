import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'


export default function RequireAdmin({ children }: { children: React.ReactNode }) {
    const { user, isAdmin, isLoading } = useAuth()
    const location = useLocation()

    if (isLoading) return null

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location.pathname }} />
    }

    if (!isAdmin) {
        // Redirect non-admins to the app home instead of login
        return <Navigate to="/app" replace />
    }

    return children
}
