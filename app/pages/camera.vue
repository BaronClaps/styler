<template>
  <UMain class="h-full min-h-0 flex flex-col overflow-hidden">
    <Viewer ref="viewerRef">
      <UButton
          icon="i-ic-outline-circle"
          variant="ghost"
          color="white"
          class="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 p-0 rounded-full hover:bg-transparent dark:hover:bg-transparent active:scale-95 transition-transform text-white drop-shadow-md [&_span]:!w-28 [&_span]:!h-28"
          :class="{ 'opacity-50 pointer-events-none': isUploading }"
          @click="handleCapture"
      />

      <template #fallback-action>
        <UFileUpload
            v-model="fileModel"
            accept="image/*"
            class="w-full max-w-[24rem]"
            label="Upload image instead"
            icon="i-lucide-image"
            :disabled="isUploading"
            @update:model-value="(files) => handleImageUpload(files)"
        />
      </template>
    </Viewer>
  </UMain>
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