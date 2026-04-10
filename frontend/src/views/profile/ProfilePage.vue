<template>
  <div class="profile-page">
    <!-- 用户信息区域 -->
    <div class="user-info-section">
      <template v-if="userStore.isLoggedIn">
        <div class="user-info-content" @click="showEditNickname = true">
          <div class="avatar">
            <span class="avatar-text">{{ avatarText }}</span>
          </div>
          <div class="user-detail">
            <div class="user-name-row">
              <span class="user-name">{{ userStore.userInfo?.nickname || userStore.userInfo?.username || '用户' }}</span>
              <van-tag v-if="userStore.role === 'admin'" type="danger" size="medium" round>管理员</van-tag>
            </div>
            <span class="user-desc">用心做好每一餐</span>
          </div>
          <van-icon name="arrow" size="16" color="#999" />
        </div>
        <div v-if="userStore.role === 'admin'" class="admin-entry" @click="$router.push('/admin')">
          <van-icon name="setting-o" size="16" />
          <span>进入管理后台</span>
          <van-icon name="arrow" size="14" color="#999" />
        </div>
      </template>
      <template v-else>
        <div class="user-info-content" @click="$router.push('/login')">
          <div class="avatar avatar-placeholder">
            <van-icon name="user-o" size="28" color="#ccc" />
          </div>
          <div class="user-detail">
            <span class="user-name">点击登录</span>
            <span class="user-desc">登录后享受更多功能</span>
          </div>
          <van-icon name="arrow" size="16" color="#999" />
        </div>
      </template>
    </div>

    <!-- 功能列表 -->
    <div class="func-groups">
      <!-- 第一组：家庭管理 -->
      <div class="func-group">
        <div class="group-title">家庭管理</div>
        <van-cell-group inset :border="false" class="cell-group">
          <van-cell v-if="userStore.role === 'admin'" title="家庭成员管理" icon="friends-o" is-link @click="showFamilyPopup = true" />
          <van-cell title="厨房设备" icon="shop-o" is-link @click="showEquipmentPopup = true" />
        </van-cell-group>
      </div>

      <!-- 第二组：我的内容 -->
      <div class="func-group">
        <div class="group-title">我的内容</div>
        <van-cell-group inset :border="false" class="cell-group">
          <van-cell title="我的收藏" icon="star-o" is-link @click="showFavorites = true">
            <template #right-icon>
              <span class="cell-badge" v-if="favorites.length">{{ favorites.length }}</span>
              <van-icon name="arrow" size="16" color="#999" />
            </template>
          </van-cell>
          <van-cell title="营养记录" icon="chart-trending-o" is-link @click="showNutritionLog = true" />
        </van-cell-group>
      </div>

      <!-- 第三组：设置 -->
      <div class="func-group">
        <div class="group-title">设置</div>
        <van-cell-group inset :border="false" class="cell-group">
          <van-cell title="主题设置" icon="brush-o" is-link @click="showThemePopup = true">
            <template #value>
              <span class="cell-value">{{ currentThemeLabel }}</span>
            </template>
          </van-cell>
          <van-cell title="字号设置" icon="font-o" is-link @click="showFontSizePopup = true">
            <template #value>
              <span class="cell-value">{{ currentFontSizeLabel }}</span>
            </template>
          </van-cell>
          <van-cell title="关于" icon="info-o" is-link @click="showAboutPopup = true" />
        </van-cell-group>
      </div>
    </div>

    <!-- 退出登录 -->
    <div v-if="userStore.isLoggedIn" class="logout-section">
      <van-button block round plain type="danger" @click="handleLogout">退出登录</van-button>
    </div>

    <!-- 版本号 -->
    <div class="version-text">v1.0.0</div>

    <!-- 家庭成员管理弹窗 -->
    <van-popup
      v-model:show="showFamilyPopup"
      position="bottom"
      round
      :style="{ maxHeight: '80vh' }"
    >
      <div class="popup-header">
        <span class="popup-title">家庭成员管理</span>
        <van-icon name="cross" size="20" color="#999" @click="showFamilyPopup = false" />
      </div>
      <div class="popup-body">
        <!-- 管理员视图：显示真实用户列表 -->
        <template v-if="userStore.role === 'admin'">
          <div v-if="serverMembers.length" class="member-list">
            <div v-for="member in serverMembers" :key="member.id" class="member-card">
              <div class="member-info">
                <div class="member-avatar-sm">{{ (member.nickname || '?')[0] }}</div>
                <div>
                  <div class="member-name">
                    {{ member.nickname }}
                    <van-tag v-if="member.role === 'admin'" type="danger" size="small" round style="margin-left: 6px">一家之主</van-tag>
                    <van-tag v-else type="primary" size="small" round plain style="margin-left: 6px">成员</van-tag>
                  </div>
                  <div class="member-join-date">加入时间：{{ member.created_at?.split('T')[0] || '未知' }}</div>
                </div>
              </div>
              <div v-if="member.role !== 'admin'" class="member-actions">
                <van-icon name="edit" size="18" color="#00B578" @click="openEditUserPopup(member)" />
                <van-icon name="delete-o" size="18" color="#FF4D4F" @click="handleDeleteUser(member)" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <van-icon name="friends-o" size="48" color="#ddd" />
            <span>还没有家庭成员</span>
          </div>
          <div style="padding: 12px 16px;">
            <van-button type="primary" block round color="#00B578" icon="plus" @click="openAddUserPopup">
              添加家庭成员
            </van-button>
          </div>
        </template>

        <!-- 普通用户视图：本地偏好管理 -->
        <template v-else>
          <div v-if="familyMembers.length" class="member-list">
            <div v-for="(member, index) in familyMembers" :key="index" class="member-card">
              <div class="member-info">
                <div class="member-name">{{ member.nickname }}</div>
                <div class="member-tags">
                  <van-tag v-for="tag in member.tastes" :key="tag" type="primary" plain size="medium" round>
                    {{ tag }}
                  </van-tag>
                </div>
                <div v-if="member.allergies" class="member-allergies">
                  <van-icon name="warning-o" size="12" color="#FF9800" />
                  <span>{{ member.allergies }}</span>
                </div>
              </div>
              <div class="member-actions">
                <van-icon name="edit" size="18" color="#999" @click="editMember(index)" />
                <van-icon name="delete-o" size="18" color="#FF4D4F" @click="deleteMember(index)" />
              </div>
            </div>
          </div>
          <div v-else class="empty-state">
            <van-icon name="friends-o" size="48" color="#ddd" />
            <span>还没有家庭成员</span>
          </div>

          <div class="add-member-section">
            <div class="add-member-title">{{ editingMemberIndex >= 0 ? '编辑成员' : '添加成员' }}</div>
            <van-field v-model="newMember.nickname" label="昵称" placeholder="请输入昵称" />
            <div class="taste-select">
              <div class="taste-label">口味偏好</div>
              <div class="taste-tags">
                <van-tag
                  v-for="taste in tasteOptions"
                  :key="taste"
                  :type="newMember.tastes.includes(taste) ? 'primary' : 'default'"
                  plain
                  size="medium"
                  round
                  @click="toggleTaste(taste)"
                >
                  {{ taste }}
                </van-tag>
              </div>
            </div>
            <van-field v-model="newMember.allergies" label="忌口/过敏" placeholder="如：花生、海鲜" type="textarea" rows="2" autosize />
            <van-button type="primary" block round color="var(--color-primary)" @click="addMember" :disabled="!newMember.nickname.trim()">
              {{ editingMemberIndex >= 0 ? '保存修改' : '添加成员' }}
            </van-button>
            <van-button v-if="editingMemberIndex >= 0" block round plain style="margin-top: 8px" @click="openAddMember">
              取消编辑
            </van-button>
          </div>
        </template>
      </div>
    </van-popup>

    <!-- 管理员添加成员弹窗 -->
    <van-dialog
      v-model:show="showAddUserPopup"
      title="添加家庭成员"
      :show-confirm-button="false"
      close-on-click-overlay
    >
      <div style="padding: 16px 20px 20px;">
        <van-field v-model="newUserForm.nickname" label="昵称" placeholder="请输入成员昵称" />
        <van-field v-model="newUserForm.password" type="password" label="密码" placeholder="请输入密码（至少6位）" />
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <van-button block round plain @click="showAddUserPopup = false">取消</van-button>
          <van-button block round type="primary" color="#00B578" @click="handleAddUser" :disabled="!newUserForm.nickname.trim() || !newUserForm.password.trim()">确认添加</van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 管理员编辑成员弹窗 -->
    <van-dialog
      v-model:show="showEditUserPopup"
      title="编辑成员"
      :show-confirm-button="false"
      close-on-click-overlay
      @close="editingUserId = ''; showEditUserPopup = false"
    >
      <div style="padding: 16px 20px 20px;">
        <van-field v-model="editUserForm.nickname" label="昵称" placeholder="请输入新昵称" />
        <van-field v-model="editUserForm.password" type="password" label="新密码" placeholder="不修改请留空" />
        <div style="display: flex; gap: 8px; margin-top: 12px;">
          <van-button block round plain @click="editingUserId = ''">取消</van-button>
          <van-button block round type="primary" color="#00B578" @click="handleEditUser" :disabled="!editUserForm.nickname.trim()">保存修改</van-button>
        </div>
      </div>
    </van-dialog>

    <!-- 厨房设备弹窗 -->
    <van-popup
      v-model:show="showEquipmentPopup"
      position="bottom"
      round
      :style="{ maxHeight: '70vh' }"
    >
      <div class="popup-header">
        <span class="popup-title">厨房设备</span>
        <van-icon name="cross" size="20" color="#999" @click="showEquipmentPopup = false" />
      </div>
      <div class="popup-body">
        <div class="equipment-grid">
          <div
            v-for="item in equipmentOptions"
            :key="item"
            class="equipment-item"
            :class="{ active: selectedEquipment.includes(item) }"
            @click="toggleEquipment(item)"
          >
            <van-icon :name="getEquipmentIcon(item)" size="24" />
            <span>{{ item }}</span>
            <van-icon v-if="selectedEquipment.includes(item)" name="success" size="16" color="var(--color-primary)" class="check-icon" />
            <van-icon name="close" size="14" color="#999" class="delete-icon" @click.stop="removeEquipment(item)" />
          </div>
        </div>
        <div class="equipment-add">
          <van-field v-model="newEquipment" placeholder="输入设备名称" size="small" />
          <van-button size="small" type="primary" color="#00B578" @click="addEquipment" :disabled="!newEquipment.trim()">添加</van-button>
        </div>
      </div>
    </van-popup>

    <!-- 我的收藏弹窗 -->
    <van-popup
      v-model:show="showFavorites"
      position="bottom"
      round
      :style="{ maxHeight: '80vh' }"
    >
      <div class="popup-header">
        <span class="popup-title">我的收藏</span>
        <van-icon name="cross" size="20" color="#999" @click="showFavorites = false" />
      </div>
      <div class="popup-body">
        <template v-if="favorites.length">
          <div class="favorites-scroll">
            <div v-for="(item, index) in favorites" :key="index" class="favorite-card">
              <div class="favorite-cover">
                <img v-if="item.cover" :src="item.cover" :alt="item.name" />
                <div v-else class="favorite-cover-placeholder">
                  <van-icon name="photo-o" size="24" color="#ddd" />
                </div>
              </div>
              <div class="favorite-info">
                <span class="favorite-name">{{ item.name }}</span>
                <span class="favorite-cal" v-if="item.nutrition">
                  {{ item.nutrition.calories || item.nutrition.calorie || '--' }} kcal
                </span>
              </div>
              <van-icon name="delete-o" size="18" color="#FF4D4F" @click="removeFavorite(index)" />
            </div>
          </div>
        </template>
        <div v-else class="empty-state">
          <van-icon name="star-o" size="48" color="#ddd" />
          <span>还没有收藏菜品</span>
        </div>
      </div>
    </van-popup>

    <!-- 营养记录弹窗 -->
    <van-popup
      v-model:show="showNutritionLog"
      position="bottom"
      round
      :style="{ maxHeight: '70vh' }"
    >
      <div class="popup-header">
        <span class="popup-title">最近7天营养摄入</span>
        <van-icon name="cross" size="20" color="#999" @click="showNutritionLog = false" />
      </div>
      <div class="popup-body">
        <div class="nutrition-chart">
          <div class="chart-bars">
            <div v-for="(day, index) in nutritionChartData" :key="index" class="chart-bar-col">
              <div class="chart-bar-wrapper">
                <div
                  class="chart-bar"
                  :style="{ height: day.percentage + '%' }"
                >
                  <span class="chart-bar-value" v-if="day.calories">{{ day.calories }}</span>
                </div>
              </div>
              <span class="chart-bar-label">{{ day.label }}</span>
            </div>
          </div>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background: var(--color-primary)"></span>
              <span>热量 (kcal)</span>
            </div>
          </div>
        </div>
        <div v-if="!nutritionLog.length" class="empty-state">
          <van-icon name="chart-trending-o" size="48" color="#ddd" />
          <span>暂无营养记录</span>
        </div>
      </div>
    </van-popup>

    <!-- 主题设置弹窗 -->
    <van-action-sheet
      v-model:show="showThemePopup"
      title="主题设置"
      :actions="themeActions"
      @select="onThemeSelect"
      cancel-text="取消"
    />

    <!-- 字号设置弹窗 -->
    <van-action-sheet
      v-model:show="showFontSizePopup"
      title="字号设置"
      :actions="fontSizeActions"
      @select="onFontSizeSelect"
      cancel-text="取消"
    />

    <!-- 关于弹窗 -->
    <van-dialog
      v-model:show="showAboutPopup"
      title="关于"
      confirm-button-text="知道了"
    >
      <div class="about-content">
        <div class="about-logo">
          <van-icon name="home-o" size="48" color="var(--color-primary)" />
        </div>
        <div class="about-name">家庭备餐助手</div>
        <div class="about-version">v1.0.0</div>
        <p class="about-desc">
          家庭备餐助手是一款面向家庭的智能备餐应用，帮助您轻松规划每日膳食，管理家庭成员口味偏好，追踪营养摄入，让每一餐都健康美味。
        </p>
      </div>
    </van-dialog>

    <!-- 编辑昵称弹窗 -->
    <van-dialog
      v-model:show="showEditNickname"
      title="修改昵称"
      show-cancel-button
      confirm-button-text="确定"
      cancel-button-text="取消"
      @confirm="confirmEditNickname"
    >
      <div class="edit-nickname-content">
        <van-field v-model="editNicknameValue" placeholder="请输入昵称" maxlength="12" />
      </div>
    </van-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted, watch } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { showSuccessToast, showConfirmDialog, showToast } from 'vant'
