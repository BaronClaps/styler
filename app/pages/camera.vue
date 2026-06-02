<template>
  <UMain class="h-full min-h-0 flex flex-col overflow-hidden">
      <Viewer />
    <UButton
        icon="i-ic-outline-circle"
        variant="ghost"
        color="white"
        class="p-0 rounded-full hover:bg-transparent dark:hover:bg-transparent"
        :ui="{
    icon: {
      size: {
        xl: 'w-20 h-20 font-light opacity-80 hover:opacity-100 transition-opacity'
      }
    }
  }"
        size="xl"
        @click="handleImageUpload"
    />
  </UMain>
</template>

<script setup lang="ts">
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { ref } from 'vue'

const supabaseUrl: string = 'https://tvfbrkfacfdhemgaamfu.supabase.co'
const supabaseAnonKey: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2ZmJya2ZhY2ZkaGVtZ2FhbWZ1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzNDk0OTksImV4cCI6MjA5NTkyNTQ5OX0.3Pa2PH-d-Leujqc5SBEz_yanERVyTDmFxMeMLP2v9Og'
const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

interface ClothingItem {
  id: string
  image_url: string
  status: 'pending' | 'processing' | 'complete' | 'failed'
}

type UploadStatus = 'idle' | 'pending' | 'processing' | 'complete' | 'failed'

const isUploading: Ref<boolean> = ref(false)
const currentItemId: Ref<string | null> = ref(null)
const currentStatus: Ref<UploadStatus> = ref('idle')
const analysisResult: Ref<ClothingItem | null> = ref(null)

const handleImageUpload = async (event: Event): Promise<void> => {
  const input = event.target as HTMLInputElement
  const file: File | undefined = input.files?.[0]
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
            status: 'pending' as const
          }
        ])

    if (dbError) throw dbError
    isUploading.value = false

  } catch (err: unknown) {
    console.error('Pipeline Upload Fault:', err)
    currentStatus.value = 'failed'
    isUploading.value = false
  }
}
</script>