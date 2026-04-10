import request from '../utils/request'

// 分类管理
export function getCategories(params) {
  return request.get('/admin/categories', { params })
}

export function createCategory(data) {
  return request.post('/admin/categories', data)
}

export function updateCategory(id, data) {
  return request.put(`/admin/categories/${id}`, data)
}

export function deleteCategory(id) {
  return request.delete(`/admin/categories/${id}`)
}

// 菜品管理
export function getDishes(params) {
  return request.get('/admin/dishes', { params })
}

export function getDishDetail(id) {
  return request.get(`/admin/dishes/${id}`)
}

export function createDish(data) {
  return request.post('/admin/dishes', data)
}

export function updateDish(id, data) {
  return request.put(`/admin/dishes/${id}`, data)
}

export function deleteDish(id) {
  return request.delete(`/admin/dishes/${id}`)
}

export function uploadDishImage(formData) {
  return request.post('/admin/dishes/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

// 仪表盘统计
export function getDashboardStats() {
  return request.get('/admin/dashboard/stats')
}

// 订单管理（管理后台）
export function getAdminOrders(params) {
  return request.get('/admin/orders', { params })
}