import { useUserStore } from '../../store/user'
import { getMembers, addMember as addMemberApi, updateMember as updateMemberApi, deleteMember as deleteMemberApi } from '../../api/auth'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

// ========== localStorage 工具函数 ==========
function getStorage(key, defaultValue = []) {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

// ========== 用户信息 ==========
const avatarText = computed(() => {
  const name = userStore.userInfo?.nickname || userStore.userInfo?.username || ''
  return name ? name.charAt(0).toUpperCase() : '?'
})

const showEditNickname = ref(false)
const editNicknameValue = ref('')

watch(showEditNickname, (val) => {
  if (val) {
    editNicknameValue.value = userStore.userInfo?.nickname || userStore.userInfo?.username || ''
  }
})

function confirmEditNickname() {
  if (editNicknameValue.value.trim()) {
    if (userStore.userInfo) {
      userStore.userInfo.nickname = editNicknameValue.value.trim()
    }
    showSuccessToast('昵称已更新')
  }
}

// ========== 家庭成员管理 ==========
const FAMILY_KEY = 'make_dinner_family_members'
const familyMembers = ref(getStorage(FAMILY_KEY))
const showFamilyPopup = ref(false)
const editingMemberIndex = ref(-1)

const tasteOptions = ['清淡', '微辣', '中辣', '重辣', '酸甜', '咸鲜']

const newMember = ref({
  nickname: '',
  tastes: [],
  allergies: ''
})

function toggleTaste(taste) {
  const idx = newMember.value.tastes.indexOf(taste)
  if (idx > -1) {
    newMember.value.tastes.splice(idx, 1)
  } else {
    newMember.value.tastes.push(taste)
  }
}

function addMember() {
  if (!newMember.value.nickname.trim()) return
  const member = {
    nickname: newMember.value.nickname.trim(),
    tastes: [...newMember.value.tastes],
    allergies: newMember.value.allergies.trim()
  }
  const isEditing = editingMemberIndex.value >= 0
  if (isEditing) {
    familyMembers.value[editingMemberIndex.value] = member
    editingMemberIndex.value = -1
  } else {
    familyMembers.value.push(member)
  }
  setStorage(FAMILY_KEY, familyMembers.value)
  newMember.value = { nickname: '', tastes: [], allergies: '' }
  showSuccessToast(isEditing ? '成员已更新' : '成员已添加')
}

function openAddMember() {
  newMember.value = { nickname: '', tastes: [], allergies: '' }
  editingMemberIndex.value = -1
}

function editMember(index) {
  const member = familyMembers.value[index]
  newMember.value = {
    nickname: member.nickname,
    tastes: [...member.tastes],
    allergies: member.allergies || ''
  }
  editingMemberIndex.value = index
}

function deleteMember(index) {
  showConfirmDialog({
    title: '确认删除',
    message: `确定要删除成员「${familyMembers.value[index].nickname}」吗？`
  }).then(() => {
    familyMembers.value.splice(index, 1)
    setStorage(FAMILY_KEY, familyMembers.value)
    showSuccessToast('已删除')
  }).catch(() => {})
}

// ========== 服务端家庭成员（管理员功能） ==========
const serverMembers = ref([])
const showAddUserPopup = ref(false)
const showEditUserPopup = ref(false)
const newUserForm = reactive({ nickname: '', password: '' })
const editingUserId = ref('')
const editUserForm = reactive({ nickname: '', password: '' })

// 加载服务端成员列表
async function loadServerMembers() {
  if (userStore.role !== 'admin') return
  try {
    const res = await getMembers()
    serverMembers.value = res.data || res || []
  } catch (e) {
    console.error('加载成员失败:', e)
  }
}

// 打开添加成员弹窗
function openAddUserPopup() {
  newUserForm.nickname = ''
  newUserForm.password = ''
  showAddUserPopup.value = true
}

// 添加成员（管理员）
async function handleAddUser() {
  if (!newUserForm.nickname.trim() || !newUserForm.password.trim()) {
    showToast('请填写完整信息')
    return
  }
  if (newUserForm.password.length < 6) {
    showToast('密码至少6位')
    return
  }
  try {
    await addMemberApi({ nickname: newUserForm.nickname.trim(), password: newUserForm.password })
    showSuccessToast('添加成功')
    showAddUserPopup.value = false
    loadServerMembers()
  } catch (e) {
    showToast(e?.response?.data?.message || '添加失败')
  }
}

// 打开编辑成员弹窗
function openEditUserPopup(member) {
  editingUserId.value = member.id
  editUserForm.nickname = member.nickname
  editUserForm.password = ''
  showEditUserPopup.value = true
}

// 编辑成员（管理员）
async function handleEditUser() {
  if (!editUserForm.nickname.trim()) {
    showToast('请填写昵称')
    return
  }
  try {
    const data = { nickname: editUserForm.nickname.trim() }
    if (editUserForm.password.trim()) {
      if (editUserForm.password.length < 6) {
        showToast('密码至少6位')
        return
      }
      data.password = editUserForm.password
    }
    await updateMemberApi(editingUserId.value, data)
    showSuccessToast('修改成功')
    editingUserId.value = ''
    showEditUserPopup.value = false
    loadServerMembers()
  } catch (e) {
    showToast(e?.response?.data?.message || '修改失败')
  }
}

// 删除成员（管理员）
async function handleDeleteUser(member) {
  try {
    await deleteMemberApi(member.id)
    showSuccessToast('删除成功')
    loadServerMembers()
  } catch (e) {
    showToast(e?.response?.data?.message || '删除失败')
  }
}

// ========== 厨房设备 ==========
const EQUIPMENT_KEY = 'make_dinner_equipment'
const equipmentOptions = ['燃气灶', '电磁炉', '烤箱', '空气炸锅', '微波炉', '电饭煲', '蒸锅', '料理机', '面包机']
const selectedEquipment = ref(getStorage(EQUIPMENT_KEY))
const showEquipmentPopup = ref(false)
const newEquipment = ref('')

function getEquipmentIcon(name) {
  const iconMap = {
    '燃气灶': 'fire-o',
    '电磁炉': 'certificate',
    '烤箱': 'hot-o',
    '空气炸锅': 'smile-o',
    '微波炉': 'wap-home-o',
    '电饭煲': 'bowl-o',
    '蒸锅': 'more-o',
    '料理机': 'setting-o',
    '面包机': 'cake-o'
  }
  return iconMap[name] || 'shop-o'
}

function toggleEquipment(item) {
  const idx = selectedEquipment.value.indexOf(item)
  if (idx > -1) {
    selectedEquipment.value.splice(idx, 1)
  } else {
    selectedEquipment.value.push(item)
  }
  setStorage(EQUIPMENT_KEY, selectedEquipment.value)
}

function saveEquipment() {
  setStorage(EQUIPMENT_KEY, selectedEquipment.value)
}

function addEquipment() {
  const name = newEquipment.value.trim()
  if (!name) return
  if (equipmentOptions.includes(name)) {
    showToast('该设备已存在')
    return
  }
  equipmentOptions.push(name)
  selectedEquipment.value.push(name)
  newEquipment.value = ''
  saveEquipment()
  showSuccessToast('设备已添加')
}

function removeEquipment(item) {
  const idx = selectedEquipment.value.indexOf(item)
  if (idx > -1) {
    selectedEquipment.value.splice(idx, 1)
  }
  const optIdx = equipmentOptions.indexOf(item)
  if (optIdx > -1) {
    equipmentOptions.splice(optIdx, 1)
  }
  saveEquipment()
  showSuccessToast('设备已移除')
}

// ========== 我的收藏 ==========
const FAVORITES_KEY = 'make_dinner_favorites'
const favorites = ref(getStorage(FAVORITES_KEY))
const showFavorites = ref(false)

function removeFavorite(index) {
  favorites.value.splice(index, 1)
  setStorage(FAVORITES_KEY, favorites.value)
  showSuccessToast('已取消收藏')
}

// ========== 营养记录 ==========
const NUTRITION_LOG_KEY = 'make_dinner_nutrition_log'
const nutritionLog = ref(getStorage(NUTRITION_LOG_KEY))
const showNutritionLog = ref(false)

const nutritionChartData = computed(() => {
  const days = []
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const dateStr = `${d.getMonth() + 1}/${d.getDate()}`
    const dayOfWeek = weekDays[d.getDay()]
    const logEntry = nutritionLog.value.find(log => {
      const logDate = new Date(log.date)
      return logDate.toDateString() === d.toDateString()
    })
    const calories = logEntry ? (logEntry.calories || 0) : 0
    const maxCal = 2500
    days.push({
      label: `${dateStr}\n周${dayOfWeek}`,
      calories,
      percentage: Math.min(Math.round((calories / maxCal) * 100), 100)
    })
  }
  return days
})

