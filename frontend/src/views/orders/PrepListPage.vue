<template>
  <div class="prep-list-page">
    <!-- 页面内返回栏 -->
    <div class="prep-page-header">
      <van-icon name="arrow-left" size="18" color="#333" @click="router.back()" class="prep-back-btn" />
      <span class="prep-page-title">备餐清单</span>
      <span class="prep-page-placeholder"></span>
    </div>

    <div class="prep-content" v-if="order">
      <!-- 订单信息卡片 -->
      <div class="prep-card">
        <div class="prep-card-title">订单信息</div>
        <div class="prep-info-row">
          <span class="prep-info-label">状态</span>
          <van-tag
            :type="statusTagType(order.status)"
            size="medium"
            round
          >{{ statusLabel(order.status) }}</van-tag>
        </div>
        <div class="prep-info-row">
          <span class="prep-info-label">创建时间</span>
          <span class="prep-info-value">{{ formatTime(order.created_at) }}</span>
        </div>
        <div class="prep-info-row" v-if="order.notes">
          <span class="prep-info-label">备注</span>
          <span class="prep-info-value">{{ order.notes }}</span>
        </div>
      </div>

      <!-- 用料清单卡片 -->
      <div class="prep-card">
        <div class="prep-card-title">用料清单</div>
        <div class="ingredients-list">
          <div
            v-for="(item, idx) in ingredientList"
            :key="idx"
            class="ingredient-item"
          >
            <van-checkbox
              v-model="item.checked"
              shape="square"
              class="ingredient-checkbox"
            >
              <span class="ingredient-name" :class="{ checked: item.checked }">
                {{ item.name }}
              </span>
              <span class="ingredient-amount">{{ item.amount }}</span>
            </van-checkbox>
          </div>
        </div>
        <div class="ingredients-progress">
          <span class="progress-text">已准备 {{ checkedIngredientCount }}/{{ ingredientList.length }}</span>
          <van-progress
            :percentage="ingredientProgress"
            :show-pivot="false"
            color="var(--color-primary)"
            stroke-width="4"
          />
        </div>
      </div>

      <!-- 烹饪步骤卡片 -->
      <div class="prep-card">
        <div class="prep-card-title">烹饪步骤</div>
        <div class="steps-list">
          <div
            v-for="(group, gIdx) in cookingSteps"
            :key="gIdx"
            class="step-group"
          >
            <div class="step-group-header">
              <div class="step-group-title">{{ group.dishName }}</div>
              <div class="step-group-meta">
                <van-tag v-if="group.totalTime" type="primary" plain size="small" round>
                  <van-icon name="clock-o" size="12" /> {{ group.totalTime }}
                </van-tag>
                <van-tag v-if="group.difficulty" :type="group.difficulty === '简单' ? 'success' : group.difficulty === '较难' ? 'danger' : 'warning'" plain size="small" round>
                  {{ group.difficulty }}
                </van-tag>
              </div>
            </div>
            <div
              v-for="(step, sIdx) in group.steps"
              :key="sIdx"
              class="step-item"
              :class="{ done: step.done }"
              @click="step.done = !step.done"
            >
              <div class="step-check">
                <van-icon
                  :name="step.done ? 'checked' : 'circle'"
                  :color="step.done ? 'var(--color-primary)' : '#ccc'"
                  size="20"
                />
              </div>
              <div class="step-content">
                <span class="step-text" :class="{ done: step.done }">{{ step.text }}</span>
                <span v-if="step.duration" class="step-duration">
                  <van-icon name="clock-o" size="12" /> {{ step.duration }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 营养总览卡片 -->
      <div class="prep-card">
        <div class="prep-card-title">营养总览</div>
        <div class="nutrition-overview" v-if="order.total_nutrition">
          <div class="nutrition-bar-item">
            <div class="nutrition-bar-header">
              <span class="nutrition-bar-label">热量</span>
              <span class="nutrition-bar-value">
                {{ Math.round(order.total_nutrition.per_serving_kcal || 0) }} / 2000 kcal
              </span>
            </div>
            <van-progress
              :percentage="Math.min(100, Math.round((order.total_nutrition.per_serving_kcal || 0) / 2000 * 100))"
              :show-pivot="false"
              color="var(--color-primary)"
              stroke-width="6"
            />
          </div>
          <div class="nutrition-bar-item">
            <div class="nutrition-bar-header">
              <span class="nutrition-bar-label">蛋白质</span>
              <span class="nutrition-bar-value">
                {{ (order.total_nutrition.protein || 0).toFixed(1) }} / 60 g
              </span>
            </div>
            <van-progress
              :percentage="Math.min(100, Math.round((order.total_nutrition.protein || 0) / 60 * 100))"
              :show-pivot="false"
              color="#FF9800"
              stroke-width="6"
            />
          </div>
          <div class="nutrition-bar-item">
            <div class="nutrition-bar-header">
              <span class="nutrition-bar-label">碳水</span>
              <span class="nutrition-bar-value">
                {{ (order.total_nutrition.carb || 0).toFixed(1) }} / 300 g
              </span>
            </div>
            <van-progress
              :percentage="Math.min(100, Math.round((order.total_nutrition.carb || 0) / 300 * 100))"
              :show-pivot="false"
              color="#4CAF50"
              stroke-width="6"
            />
          </div>
          <div class="nutrition-bar-item">
            <div class="nutrition-bar-header">
              <span class="nutrition-bar-label">脂肪</span>
              <span class="nutrition-bar-value">
                {{ (order.total_nutrition.fat || 0).toFixed(1) }} / 65 g
              </span>
            </div>
            <van-progress
              :percentage="Math.min(100, Math.round((order.total_nutrition.fat || 0) / 65 * 100))"
              :show-pivot="false"
              color="#E91E63"
              stroke-width="6"
            />
          </div>
        </div>
        <div class="nutrition-legend">
          <span class="legend-text">参考每日推荐摄入量（成人）</span>
        </div>
      </div>

      <!-- 底部操作 -->
      <div class="prep-bottom-actions">
        <van-button
          type="primary"
          round
          block
          icon="records"
          class="prep-action-btn"
          @click="exportShoppingList"
        >导出购物清单</van-button>
        <van-button
          round
          block
          icon="share-o"
          plain
          class="prep-action-btn"
          @click="sharePrepList"
        >分享</van-button>
      </div>
    </div>

    <!-- 加载中 -->
    <div class="prep-loading" v-else>
      <van-loading size="36px" vertical>加载中...</van-loading>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { showToast } from 'vant'
import { getOrderDetail } from '../../api/orders'
import { formatDate } from '../../utils/format'

const route = useRoute()
const router = useRouter()
const order = ref(null)

// 状态映射
const statusMap = {
  planning: '备餐中',
  doing: '制作中',
  done: '已完成'
}

function statusLabel(status) {
  return statusMap[status] || status
}

function statusTagType(status) {
  const map = {
    planning: 'primary',
    doing: 'warning',
    done: 'success'
  }
  return map[status] || 'default'
}

function formatTime(date) {
  if (!date) return ''
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

// 根据菜品名称生成食材（含用量）
function generateIngredients(dishName) {
  const ingredientMap = {
    '鸡': [
      { name: '鸡肉', amount: '300g' }, { name: '生姜', amount: '3片' }, { name: '葱', amount: '2根' },
      { name: '料酒', amount: '1汤匙' }, { name: '酱油', amount: '1汤匙' }
    ],
    '鸭': [
      { name: '鸭肉', amount: '500g' }, { name: '生姜', amount: '4片' }, { name: '葱', amount: '2根' },
      { name: '八角', amount: '2颗' }, { name: '桂皮', amount: '1小块' }
    ],
    '鱼': [
      { name: '鱼', amount: '1条(约500g)' }, { name: '生姜', amount: '5片' }, { name: '葱', amount: '2根' },
      { name: '料酒', amount: '2汤匙' }, { name: '蒸鱼豉油', amount: '2汤匙' }
    ],
    '虾': [
      { name: '虾', amount: '300g' }, { name: '生姜', amount: '3片' }, { name: '葱', amount: '2根' },
      { name: '料酒', amount: '1汤匙' }, { name: '蒜', amount: '3瓣' }
    ],
    '猪': [
      { name: '猪肉', amount: '300g' }, { name: '生姜', amount: '3片' }, { name: '葱', amount: '2根' },
      { name: '酱油', amount: '2汤匙' }, { name: '料酒', amount: '1汤匙' }
    ],
    '红烧': [
      { name: '五花肉', amount: '500g' }, { name: '冰糖', amount: '30g' }, { name: '生姜', amount: '4片' },
      { name: '葱', amount: '2根' }, { name: '八角', amount: '2颗' }, { name: '桂皮', amount: '1小块' },
      { name: '香叶', amount: '2片' }, { name: '生抽', amount: '2汤匙' }, { name: '老抽', amount: '1汤匙' },
      { name: '料酒', amount: '1汤匙' }
    ],
    '牛': [
      { name: '牛肉', amount: '300g' }, { name: '生姜', amount: '3片' }, { name: '葱', amount: '2根' },
      { name: '料酒', amount: '1汤匙' }, { name: '黑胡椒', amount: '适量' }
    ],
    '排': [
      { name: '排骨', amount: '500g' }, { name: '生姜', amount: '4片' }, { name: '葱', amount: '2根' },
      { name: '料酒', amount: '1汤匙' }, { name: '酱油', amount: '2汤匙' }
    ],
    '蛋': [
      { name: '鸡蛋', amount: '3个' }, { name: '葱', amount: '1根' }, { name: '盐', amount: '适量' },
      { name: '食用油', amount: '2汤匙' }
    ],
    '豆': [
      { name: '豆腐', amount: '1块(约400g)' }, { name: '葱', amount: '1根' },
      { name: '酱油', amount: '1汤匙' }, { name: '食用油', amount: '2汤匙' }
    ],
    '青菜': [
      { name: '青菜', amount: '300g' }, { name: '蒜', amount: '3瓣' },
      { name: '盐', amount: '适量' }, { name: '食用油', amount: '1汤匙' }
    ],
    '白菜': [
      { name: '白菜', amount: '400g' }, { name: '蒜', amount: '3瓣' },
      { name: '盐', amount: '适量' }, { name: '醋', amount: '1汤匙' }
    ],
    '番茄': [
      { name: '番茄', amount: '2个' }, { name: '鸡蛋', amount: '3个' }, { name: '葱', amount: '1根' },
      { name: '盐', amount: '适量' }, { name: '糖', amount: '1茶匙' }
    ],
    '土豆': [
      { name: '土豆', amount: '2个' }, { name: '葱', amount: '1根' },
      { name: '酱油', amount: '1汤匙' }, { name: '盐', amount: '适量' }
    ],
    '黄瓜': [
      { name: '黄瓜', amount: '2根' }, { name: '蒜', amount: '3瓣' },
      { name: '醋', amount: '1汤匙' }, { name: '辣椒油', amount: '适量' }
    ],
    '西兰': [
      { name: '西兰花', amount: '1颗' }, { name: '蒜', amount: '3瓣' },
      { name: '盐', amount: '适量' }, { name: '食用油', amount: '1汤匙' }
    ],
    '沙拉': [
      { name: '生菜', amount: '100g' }, { name: '番茄', amount: '1个' }, { name: '黄瓜', amount: '1根' },
      { name: '沙拉酱', amount: '2汤匙' }
    ],
    '汤': [
      { name: '生姜', amount: '3片' }, { name: '葱', amount: '2根' },
      { name: '盐', amount: '适量' }, { name: '料酒', amount: '1汤匙' }
    ],
    '粥': [
      { name: '大米', amount: '1杯' }, { name: '水', amount: '8杯' }, { name: '盐', amount: '适量' }
    ],
    '面': [
      { name: '面条', amount: '200g' }, { name: '葱', amount: '1根' },
      { name: '酱油', amount: '1汤匙' }, { name: '醋', amount: '适量' }
    ],
    '饭': [
      { name: '大米', amount: '2杯' }, { name: '水', amount: '2杯' }
    ],
    '炒': [
      { name: '食用油', amount: '2汤匙' }, { name: '盐', amount: '适量' },
      { name: '酱油', amount: '1汤匙' }, { name: '葱', amount: '1根' }, { name: '蒜', amount: '2瓣' }
    ],
    '蒸': [
      { name: '生姜', amount: '3片' }, { name: '葱', amount: '2根' }, { name: '料酒', amount: '1汤匙' }
    ],
    '烤': [
      { name: '锡纸', amount: '1张' }, { name: '食用油', amount: '适量' }, { name: '调料', amount: '适量' }
    ],
    '水饺': [
      { name: '饺子皮', amount: '30张' }, { name: '猪肉馅', amount: '300g' }, { name: '白菜', amount: '200g' },
      { name: '生姜', amount: '2片' }, { name: '酱油', amount: '1汤匙' }
    ],
    '煎饺': [
      { name: '速冻水饺', amount: '20个' }, { name: '食用油', amount: '2汤匙' },
      { name: '醋', amount: '适量' }, { name: '蒜', amount: '3瓣' }
    ],
    '春卷': [
      { name: '春卷皮', amount: '10张' }, { name: '猪肉馅', amount: '200g' }, { name: '卷心菜', amount: '150g' },
      { name: '食用油', amount: '适量(炸用)' }
    ],
    '鸡翅': [
      { name: '鸡翅', amount: '500g' }, { name: '酱油', amount: '2汤匙' }, { name: '料酒', amount: '1汤匙' },
      { name: '蜂蜜', amount: '1汤匙' }, { name: '蒜', amount: '3瓣' }
    ],
    '皮蛋': [
      { name: '皮蛋', amount: '2个' }, { name: '豆腐', amount: '1块' }, { name: '葱', amount: '1根' },
      { name: '酱油', amount: '1汤匙' }, { name: '香油', amount: '1茶匙' }
    ],
    '蒜泥': [
      { name: '五花肉', amount: '300g' }, { name: '蒜', amount: '1整头' }, { name: '酱油', amount: '2汤匙' },
      { name: '辣椒油', amount: '1汤匙' }, { name: '葱', amount: '1根' }
    ],
    '凉拌': [
      { name: '蒜', amount: '3瓣' }, { name: '醋', amount: '1汤匙' }, { name: '辣椒油', amount: '适量' },
      { name: '香油', amount: '1茶匙' }, { name: '盐', amount: '适量' }
    ],
    '紫菜': [
      { name: '紫菜', amount: '5g' }, { name: '鸡蛋', amount: '1个' }, { name: '盐', amount: '适量' },
      { name: '香油', amount: '几滴' }, { name: '葱', amount: '少许' }
    ],
    '牛腩': [
      { name: '牛腩', amount: '500g' }, { name: '番茄', amount: '2个' }, { name: '生姜', amount: '4片' },
      { name: '葱', amount: '2根' }, { name: '料酒', amount: '1汤匙' }
    ],
    '排骨玉米': [
      { name: '排骨', amount: '400g' }, { name: '玉米', amount: '1根' }, { name: '生姜', amount: '3片' },
      { name: '葱', amount: '1根' }, { name: '盐', amount: '适量' }
    ],
    '红豆': [
      { name: '红豆', amount: '100g' }, { name: '冰糖', amount: '30g' }, { name: '水', amount: '适量' }
    ],
    '芒果': [
      { name: '芒果', amount: '1个' }, { name: '西米', amount: '50g' }, { name: '椰奶', amount: '200ml' }
    ],
    '双皮奶': [
      { name: '牛奶', amount: '250ml' }, { name: '蛋清', amount: '2个' }, { name: '糖', amount: '20g' }
    ],
    '蛋挞': [
      { name: '蛋挞皮', amount: '6个' }, { name: '牛奶', amount: '100ml' }, { name: '鸡蛋', amount: '2个' },
      { name: '糖', amount: '30g' }
    ],
    '戚风': [
      { name: '鸡蛋', amount: '4个' }, { name: '低筋面粉', amount: '80g' }, { name: '糖', amount: '60g' },
      { name: '植物油', amount: '30ml' }
    ],
    '曲奇': [
      { name: '黄油', amount: '100g' }, { name: '低筋面粉', amount: '150g' }, { name: '糖粉', amount: '50g' },
      { name: '鸡蛋', amount: '1个' }
    ],
    '柠檬': [
      { name: '柠檬', amount: '半个' }, { name: '蜂蜜', amount: '1汤匙' }, { name: '温水', amount: '300ml' }
    ],
    '绿豆': [
      { name: '绿豆', amount: '50g' }, { name: '冰糖', amount: '20g' }, { name: '水', amount: '适量' }
    ],
    '酸梅': [
      { name: '乌梅', amount: '30g' }, { name: '山楂', amount: '20g' }, { name: '甘草', amount: '5g' },
      { name: '冰糖', amount: '40g' }, { name: '水', amount: '2L' }
    ],
    '葱油': [
      { name: '面条', amount: '200g' }, { name: '葱', amount: '4根' }, { name: '食用油', amount: '3汤匙' },
      { name: '酱油', amount: '2汤匙' }
    ],
    '蛋炒饭': [
      { name: '米饭', amount: '1碗(隔夜)' }, { name: '鸡蛋', amount: '2个' }, { name: '葱', amount: '1根' },
      { name: '盐', amount: '适量' }, { name: '食用油', amount: '2汤匙' }
    ],
  }

  const result = [
    { name: '食用油', amount: '适量' },
    { name: '盐', amount: '适量' },
    { name: '葱', amount: '适量' },
    { name: '蒜', amount: '适量' }
  ]
  Object.entries(ingredientMap).forEach(([keyword, ings]) => {
    if (dishName.includes(keyword)) {
      ings.forEach(ing => {
        if (!result.some(r => r.name === ing.name)) {
          result.push(ing)
        }
      })
    }
  })

  // 如果没有匹配到具体食材，使用通用调料（不再把菜品名作为食材）
  return result.slice(0, 10)
}

// 用料清单（ref，修复勾选无反应问题）
const ingredientList = ref([])

function loadIngredients() {
  if (!order.value || !order.value.items) return
  const ingredientMap = {}
  ;(order.value.items || []).forEach(item => {
    const dishName = item.dish_name || item.name || '未知菜品'
    const baseIngredients = generateIngredients(dishName)
    baseIngredients.forEach(ing => {
      if (!ingredientMap[ing.name]) {
        ingredientMap[ing.name] = { name: ing.name, amount: ing.amount, checked: false }
      }
    })
  })
  ingredientList.value = Object.values(ingredientMap)
}

const checkedIngredientCount = computed(() => {
  return ingredientList.value.filter(i => i.checked).length
})

const ingredientProgress = computed(() => {
  if (ingredientList.value.length === 0) return 0
  return Math.round(checkedIngredientCount.value / ingredientList.value.length * 100)
})

// 详细烹饪步骤数据库（按菜品名称匹配）
const cookingRecipes = {
  '番茄炒蛋': {
    totalTime: '15分钟',
    difficulty: '简单',
    steps: [
      { text: '番茄洗净，在顶部划十字刀，用开水烫30秒后去皮，切成小块备用', duration: '3分钟' },
      { text: '鸡蛋打入碗中，加少许盐，用筷子充分搅散至起泡', duration: '1分钟' },
      { text: '锅中倒入2汤匙食用油，大火烧至七成热（油面微微冒烟）', duration: '1分钟' },
      { text: '倒入蛋液，待底部凝固后用铲子从边缘向中间推炒，炒成大块后盛出备用', duration: '2分钟' },
      { text: '锅中再加少许油，放入番茄块，中火翻炒至出汁变软', duration: '3分钟' },
      { text: '加入1茶匙白糖和适量盐调味，继续翻炒1分钟', duration: '1分钟' },
      { text: '倒入炒好的鸡蛋，翻炒均匀，撒上葱花即可出锅', duration: '1分钟' },
    ]
  },
  '红烧肉': {
    totalTime: '90分钟',
    difficulty: '中等',
    steps: [
      { text: '五花肉洗净切成3cm见方的块，冷水下锅加姜片、料酒焯水5分钟，捞出洗净浮沫', duration: '10分钟' },
      { text: '锅中放少许油，加入冰糖小火炒至焦糖色（呈琥珀色冒小泡）', duration: '3分钟' },
      { text: '放入五花肉块翻炒上色，每块肉均匀裹上糖色', duration: '2分钟' },
      { text: '加入葱段、姜片、八角、桂皮、香叶炒出香味', duration: '1分钟' },
      { text: '倒入没过肉面的热水，加生抽2汤匙、老抽1汤匙、料酒1汤匙', duration: '1分钟' },
      { text: '大火烧开后转小火，加盖慢炖60-70分钟至肉软烂', duration: '65分钟' },
      { text: '开盖转大火收汁，不断翻动防止粘锅，至汤汁浓稠裹满肉块即可', duration: '5分钟' },
    ]
  },
  '宫保鸡丁': {
    totalTime: '25分钟',
    difficulty: '中等',
    steps: [
      { text: '鸡胸肉切1.5cm丁，加1汤匙生抽、1茶匙淀粉、少许盐腌制15分钟', duration: '15分钟' },
      { text: '花生米用小火炒至金黄酥脆盛出备用（或用油炸）', duration: '3分钟' },
      { text: '调碗汁：醋2汤匙、生抽1汤匙、糖1汤匙、淀粉1茶匙、水2汤匙，搅匀备用', duration: '1分钟' },
      { text: '锅中大火烧热油，放入鸡丁滑炒至变白断生，盛出备用', duration: '2分钟' },
      { text: '锅中留底油，小火爆香干辣椒段（约10根）和花椒（1茶匙），注意不要炒糊', duration: '1分钟' },
      { text: '加入葱段、蒜片、姜末炒香，倒入鸡丁大火翻炒', duration: '1分钟' },
      { text: '倒入碗汁快速翻炒均匀，最后加入花生米翻炒几下即可出锅', duration: '1分钟' },
    ]
  },
  '清炒时蔬': {
    totalTime: '8分钟',
    difficulty: '简单',
    steps: [
      { text: '时蔬（如西兰花/菜心/荷兰豆）洗净，西兰花掰小朵，菜心对半切', duration: '2分钟' },
      { text: '烧一锅开水，加少许盐和几滴油，放入蔬菜焯水1分钟，捞出沥干', duration: '2分钟' },
      { text: '锅中大火烧热2汤匙食用油，放入蒜末爆香', duration: '30秒' },
      { text: '放入焯好的蔬菜，大火快速翻炒，加盐和少许鸡精调味', duration: '1分钟' },
      { text: '翻炒均匀后即可出锅装盘', duration: '30秒' },
    ]
  },
  '鱼香肉丝': {
    totalTime: '20分钟',
    difficulty: '中等',
    steps: [
      { text: '猪里脊肉切丝，加1汤匙生抽、1茶匙淀粉、少许盐腌制10分钟', duration: '10分钟' },
      { text: '木耳泡发切丝，胡萝卜切丝，青椒去籽切丝，葱姜蒜切末', duration: '3分钟' },
      { text: '调鱼香汁：醋2汤匙、生抽1汤匙、糖1.5汤匙、豆瓣酱1汤匙、淀粉1茶匙、水2汤匙', duration: '1分钟' },
      { text: '锅中大火烧热油，放入肉丝滑散炒至变色，盛出备用', duration: '2分钟' },
      { text: '锅中留底油，放入豆瓣酱炒出红油，加入葱姜蒜末炒香', duration: '1分钟' },
      { text: '放入胡萝卜丝、木耳丝翻炒1分钟，再加入青椒丝翻炒', duration: '1分钟' },
      { text: '倒入肉丝和鱼香汁，大火快速翻炒至汤汁浓稠裹匀即可', duration: '1分钟' },
    ]
  },
  '紫菜蛋花汤': {
    totalTime: '10分钟',
    difficulty: '简单',
    steps: [
      { text: '紫菜撕成小片，鸡蛋打散备用，葱切葱花', duration: '2分钟' },
      { text: '锅中加入适量清水（约800ml），大火烧开', duration: '3分钟' },
      { text: '加入少许盐和几滴香油调味', duration: '30秒' },
      { text: '转小火，将蛋液沿筷子缓缓倒入锅中，形成蛋花', duration: '30秒' },
      { text: '加入紫菜，轻轻搅匀，撒上葱花即可关火盛出', duration: '1分钟' },
    ]
  },
  '排骨玉米汤': {
    totalTime: '60分钟',
    difficulty: '简单',
    steps: [
      { text: '排骨斩段洗净，冷水下锅加姜片、料酒焯水5分钟，捞出洗净', duration: '8分钟' },
      { text: '玉米切段，生姜切片，葱打结', duration: '2分钟' },
      { text: '砂锅中放入排骨、玉米、姜片、葱结，加入足量清水', duration: '1分钟' },
      { text: '大火烧开后撇去浮沫，转小火加盖慢炖45分钟', duration: '45分钟' },
      { text: '加入适量盐调味，再炖5分钟，捞出葱结即可', duration: '5分钟' },
    ]
  },
  '番茄牛腩汤': {
    totalTime: '80分钟',
    difficulty: '中等',
    steps: [
      { text: '牛腩切3cm块，冷水下锅加姜片、料酒焯水5分钟，捞出洗净', duration: '8分钟' },
      { text: '番茄顶部划十字，开水烫后去皮，切成小块', duration: '3分钟' },
      { text: '锅中放少许油，放入一半番茄块炒出汁', duration: '3分钟' },
      { text: '加入牛腩翻炒，倒入足量热水，放姜片、葱结，大火烧开', duration: '2分钟' },
      { text: '转小火加盖炖60分钟至牛腩软烂', duration: '60分钟' },
      { text: '加入剩余番茄块，加盐调味，再炖5分钟即可', duration: '5分钟' },
    ]
  },
  '凉拌黄瓜': {
    totalTime: '10分钟',
    difficulty: '简单',
    steps: [
      { text: '黄瓜洗净，用刀面拍碎，切成小段', duration: '1分钟' },
      { text: '蒜切末，加入2汤匙生抽、1汤匙醋、1茶匙糖、少许盐和辣椒油拌匀', duration: '2分钟' },
      { text: '将调好的料汁倒入黄瓜中，拌匀', duration: '1分钟' },
      { text: '撒上少许芝麻和葱花，即可上桌', duration: '1分钟' },
    ]
  },
  '皮蛋豆腐': {
    totalTime: '10分钟',
    difficulty: '简单',
    steps: [
      { text: '豆腐切成1cm厚的片，整齐码在盘中', duration: '2分钟' },
      { text: '皮蛋去壳，每个切成6瓣，摆在豆腐上', duration: '2分钟' },
      { text: '调汁：生抽2汤匙、醋1汤匙、香油1茶匙、蒜末少许，搅匀', duration: '1分钟' },
      { text: '将料汁均匀淋在皮蛋豆腐上，撒上葱花即可', duration: '1分钟' },
    ]
  },
  '蒜泥白肉': {
    totalTime: '25分钟',
    difficulty: '中等',
    steps: [
      { text: '五花肉整块冷水下锅，加姜片、葱段、料酒，大火煮开后转中火煮20分钟', duration: '22分钟' },
      { text: '煮熟后捞出放入冰水中浸泡5分钟（使肉质紧实，口感更好）', duration: '5分钟' },
      { text: '捞出沥干，切成薄片，整齐码在盘中', duration: '3分钟' },
      { text: '蒜捣成泥，加生抽2汤匙、辣椒油1汤匙、香油1茶匙、少许糖拌匀', duration: '2分钟' },
      { text: '将蒜泥料汁淋在白肉上，撒上葱花即可', duration: '1分钟' },
    ]
  },
  '蛋炒饭': {
    totalTime: '10分钟',
    difficulty: '简单',
    steps: [
      { text: '隔夜米饭提前用手拨散（新鲜米饭可放凉后使用）', duration: '1分钟' },
      { text: '鸡蛋打散，葱切葱花备用', duration: '1分钟' },
      { text: '锅中大火烧热2汤匙油，倒入蛋液快速炒散，盛出备用', duration: '1分钟' },
      { text: '锅中再加少许油，放入米饭大火翻炒，炒至米粒分明、微微干爽', duration: '3分钟' },
      { text: '倒入炒好的鸡蛋，加盐调味，撒入葱花翻炒均匀即可', duration: '1分钟' },
    ]
  },
  '手工水饺': {
    totalTime: '60分钟',
    difficulty: '中等',
    steps: [
      { text: '和面：面粉中慢慢加入温水，边加边搅拌成絮状，揉成光滑面团，醒面30分钟', duration: '35分钟' },
      { text: '调馅：猪肉馅中分次加入葱姜水（共3汤匙），顺一个方向搅拌上劲', duration: '5分钟' },
      { text: '白菜切碎，撒少许盐腌制10分钟，挤干水分，加入肉馅中', duration: '12分钟' },
      { text: '馅中加盐、生抽、蚝油、香油调味，搅拌均匀', duration: '2分钟' },
      { text: '面团搓条切剂子（约10g一个），擀成中间厚边缘薄的圆皮', duration: '10分钟' },
      { text: '取适量馅放在皮中央，对折捏紧，再捏出褶皱', duration: '15分钟' },
      { text: '锅中烧开水，下入饺子，轻轻搅动防粘，水开后加冷水，反复三次至饺子浮起', duration: '8分钟' },
    ]
  },
  '葱油拌面': {
    totalTime: '15分钟',
    difficulty: '简单',
    steps: [
      { text: '葱切段（葱白和葱绿分开），准备面条', duration: '2分钟' },
      { text: '锅中倒入3汤匙食用油，小火放入葱段，慢慢炸至葱段焦黄酥脆，捞出葱油备用', duration: '5分钟' },
      { text: '大锅烧开水，下面条煮至刚好断生（有嚼劲），捞出沥干', duration: '5分钟' },
      { text: '面条中加入2汤匙生抽、少许白糖，淋上葱油，撒上酥脆葱段，拌匀即可', duration: '1分钟' },
    ]
  },
  '煎饺': {
    totalTime: '15分钟',
    difficulty: '简单',
    steps: [
      { text: '平底锅中倒入2汤匙油，中火烧热', duration: '1分钟' },
      { text: '将速冻水饺（无需解冻）整齐码在锅中，煎2分钟至底部微黄', duration: '2分钟' },
      { text: '倒入清水至饺子三分之一高度，立即盖上锅盖', duration: '30秒' },
      { text: '中火焖煮约8分钟至水分蒸发，听到滋滋声', duration: '8分钟' },
      { text: '继续煎1-2分钟至底部金黄酥脆，倒扣在盘中即可', duration: '2分钟' },
    ]
  },
  '春卷': {
    totalTime: '20分钟',
    difficulty: '中等',
    steps: [
      { text: '猪肉馅炒熟，卷心菜切丝炒软，加盐调味，混合成馅料放凉', duration: '8分钟' },
      { text: '取一张春卷皮，放入适量馅料在下方，向上卷一圈', duration: '1分钟' },
      { text: '左右两边向中间折，继续向上卷紧，用面糊封口', duration: '1分钟' },
      { text: '锅中倒入足量油，烧至六成热（筷子插入有密集气泡）', duration: '3分钟' },
      { text: '放入春卷，中火炸至金黄酥脆（约3-4分钟），捞出沥油', duration: '4分钟' },
    ]
  },
  '炸鸡翅': {
    totalTime: '40分钟',
    difficulty: '中等',
    steps: [
      { text: '鸡翅洗净，在两面各划两刀方便入味，用厨房纸吸干水分', duration: '3分钟' },
      { text: '加入生抽2汤匙、料酒1汤匙、蜂蜜1汤匙、蒜末、姜片腌制30分钟', duration: '32分钟' },
      { text: '鸡翅裹上一层薄薄的淀粉', duration: '2分钟' },
      { text: '锅中倒入足量油，烧至六成热，放入鸡翅中火炸5分钟至表面金黄', duration: '5分钟' },
      { text: '转大火再炸1分钟逼出多余油分，捞出沥油即可', duration: '1分钟' },
    ]
  },
  '红豆沙': {
    totalTime: '50分钟',
    difficulty: '简单',
    steps: [
      { text: '红豆提前浸泡4小时（或用高压锅可省略），洗净沥干', duration: '5分钟' },
      { text: '放入锅中加3倍水量，大火烧开后转小火煮40分钟至软烂', duration: '40分钟' },
      { text: '加入冰糖，继续搅拌煮至冰糖融化，汤汁浓稠', duration: '3分钟' },
      { text: '可加入少许椰奶增加风味，搅匀后盛出', duration: '1分钟' },
    ]
  },
  '芒果西米露': {
    totalTime: '25分钟',
    difficulty: '简单',
    steps: [
      { text: '西米放入大量沸水中煮15分钟，边煮边搅拌防粘，煮至只剩中心白点', duration: '15分钟' },
      { text: '关火焖5分钟至完全透明，捞出过冷水沥干', duration: '5分钟' },
      { text: '芒果去皮切丁，一半留果肉，一半加椰奶打成芒果椰奶浆', duration: '3分钟' },
      { text: '碗中放入西米、芒果果肉，倒入芒果椰奶浆，冷藏后口感更佳', duration: '2分钟' },
    ]
  },
  '双皮奶': {
    totalTime: '30分钟',
    difficulty: '中等',
    steps: [
      { text: '牛奶倒入锅中，小火加热至边缘冒小泡（不要沸腾），倒入碗中放凉结奶皮', duration: '8分钟' },
      { text: '挑起奶皮，将牛奶缓缓倒出（留奶皮在碗底），牛奶中加入蛋清和糖搅匀', duration: '3分钟' },
      { text: '过筛2次使奶液细腻，沿碗边缓缓倒回碗中（让奶皮浮起）', duration: '2分钟' },
      { text: '盖上保鲜膜，上锅中火蒸15分钟，关火焖5分钟', duration: '20分钟' },
      { text: '取出放凉，撒上红豆或芒果丁即可', duration: '2分钟' },
    ]
  },
  '蛋挞': {
    totalTime: '30分钟',
    difficulty: '中等',
    steps: [
      { text: '牛奶微波炉加热30秒，加入糖搅拌至融化，放凉备用', duration: '3分钟' },
      { text: '鸡蛋打散，加入放凉的牛奶中搅匀，过筛2次使挞液细腻', duration: '3分钟' },
      { text: '蛋挞皮排列在烤盘上，将挞液倒入至八分满', duration: '2分钟' },
      { text: '烤箱预热至200°C，放入中层烤20-25分钟至表面出现焦斑', duration: '22分钟' },
    ]
  },
  '戚风蛋糕': {
    totalTime: '60分钟',
    difficulty: '较难',
    steps: [
      { text: '蛋黄蛋白分离（装蛋白的碗必须无水无油），蛋黄加20g糖搅匀', duration: '3分钟' },
      { text: '依次加入植物油30ml和水30ml，每次搅匀后再加下一种', duration: '2分钟' },
      { text: '筛入低筋面粉80g，用刮刀翻拌至无干粉（不要画圈搅拌）', duration: '2分钟' },
      { text: '蛋白中加几滴柠檬汁，用电动打蛋器打至粗泡，分3次加入40g糖', duration: '5分钟' },
      { text: '继续打至提起打蛋器呈直立小尖角（干性发泡）', duration: '3分钟' },
      { text: '取1/3蛋白霜加入蛋黄糊中翻拌均匀，再倒回蛋白霜中翻拌均匀', duration: '3分钟' },
      { text: '倒入8寸戚风模具，轻震几下震出大气泡', duration: '1分钟' },
      { text: '放入预热好150°C的烤箱，烤45-50分钟，出炉后立即倒扣放凉', duration: '50分钟' },
    ]
  },
  '曲奇饼干': {
    totalTime: '30分钟',
    difficulty: '中等',
    steps: [
      { text: '黄油100g室温软化（手指能轻松按出坑），加入糖粉用刮刀拌匀', duration: '3分钟' },
      { text: '分2次加入蛋液，每次搅匀后再加下一次', duration: '2分钟' },
      { text: '筛入低筋面粉150g，用刮刀切拌至无干粉（不要过度搅拌）', duration: '2分钟' },
      { text: '将面糊装入裱花袋，在铺了油纸的烤盘上挤出花型', duration: '5分钟' },
      { text: '放入预热好170°C的烤箱，烤15-18分钟至边缘微黄', duration: '17分钟' },
      { text: '取出放凉后会变酥脆，完全冷却后密封保存', duration: '10分钟' },
    ]
  },
  '柠檬蜂蜜水': {
    totalTime: '5分钟',
    difficulty: '简单',
    steps: [
      { text: '柠檬用盐搓洗表面，切薄片去籽', duration: '1分钟' },
      { text: '杯中放入柠檬片，加入1汤匙蜂蜜', duration: '30秒' },
      { text: '倒入温水（不要用开水，会破坏蜂蜜营养），搅拌均匀即可', duration: '1分钟' },
    ]
  },
  '绿豆汤': {
    totalTime: '40分钟',
    difficulty: '简单',
    steps: [
      { text: '绿豆洗净，提前浸泡1小时（不泡也可以，只是煮的时间更长）', duration: '5分钟' },
      { text: '锅中加入绿豆和足量清水（约绿豆的8倍），大火烧开', duration: '5分钟' },
      { text: '转小火煮30分钟至绿豆开花软烂', duration: '30分钟' },
      { text: '加入冰糖搅拌至融化，关火即可（喜欢冰饮可冷藏后饮用）', duration: '2分钟' },
    ]
  },
  '酸梅汤': {
    totalTime: '45分钟',
    difficulty: '简单',
    steps: [
      { text: '乌梅、山楂、甘草用清水快速冲洗干净', duration: '1分钟' },
      { text: '锅中加入2L清水，放入所有材料，大火烧开', duration: '5分钟' },
      { text: '转小火煮30分钟，让味道充分释放', duration: '30分钟' },
      { text: '加入冰糖搅拌至融化，关火过滤渣滓', duration: '3分钟' },
      { text: '放凉后冷藏饮用，风味更佳', duration: '等待冷却' },
    ]
  },
}

// 默认步骤（没有匹配到具体菜谱时使用）
const defaultRecipe = {
  totalTime: '30分钟',
  difficulty: '中等',
  steps: [
    { text: '准备所有食材，清洗干净，按菜谱要求切配好', duration: '5分钟' },
    { text: '锅中烧热食用油，放入主料翻炒至变色', duration: '3分钟' },
    { text: '加入调料（盐、酱油、料酒等），翻炒均匀入味', duration: '3分钟' },
    { text: '加入配菜继续翻炒至断生', duration: '3分钟' },
    { text: '试味调整，大火收汁或加少许水淀粉勾芡', duration: '2分钟' },
    { text: '出锅装盘，撒上葱花或香菜点缀即可', duration: '1分钟' },
  ]
}

// 烹饪步骤
const cookingSteps = computed(() => {
  if (!order.value || !order.value.items) return []
  return (order.value.items || []).map(item => {
    const dishName = item.dish_name || item.name || '未知菜品'
    const recipe = cookingRecipes[dishName] || defaultRecipe
    return {
      dishName,
      totalTime: recipe.totalTime,
      difficulty: recipe.difficulty,
      steps: recipe.steps.map(s => reactive({ text: s.text, duration: s.duration, done: false }))
    }
  })
})

// 导出购物清单
function exportShoppingList() {
  if (!order.value) {
    showToast({ message: '订单数据未加载', icon: 'fail' })
    return
  }
  if (ingredientList.value.length === 0) {
    showToast({ message: '购物清单为空', icon: 'fail' })
    return
  }
  let text = '===== 购物清单 =====\n\n'
  text += `订单时间: ${formatTime(order.value.created_at)}\n`
  text += `菜品: ${(order.value.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}\n\n`
  text += '--- 用料 ---\n'
  ingredientList.value.forEach(item => {
    text += `${item.checked ? '[x]' : '[ ]'} ${item.name} ${item.amount}\n`
  })
  text += '\n--- 营养总览 ---\n'
  if (order.value.total_nutrition) {
    text += `热量: ${Math.round(order.value.total_nutrition.per_serving_kcal || 0)} kcal\n`
    text += `蛋白质: ${(order.value.total_nutrition.protein || 0).toFixed(1)} g\n`
    text += `碳水: ${(order.value.total_nutrition.carb || 0).toFixed(1)} g\n`
    text += `脂肪: ${(order.value.total_nutrition.fat || 0).toFixed(1)} g\n`
  }

  fallbackCopy(text)
}

function fallbackCopy(text) {
  // 尝试 navigator.clipboard（HTTPS 环境）
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(() => {
      showSuccessToast('购物清单已复制到剪贴板')
    }).catch(() => {
      doFallbackCopy(text)
    })
  } else {
    doFallbackCopy(text)
  }
}

function doFallbackCopy(text) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.left = '-9999px'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()
  try {
    document.execCommand('copy')
    showSuccessToast('购物清单已复制到剪贴板')
  } catch (e) {
    // 最后兜底：弹出文本让用户手动复制
    showCopyDialog(text)
  }
  document.body.removeChild(textarea)
}

