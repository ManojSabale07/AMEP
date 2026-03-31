/**
 * AMEP API Service Layer v3.1
 * Centralized all API calls with axios interceptors
 */
import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Axios instance with base URL
const api = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// Auth token injected on every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('amep_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  },
  (error) => Promise.reject(error)
)

// Auto-logout on 401
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('amep_token')
      localStorage.removeItem('amep_user')
      // Don't force redirect here — let AuthContext handle it
    }
    return Promise.reject(error)
  }
)

// ============ Auth ============
export const login = (email, password, role) =>
  api.post('/auth/login', { email, password, role })

export const register = (email, password, name, role) =>
  api.post('/auth/register', { email, password, name, role })

export const logout = () =>
  api.post('/auth/logout')

export const validateToken = () =>
  api.get('/auth/validate')

export const getCurrentUser = () =>
  api.get('/auth/me')

export const refreshToken = () =>
  api.post('/auth/refresh')

// ============ Prediction ============
export const predict = (data) =>
  api.post('/predict', data)

export const predictMastery = (data) =>
  api.post('/predict-mastery', data)

export const predictPerformance = (data) =>
  api.post('/predict-performance', data)

// ============ Students (Teacher) ============
export const getStudents = () =>
  api.get('/students')

export const getStudent = (id) =>
  api.get(`/students/${id}`)

export const addStudent = (data) =>
  api.post('/add-student', data)

export const updateStudentAPI = (id, data) =>
  api.put(`/students/${id}`, data)

export const deleteStudent = (id) =>
  api.delete(`/students/${id}`)

// ============ Student Self-Profile ============
export const getStudentProfile = () =>
  api.get('/student/profile')

export const updateStudentProfile = (data) =>
  api.put('/student/profile', data)

// ============ Analytics ============
export const getClassAnalytics = () =>
  api.get('/class-analytics')

// ============ Health ============
export const healthCheck = () =>
  api.get('/health')

export default api
