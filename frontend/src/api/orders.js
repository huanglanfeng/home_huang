import request from '../utils/request'

export function createOrder(data) {
  return request.post('/orders', data)
}

export function getOrders(params) {
  return request.get('/orders', { params })
}

export function getOrderDetail(orderId) {
  return request.get(`/orders/${orderId}`)
}

export function updateOrderStatus(orderId, status) {
  return request.patch(`/orders/${orderId}/status`, { status })
}
