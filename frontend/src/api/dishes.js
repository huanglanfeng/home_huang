import request from '../utils/request'

export function getCategories() {
  return request.get('/categories')
}

export function getDishes(params) {
  return request.get('/dishes', { params })
}

export function getDishDetail(dishId) {
  return request.get(`/dishes/${dishId}`)
}
