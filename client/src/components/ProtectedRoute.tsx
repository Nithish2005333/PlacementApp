import { Navigate, useLocation } from 'react-router-dom'

type RoleRequirement = 'student' | 'admin' | 'staff' | 'rep' | 'admin_or_rep' | 'admin_or_staff';

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: RoleRequirement
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const location = useLocation()
  const token = localStorage.getItem('token')
  const role = localStorage.getItem('role')

  if (!token) {
    // Decide login page based on target role
    const needsAdminLogin = requiredRole === 'admin' || requiredRole === 'staff' || requiredRole === 'admin_or_rep' || requiredRole === 'admin_or_staff'
    return <Navigate to={needsAdminLogin ? '/admin/login' : '/login'} state={{ from: location }} replace />
  }

  if (requiredRole) {
    if (requiredRole === 'admin_or_rep') {
      // Treat staff like admin for access
      if (role !== 'admin' && role !== 'rep' && role !== 'staff') {
        return <Navigate to={role === 'student' ? '/login' : '/admin/login'} replace />
      }
    } else if (requiredRole === 'admin_or_staff') {
      if (role !== 'admin' && role !== 'staff') {
        return <Navigate to={role === 'student' ? '/login' : '/admin/login'} replace />
      }
    } else if (role !== requiredRole) {
      return <Navigate to={role === 'admin' || role === 'staff' || role === 'rep' ? '/admin/login' : '/login'} replace />
    }
  }

  return <>{children}</>
}

