const { error } = require('../utils/response')

const admin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return error(res, 403, '权限不足，需要管理员权限')
  }
  next()
}

module.exports = admin
