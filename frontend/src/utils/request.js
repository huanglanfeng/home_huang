import axios from 'axios'
import { getToken } from './auth'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 10000
})

request.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  res => {
    const data = res.data
    // 业务状态码检查：code 非 200 视为业务错误
    if (data && data.code !== undefined && data.code !== 200) {
      const err = new Error(data.message || '请求失败')
      err.response = { data }
      return Promise.reject(err)
    }
    return data
  },
  err => {
    console.error('请求错误:', err)
    return Promise.reject(err)
  }
)

export default request
