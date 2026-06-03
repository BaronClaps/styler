<template>
  <UMain>
    <div class="flex-1 p-6 space-y-6 max-w-xl">
      <div>
        <h1 class="text-2xl font-bold tracking-tight text-slate-100">Home Page</h1>
        <p class="text-sm text-slate-400 mt-1">Configure global platform attributes.</p>
      </div>

      <div class="p-5 bg-slate-900 border border-slate-800 rounded-xl shadow-xl space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-slate-400">
            UUID
          </label>
        </div>

        <div class="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <UInput
              v-model="inputVal"
              placeholder="Enter or generate UUID"
              class="w-full max-w-sm"
              @keyup.enter="saveUserId"
          />

          <div class="flex gap-2">
            <UButton
                label="Generate"
                color="slate"
                variant="soft"
                icon="i-heroicons-arrow-path"
                @click="generateRandomUuid"
            />
            <UButton
                label="Save"
                color="primary"
                variant="solid"
                @click="saveUserId"
            />
          </div>
        </div>

        <div class="pt-2 border-t border-slate-800/60 flex items-center gap-2 text-xs text-slate-400">
          <div class="w-1.5 h-1.5 rounded-full" :class="userId ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'" />
          Current User Id:
          <span class="font-mono text-xs bg-slate-950 px-2 py-0.5 rounded border border-slate-800" :class="userId ? 'text-emerald-400' : 'text-slate-500'">
            {{ userId || 'null (Not Registered)' }}
          </span>
        </div>
      </div>
    </div>
  </UMain>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const { userId } = useUser()
const toast = useToast()
const inputVal = ref('')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

onMounted(() => {
  if (userId.value) {
    inputVal.value = userId.value
  }
})

const generateRandomUuid = () => {
  inputVal.value = crypto.randomUUID()
  toast.add({
    title: 'UUID Generated',
    description: 'A new cryptographically secure UUID was generated. Click Save to apply.',
    color: 'sky',
    icon: 'i-heroicons-sparkles',
    timeout: 2500
  })
}

const saveUserId = () => {
  const sanitizedId = inputVal.value.trim()

  if (!sanitizedId) {
    userId.value = null
    toast.add({
      title: 'Identity Cleared',
      description: 'The global user ID context has been reset to empty.',
      color: 'amber',
      icon: 'i-heroicons-trash'
    })
    return
  }

  if (!UUID_REGEX.test(sanitizedId)) {
    toast.add({
      title: 'Invalid Format',
      description: 'The identifier provided is not a valid UUID format (e.g., xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx).',
      color: 'rose',
      icon: 'i-heroicons-exclamation-circle'
    })
    return
  }

  // Update global persistent cookie
  userId.value = sanitizedId

  toast.add({
    title: 'Configuration Saved',
    description: 'Global user identity UUID has been synchronized.',
    color: 'emerald',
    icon: 'i-heroicons-check-circle',
    timeout: 3000
  })
}
</script>