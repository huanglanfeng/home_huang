const express = require('express')
const multer = require('multer')
const path = require('path')
const crypto = require('crypto')
const router = express.Router()
const { auth } = require('../middleware/auth')
const admin = require('../middleware/admin')
const { success, error } = require('../utils/response')

// 配置 multer 存储
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../uploads'))
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname)
    const filename = crypto.randomUUID() + ext
    cb(null, filename)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 限制
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase())
    const mime = allowedTypes.test(file.mimetype)
    if (ext && mime) {
      cb(null, true)
    } else {
      cb(new Error('只支持 jpg、png、gif、webp 格式的图片'))
    }
  },
})

// POST /api/upload - 上传图片（管理员）
router.post('/', auth, admin, upload.single('file'), (req, res) => {
  if (!req.file) {
    return error(res, 400, '请选择要上传的图片')
  }

  const url = `/uploads/${req.file.filename}`
  success(res, { url }, '上传成功')
})

// 错误处理
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return error(res, 400, '文件大小不能超过5MB')
    }
    return error(res, 400, '上传失败: ' + err.message)
  }
  if (err) {
    return error(res, 400, err.message)
  }
  next()
})

module.exports = router
