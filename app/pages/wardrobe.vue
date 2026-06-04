<script setup lang="ts">
</script>
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
    </div>
    <USeparator />
    <div class="p-5 space-y-4">
      <div class="flex flex-col gap-1.5">
        <label class="text-xl font-semibold tracking-wider text-slate-200">
          Nothing here yet :(
        </label>
      </div>
    </div>
  </UMain>
</template>