// ========== 主题设置 ==========
const THEME_KEY = 'make_dinner_theme'
const showThemePopup = ref(false)

const themeActions = [
  { name: '清新绿', value: 'green', color: '#00B578' },
  { name: '暖白木色', value: 'warm', color: '#D4A574' }
]

const currentTheme = ref(localStorage.getItem(THEME_KEY) || 'green')

const currentThemeLabel = computed(() => {
  const found = themeActions.find(t => t.value === currentTheme.value)
  return found ? found.name : '清新绿'
})

function applyTheme(theme) {
  const root = document.documentElement
  if (theme === 'warm') {
    root.style.setProperty('--color-primary', '#D4A574')
    root.style.setProperty('--color-primary-light', '#E0B98E')
    root.style.setProperty('--color-primary-dark', '#B8895C')
    root.style.setProperty('--color-secondary', '#C49A6C')
    root.style.setProperty('--color-bg', '#FBF8F5')
  } else {
    root.style.setProperty('--color-primary', '#00B578')
    root.style.setProperty('--color-primary-light', '#33C98E')
    root.style.setProperty('--color-primary-dark', '#009A63')
    root.style.setProperty('--color-secondary', '#6C9E77')
    root.style.setProperty('--color-bg', '#F6F7F9')
  }
}

function onThemeSelect(action) {
  currentTheme.value = action.value
  localStorage.setItem(THEME_KEY, action.value)
  applyTheme(action.value)
  showThemePopup.value = false
  showSuccessToast('主题已切换')
}

