import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { SignIn, SignUp } from '@clerk/clerk-react'
import { useAuth } from '../App'
import '../styles/Login.css'

function Login({ clerkEnabled }) {
  const [name, setName] = useState('')
  const [role, setRole] = useState('student')
  const [showSignUp, setShowSignUp] = useState(false)
  const { login, setRole: setAuthRole } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    login(name, role)
    setAuthRole(role)
    navigate(role === 'teacher' ? '/teacher' : '/student')
  }

  // If Clerk is enabled, show Clerk's sign in
  if (clerkEnabled) {
    return (
      <div className="login-page">
        <div className="login-container">
          <div className="login-card clerk-card">
            <div className="login-header">
              <span className="login-icon">🎓</span>
              <h1>AMEP</h1>
              <p>Adaptive Mastery & Learning Platform</p>
            </div>

            <div className="clerk-auth">
              {showSignUp ? (
                <SignUp
                  routing="hash"
                  afterSignUpUrl="/login"
                  signInUrl="/login"
                />
              ) : (
                <SignIn
                  routing="hash"
                  afterSignInUrl="/login"
                  signUpUrl="/login"
                />
              )}
            </div>

            <div className="auth-toggle">
              <button onClick={() => setShowSignUp(!showSignUp)}>
                {showSignUp ? 'Already have an account? Sign In' : 'Need an account? Sign Up'}
              </button>
            </div>

            {/* Role selection after Clerk auth */}
            <div className="role-selection-clerk">
              <h3>Select Your Role</h3>
              <div className="role-selector">
                <label className={`role-card ${role === 'student' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === 'student'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <div className="role-content">
                    <span className="role-icon">📚</span>
                    <span className="role-title">Student</span>
                  </div>
                </label>
                <label className={`role-card ${role === 'teacher' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <div className="role-content">
                    <span className="role-icon">👨‍🏫</span>
                    <span className="role-title">Teacher</span>
                  </div>
                </label>
              </div>
              <button
                className="btn-continue"
                onClick={() => {
                  setAuthRole(role)
                  navigate(role === 'teacher' ? '/teacher' : '/student')
                }}
              >
                Continue as {role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Demo mode (no Clerk)
  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-icon">🎓</span>
            <h1>AMEP</h1>
            <p>Adaptive Mastery & Learning Platform</p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="name">Your Name</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                required
              />
            </div>

            <div className="form-group">
              <label>Select Your Role</label>
              <div className="role-selector">
                <label className={`role-card ${role === 'student' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="student"
                    checked={role === 'student'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <div className="role-content">
                    <span className="role-icon">📚</span>
                    <span className="role-title">Student</span>
                    <span className="role-desc">Get personalized learning guidance</span>
                  </div>
                </label>
                <label className={`role-card ${role === 'teacher' ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="role"
                    value="teacher"
                    checked={role === 'teacher'}
                    onChange={(e) => setRole(e.target.value)}
                  />
                  <div className="role-content">
                    <span className="role-icon">👨‍🏫</span>
                    <span className="role-title">Teacher</span>
                    <span className="role-desc">Monitor and guide students</span>
                  </div>
                </label>
              </div>
            </div>

            <button type="submit" className="btn-primary">
              <span>Enter Platform</span>
              <span className="arrow">→</span>
            </button>
          </form>

          <div className="demo-notice">
            <p>🔔 Demo Mode Active - No authentication required</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
