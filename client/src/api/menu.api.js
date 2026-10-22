import http from './http.js'

export const getMenuItems = async (params = {}) => {
  const { data } = await http.get('/menu', { params })
  return data
}

export const getMenuItem = async (id) => {
  const { data } = await http.get(`/menu/${id}`)
  return data
}

export const createMenuItem = async (payload) => {
  const { data } = await http.post('/menu', payload)
  return data
}

export const updateMenuItem = async (id, payload) => {
  const { data } = await http.patch(`/menu/${id}`, payload)
  return data
}

export const updateMenuItemAvailability = async (id, payload) => {
  const { data } = await http.patch(`/menu/${id}/availability`, payload)
  return data
}

export const deleteMenuItem = async (id) => {
  const { data } = await http.delete(`/menu/${id}`)
  return data
}


export const uploadMenuImage = async (file) => {
  const formData = new FormData();
  formData.append("image", file);

  const { data } = await http.post("/menu/upload-image", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    // Never automatically retry an image upload.
    retry: 0,
  });

  return data;
};
