import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401) {
      const role = localStorage.getItem('role') || 'student'
      localStorage.removeItem('token')
      if (typeof window !== 'undefined') {
        window.location.replace(role === 'admin' ? '/admin/login' : '/login')
      }
    }
    return Promise.reject(error)
  }
)

export default api


