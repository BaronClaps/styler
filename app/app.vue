<template>
  <div class="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col items-center justify-center p-6 font-sans">
    <div class="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">

      <header class="mb-6">
        <h1 class="text-xl font-bold tracking-tight text-neutral-50">Clothes Classifier</h1>
        <p class="text-xs text-neutral-400 mt-1">speed i need this to work</p>
      </header>
      <label        class="group flex flex-col items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-all duration-200"
                    :class="isUploading ? 'border-amber-500/50 bg-amber-500/5' : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-900'"
      >
        <div class="flex flex-col items-center justify-center pt-5 pb-6 px-4 text-center">
        <span v-if="!isUploading" class="text-sm text-neutral-400 group-hover:text-neutral-300">
          UPLOAD
        </span>
          <span v-else class="text-sm text-amber-400 animate-pulse">
          UPLOADING...
        </span>
        </div>      <UInput          type="file"
                                     icon="i-heroicons-folder-open"
                                     placeholder="Upload Clothes"
                                     size="sm"
                                     color="secondary"
                                     :loading="isUploading"
                                     :disabled="isUploading"
                                     @change="handleImageUpload"
      />
      </label>
      <div v-if="currentItemId" class="mt-6 pt-6 border-t border-neutral-800 space-y-4">
        <div class="flex items-center justify-between text-xs">
          <span class="text-neutral-400 font-mono">ID: {{ currentItemId.slice(0, 8) }}...</span>
          <span            class="px-2 py-0.5 rounded-full font-medium tracking-wide uppercase text-[10px]"
                           :class="{
            'bg-neutral-800 text-neutral-400': currentStatus === 'pending',
            'bg-amber-500/10 text-amber-400 animate-pulse': currentStatus === 'processing',
            'bg-emerald-500/10 text-emerald-400': currentStatus === 'completed',
            'bg-red-500/10 text-red-400': currentStatus === 'failed'
          }"
          >
          {{ currentStatus }}
        </span>
        </div>
        <div v-if="analysisResult" class="bg-neutral-950 rounded-lg p-4 border border-neutral-800 text-xs font-mono max-h-48 overflow-y-auto">
          <div class="text-amber-400 mb-1">yo ts tuff:</div>
          <pre class="text-neutral-300">{{ JSON.stringify(analysisResult, null, 2) }}</pre>
        </div>    </div>
    </div></div>
</template>

<script setup>
import { ref } from 'vue'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tvfbrkfacfdhemgaamfu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZmJya2ZhY2ZkaGVtZ2FhbWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk0OTksImV4cCI6MjA5NTkyNTQ5OX0.3Pa2PH-d-Leujqc5SBEz_yanERVyTDmFxMeMLP2v9Og'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

const isUploading = ref(false)
const currentItemId = ref(null)
const currentStatus = ref('idle')
const analysisResult = ref(null)

let pollInterval = null

// Define the steps for your Stepper
const steps = ref([
  { label: 'Upload' },
  { label: 'Verify' },
  { label: 'Done' }
])

const handleImageUpload = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return

  try {
    isUploading.value = true
    analysisResult.value = null
    currentStatus.value = 'pending'

    const itemId = crypto.randomUUID()
    currentItemId.value = itemId

    const fileExtension = file.name.split('.').pop()
    const storagePath = `garments/${itemId}.${fileExtension}`

    const { data: storageData, error: storageError } = await supabase.storage
        .from('wardrobe')
        .upload(storagePath, file, { cacheControl: '3600', upsert: true })

    if (storageError) throw storageError

    const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(storagePath)

    const { error: dbError } = await supabase
        .from('clothing_items')
        .insert([
          {
            id: itemId,
            image_url: publicUrl,
            status: 'pending'
          }
        ])

    if (dbError) throw dbError
    isUploading.value = false

    startTrackingJob(itemId)

  } catch (err) {
    console.error('Pipeline Upload Fault:', err)
    currentStatus.value = 'failed'
    isUploading.value = false
  }
}

const startTrackingJob = (id) => {
  if (pollInterval) clearInterval(pollInterval)

  pollInterval = setInterval(async () => {
    const { data, error } = await supabase
        .from('clothing_items')
        .select('*')
        .eq('id', id)
        .single()

    if (!error && data) {
      currentStatus.value = data.status

      if (data.status === 'completed') {
        clearInterval(pollInterval)
        analysisResult.value = {
          category: data.category,
          sub_category: data.sub_category,
          colors: { primary: data.primary_color_hex, secondary: data.secondary_color_hex },
          tags: data.style_tags,
          weather: data.weather_tags
        }
      } else if (data.status === 'failed') {
        clearInterval(pollInterval)
      }
    }
  }, 2000)
}
</script>