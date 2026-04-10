import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export const useCartStore = defineStore('cart', () => {
  const items = ref([])

  const totalCount = computed(() => items.value.reduce((sum, item) => sum + item.quantity, 0))

  const totalNutrition = computed(() => {
    return items.value.reduce((acc, item) => {
      const n = item.nutrition || {}
      return {
        per_serving_kcal: (acc.per_serving_kcal || 0) + (n.per_serving_kcal || 0) * item.quantity,
        protein: (acc.protein || 0) + (n.protein || 0) * item.quantity,
        carb: (acc.carb || 0) + (n.carb || 0) * item.quantity,
        fat: (acc.fat || 0) + (n.fat || 0) * item.quantity,
        sodium: (acc.sodium || 0) + (n.sodium || 0) * item.quantity,
        fiber: (acc.fiber || 0) + (n.fiber || 0) * item.quantity,
      }
    }, {})
  })

  function addItem(dish, specs = {}, quantity = 1, notes = '') {
    const existing = items.value.findIndex(item =>
      item.dish_id === dish.id && JSON.stringify(item.specs) === JSON.stringify(specs)
    )
    if (existing >= 0) {
      items.value[existing].quantity += quantity
    } else {
      items.value.push({
        dish_id: dish.id,
        name: dish.name,
        cover: dish.cover,
        specs,
        quantity,
        nutrition: dish.nutrition || {},
        notes
      })
    }
  }

  function removeItem(index) {
    items.value.splice(index, 1)
  }

  function updateQuantity(index, qty) {
    if (qty <= 0) {
      items.value.splice(index, 1)
    } else {
      items.value[index].quantity = qty
    }
  }

  function clearCart() {
    items.value = []
  }

  return { items, totalCount, totalNutrition, addItem, removeItem, updateQuantity, clearCart }
})