// 兜底：弹出对话框显示文本
const showCopyText = ref('')
const showCopyDialogVisible = ref(false)
function showCopyDialog(text) {
  showCopyText.value = text
  showCopyDialogVisible.value = true
}

// 分享
async function sharePrepList() {
  if (!order.value) {
    showToast({ message: '订单数据未加载', icon: 'fail' })
    return
  }
  const shareData = {
    title: '家庭备餐清单',
    text: `今日备餐: ${(order.value.items || []).map(i => `${i.name} x${i.quantity}`).join(', ')}`
  }
  if (navigator.share) {
    try {
      await navigator.share(shareData)
    } catch (e) {
      // 用户取消分享
      if (e.name !== 'AbortError') {
        showToast({ message: '分享失败', icon: 'fail' })
      }
    }
  } else {
    // 不支持 Web Share API，复制到剪贴板
    fallbackCopy(shareData.text)
  }
}

// 加载订单详情
async function loadOrder() {
  const orderId = route.params.id
  if (!orderId) return
  try {
    const res = await getOrderDetail(orderId)
    order.value = res.data || res
    loadIngredients()
  } catch (e) {
    console.error('加载订单详情失败:', e)
    showToast({ message: '加载失败', icon: 'fail' })
  }
}

onMounted(() => {
  loadOrder()
})
</script>