// ========== 字号设置 ==========
const FONT_SIZE_KEY = 'make_dinner_font_size'
const showFontSizePopup = ref(false)

const fontSizeActions = [
  { name: '小', value: 'small', size: '14px' },
  { name: '标准', value: 'standard', size: '16px' },
  { name: '大', value: 'large', size: '18px' },
  { name: '超大', value: 'xlarge', size: '20px' }
]

const currentFontSize = ref(localStorage.getItem(FONT_SIZE_KEY) || 'standard')

const currentFontSizeLabel = computed(() => {
  const found = fontSizeActions.find(f => f.value === currentFontSize.value)
  return found ? found.name : '标准'
})

function applyFontSize(size) {
  document.documentElement.style.fontSize = size
}

function onFontSizeSelect(action) {
  currentFontSize.value = action.value
  localStorage.setItem(FONT_SIZE_KEY, action.value)
  applyFontSize(action.size)
  showFontSizePopup.value = false
  showSuccessToast('字号已调整')
}

// ========== 关于 ==========
const showAboutPopup = ref(false)

// ========== 退出登录 ==========
function handleLogout() {
  showConfirmDialog({
    title: '确认退出',
    message: '退出登录后需要重新登录才能使用'
  }).then(() => {
    userStore.logout()
    showSuccessToast('已退出登录')
  }).catch(() => {})
}

