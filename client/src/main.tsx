import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Register from './pages/Register'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Semester from './pages/Semester'
import Resume from './pages/Resume'
import AdminLogin from './pages/admin/AdminLogin'
import Departments from './pages/admin/Departments'
import StudentList from './pages/admin/StudentList'
import StudentDetails from './pages/admin/StudentDetails'
import Reps from './pages/admin/Reps'
import Staff from './pages/admin/Staff'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import FrontPage from './pages/FrontPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<FrontPage />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        
        {/* Protected student routes */}
        <Route path="/profile" element={
          <ProtectedRoute requiredRole="student">
            <Profile />
          </ProtectedRoute>
        } />
        <Route path="/profile/semester" element={
          <ProtectedRoute requiredRole="student">
            <Semester />
          </ProtectedRoute>
        } />
        <Route path="/profile/resume" element={
          <ProtectedRoute requiredRole="student">
            <Resume />
          </ProtectedRoute>
        } />
        <Route path="/edit" element={
          <ProtectedRoute requiredRole="student">
            <EditProfile />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/departments" element={
          <ProtectedRoute requiredRole="admin_or_staff">
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute requiredRole="admin_or_rep">
            <StudentList />
          </ProtectedRoute>
        } />
        <Route path="/admin/students/:id" element={
          <ProtectedRoute requiredRole="admin_or_rep">
            <StudentDetails />
          </ProtectedRoute>
        } />
        <Route path="/admin/reps" element={
          <ProtectedRoute requiredRole="admin_or_staff">
            <Reps />
          </ProtectedRoute>
        } />
        <Route path="/admin/staff" element={
          <ProtectedRoute requiredRole="admin">
            <Staff />
          </ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)



