<template>
  <div class="w-full h-full flex flex-col relative overflow-hidden">
    <Viewer ref="viewerRef">

      <div class="absolute bottom-8 left-0 right-0 flex items-center justify-between z-30 px-8 pointer-events-none">

        <div class="flex items-center justify-center w-12 h-12 md:hidden pointer-events-auto">
          <UButton
              to="/wardrobe"
              icon="i-lucide-shirt"
              size="xl"
              color="neutral"
              variant="subtle"
              class="rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-white hover:bg-slate-800/80 active:scale-50 transition"
              aria-label="Go to wardrobe"
          />
        </div>
        <div class="hidden md:block w-12 h-12"></div>

        <button
            type="button"
            class="group pointer-events-auto relative flex items-center justify-center w-20 h-20 bg-transparent border-4 border-white rounded-full transition-transform active:scale-90 focus:outline-none shadow-xl shrink-0"
            :class="{ 'opacity-40 pointer-events-none': isUploading }"
            @click="handleCapture"
        >
          <span class="w-16 h-16 bg-white rounded-full opacity-95 transition group-hover:scale-95" />
        </button>

        <div class="flex items-center justify-center w-12 h-12 md:hidden pointer-events-auto">
          <UButton
              to="/settings"
              icon="i-heroicons-cog-6-tooth"
              size="xl"
              color="neutral"
              variant="subtle"
              class="rounded-full bg-slate-900/60 backdrop-blur-md border border-slate-700/50 text-white hover:bg-slate-800/80 active:scale-95 transition"
              aria-label="Open settings"
          />
        </div>
        <div class="hidden md:block w-12 h-12"></div>
      </div>

      <template #fallback-action>
        <div class="w-full max-w-[24rem] mt-2 px-4 pointer-events-auto">
          <UFileUpload
              v-model="fileModel"
              accept="image/*"
              class="w-full"
              label="Upload image instead"
              icon="i-lucide-image"
              :disabled="isUploading"
              @update:model-value="(files) => handleImageUpload(files)"
          />
        </div>
      </template>
    </Viewer>
  </div>
</template>

<script setup lang="ts">
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ref, type Ref } from 'vue'

const supabaseUrl: string = 'https://tvfbrkfacfdhemgaamfu.supabase.co'
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZmJya2ZhY2ZkaGVtZ2FhbWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk0OTksImV4cCI6MjA5NTkyNTQ5OX0.3Pa2PH-d-Leujqc5SBEz_yanERVyTDmFxMeMLP2v9Og'
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

interface ClothingItem {
  id: string
  image_url: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
}

type UploadStatus = 'idle' | 'pending' | 'processing' | 'complete' | 'failed'

const toast = useToast()

const viewerRef = ref<InstanceType<typeof Viewer> | null>(null)
const isUploading: Ref<boolean> = ref(false)
const currentItemId: Ref<string | null> = ref(null)
const currentStatus: Ref<UploadStatus> = ref('idle')
const analysisResult: Ref<ClothingItem | null> = ref(null)
const { userId } = useUser()
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const activeUserId = (userId.value && uuidRegex.test(userId.value))
    ? userId.value
    : crypto.randomUUID()

const fileModel = ref<any>(null)

const handleCapture = async (): Promise<void> => {
  if (!viewerRef.value || isUploading.value) return

  const imageBlob = await viewerRef.value.captureSnapshot()
  if (!imageBlob) {
    toast.add({
      title: 'Capture Failed',
      description: 'Could not capture an image from the live hardware feed.',
      color: 'red',
      icon: 'i-heroicons-x-circle'
    })
    return
  }

  const snapshotFile = new File([imageBlob], `snapshot-${Date.now()}.jpg`, { type: 'image/jpeg' })
  await handleImageUpload(snapshotFile)
}

const handleImageUpload = async (payload: any): Promise<void> => {
  let file: File | undefined

  if (payload instanceof File) {
    file = payload
  } else if (payload && payload.target && 'files' in payload.target) {
    const input = payload.target as HTMLInputElement
    file = input.files?.[0]
  } else if (payload) {
    if (Array.isArray(payload) && payload.length > 0) {
      file = payload[0]
    } else if (payload instanceof FileList && payload.length > 0) {
      file = payload[0]
    } else if (typeof payload === 'object' && payload.name) {
      file = payload as File
    }
  }

  if (!file) return

  if (userId.value == null) {
    userId.value = crypto.randomUUID()
  }

  try {
    isUploading.value = true
    analysisResult.value = null
    currentStatus.value = 'pending'
    const itemId: string = crypto.randomUUID()
    currentItemId.value = itemId

    const fileExtension: string | undefined = file.name.split('.').pop()
    const storagePath: string = `garments/${itemId}.${fileExtension}`

    const { error: storageError } = await supabase.storage
        .from('wardrobe')
        .upload(storagePath, file, { cacheControl: '3600', upsert: true })

    const { data: { publicUrl } } = supabase.storage
        .from('wardrobe')
        .getPublicUrl(storagePath)

    const { error: dbError } = await supabase
        .from('clothing_items')
        .insert([
          {
            id: itemId,
            user_id: userId.value,
            image_url: publicUrl,
            status: 'pending' as const
          }
        ])

    currentStatus.value = 'complete'
    isUploading.value = false

    fileModel.value = null

  } catch (err: unknown) {
    console.error('Pipeline Upload Fault:', err)
    currentStatus.value = 'failed'
    isUploading.value = false
  }
}
</script>