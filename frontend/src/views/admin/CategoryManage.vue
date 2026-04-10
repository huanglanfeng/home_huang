<template>
  <div class="category-manage">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon>
        新增分类
      </el-button>
    </div>

    <!-- 分类列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="categories"
        v-loading="loading"
        stripe
        size="small"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="名称" min-width="120" />
        <el-table-column prop="icon" label="图标" width="100">
          <template #default="{ row }">
            <span class="category-icon">{{ row.icon || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="100">
          <template #default="{ row }">
            {{ row.sort ?? row.sort_order ?? '-' }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.enabled === 1 || row.enabled === 'active' || row.status === 1 || row.status === 'active' ? 'success' : 'danger'" size="small">
              {{ row.enabled === 1 || row.enabled === 'active' || row.status === 1 || row.status === 'active' ? '启用' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" fixed="right" align="center">
          <template #default="{ row }">
            <el-dropdown trigger="click" @command="(cmd) => handleCommand(cmd, row)">
              <el-button type="primary" :icon="MoreFilled" circle size="small" />
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="edit" :icon="Edit">编辑</el-dropdown-item>
                  <el-dropdown-item command="delete" :icon="Delete" divided style="color: #f56c6c">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && categories.length === 0" description="暂无分类数据" />
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑分类' : '新增分类'"
      width="420px"
      :close-on-click-modal="false"
      destroy-on-close
      append-to-body
      align-center
    >
      <el-form
        ref="formRef"
        :model="formData"
        :rules="formRules"
        label-width="60px"
        class="category-form"
      >
        <el-form-item label="名称" prop="name">
          <el-input v-model="formData.name" placeholder="请输入分类名称" maxlength="20" />
        </el-form-item>
        <el-form-item label="图标" prop="icon">
          <el-input v-model="formData.icon" placeholder="请输入图标名或emoji" maxlength="10" />
        </el-form-item>
        <el-form-item label="排序" prop="sort_order">
          <el-input-number v-model="formData.sort_order" :min="0" :max="999" controls-position="right" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="formData.status"
            :active-value="1"
            :inactive-value="0"
            active-text="启用"
            inactive-text="禁用"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" :loading="submitLoading" @click="handleSubmit">确定</el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, MoreFilled, Edit, Delete } from '@element-plus/icons-vue'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/admin'

const loading = ref(false)
const submitLoading = ref(false)
const categories = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const formRef = ref(null)

const defaultForm = {
  name: '',
  icon: '',
  sort_order: 0,
  status: 1
}

const formData = reactive({ ...defaultForm })

const formRules = {
  name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { max: 20, message: '名称不能超过20个字符', trigger: 'blur' }
  ]
}

async function fetchCategories() {
  loading.value = true
  try {
    const res = await getCategories({ all: 'true' })
    categories.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
  } catch (err) {
    console.error('获取分类列表失败:', err)
    ElMessage.error('获取分类列表失败')
  } finally {
    loading.value = false
  }
}

function resetForm() {
  Object.assign(formData, { ...defaultForm })
  editId.value = null
  isEdit.value = false
}

function handleAdd() {
  resetForm()
  dialogVisible.value = true
}

function handleCommand(command, row) {
  if (command === 'edit') handleEdit(row)
  else if (command === 'delete') handleDelete(row)
}

function handleEdit(row) {
  resetForm()
  isEdit.value = true
  editId.value = row.id
  Object.assign(formData, {
    name: row.name || '',
    icon: row.icon || '',
    sort_order: row.sort ?? row.sort_order ?? 0,
    status: row.enabled !== undefined
      ? (row.enabled === 'active' ? 1 : (row.enabled === 'inactive' ? 0 : (typeof row.enabled === 'number' ? row.enabled : 1)))
      : (row.status === 'active' ? 1 : (row.status === 'inactive' ? 0 : (row.status ?? 1)))
  })
  dialogVisible.value = true
}

async function handleDelete(row) {
  try {
    await deleteCategory(row.id)
    ElMessage.success('删除成功')
    fetchCategories()
  } catch (err) {
    console.error('删除分类失败:', err)
    ElMessage.error('删除分类失败')
  }
}

async function handleSubmit() {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (!valid) return

    submitLoading.value = true
    try {
      const data = {
        name: formData.name,
        icon: formData.icon,
        sort: formData.sort_order,
        enabled: formData.status
      }

      if (isEdit.value) {
        await updateCategory(editId.value, data)
        ElMessage.success('更新成功')
      } else {
        await createCategory(data)
        ElMessage.success('创建成功')
      }

      dialogVisible.value = false
      fetchCategories()
    } catch (err) {
      console.error('保存分类失败:', err)
      ElMessage.error(isEdit.value ? '更新失败' : '创建失败')
    } finally {
      submitLoading.value = false
    }
  })
}

onMounted(() => {
  fetchCategories()
})
</script>

<style scoped>
.category-manage {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
}

.table-card {
  border-radius: var(--radius-md, 12px);
  border: none;
}

.category-icon {
  font-size: 24px;
  line-height: 1;
}

.category-form :deep(.el-form-item) {
  margin-bottom: 18px;
}

.dialog-footer {
  display: flex;
  justify-content: space-between;
}
</style>
