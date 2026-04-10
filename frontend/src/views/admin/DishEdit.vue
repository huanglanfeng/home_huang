<template>
  <div class="dish-edit">
    <div class="page-header">
      <el-button @click="$router.push('/admin/dishes')">
        <el-icon><ArrowLeft /></el-icon>
        返回列表
      </el-button>
    </div>

    <el-form
      ref="formRef"
      :model="formData"
      :rules="formRules"
      label-width="120px"
      class="dish-form"
      v-loading="pageLoading"
    >
      <!-- 基本信息 -->
      <el-card shadow="never" class="form-section">
        <template #header>
          <span class="section-title">基本信息</span>
        </template>

        <el-form-item label="菜品名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入菜品名称" maxlength="50" show-word-limit />
        </el-form-item>

        <el-form-item label="所属分类" prop="category_id">
          <el-select v-model="formData.category_id" placeholder="请选择分类" style="width: 100%;">
            <el-option
              v-for="cat in categoryList"
              :key="cat.id"
              :label="cat.name"
              :value="cat.id"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="菜品简介" prop="description">
          <el-input
            v-model="formData.description"
            type="textarea"
            placeholder="请输入菜品简介"
            :rows="3"
            maxlength="200"
            show-word-limit
          />
        </el-form-item>

        <el-form-item label="标签" prop="tags">
          <el-select
            v-model="formData.tags"
            multiple
            placeholder="请选择标签"
            style="width: 100%;"
            collapse-tags
            collapse-tags-tooltip
          >
            <el-option
              v-for="tag in tagOptions"
              :key="tag"
              :label="tag"
              :value="tag"
            />
          </el-select>
        </el-form-item>

        <el-form-item label="封面图" prop="cover_image">
          <el-upload
            class="cover-uploader"
            :action="uploadAction"
            :headers="uploadHeaders"
            name="file"
            :show-file-list="false"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept="image/*"
          >
            <el-image
              v-if="formData.cover_image"
              :src="formData.cover_image"
              fit="cover"
              class="cover-preview"
            />
            <div v-else class="cover-placeholder">
              <el-icon :size="32"><Plus /></el-icon>
              <span>上传封面图</span>
            </div>
          </el-upload>
          <div class="upload-tip">支持 JPG、PNG 格式，建议尺寸 400x400</div>
        </el-form-item>
      </el-card>

      <!-- 规格管理 -->
      <el-card shadow="never" class="form-section">
        <template #header>
          <div class="section-header">
            <span class="section-title">规格管理</span>
            <el-button type="primary" text size="small" @click="addSpecGroup">
              <el-icon><Plus /></el-icon>
              添加规格组
            </el-button>
          </div>
        </template>

        <div v-if="formData.spec_groups.length === 0" class="empty-specs">
          <el-empty description="暂无规格，点击上方按钮添加" :image-size="60" />
        </div>

        <div
          v-for="(group, gIndex) in formData.spec_groups"
          :key="gIndex"
          class="spec-group"
        >
          <div class="spec-group__header">
            <el-input
              v-model="group.name"
              placeholder="规格名称（如：甜度、份量）"
              style="width: 200px;"
            />
            <el-button type="danger" text size="small" @click="removeSpecGroup(gIndex)">
              <el-icon><Delete /></el-icon>
              删除规格组
            </el-button>
          </div>
          <div class="spec-group__options">
            <div
              v-for="(option, oIndex) in group.options"
              :key="oIndex"
              class="spec-option"
            >
              <el-input
                v-model="option.name"
                placeholder="选项名称（如：全糖、半糖）"
                style="width: 180px;"
              />
              <el-input-number
                v-model="option.price"
                placeholder="加价"
                :min="0"
                :precision="2"
                :step="1"
                controls-position="right"
                style="width: 140px;"
              />
              <el-button type="danger" text size="small" @click="removeSpecOption(gIndex, oIndex)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button type="primary" text size="small" @click="addSpecOption(gIndex)">
              <el-icon><Plus /></el-icon>
              添加选项
            </el-button>
          </div>
        </div>
      </el-card>

      <!-- 营养信息 -->
      <el-card shadow="never" class="form-section">
        <template #header>
          <span class="section-title">营养信息</span>
        </template>

        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="每份热量" prop="nutrition.calories">
              <el-input-number
                v-model="formData.nutrition.calories"
                :min="0"
                :max="99999"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <div class="unit-label">kcal</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="蛋白质" prop="nutrition.protein">
              <el-input-number
                v-model="formData.nutrition.protein"
                :min="0"
                :max="9999"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <div class="unit-label">g</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="碳水化合物" prop="nutrition.carbs">
              <el-input-number
                v-model="formData.nutrition.carbs"
                :min="0"
                :max="9999"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <div class="unit-label">g</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="脂肪" prop="nutrition.fat">
              <el-input-number
                v-model="formData.nutrition.fat"
                :min="0"
                :max="9999"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <div class="unit-label">g</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="钠" prop="nutrition.sodium">
              <el-input-number
                v-model="formData.nutrition.sodium"
                :min="0"
                :max="99999"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <div class="unit-label">mg</div>
            </el-form-item>
          </el-col>
          <el-col :xs="24" :sm="12" :md="8">
            <el-form-item label="膳食纤维" prop="nutrition.fiber">
              <el-input-number
                v-model="formData.nutrition.fiber"
                :min="0"
                :max="9999"
                :precision="1"
                controls-position="right"
                style="width: 100%;"
              />
              <div class="unit-label">g</div>
            </el-form-item>
          </el-col>
        </el-row>
      </el-card>

      <!-- 底部操作按钮 -->
      <div class="form-actions">
        <el-button size="large" @click="$router.push('/admin/dishes')">取消</el-button>
        <el-button type="primary" size="large" :loading="submitLoading" @click="handleSubmit">
          {{ isEdit ? '保存修改' : '确定添加' }}
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, Delete, ArrowLeft } from '@element-plus/icons-vue'
import { getToken } from '../../utils/auth'
import { getCategories, getDishDetail, createDish, updateDish, uploadDishImage } from '../../api/admin'

