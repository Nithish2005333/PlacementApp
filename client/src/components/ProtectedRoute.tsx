import { Navigate, useLocation } from 'react-router-dom'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'student' | 'admin'
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  if (requiredRole && role !== requiredRole) {
    // Redirect to appropriate login page based on role
    return <Navigate to={role === 'admin' ? '/admin/login' : '/login'} replace />
  }

  return <>{children}</>
}

