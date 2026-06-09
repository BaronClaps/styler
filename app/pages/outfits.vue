<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { createClient } from '@supabase/supabase-js'
import { useUser } from '~/composables/useUser'

const supabaseUrl = 'https://tvfbrkfacfdhemgaamfu.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZmJya2ZhY2ZkaGVtZ2FhbWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk0OTksImV4cCI6MjA5NTkyNTQ5OX0.3Pa2PH-d-Leujqc5SBEz_yanERVyTDmFxMeMLP2v9Og'
const supabase = createClient(supabaseUrl, supabaseKey)
const { userId } = useUser()
const activeTab = ref<'review' | 'history'>('review')
const historyFilter = ref<'accepted' | 'declined'>('accepted')
const deckList = ref<any[]>([])
const historyList = ref<any[]>([])
const isLoadingDeck = ref(false)
const promptText = ref('')
const isSubmittingRequest = ref(false)
const swipeDirection = ref<'left' | 'right' | null>(null)
const lockSwiper = ref(false)
const dragX = ref(0)
const isDragging = ref(false)
let startX = 0
const realQueueCount = computed(() => deckList.value.filter(o => o.status === 'pending' || o.status === 'processing').length)

const getCardStyles = (item: any) => {
  const index = deckList.value.indexOf(item)
  if (index < 0) return 'display: none;'

  if (index === 0) {
    if (swipeDirection.value === 'right') return 'transform: translateX(180%) rotate(20deg); opacity: 0; transition: transform 250ms ease-in, opacity 250ms; z-index: 40;'
    if (swipeDirection.value === 'left') return 'transform: translateX(-180%) rotate(-20deg); opacity: 0; transition: transform 250ms ease-in, opacity 250ms; z-index: 40;'
    if (isDragging.value) {
      const rotation = (dragX.value / 350) * 12
      return `transform: translateX(${dragX.value}px) rotate(${rotation}deg); transition: none; z-index: 40;`
    }
    return 'transform: translateX(0px) rotate(0deg); transition: transform 250ms cubic-bezier(0.175, 0.885, 0.32, 1.1), opacity 250ms; z-index: 40;'
  }
  const translateY = index * 14
  const rotateDeg = index % 2 === 0 ? index * 2.5 : index * -2.5
  const scale = 1 - (index * 0.03)

  return `transform: translateY(${translateY}px) scale(${scale}) rotate(${rotateDeg}deg); z-index: ${40 - index}; pointer-events: none; transition: transform 300ms ease-out, opacity 300ms;`
}
const handleDragStart = (e: PointerEvent) => {
  if (lockSwiper.value || deckList.value.length === 0) return
  const activeCard = deckList.value[0]
  if (activeCard.status === 'pending' || activeCard.status === 'processing') return
  const target = e.target as HTMLElement
  if (target.closest('button') || target.closest('a')) return
  isDragging.value = true
  startX = e.clientX
  const el = e.currentTarget as HTMLElement
  el.setPointerCapture(e.pointerId)
}

const handleDragMove = (e: PointerEvent) => {
  if (!isDragging.value) return
  dragX.value = e.clientX - startX
}

const handleDragEnd = (e: PointerEvent) => {
  if (!isDragging.value) return
  isDragging.value = false
  const el = e.currentTarget as HTMLElement
  el.releasePointerCapture(e.pointerId)

  if (dragX.value > 140) {
    recordVote('accepted')
  } else if (dragX.value < -140) {
    recordVote('declined')
  } else {
    dragX.value = 0
  }
}

const loadDeck = async () => {
  if (!userId.value) return
  isLoadingDeck.value = true

  const { data, error } = await supabase
      .from('view_outfits_compiled')
      .select('*')
      .in('status', ['processed', 'pending', 'processing'])

  if (!error && data) {
    deckList.value = data
        .filter((item: any) => item.user_id === userId.value)
        .sort((a, b) => {
          const aReady = a.status === 'processed' ? 1 : 0
          const bReady = b.status === 'processed' ? 1 : 0

          if (aReady !== bReady) {
            return bReady - aReady
          }

          if (b.priority !== a.priority) {
            return b.priority - a.priority
          }
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        })
  }
  isLoadingDeck.value = false
}

