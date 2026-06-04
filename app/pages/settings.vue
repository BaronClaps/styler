<template>
  <UMain>
    <div class="flex-1 p-6 space-y-6 max-w-xl">
        <UButton
            icon="i-heroicons-arrow-left"
            color="neutral"
            variant="ghost"
            label="Back"
            class="text-slate-200 hover:text-white"
            @click="$router.back()"
        />
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
const inputVal = ref('')

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[4][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

onMounted(() => {
  if (userId.value) {
    inputVal.value = userId.value
  }
})

const generateRandomUuid = () => {
  inputVal.value = crypto.randomUUID()
}

const saveUserId = () => {
  const sanitizedId = inputVal.value.trim()
  if (!sanitizedId) {
    userId.value = null
    return
  }
  userId.value = sanitizedId
}
</script>