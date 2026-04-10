<template>
  <div class="dish-manage">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <el-input
          v-model="keyword"
          placeholder="搜索菜品名称"
          clearable
          class="search-input"
          @input="handleSearch"
        />
        <el-select
          v-model="filterCategoryId"
          placeholder="全部分类"
          clearable
          class="filter-select"
          @change="handleFilter"
        >
          <el-option
            v-for="cat in categoryList"
            :key="cat.id"
            :label="cat.name"
            :value="cat.id"
          />
        </el-select>
      </div>
      <el-button type="primary" @click="$router.push('/admin/dishes/edit')">
        <el-icon><Plus /></el-icon>
        新增菜品
      </el-button>
    </div>

    <!-- 菜品列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="dishList"
        v-loading="loading"
        stripe
        size="small"
        style="width: 100%"
      >
        <el-table-column prop="id" label="ID" width="70" />
        <el-table-column label="封面图" width="60">
          <template #default="{ row }">
            <el-image
              v-if="row.cover_image"
              :src="row.cover_image"
              :preview-src-list="[row.cover_image]"
              fit="cover"
              class="dish-cover dish-cover-small"
              preview-teleported
            />
            <span v-else class="no-image">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="name" label="名称" min-width="140" show-overflow-tooltip />
        <el-table-column label="分类" width="120">
          <template #default="{ row }">
            {{ row.category_name || row.category?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="标签" width="120">
          <template #default="{ row }">
            <template v-if="row.tags && row.tags.length > 0">
              <el-tag
                v-for="tag in row.tags.slice(0, 3)"
                :key="tag"
                size="small"
                type="info"
                style="margin-right: 4px; margin-bottom: 4px;"
              >
                {{ tag }}
              </el-tag>
              <el-tag v-if="row.tags.length > 3" size="small" type="info">
                +{{ row.tags.length - 3 }}
              </el-tag>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag
              :type="row.enabled === 1 || row.enabled === 'active' || row.status === 1 || row.status === 'active' ? 'success' : 'danger'"
              size="small"
            >
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
                  <el-dropdown-item command="toggle" :icon="row.enabled === 1 || row.enabled === 'active' || row.status === 1 || row.status === 'active' ? TurnOff : Open">
                    {{ row.enabled === 1 || row.enabled === 'active' || row.status === 1 || row.status === 'active' ? '禁用' : '启用' }}
                  </el-dropdown-item>
                  <el-dropdown-item command="delete" :icon="Delete" divided style="color: #f56c6c">删除</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && dishList.length === 0" description="暂无菜品数据" />

      <!-- 分页 -->
      <div v-if="total > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          background
          small
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Plus, MoreFilled, Edit, Delete, TurnOff, Open } from '@element-plus/icons-vue'
import { getDishes, deleteDish, updateDish, getCategories } from '../../api/admin'

const router = useRouter()
const loading = ref(false)
const allDishes = ref([])
const categoryList = ref([])
const filterCategoryId = ref(null)
const keyword = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const filteredDishes = computed(() => {
  let list = allDishes.value
  if (keyword.value) {
    list = list.filter(d => d.name.includes(keyword.value))
  }
  return list
})

const dishList = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredDishes.value.slice(start, start + pageSize.value)
})

const total = computed(() => filteredDishes.value.length)

async function fetchCategories() {
  try {
    const res = await getCategories()
    categoryList.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
  } catch (err) {
    console.error('获取分类列表失败:', err)
  }
}

async function fetchDishes() {
  loading.value = true
  try {
    const params = { all: 'true' }
    if (filterCategoryId.value) {
      params.category_id = filterCategoryId.value
    }

    const res = await getDishes(params)
    if (Array.isArray(res.data)) {
      allDishes.value = res.data
    } else {
      allDishes.value = res.data?.list || res.data?.dishes || []
    }
  } catch (err) {
    console.error('获取菜品列表失败:', err)
    ElMessage.error('获取菜品列表失败')
  } finally {
    loading.value = false
  }
}

function handleFilter() {
  currentPage.value = 1
  fetchDishes()
}

function handleSearch() {
  currentPage.value = 1
}

function handleSizeChange() {
  currentPage.value = 1
}

function handlePageChange() {
  // currentPage 已通过 v-model 自动更新
}

function handleCommand(command, row) {
  if (command === 'edit') handleEdit(row)
  else if (command === 'toggle') handleToggleStatus(row)
  else if (command === 'delete') handleDelete(row)
}

function handleEdit(row) {
  router.push(`/admin/dishes/edit/${row.id}`)
}

async function handleDelete(row) {
  try {
    await deleteDish(row.id)
    ElMessage.success('删除成功')
    fetchDishes()
  } catch (err) {
    console.error('删除菜品失败:', err)
    ElMessage.error('删除菜品失败')
  }
}

async function handleToggleStatus(row) {
  const currentStatus = row.enabled !== undefined ? row.enabled : row.status
  const newStatus = (currentStatus === 1 || currentStatus === 'active') ? 0 : 1
  try {
    await updateDish(row.id, { enabled: newStatus })
    row.enabled = newStatus
    if (row.status !== undefined) row.status = newStatus
    ElMessage.success(newStatus ? '已启用' : '已禁用')
    fetchDishes()
  } catch (err) {
    console.error('更新状态失败:', err)
    ElMessage.error('更新状态失败')
  }
}

onMounted(() => {
  fetchCategories()
  fetchDishes()
})
</script>

<style scoped>
.dish-manage {
  max-width: 1200px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  gap: 12px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.search-input {
  width: 220px;
}

.filter-select {
  width: 150px;
}

.table-card {
  border-radius: var(--radius-md, 12px);
  border: none;
}

.dish-cover {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm, 8px);
  object-fit: cover;
}

.dish-cover-small {
  width: 40px;
  height: 40px;
}

.no-image {
  font-size: 12px;
  color: var(--color-text-hint, #999);
}

.text-muted {
  color: var(--color-text-hint, #999);
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }

  .header-left {
    flex-direction: column;
    width: 100%;
  }

  .search-input,
  .filter-select {
    width: 100%;
  }

  .pagination-wrapper {
    justify-content: center;
  }
}
</style>
