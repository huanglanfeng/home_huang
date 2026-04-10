import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getCategories as getCategoriesApi } from '../api/dishes'

export const useCategoryStore = defineStore('category', () => {
  const categories = ref([])

  async function fetchCategories() {
    const res = await getCategoriesApi()
    categories.value = res.data || []
    return categories.value
  }

  return {
    categories,
    fetchCategories
  }
})
