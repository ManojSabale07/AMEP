import { useState, useEffect, createContext, useContext } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

// Import pages
import Login from './pages/Login'
import StudentDashboard from './pages/StudentDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import Layout from './components/Layout'

// Auth Context
const AuthContext = createContext(null)

export const useAuth = () => {
  const context = useContext(AuthContext)
  return context
}

// Protected Route Component
const ProtectedRoute = ({ children, allowedRole }) => {
  const auth = useAuth()

  if (!auth?.isLoggedIn) {
    return <Navigate to="/login" replace />
  }

  if (allowedRole && auth?.role !== allowedRole) {
    return <Navigate to={auth?.role === 'teacher' ? '/teacher' : '/student'} replace />
  }

  return children
}

function App() {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark'
  })

  useEffect(() => {
    // Apply dark mode
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  // Auto-restore session from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem('amep_user')
    const savedRole = localStorage.getItem('amep_role')
    if (savedUser && savedRole) {
      setUser(JSON.parse(savedUser))
      setRole(savedRole)
      setIsLoggedIn(true)
    }
  }, [])

  const login = (name, selectedRole) => {
    const userData = { name, email: `${name.toLowerCase().replace(' ', '.')}@demo.com` }
    setUser(userData)
    setRole(selectedRole)
    setIsLoggedIn(true)
    localStorage.setItem('amep_user', JSON.stringify(userData))
    localStorage.setItem('amep_role', selectedRole)
  }

  const logout = () => {
    setUser(null)
    setRole(null)
    setIsLoggedIn(false)
    localStorage.removeItem('amep_user')
    localStorage.removeItem('amep_role')
  }

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev)
  }

  const authValue = {
    user,
    role,
    setRole,
    isLoggedIn,
    login,
    logout,
    darkMode,
    toggleDarkMode
  }

  return (
    <AuthContext.Provider value={authValue}>
      <div className="app" data-theme={darkMode ? 'dark' : 'light'}>
        <Routes>
          {/* Login Route */}
          <Route
            path="/login"
            element={
              isLoggedIn
                ? <Navigate to={role === 'teacher' ? '/teacher' : '/student'} replace />
                : <Login />
            }
          />

          {/* Student Dashboard */}
          <Route
            path="/student/*"
            element={
              <ProtectedRoute allowedRole="student">
                <Layout>
                  <StudentDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Teacher Dashboard */}
          <Route
            path="/teacher/*"
            element={
              <ProtectedRoute allowedRole="teacher">
                <Layout>
                  <TeacherDashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </AuthContext.Provider>
  )
}

export default App
