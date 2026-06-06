<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const videoRef = ref<HTMLVideoElement | null>(null)
const isStreaming = ref(false)
const errorMessage = ref<string | null>(null)
const facingMode = ref<'user' | 'environment'>('user')
let localStream: MediaStream | null = null

const startCamera = async () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
  }

  errorMessage.value = null
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode.value
      },
      audio: false
    })
    localStream = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      isStreaming.value = true
    }
  } catch (error: any) {
    console.error('Camera access error:', error)
    if (error.name === 'NotAllowedError') {
      errorMessage.value = 'Camera access please.'
    } else {
      errorMessage.value = 'Error camera stream'
    }
  }
}

const toggleCameraFacing = () => {
  facingMode.value = facingMode.value === 'user' ? 'environment' : 'user'
  startCamera()
}

const stopCamera = () => {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop())
    localStream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  isStreaming.value = false
}

const captureSnapshot = (): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    if (!videoRef.value || !isStreaming.value) {
      reject(new Error('Camera not active'))
      return
    }

    const canvas = document.createElement('canvas')
    canvas.width = videoRef.value.videoWidth
    canvas.height = videoRef.value.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      reject(new Error('Failed to get canvas'))
      return
    }

    if (facingMode.value === 'user') {
      ctx.translate(canvas.width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(videoRef.value, 0, 0, canvas.width, canvas.height)
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error('Canvas capture failed'))
        return
      }
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}

defineExpose({ captureSnapshot, toggleCameraFacing })

onMounted(() => { startCamera() })
onBeforeUnmount(() => { stopCamera() })
</script>

<template>
  <div class="absolute inset-0 w-full h-full bg-black overflow-hidden flex items-center justify-center">
    <video
        ref="videoRef"
        autoplay
        playsinline
        muted
        class="absolute inset-0 w-full h-full object-cover"
        :class="{ 'scale-x-[-1]': facingMode === 'user' }"
    />
    <slot />
    <div v-if="errorMessage" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/90 z-20 overflow-y-auto">
      <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-rose-500 mb-2" />
      <p class="text-sm font-medium text-slate-200 mb-4">{{ errorMessage }}</p>

      <div class="flex flex-col items-center gap-4 w-full max-w-sm">
        <button @click="startCamera" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-semibold text-white transition w-full max-w-[24rem]">
          Retry
        </button>
        <slot name="fallback-action" />
      </div>
    </div>
  </div>
</template>