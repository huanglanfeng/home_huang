const jwt = require('jsonwebtoken')
const { error } = require('../utils/response')

const JWT_SECRET = 'make-dinner-secret-key-2024'

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, 401, '未登录，请先登录')
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    req.user = decoded
    next()
  } catch (err) {
    return error(res, 401, '登录已过期，请重新登录')
  }
}

module.exports = { auth, JWT_SECRET }
