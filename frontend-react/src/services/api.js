import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Prediction API
export const predict = async (data) => {
  const response = await api.post('/predict', data)
  return response.data
}

// Students API
export const getStudents = async () => {
  const response = await api.get('/students')
  return response.data
}

export const getStudent = async (id) => {
  const response = await api.get(`/students/${id}`)
  return response.data
}

export const addStudent = async (data) => {
  const response = await api.post('/add-student', data)
  return response.data
}

export const updateStudent = async (id, data) => {
  const response = await api.put(`/students/${id}`, data)
  return response.data
}

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`)
  return response.data
}

// Analytics API
export const getClassAnalytics = async () => {
  const response = await api.get('/class-analytics')
  return response.data
}

// Health check
export const healthCheck = async () => {
  const response = await api.get('/health')
  return response.data
}

export default api
