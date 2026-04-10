import request from '../utils/request'

export function login(data) {
  return request.post('/auth/login', {
    nickname: data.username || data.nickname,
    password: data.password
  })
}

export function register(data) {
  return request.post('/auth/register', {
    nickname: data.nickname || data.username,
    password: data.password
  })
}

export function getProfile() {
  return request.get('/auth/me')
}

// 管理员管理家庭成员
export function getMembers() {
  return request.get('/auth/members')
}

export function addMember(data) {
  return request.post('/auth/members', data)
}

export function updateMember(id, data) {
  return request.put(`/auth/members/${id}`, data)
}

export function deleteMember(id) {
  return request.delete(`/auth/members/${id}`)
}
