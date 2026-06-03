<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue'

const videoRef = ref<HTMLVideoElement | null>(null)
const isStreaming = ref(false)
const errorMessage = ref<string | null>(null)
let localStream: MediaStream | null = null

const startCamera = async () => {
  errorMessage.value = null
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user' // 'background' for back facing? - TODO: add a flip button
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
      errorMessage.value = 'Permission denied. Please grant camera access.'
    } else {
      errorMessage.value = 'Error with camera stream'
    }
  }
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

const captureSnapshot = (): Promise<Blob | null> => {
  return new Promise((resolve) => {
    if (!videoRef.value || !isStreaming.value) {
      return resolve(null)
    }

    const video = videoRef.value
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) return resolve(null)

    ctx.translate(canvas.width, 0)
    ctx.scale(-1, 1)

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    canvas.toBlob((blob) => {
      resolve(blob)
    }, 'image/jpeg', 0.95)
  })
}
defineExpose({ captureSnapshot })
onMounted(() => { startCamera() })
onBeforeUnmount(() => { stopCamera() })
</script>

<template>
  <div class="flex flex-col items-center justify-center p-4 w-full h-full">
    <div class="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">
      <video ref="videoRef" autoplay playsinline muted class="w-full h-full object-contain scale-x-[-1]"/>
      <slot />
      <div v-if="errorMessage" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80 overflow-y-auto">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-rose-500 mb-2" />
        <p class="text-sm font-medium text-slate-200 mb-4">{{ errorMessage }}</p>

        <div class="flex flex-col items-center gap-4 w-full max-w-sm">
          <button @click="startCamera" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-semibold transition w-full max-w-[24rem]">
            Retry Connection
          </button>
          <slot name="fallback-action" />
        </div>
      </div>
      <div v-if="!isStreaming && !errorMessage" class="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-emerald-500 animate-spin mb-2" />
        <p class="text-xs text-slate-400">Requesting video stream...</p>
      </div>
    </div>
  </div>
</template>