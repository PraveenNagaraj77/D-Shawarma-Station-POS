import http from './http.js'

export const getDashboard = async (date) => {
  const { data } = await http.get('/dashboard', {
    params: date ? { date } : {},
  })
  return data
}
