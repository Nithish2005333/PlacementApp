import Resume from './pages/Resume'
        <Route path="/profile/resume" element={
          <ProtectedRoute requiredRole="student">
            <Resume />
          </ProtectedRoute>
        } />
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Register from './pages/Register'
import Login from './pages/Login'
import Profile from './pages/Profile'
import EditProfile from './pages/EditProfile'
import Semester from './pages/Semester'
import AdminLogin from './pages/admin/AdminLogin'
import Dashboard from './pages/admin/Dashboard'
import Departments from './pages/admin/Departments'
import StudentList from './pages/admin/StudentList'
import StudentDetails from './pages/admin/StudentDetails'
import ProtectedRoute from './components/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        
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
        <Route path="/edit" element={
          <ProtectedRoute requiredRole="student">
            <EditProfile />
          </ProtectedRoute>
        } />

        {/* Admin routes */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={
          <ProtectedRoute requiredRole="admin">
            <Dashboard />
          </ProtectedRoute>
        } />
        <Route path="/admin/departments" element={
          <ProtectedRoute requiredRole="admin">
            <Departments />
          </ProtectedRoute>
        } />
        <Route path="/admin/students" element={
          <ProtectedRoute requiredRole="admin">
            <StudentList />
          </ProtectedRoute>
        } />
        <Route path="/admin/students/:id" element={
          <ProtectedRoute requiredRole="admin">
            <StudentDetails />
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



