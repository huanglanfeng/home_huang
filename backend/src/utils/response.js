exports.success = (res, data = null, message = '成功') => {
  res.json({ code: 200, message, data })
}

exports.error = (res, code = 400, message = '请求失败') => {
  res.json({ code, message })
}
