import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import TeacherDashboard from './pages/TeacherDashboard'
import TeacherStudents from './pages/TeacherStudents'
import TeacherAnalytics from './pages/TeacherAnalytics'
import { validateToken } from './services/api'

// Auth Context
const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

// Protected Route Component
function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth()
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '4px solid rgba(99,102,241,0.2)', borderTopColor: '#6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }}></div>
      <p style={{ color: '#64748b', fontWeight: 500 }}>Loading AMEP...</p>
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (role && user.role !== role) {
    return <Navigate to={user.role === 'student' ? '/student' : '/teacher'} replace />
  }
  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Validate token on mount and persist across refreshes
  useEffect(() => {
    const token = localStorage.getItem('amep_token')
    const cachedUser = localStorage.getItem('amep_user')

    if (!token) { setLoading(false); return }

    // Optimistically set cached user first for faster render
    if (cachedUser) {
      try { setUser(JSON.parse(cachedUser)) } catch {}
    }

    validateToken()
      .then(res => {
        if (res.valid && res.user) {
          setUser(res.user)
          localStorage.setItem('amep_user', JSON.stringify(res.user))
        } else {
          localStorage.removeItem('amep_token')
          localStorage.removeItem('amep_user')
          setUser(null)
        }
      })
      .catch(() => {
        // Keep cached user if network is down — graceful degradation
        if (!cachedUser) {
          localStorage.removeItem('amep_token')
          setUser(null)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  const handleLogin = (userData, token) => {
    localStorage.setItem('amep_token', token)
    localStorage.setItem('amep_user', JSON.stringify(userData))
    setUser(userData)
  }

  const handleLogout = () => {
    localStorage.removeItem('amep_token')
    localStorage.removeItem('amep_user')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login: handleLogin, logout: handleLogout }}>
      <Routes>
          {/* Public */}
          <Route path="/login" element={user && !loading ? <Navigate to={user.role === 'student' ? '/student' : '/teacher'} replace /> : <Login />} />

          {/* Student Routes */}
          <Route path="/student" element={
            <ProtectedRoute role="student">
              <Layout><StudentDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/student/profile" element={
            <ProtectedRoute role="student">
              <Layout><StudentProfile /></Layout>
            </ProtectedRoute>
          } />

          {/* Teacher Routes */}
          <Route path="/teacher" element={
            <ProtectedRoute role="teacher">
              <Layout><TeacherDashboard /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/students" element={
            <ProtectedRoute role="teacher">
              <Layout><TeacherStudents /></Layout>
            </ProtectedRoute>
          } />
          <Route path="/teacher/analytics" element={
            <ProtectedRoute role="teacher">
              <Layout><TeacherAnalytics /></Layout>
            </ProtectedRoute>
          } />

          {/* Redirect root */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* 404 */}
          <Route path="*" element={
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', gap: '1rem' }}>
              <div style={{ fontSize: '4rem' }}>🔍</div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Page Not Found</h2>
              <a href="/login" style={{ color: '#6366f1', fontWeight: 600 }}>← Back to Login</a>
            </div>
          } />
        </Routes>
    </AuthContext.Provider>
  )
}

export default App
