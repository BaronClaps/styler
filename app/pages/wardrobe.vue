<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvfbrkfacfdhemgaamfu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZmJya2ZhY2ZkaGVtZ2FhbWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk0OTksImV4cCI6MjA5NTkyNTQ5OX0.3Pa2PH-d-Leujqc5SBEz_yanERVyTDmFxMeMLP2v9Og'
const supabase = createClient(supabaseUrl, supabaseKey)

const { userId } = useUser()

interface ClothingItem {
  id: string
  user_id: string
  image_url: string
  status: 'pending' | 'processed' | 'failed'
  created_at?: string
  category?: string
  sub_category?: string
  primary_color_hex?: string
  secondary_color_hex?: string
  is_patterned?: boolean
  pattern_type?: string
  style_tags?: string[]
  weather_tags?: string[]
  occasions?: string[]
  color?: string
}

const items = ref<ClothingItem[]>([])
const isLoading = ref(true)
const isRefreshing = ref(false)
const errorMessage = ref<string | null>(null)
const deletingId = ref<string | null>(null)

const fetchWardrobeItems = async (showRefreshIndicator = false) => {
  if (!userId.value) {
    isLoading.value = false
    return
  }

  if (showRefreshIndicator) isRefreshing.value = true
  errorMessage.value = null

  try {
    const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('user_id', userId.value)
        .order('created_at', { ascending: false })

    if (error) throw error
    items.value = data || []
  } catch (err: any) {
    console.error('Error getting wardrobe:', err)
    errorMessage.value = err.message || 'Failed to fetch'
  } finally {
    isLoading.value = false
    isRefreshing.value = false
  }
}