const route = useRoute()
const router = useRouter()

const formRef = ref(null)
const pageLoading = ref(false)
const submitLoading = ref(false)
const categoryList = ref([])

const isEdit = computed(() => !!route.params.id)

const tagOptions = [
  '低脂', '高蛋白', '儿童友好', '素食', '无麸质', '低糖', '高纤维', '快手菜'
]

const uploadAction = '/api/upload'
const uploadHeaders = computed(() => ({
  Authorization: `Bearer ${getToken()}`
}))

const defaultFormData = {
  name: '',
  category_id: null,
  description: '',
  tags: [],
  cover_image: '',
  spec_groups: [],
  nutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sodium: 0,
    fiber: 0
  }
}

const formData = reactive({
  name: '',
  category_id: null,
  description: '',
  tags: [],
  cover_image: '',
  spec_groups: [],
  nutrition: {
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    sodium: 0,
    fiber: 0
  }
})

const formRules = {
  name: [
    { required: true, message: '请输入菜品名称', trigger: 'blur' },
    { max: 50, message: '名称不能超过50个字符', trigger: 'blur' }
  ],
  category_id: [
    { required: true, message: '请选择所属分类', trigger: 'change' }
  ]
}

// 规格管理方法
function addSpecGroup() {
  formData.spec_groups.push({
    name: '',
    options: []
  })
}

function removeSpecGroup(index) {
  formData.spec_groups.splice(index, 1)
}

function addSpecOption(groupIndex) {
  formData.spec_groups[groupIndex].options.push({
    name: '',
    price: 0
  })
}

function removeSpecOption(groupIndex, optionIndex) {
  formData.spec_groups[groupIndex].options.splice(optionIndex, 1)
}

// 图片上传
function beforeUpload(file) {
  const isImage = file.type.startsWith('image/')
  const isLt5M = file.size / 1024 / 1024 < 5
  if (!isImage) {
    ElMessage.error('只能上传图片文件')
    return false
  }
  if (!isLt5M) {
    ElMessage.error('图片大小不能超过 5MB')
    return false
  }
  return true
}

function handleUploadSuccess(response) {
  if (response?.data?.url || response?.url) {
    formData.cover_image = response.data?.url || response.url
    ElMessage.success('图片上传成功')
  } else {
    ElMessage.error('图片上传返回数据异常')
  }
}

function handleUploadError() {
  ElMessage.error('图片上传失败')
}

// 获取分类列表
async function fetchCategories() {
  try {
    const res = await getCategories()
    categoryList.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
  } catch (err) {
    console.error('获取分类列表失败:', err)
  }
}

