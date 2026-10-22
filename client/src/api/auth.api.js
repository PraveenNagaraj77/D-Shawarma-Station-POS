import http from './http.js'

export const login = async (credentials) => {
  const { data } = await http.post('/auth/login', credentials)
  return data
}

export const changePassword = async (payload) => {
  const { data } = await http.post('/auth/change-password', payload)
  return data
}