<style scoped>
.prep-list-page {
  min-height: 100%;
  background: var(--color-bg);
}

.prep-page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--color-bg-white);
  border-bottom: 1px solid var(--color-border);
  flex-shrink: 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.prep-back-btn {
  cursor: pointer;
  padding: 4px;
}

.prep-page-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.prep-page-placeholder {
  width: 26px;
}

.prep-content {
  padding: 12px;
  padding-bottom: 100px;
}

.prep-card {
  background: var(--color-bg-white);
  border-radius: 12px;
  padding: 14px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
}

.prep-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 12px;
  padding-left: 10px;
  border-left: 3px solid var(--color-primary);
}

/* 订单信息 */
.prep-info-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 0;
}

.prep-info-label {
  font-size: 13px;
  color: var(--color-text-hint);
  flex-shrink: 0;
  margin-right: 12px;
}

.prep-info-value {
  font-size: 13px;
  color: var(--color-text-primary);
  text-align: right;
}

/* 用料清单 */
.ingredients-list {
  margin-bottom: 12px;
}

.ingredient-item {
  padding: 6px 0;
}

.ingredient-checkbox {
  align-items: center;
}

.ingredient-name {
  font-size: 14px;
  color: var(--color-text-primary);
}

.ingredient-name.checked {
  color: var(--color-text-hint);
  text-decoration: line-through;
}