// ========== 初始化 ==========
onMounted(() => {
  // 应用已保存的主题和字号
  applyTheme(currentTheme.value)
  const savedFontSize = fontSizeActions.find(f => f.value === currentFontSize.value)
  if (savedFontSize) {
    applyFontSize(savedFontSize.size)
  }
  // 加载服务端成员列表（管理员）
  loadServerMembers()
  // 处理 URL query 中的 tab 参数
  if (route.query.tab === 'favorites') {
    showFavorites.value = true
  } else if (route.query.tab === 'preferences') {
    showFamilyPopup.value = true
  }
})
</script>

<style scoped>
.profile-page {
  padding: 0 var(--spacing-lg) var(--spacing-xxl);
  min-height: 100vh;
}

/* 用户信息区域 */
.user-info-section {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-primary-dark) 100%);
  border-radius: 0 0 var(--radius-xl) var(--radius-xl);
  padding: var(--spacing-xl) var(--spacing-lg);
  margin: 0 calc(-1 * var(--spacing-lg));
  margin-bottom: var(--spacing-lg);
}

.user-info-content {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  cursor: pointer;
}

.avatar {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-text {
  font-size: 24px;
  font-weight: 600;
  color: #fff;
}

.avatar-placeholder {
  background: rgba(255, 255, 255, 0.15);
}

.user-detail {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.user-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: #fff;
}

.user-desc {
  font-size: var(--font-size-sm);
  color: rgba(255, 255, 255, 0.75);
}

.admin-entry {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: var(--spacing-md);
  padding: 10px var(--spacing-md);
  background: rgba(255, 255, 255, 0.15);
  border-radius: var(--radius-sm);
  color: rgba(255, 255, 255, 0.9);
  font-size: var(--font-size-sm);
  cursor: pointer;
}

/* 功能分组 */
.func-groups {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.func-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
}

.group-title {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
  padding-left: var(--spacing-sm);
  margin-bottom: 2px;
}

.cell-group {
  border-radius: var(--radius-lg) !important;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}

.cell-group :deep(.van-cell) {
  padding: var(--spacing-md) var(--spacing-lg);
}

.cell-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 18px;
  height: 18px;
  padding: 0 5px;
  background: var(--color-danger);
  color: #fff;
  font-size: 11px;
  border-radius: 9px;
  margin-right: 8px;
}

