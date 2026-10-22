import axios from 'axios'

const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

http.interceptors.request.use((config) => {
  const token = localStorage.getItem('dss_access_token')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  return config
})

http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message =
        error.response.data?.message || 'The request could not be completed.'

      return Promise.reject(
        Object.assign(new Error(message), {
          status: error.response.status,
          data: error.response.data,
        }),
      )
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(
        new Error('The request timed out. Please try again.'),
      )
    }

    return Promise.reject(
      new Error('Unable to reach the POS server. Check that the backend is running.'),
    )
  },
)

export default http