.ingredient-amount {
  font-size: 12px;
  color: #999;
  margin-left: 6px;
}

.ingredients-progress {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.progress-text {
  font-size: 12px;
  color: var(--color-text-hint);
  white-space: nowrap;
}

.ingredients-progress :deep(.van-progress) {
  flex: 1;
}

/* 烹饪步骤 */
.steps-list {
  margin-bottom: 4px;
}

.step-group {
  margin-bottom: 12px;
}

.step-group:last-child {
  margin-bottom: 0;
}

.step-group-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.step-group-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-primary);
}

.step-group-meta {
  display: flex;
  gap: 6px;
  align-items: center;
}

.step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 0;
  cursor: pointer;
}

.step-check {
  flex-shrink: 0;
  margin-top: 1px;
}

.step-content {
  flex: 1;
}

.step-text {
  font-size: 13px;
  color: var(--color-text-primary);
  line-height: 1.5;
}

.step-text.done {
  color: var(--color-text-hint);
  text-decoration: line-through;
}

.step-duration {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* 营养总览 */
.nutrition-overview {
  margin-bottom: 8px;
}

.nutrition-bar-item {
  margin-bottom: 12px;
}

.nutrition-bar-item:last-child {
  margin-bottom: 0;
}

.nutrition-bar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.nutrition-bar-label {
  font-size: 13px;
  color: var(--color-text-primary);
  font-weight: 500;
}

.nutrition-bar-value {
  font-size: 12px;
  color: var(--color-text-hint);
}

.nutrition-legend {
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid var(--color-border);
}

.legend-text {
  font-size: 11px;
  color: var(--color-text-hint);
}

/* 底部操作 */
.prep-bottom-actions {
  padding: 12px;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-bg-white);
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.08);
  display: flex;
  gap: 10px;
  z-index: 50;
}

.prep-action-btn {
  flex: 1;
  height: 40px;
}

/* 加载中 */
.prep-loading {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 300px;
}
</style>