const deleteItem = async (id: string) => {
  if (!userId.value) return

  deletingId.value = id
  try {
    // Verified targeting utilizing both Item ID and User ID context to satisfy Supabase RLS
    const { error } = await supabase
        .from('clothing_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId.value)

    if (error) throw error

    // Smooth immediate refresh following successful drop
    await fetchWardrobeItems(false)
  } catch (err: any) {
    console.error('Error deleting wardrobe item:', err)
    alert(err.message || 'Failed to delete item. Verify your database permissions.')
  } finally {
    deletingId.value = null
  }
}

const getStatusBadgeColor = (status: ClothingItem['status']) => {
  switch (status) {
    case 'completed':
      return 'success'
    case 'processed':
      return 'success'
    case 'pending':
      return 'warning'
    case 'failed':
      return 'danger'
    default:
      return 'neutral'
  }
}

onMounted(() => {
  fetchWardrobeItems()
})
</script>

<template>
  <UMain class="h-full min-h-0 flex flex-col bg-neutral-950 overflow-hidden text-slate-100">
    <div class="p-6 shrink-0 flex items-center justify-between border-b border-slate-800/60 bg-neutral-900/40 backdrop-blur-md">
      <div class="flex items-center gap-3">
        <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            label="Back"
            class="text-slate-400 hover:text-white"
            @click="$router.back()"
        />
        <h1 class="text-xl font-bold tracking-tight text-slate-100">My Wardrobe</h1>
      </div>
      <UButton
          icon="i-heroicons-arrow-path"
          color="neutral"
          variant="subtle"
          size="sm"
          :loading="isRefreshing"
          :disabled="isLoading || !userId"
          @click="fetchWardrobeItems(true)"
      />
    </div>

    <div class="flex-1 overflow-y-auto p-6 min-h-0">

      <div v-if="!userId" class="flex flex-col items-center justify-center py-16 text-center max-w-sm mx-auto">
        <div class="p-4 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 mb-4">
          <UIcon name="i-heroicons-user-minus" class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-semibold text-slate-200 mb-1">Context Missing</h3>
        <p class="text-sm text-slate-400 mb-6">You need to configure a UUID in Settings before viewing your collection.</p>
        <UButton to="/settings" label="Go to Settings" color="primary" />
      </div>

      <div v-else-if="isLoading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        <div v-for="n in 4" :key="n" class="aspect-[3/4] rounded-xl bg-slate-900/60 border border-slate-800/60 flex flex-col overflow-hidden animate-pulse">
          <div class="flex-1 bg-slate-800/40" />
          <div class="p-3 space-y-2 bg-neutral-900/40">
            <div class="h-4 bg-slate-800 rounded w-2/3" />
            <div class="h-3 bg-slate-800 rounded w-1/3" />
          </div>
        </div>
      </div>

      <div v-else-if="errorMessage" class="p-4 rounded-xl border border-rose-900/50 bg-rose-950/20 text-rose-200 text-sm max-w-xl mx-auto flex items-start gap-3">
        <UIcon name="i-heroicons-exclamation-circle" class="w-5 h-5 shrink-0 mt-0.5" />
        <div class="flex-1">
          <p class="font-medium">Database connection lost</p>
          <p class="text-rose-300/80 text-xs mt-1">{{ errorMessage }}</p>
          <UButton size="xs" color="danger" variant="subtle" class="mt-3" @click="fetchWardrobeItems(false)">Try Again</UButton>
        </div>
      </div>

      <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center py-20 text-center max-w-sm mx-auto">
        <div class="p-4 rounded-full bg-slate-900/60 border border-slate-800 text-slate-400 mb-4">
          <UIcon name="i-lucide-shirt" class="w-8 h-8" />
        </div>
        <h3 class="text-lg font-semibold text-slate-200 mb-1">Your wardrobe is empty</h3>
        <p class="text-sm text-slate-400 mb-6">Take photos or upload clothing using the camera.</p>
        <UButton to="/camera" icon="i-heroicons-camera" label="Open Camera Scanner" color="neutral" variant="subtle" />
      </div>

      <div v-else class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 items-start">
        <div
            v-for="item in items"
            :key="item.id"
            class="group bg-slate-900/40 border border-slate-800/80 rounded-xl overflow-hidden flex flex-col hover:border-slate-700/60 transition-all duration-300 shadow-md"
        >
          <div class="relative aspect-[3/4] w-full bg-slate-950 overflow-hidden">
            <img
                :src="item.image_url"
                alt="Clothing snapshot view"
                class="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                loading="lazy"
            />
            <div class="absolute top-2 left-2 z-10">
              <UBadge :color="getStatusBadgeColor(item.status)" variant="solid" size="sm" class="capitalize font-semibold tracking-wide shadow-md px-1.5 py-0.5 text-[10px]">
                {{ item.status }}
              </UBadge>
            </div>

            <div class="absolute top-2 right-2 z-10">
              <button
                  type="button"
                  class="flex items-center justify-center w-7 h-7 rounded-full shadow-lg bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 transition-all focus:outline-none disabled:opacity-50"
                  :disabled="deletingId !== null"
                  @click.stop="deleteItem(item.id)"
                  aria-label="Delete wardrobe record"
              >
                <UIcon
                    :name="deletingId === item.id ? 'i-heroicons-arrow-path' : 'i-heroicons-trash'"
                    class="w-4 h-4 text-white"
                    :class="{ 'animate-spin': deletingId === item.id }"
                />
              </button>
            </div>
          </div>

          <div class="p-3 bg-neutral-900 border-t border-slate-800/80 flex flex-col gap-1">
            <div class="flex items-center justify-between gap-1.5 min-w-0">
              <span class="text-xs font-bold truncate text-slate-200 group-hover:text-white transition-colors">
                {{ item.sub_category || item.category || 'Analyzing...' }}
              </span>

              <UPopover :disabled="item.status === 'pending'" mode="click" :ui="{ width: 'w-64 sm:w-72' }">
                <UButton
                    icon="i-heroicons-chart-bar"
                    color="neutral"
                    variant="link"
                    size="md"
                    class="p-1 text-slate-400 hover:text-emerald-400 transition"
                    :disabled="item.status === 'pending'"
                    aria-label="View Metrics"
                />

                <template #content>
                  <div class="p-4 bg-slate-900 border border-slate-800 rounded-lg shadow-2xl text-xs text-slate-300 space-y-3.5 select-none">
                    <div class="flex flex-col gap-0.5 pb-2 border-b border-slate-800/60">
                      <span class="text-[11px] font-bold text-slate-400 capitalize">{{ item.category || 'Details' }} Profile</span>
                      <span class="font-mono text-[9px] text-slate-500 truncate">ID: {{ item.id }}</span>
                    </div>

                    <div class="flex flex-col gap-1.5">
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Color Palette</span>
                      <div class="flex items-center gap-2 bg-slate-950 p-2 rounded border border-slate-800/80">
                        <div class="flex items-center gap-1 min-w-0 flex-1">
                          <div class="w-3 h-3 rounded shrink-0 border border-white/10" :style="{ backgroundColor: item.primary_color_hex || '#334155' }" />
                          <span class="font-mono text-[10px] truncate">{{ item.primary_color_hex || 'N/A' }}</span>
                        </div>
                        <div class="w-px h-3 bg-slate-800 shrink-0" />
                        <div class="flex items-center gap-1 min-w-0 flex-1">
                          <div class="w-3 h-3 rounded shrink-0 border border-white/10" :style="{ backgroundColor: item.secondary_color_hex || '#334155' }" />
                          <span class="font-mono text-[10px] truncate">{{ item.secondary_color_hex || 'N/A' }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="flex justify-between items-center bg-slate-950/40 p-1.5 px-2 rounded border border-slate-800/40 text-[11px]">
                      <span class="text-slate-400">Pattern:</span>
                      <span class="font-medium text-slate-200">
                        {{ item.is_patterned ? item.pattern_type : 'Solid Fabric' }}
                      </span>
                    </div>

                    <div v-if="item.style_tags?.length" class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Vibe</span>
                      <div class="flex flex-wrap gap-1">
                        <span v-for="tag in item.style_tags" :key="tag" class="text-[10px] bg-slate-800 border border-slate-700/40 text-slate-300 px-1.5 py-0.5 rounded capitalize font-medium">
                          {{ tag }}
                        </span>
                      </div>
                    </div>

                    <div v-if="item.weather_tags?.length" class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Weather</span>
                      <div class="flex flex-wrap gap-1">
                        <span v-for="w in item.weather_tags" :key="w" class="text-[10px] bg-emerald-950/40 border border-emerald-900/60 text-emerald-400 px-1.5 py-0.5 rounded capitalize font-mono font-medium">
                          {{ w }}
                        </span>
                      </div>
                    </div>

                    <div v-if="item.occasions?.length" class="space-y-1">
                      <span class="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Occasion</span>
                      <div class="flex flex-wrap gap-1">
                        <span v-for="occ in item.occasions" :key="occ" class="text-[10px] bg-blue-950/40 border border-blue-900/60 text-blue-400 px-1.5 py-0.5 rounded capitalize font-medium">
                          {{ occ.replace('_', ' ') }}
                        </span>
                      </div>
                    </div>
                  </div>
                </template>
              </UPopover>
            </div>
          </div>
        </div>
      </div>
    </div>
  </UMain>
</template>