.cell-value {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
}

/* 退出登录 */
.logout-section {
  margin-top: var(--spacing-xxl);
  padding: 0 var(--spacing-sm);
}

/* 版本号 */
.version-text {
  text-align: center;
  font-size: var(--font-size-xs);
  color: var(--color-text-hint);
  padding: var(--spacing-lg) 0;
}

/* 弹窗通用样式 */
.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-lg);
  border-bottom: 1px solid var(--color-border);
}

.popup-title {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--color-text-primary);
}

.popup-body {
  padding: var(--spacing-lg);
  max-height: 60vh;
  overflow-y: auto;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-xxl) 0;
  color: var(--color-text-hint);
  font-size: var(--font-size-sm);
}

/* 家庭成员管理 */
.member-list {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-xl);
}

.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.member-name {
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-primary);
}

.member-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.member-allergies {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: #FF9800;
}

.member-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
}

.add-member-section {
  border-top: 1px solid var(--color-border);
  padding-top: var(--spacing-lg);
}

.add-member-title {
  font-size: var(--font-size-md);
  font-weight: 500;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-md);
}

.taste-select {
  padding: var(--spacing-md) var(--spacing-lg);
}

.taste-label {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  margin-bottom: 8px;
}

.taste-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.taste-tags .van-tag {
  cursor: pointer;
  transition: all 0.2s;
}

