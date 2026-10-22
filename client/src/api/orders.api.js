import http from './http.js'

export const getOrders = async (params = {}) => {
  const { data } = await http.get('/orders', { params })
  return data
}

export const getOrder = async (id) => {
  const { data } = await http.get(`/orders/${id}`)
  return data
}

export const createOrder = async (payload) => {
  const { data } = await http.post('/orders', payload)
  return data
}

export const cancelOrder = async (id) => {
  const { data } = await http.patch(`/orders/${id}/cancel`)
  return data
}