// 获取菜品详情（编辑模式）
async function fetchDishDetail() {
  if (!route.params.id) return

  pageLoading.value = true
  try {
    const res = await getDishDetail(route.params.id)
    const dish = res.data || res

    formData.name = dish.name || ''
    formData.category_id = dish.category_id || null
    formData.description = dish.description || ''
    formData.tags = dish.tags || []
    formData.cover_image = dish.cover || dish.cover_image || ''

    // 规格组 - 支持后端 specs 字段（label/value/price）映射到前端 spec_groups（name/price）
    if (dish.specs && Array.isArray(dish.specs)) {
      formData.spec_groups = dish.specs.map(s => ({
        name: s.label || s.name || '',
        options: (s.options || []).map(o => ({
          name: o.label || o.name || '',
          price: o.price || 0
        }))
      }))
    } else if (dish.spec_groups && Array.isArray(dish.spec_groups)) {
      formData.spec_groups = dish.spec_groups.map(g => ({
        name: g.name || '',
        options: (g.options || []).map(o => ({
          name: o.name || '',
          price: o.price || 0
        }))
      }))
    }

    // 营养信息 - 后端字段映射到前端字段
    const nutrition = dish.nutrition || {}
    formData.nutrition = {
      calories: nutrition.per_serving_kcal || nutrition.calories || 0,
      protein: nutrition.protein || 0,
      carbs: nutrition.carb || nutrition.carbs || 0,
      fat: nutrition.fat || 0,
      sodium: nutrition.sodium || 0,
      fiber: nutrition.fiber || 0
    }
  } catch (err) {
    console.error('获取菜品详情失败:', err)
    ElMessage.error('获取菜品详情失败')
  } finally {
    pageLoading.value = false
  }
}

// 提交表单
async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      const data = {
        name: formData.name,
        category_id: formData.category_id,
        description: formData.description,
        tags: formData.tags,
        cover: formData.cover_image,
        specs: formData.spec_groups.filter(g => g.name.trim()),
        nutrition: {
          per_serving_kcal: formData.nutrition.calories,
          protein: formData.nutrition.protein,
          carb: formData.nutrition.carbs,
          fat: formData.nutrition.fat,
          sodium: formData.nutrition.sodium,
          fiber: formData.nutrition.fiber
        }
      }

      if (isEdit.value) {
        await updateDish(route.params.id, data)
        ElMessage.success('更新成功')
      } else {
        await createDish(data)
        ElMessage.success('创建成功')
      }

      router.push('/admin/dishes')
    } catch (err) {
      console.error('保存菜品失败:', err)
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchCategories()
  if (isEdit.value) {
    fetchDishDetail()
  }
})
</script>

<style scoped>
.dish-edit {
  max-width: 900px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.page-title {
  font-size: var(--font-size-xl, 20px);
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
  margin: 0;
}

.form-section {
  margin-bottom: 20px;
  border-radius: var(--radius-md, 12px);
  border: none;
}

.section-title {
  font-size: var(--font-size-lg, 18px);
  font-weight: 600;
  color: var(--color-text-primary, #1A1A1A);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* 封面图上传 */
.cover-uploader {
  line-height: 1;
}

.cover-preview {
  width: 148px;
  height: 148px;
  border-radius: var(--radius-sm, 8px);
  border: 1px dashed var(--color-border, #eee);
}

.cover-placeholder {
  width: 148px;
  height: 148px;
  border: 1px dashed var(--color-border, #ddd);
  border-radius: var(--radius-sm, 8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--color-text-hint, #999);
  cursor: pointer;
  transition: border-color 0.3s;
}

.cover-placeholder:hover {
  border-color: var(--color-primary, #00B578);
  color: var(--color-primary, #00B578);
}

.cover-placeholder span {
  font-size: 12px;
}

.upload-tip {
  font-size: 12px;
  color: var(--color-text-hint, #999);
  margin-top: 4px;
}

/* 规格管理 */
.empty-specs {
  padding: 10px 0;
}

.spec-group {
  border: 1px solid var(--color-border, #eee);
  border-radius: var(--radius-sm, 8px);
  padding: 16px;
  margin-bottom: 12px;
}

.spec-group__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.spec-group__options {
  padding-left: 20px;
}

.spec-option {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

/* 营养信息 */
.unit-label {
  font-size: 12px;
  color: var(--color-text-hint, #999);
  margin-top: 2px;
}

/* 底部操作 */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 0;
  border-top: 1px solid var(--color-border, #eee);
  margin-top: 20px;
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .spec-group__header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .spec-group__header .el-input {
    width: 100% !important;
  }

  .spec-option {
    flex-wrap: wrap;
  }

  .spec-option .el-input {
    width: 100% !important;
  }

  .spec-option .el-input-number {
    width: 100% !important;
  }
}
</style>
