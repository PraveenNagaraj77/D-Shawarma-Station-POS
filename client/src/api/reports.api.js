import http from './http.js'

export const getSalesReport = async (params = {}) => {
  const { data } = await http.get('/reports/sales', { params })
  return data
}
