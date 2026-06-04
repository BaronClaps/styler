<template>
  <div class="bg-neutral-950 h-dvh w-screen overflow-hidden text-slate-100">
    <nav class="h-full w-full">
      <div
          class="flex h-full w-full"
          :class="[
            variant === 'inset' && 'bg-neutral-50 dark:bg-neutral-950',
            side === 'right' && 'flex-row-reverse'
          ]"
      >
        <USidebar
            v-model:open="open"
            variant="inset"
            collapsible="icon"
            :side="side"
            class="hidden md:flex h-full"
            :ui="{ container: 'h-full' }"
        >
          <template #header>
            <div class="flex items-center gap-2 px-2">
              <UIcon name="i-logos-nuxt-icon" class="size-6 shrink-0" />
              <span v-if="open" class="font-bold text-xl tracking-tight">Styler</span>
            </div>
          </template>
          <UNavigationMenu
              :items="items"
              orientation="vertical"
              :ui="{ link: 'p-2 overflow-hidden' }"
          />
        </USidebar>

        <div class="flex-1 flex flex-col h-full min-w-0 overflow-hidden md:peer-data-[variant=floating]:my-4 md:peer-data-[variant=inset]:m-4 md:peer-data-[variant=inset]:rounded-xl bg-neutral-900 border-slate-800">

          <div
              class="hidden md:flex h-(--ui-header-height) shrink-0 items-center px-4 border-b border-neutral-800"
              :class="[side === 'right' && 'justify-end']"
          >
            <UButton
                :icon="side === 'left' ? 'i-lucide-panel-left' : 'i-lucide-panel-right'"
                color="neutral"
                variant="ghost"
                aria-label="Toggle sidebar"
                @click="open = !open"
            />
          </div>

          <div class="flex-1 relative w-full h-full min-h-0 bg-neutral-950 overflow-hidden">
            <main class="absolute inset-0 w-full h-full overflow-hidden">
              <NuxtPage />
            </main>
          </div>
        </div>
      </div>
    </nav>
  </div>
</template>

<script setup lang="ts">
import type { NavigationMenuItem, SidebarProps } from '@nuxt/ui'

defineProps<Pick<SidebarProps, 'variant' | 'collapsible' | 'side'>>()

const open = ref(true)

const items = ref<NavigationMenuItem[]>([
  {
    label: 'Home',
    icon: 'i-lucide-house',
    to: '/'
  },
  {
    label: 'Wardrobe',
    icon: 'i-lucide-shirt',
    to: '/wardrobe'
  },
  {
    label: 'Camera',
    icon: 'i-lucide-camera',
    to: '/camera'
  },
  {
    label: 'Settings',
    icon: "i-heroicons-cog-6-tooth",
    to: '/settings'
  }
])
</script>