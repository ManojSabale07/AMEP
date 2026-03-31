import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../App'
import axios from 'axios'
import '../styles/Login.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function Login() {
  const [isRegister, setIsRegister] = useState(false)
  const [role, setRole] = useState('student')
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  const calculatePasswordStrength = (password) => {
    let strength = 0
    if (password.length >= 6) strength++
    if (password.length >= 10) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z\d]/.test(password)) strength++
    return Math.min(strength, 4)
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError('')
    
    if (name === 'password') {
      setPasswordStrength(calculatePasswordStrength(value))
    }
  }

  const validateForm = () => {
    if (!formData.email || !formData.password) {
      setError('Please fill in all required fields')
      return false
    }
    
    if (isRegister && !formData.name) {
      setError('Please enter your name')
      return false
    }
    
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return false
    }
    
    if (isRegister && formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setError('')
    
    try {
      if (isRegister) {
        // Register
        const response = await axios.post(`${API_URL}/auth/register`, {
          email: formData.email,
          password: formData.password,
          name: formData.name,
          role: role
        })
        
        if (response.data.success) {
          // Auto-login after registration
          const loginResponse = await axios.post(`${API_URL}/auth/login`, {
            email: formData.email,
            password: formData.password,
            role: role
          })
          
          if (loginResponse.data.success) {
            const { user, token } = loginResponse.data
            login(user, token)
            navigate(role === 'teacher' ? '/teacher' : '/student')
          }
        }
      } else {
        // Login
        const response = await axios.post(`${API_URL}/auth/login`, {
          email: formData.email,
          password: formData.password,
          role: role
        })
        
        if (response.data.success) {
          const { user, token } = response.data
          login(user, token)
          navigate(role === 'teacher' ? '/teacher' : '/student')
        }
      }
    } catch (err) {
      console.error('Auth error:', err)
      console.error('Error response:', err.response?.data)
      const errorMessage = err.response?.data?.error || err.message || 'Authentication failed. Please try again.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getPasswordStrengthLabel = () => {
    const labels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
    return labels[passwordStrength] || 'Weak'
  }

  const getPasswordStrengthColor = () => {
    const colors = ['#ef4444', '#f59e0b', '#eab308', '#10b981', '#059669']
    return colors[passwordStrength] || '#ef4444'
  }

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <span className="login-icon">🎓</span>
            <h1 className="app-title">AMEP</h1>
            <p className="app-subtitle">Adaptive Mastery & Learning Platform</p>
          </div>

          <div className="auth-tabs">
            <button 
              className={`auth-tab ${!isRegister ? 'active' : ''}`}
              onClick={() => {
                setIsRegister(false)
                setError('')
                setFormData({ name: '', email: '', password: '', confirmPassword: '' })
              }}
            >
              Sign In
            </button>
            <button 
              className={`auth-tab ${isRegister ? 'active' : ''}`}
              onClick={() => {
                setIsRegister(true)
                setError('')
                setFormData({ name: '', email: '', password: '', confirmPassword: '' })
              }}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit} className="auth-form">
            {error && (
              <div className="error-message slide-down">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <div className="form-group">
              <label>I am a</label>
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
                    <div className="role-text">
                      <span className="role-title">Student</span>
                      <span className="role-desc">Track my learning</span>
                    </div>
                  </div>
                  <div className="role-checkmark">✓</div>
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
                    <div className="role-text">
                      <span className="role-title">Teacher</span>
                      <span className="role-desc">Guide students</span>
                    </div>
                  </div>
                  <div className="role-checkmark">✓</div>
                </label>
              </div>
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  className="form-input"
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className="form-input"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="form-input"
                required
              />
              {isRegister && formData.password && (
                <div className="password-strength">
                  <div className="strength-bar">
                    <div 
                      className="strength-fill" 
                      style={{ 
                        width: `${(passwordStrength / 4) * 100}%`,
                        backgroundColor: getPasswordStrengthColor()
                      }}
                    ></div>
                  </div>
                  <span className="strength-label" style={{ color: getPasswordStrengthColor() }}>
                    {getPasswordStrengthLabel()}
                  </span>
                </div>
              )}
            </div>

            {isRegister && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Confirm Password</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className="form-input"
                  required
                />
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={loading}
            >
              {loading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span>{isRegister ? 'Create Account' : 'Sign In'}</span>
                  <span className="arrow">→</span>
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <p>
              {isRegister ? 'Already have an account?' : "Don't have an account?"}
              {' '}
              <button 
                className="link-button"
                onClick={() => {
                  setIsRegister(!isRegister)
                  setError('')
                  setFormData({ name: '', email: '', password: '', confirmPassword: '' })
                }}
              >
                {isRegister ? 'Sign In' : 'Sign Up'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
