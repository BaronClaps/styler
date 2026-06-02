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
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user' // 'user' (front) or 'environment' (back)
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
      errorMessage.value = 'Permission denied. Please grant camera access in your browser settings.'
    } else {
      errorMessage.value = 'Unable to access hardware camera stream.'
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

onMounted(() => {
  startCamera()
})

onBeforeUnmount(() => {
  stopCamera()
})
</script>

<template>
  <div class="flex flex-col items-center justify-center p-4 w-full h-full">

    <div class="relative aspect-video w-full bg-slate-950 rounded-xl overflow-hidden border border-slate-800 shadow-2xl flex items-center justify-center">

      <video
          ref="videoRef"
          autoplay
          playsinline
          muted
          class="w-full h-full object-contain scale-x-[-1]"
      />
      <div v-if="errorMessage" class="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-950/80">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-12 h-12 text-rose-500 mb-2" />
        <p class="text-sm font-medium text-slate-200">{{ errorMessage }}</p>
        <button @click="startCamera" class="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-md text-sm font-semibold transition">
          Retry Connection
        </button>
      </div>

      <div v-if="!isStreaming && !errorMessage" class="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center">
        <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 text-emerald-500 animate-spin mb-2" />
        <p class="text-xs text-slate-400">Requesting hardware link...</p>
      </div>
    </div>
  </div>
</template>