/* 厨房设备 */
.equipment-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing-md);
}

.equipment-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: var(--spacing-lg) var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  cursor: pointer;
  position: relative;
  transition: all 0.2s;
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
}

.equipment-item.active {
  background: #E8F5E9;
  color: var(--color-primary);
  border: 1px solid var(--color-primary);
}

.equipment-item:active {
  transform: scale(0.96);
}

.check-icon {
  position: absolute;
  top: 8px;
  right: 8px;
}

.delete-icon {
  position: absolute;
  top: 8px;
  left: 8px;
  cursor: pointer;
}

.equipment-add {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-top: var(--spacing-lg);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--color-border);
}

.equipment-add .van-field {
  flex: 1;
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}

.equipment-add .van-button {
  flex-shrink: 0;
}

/* 我的收藏 */
.favorites-scroll {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.favorite-card {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
}

.favorite-cover {
  width: 60px;
  height: 60px;
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex-shrink: 0;
  background: #f5f5f5;
}

.favorite-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.favorite-cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.favorite-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.favorite-name {
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--color-text-primary);
}

.favorite-cal {
  font-size: var(--font-size-xs);
  color: var(--color-text-hint);
}

/* 营养记录图表 */
.nutrition-chart {
  padding: var(--spacing-md) 0;
}