const loadHistory = async () => {
  if (!userId.value) return
  const { data, error } = await supabase
      .from('view_outfits_compiled')
      .select('*')
      .eq('user_id', userId.value)
      .eq('status', historyFilter.value)
      .order('updated_at', { ascending: false })

  if (!error && data) historyList.value = data
}

const queueCustomOutfit = async () => {
  if (!userId.value || !promptText.value.trim()) return
  isSubmittingRequest.value = true

  const basePayload: any = {
    user_id: userId.value,
    priority: 10,
    status: 'pending',
    prompt: promptText.value.trim()
  }

  const { error } = await supabase.from('outfits').insert([basePayload])

  if (!error) {
    promptText.value = ''
    await loadDeck()

    fetch(`${supabaseUrl}/functions/v1/generate-outfits`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${supabaseKey}` }
    }).then(() => loadDeck())
  }
  isSubmittingRequest.value = false
}

const recordVote = async (status: 'accepted' | 'declined') => {
  if (deckList.value.length === 0 || lockSwiper.value) return

  lockSwiper.value = true
  swipeDirection.value = status === 'accepted' ? 'right' : 'left'
  const targetId = deckList.value[0].id

  await supabase
      .from('outfits')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', targetId)

  setTimeout(() => {
    deckList.value.shift()
    swipeDirection.value = null
    dragX.value = 0
    lockSwiper.value = false
    if (activeTab.value === 'history') loadHistory()
  }, 250)
}

const fillBackgroundQueue = async () => {
  if (!userId.value || realQueueCount.value >= 20) return
  const needed = 20 - realQueueCount.value

  const backgroundItems = Array.from({ length: needed }).map(() => ({
    user_id: userId.value,
    priority: 0,
    status: 'pending' as const
  }))

  await supabase.from('outfits').insert(backgroundItems)
  loadDeck()
}

onMounted(() => {
  if (userId.value) {
    loadDeck()
    loadHistory()
    setTimeout(() => fillBackgroundQueue(), 1000)
  }
})

watch(historyFilter, () => loadHistory())
watch(activeTab, (tab) => { if (tab === 'history') loadHistory() })
</script>

<template>
  <UMain class="w-full h-full min-h-0 bg-neutral-950 p-3 sm:p-6 flex flex-col overflow-y-auto select-none">
    <div class="max-w-2xl w-full mx-auto mb-4 flex gap-2 bg-slate-900/60 border border-slate-800/80 p-1 rounded-xl shrink-0">
      <button
          class="flex-1 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          :class="activeTab === 'review' ? 'bg-slate-800 text-white border border-slate-700/50 shadow-md' : 'text-slate-400 hover:text-slate-200'"
          @click="activeTab = 'review'">
        <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-emerald-400" />
        Outfit Queue
      </button>
      <button
          class="flex-1 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2"
          :class="activeTab === 'history' ? 'bg-slate-800 text-white border border-slate-700/50 shadow-md' : 'text-slate-400 hover:text-slate-200'"
          @click="activeTab = 'history'">
        <UIcon name="i-heroicons-clock" class="w-4 h-4 text-blue-400" />
        My Outfits
      </button>
    </div>
    <div v-if="activeTab === 'review'" class="flex-1 max-w-2xl w-full mx-auto flex flex-col gap-3 min-h-0">
      <div class="bg-slate-900/30 border border-slate-800/80 p-3 rounded-2xl space-y-2 shrink-0 backdrop-blur-sm">
        <span class="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Request an Outfit</span>
        <div class="flex gap-2">
          <UInput
              v-model="promptText"
              placeholder="Describe what you want to wear..."
              class="flex-1 placeholder:text-[10px]"
              size="xs"
              :disabled="isSubmittingRequest"
              @keyup.enter="queueCustomOutfit"/>
          <UButton color="neutral" variant="subtle" :loading="isSubmittingRequest" icon="i-heroicons-bolt" size="sm" @click="queueCustomOutfit">
            Generate
          </UButton>
        </div>
      </div>
      <div class="flex-1 relative flex items-center justify-center min-h-[440px] sm:min-h-[490px] px-1 pb-10">
        <div v-if="isLoadingDeck" class="text-center space-y-2">
          <UIcon name="i-heroicons-arrow-path" class="w-6 h-6 text-emerald-400 animate-spin mx-auto" />
          <p class="text-[11px] font-mono text-slate-500">Syncing outfits...</p>
        </div>
        <div v-else-if="deckList.length === 0" class="text-center max-w-xs p-6 border border-dashed border-slate-800 rounded-2xl bg-slate-900/10">
          <UIcon name="i-heroicons-squares-plus" class="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p class="text-xs text-slate-400">Queue up styles</p>
        </div>
        <div v-else class="w-full h-full relative flex items-center justify-center">
          <div
              v-for="card in deckList.slice(0, 3).reverse()"
              :key="card.id"
              class="absolute w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 sm:gap-5 shadow-2xl origin-bottom touch-none"
              :style="getCardStyles(card)"
              @pointerdown="deckList.indexOf(card) === 0 ? handleDragStart($event) : null"
              @pointermove="deckList.indexOf(card) === 0 ? handleDragMove($event) : null"
              @pointerup="deckList.indexOf(card) === 0 ? handleDragEnd($event) : null"
              @pointercancel="deckList.indexOf(card) === 0 ? handleDragEnd($event) : null">
            <div v-if="card.status === 'pending' || card.status === 'processing'" class="w-full min-h-[280px] flex flex-col items-center justify-center gap-3 text-center py-8">
              <UIcon name="i-heroicons-cpu-chip" class="w-10 h-10 text-emerald-400 animate-bounce" />
              <div>
                <p class="text-xs font-semibold text-slate-200">Creating your outfit...</p>
                <p v-if="card.prompt" class="text-[11px] text-emerald-500 italic max-w-xs truncate mx-auto mt-1">"{{ card.prompt }}"</p>
              </div>
            </div>
            <template v-else>
              <div v-if="deckList.indexOf(card) === 0 && isDragging && Math.abs(dragX) > 30" class="absolute top-4 z-50 pointer-events-none uppercase text-[10px] font-bold font-mono px-3 py-1 rounded-full tracking-wider shadow-xl"
                   :class="dragX > 0 ? 'right-4 bg-emerald-500 text-white rotate-6' : 'left-4 bg-rose-500 text-white -rotate-6'">
                {{ dragX > 0 ? 'Wear' : 'Skip' }}
              </div>
              <div class="flex-1 grid gap-2 min-h-[200px] pointer-events-none" :class="card.items?.length <= 2 ? 'grid-cols-2' : 'grid-cols-2 grid-rows-2'">
                <div v-for="item in card.items" :key="item.id" class="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 shadow-lg flex items-center justify-center aspect-square">
                  <img :src="item.image_url" class="absolute inset-0 w-full h-full object-cover" draggable="false" />
                  <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-neutral-950 via-neutral-950/30 to-transparent p-2">
                    <span class="text-[9px] font-bold text-slate-200 tracking-wide block uppercase truncate">{{ item.sub_category || item.category }}</span>
                  </div>
                </div>
              </div>
              <div class="w-full md:w-[210px] flex flex-col justify-between gap-3 border-t md:border-t-0 md:border-l border-slate-800/80 pt-3 md:pt-0 md:pl-4 pointer-events-none">
                <div class="space-y-3">
                  <div>
                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">Aesthetic Focus</span>
                    <div class="flex flex-wrap gap-1">
                      <span v-for="tag in card.classification_tags" :key="tag" class="text-[8px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                        {{ tag }}
                      </span>
                    </div>
                  </div>

                  <div>
                    <span class="text-[9px] font-bold text-slate-500 uppercase tracking-wider block mb-1">User Intent Context</span>
                    <div class="p-2.5 bg-slate-950/70 border border-slate-800/60 rounded-xl max-h-[120px] overflow-y-auto">
                      <p class="text-[11px] text-slate-300 leading-normal font-medium italic">
                        <template v-if="card.prompt">"{{ card.prompt }}"</template>
                        <template v-else-if="card.category_filter || card.style_filter || card.weather_filter || card.occasion_filter">
                          Manual Parameters: {{ [card.category_filter, card.style_filter, card.weather_filter, card.occasion_filter].filter(Boolean).join(', ') }}
                        </template>
                        <template v-else>Background.</template>
                      </p>
                    </div>
                  </div>
                </div>
                <div v-if="deckList.indexOf(card) === 0" class="flex items-center justify-center gap-2 pt-2 border-t border-slate-800/60 shrink-0 relative z-50 pointer-events-auto">
                  <button
                      type="button"
                      class="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 bg-rose-950/20 border border-rose-900/40 text-rose-400 hover:bg-rose-900/40 hover:text-white active:scale-95 transition text-xs font-bold shadow-md cursor-pointer"
                      @pointerdown.stop
                      @click.stop.prevent="recordVote('declined')">
                    <UIcon name="i-heroicons-x-mark" class="w-3.5 h-3.5" />
                    Skip
                  </button>
                  <button
                      type="button"
                      class="flex-1 h-10 rounded-xl flex items-center justify-center gap-1.5 bg-emerald-950/20 border border-emerald-900/40 text-emerald-400 hover:bg-emerald-900/40 hover:text-white active:scale-95 transition text-xs font-bold shadow-md cursor-pointer"
                      @pointerdown.stop
                      @click.stop.prevent="recordVote('accepted')">
                    <UIcon name="i-heroicons-check" class="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>
    <div v-else class="flex-1 max-w-4xl w-full mx-auto flex flex-col gap-4">
      <div class="flex justify-between items-center bg-slate-900/40 border border-slate-800/80 p-3 rounded-xl shrink-0">
        <span class="text-xs font-bold text-slate-400 uppercase tracking-wider">My Outfits</span>
        <div class="flex gap-1 bg-slate-950 border border-slate-800 p-1 rounded-lg">
          <button class="text-[11px] px-3 py-1 rounded font-medium transition-all" :class="historyFilter === 'accepted' ? 'bg-emerald-950 text-emerald-400 font-bold border border-emerald-900' : 'text-slate-500 hover:text-slate-300'" @click="historyFilter = 'accepted'">Approved</button>
          <button class="text-[11px] px-3 py-1 rounded font-medium transition-all" :class="historyFilter === 'declined' ? 'bg-rose-950 text-rose-400 font-bold border border-rose-900' : 'text-slate-500 hover:text-slate-300'" @click="historyFilter = 'declined'">Declined</button>
        </div>
      </div>
      <div v-if="historyList.length === 0" class="text-center py-12 text-slate-600 text-xs border border-dashed border-slate-800 rounded-2xl">
        No outfits matched
      </div>
      <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div v-for="fit in historyList" :key="fit.id" class="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col justify-between gap-3 shadow-md">
          <div class="flex flex-wrap gap-1">
            <span v-for="tag in fit.classification_tags" :key="tag" class="text-[8px] bg-slate-950 px-1.5 py-0.5 border border-slate-800 text-slate-500 rounded uppercase font-bold tracking-wider">
              {{ tag }}
            </span>
          </div>
          <div class="grid grid-cols-4 gap-1">
            <div v-for="itm in fit.items" :key="itm.id" class="aspect-square bg-slate-950 border border-slate-800/60 rounded-lg overflow-hidden relative">
              <img :src="itm.image_url" class="w-full h-full object-cover" />
            </div>
          </div>
          <p class="text-[11px] text-slate-400 bg-slate-950/40 p-2 rounded-lg border border-slate-800/40 italic">"{{ fit.prompt || 'Manual Filter Combo' }}"</p>
          <div class="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-2 border-t border-slate-800/40">
            <span>{{ new Date(fit.updated_at).toLocaleDateString() }}</span>
            <UButton
                size="xs"
                :color="fit.status === 'accepted' ? 'rose' : 'emerald'"
                variant="link"
                class="p-0 text-[10px]"
                @click="async () => {
                const target = fit.status === 'accepted' ? 'declined' : 'accepted'
                await supabase.from('outfits').update({ status: target, updated_at: new Date().toISOString() }).eq('id', fit.id)
                loadHistory()
              }">
              Flip Status
            </UButton>
          </div>
        </div>
      </div>
    </div>
  </UMain>
</template>