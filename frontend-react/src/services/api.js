import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('amep_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - redirect to login
      localStorage.removeItem('amep_token');
      localStorage.removeItem('amep_user');
      localStorage.removeItem('amep_role');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (email, password, name, role) =>
    axios.post(`${API_URL}/auth/register`, { email, password, name, role }),
  
  login: (email, password, role) =>
    axios.post(`${API_URL}/auth/login`, { email, password, role }),
  
  logout: () =>
    api.post('/auth/logout'),
  
  validate: () =>
    api.get('/auth/validate'),
  
  getCurrentUser: () =>
    api.get('/auth/me'),
};

// Prediction API
export const predict = async (data) => {
  const response = await api.post('/predict', data);
  return response.data;
};

// Student API  
export const getStudentProfile = async () => {
  const response = await api.get('/student/profile');
  return response.data;
};

export const updateStudentProfile = async (data) => {
  const response = await api.put('/student/profile', data);
  return response.data;
};

export const getStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const getStudent = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const addStudent = async (data) => {
  const response = await api.post('/add-student', data);
  return response.data;
};

export const updateStudent = async (id, data) => {
  const response = await api.put(`/students/${id}`, data);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

// Analytics API
export const getClassAnalytics = async () => {
  const response = await api.get('/class-analytics');
  return response.data;
};

// Health check
export const healthCheck = async () => {
  const response = await axios.get(`${API_URL}/health`);
  return response.data;
};

export default api;