.chart-bars {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 160px;
  padding: 0 4px;
  border-bottom: 1px solid var(--color-border);
}

.chart-bar-col {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  height: 100%;
}

.chart-bar-wrapper {
  flex: 1;
  width: 100%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.chart-bar {
  width: 24px;
  min-height: 2px;
  background: linear-gradient(180deg, var(--color-primary) 0%, var(--color-primary-light) 100%);
  border-radius: 4px 4px 0 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  transition: height 0.5s ease;
  position: relative;
}

.chart-bar-value {
  position: absolute;
  top: -18px;
  font-size: 10px;
  color: var(--color-text-hint);
  white-space: nowrap;
}

.chart-bar-label {
  font-size: 10px;
  color: var(--color-text-hint);
  white-space: pre-line;
  text-align: center;
  line-height: 1.3;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: var(--spacing-lg);
  margin-top: var(--spacing-md);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: var(--font-size-xs);
  color: var(--color-text-hint);
}

.legend-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

/* 关于弹窗 */
.about-content {
  padding: var(--spacing-xl) var(--spacing-lg);
  text-align: center;
}

.about-logo {
  margin-bottom: var(--spacing-md);
}

.about-name {
  font-size: var(--font-size-xl);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.about-version {
  font-size: var(--font-size-sm);
  color: var(--color-text-hint);
  margin-bottom: var(--spacing-lg);
}

.about-desc {
  font-size: var(--font-size-sm);
  color: var(--color-text-secondary);
  line-height: 1.8;
  text-align: left;
  margin: 0;
}

/* 编辑昵称 */
.edit-nickname-content {
  padding: 0 var(--spacing-lg);
}

.member-avatar-sm {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #00B578, #009A63);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
}

.member-join-date {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}
</style>
