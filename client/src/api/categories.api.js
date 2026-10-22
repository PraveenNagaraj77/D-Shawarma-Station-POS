import http from './http.js'

export const getCategories = async () => {
  const { data } = await http.get('/categories')
  return data
}

export const createCategory = async (payload) => {
  const { data } = await http.post('/categories', payload)
  return data
}

export const updateCategory = async (id, payload) => {
  const { data } = await http.patch(`/categories/${id}`, payload)
  return data
}

export const deleteCategory = async (id) => {
  const { data } = await http.delete(`/categories/${id}`)
  return data
}
