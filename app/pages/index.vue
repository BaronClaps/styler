<template>
  <UMain class="w-full h-full min-h-0 flex flex-col items-center justify-center p-6 bg-neutral-950">
    <div class="w-full max-w-sm flex flex-col items-center justify-center">

      <UButton
          to="/outfits"
          color="neutral"
          variant="subtle"
          size="xl"
          class="w-full py-5 px-6 rounded-2xl flex items-center justify-center gap-3 bg-slate-900/40 backdrop-blur-md border-2 border-slate-700/60 text-slate-100 hover:text-white hover:bg-slate-800/60 hover:border-slate-500 active:scale-[0.98] transition-all shadow-2xl [&_svg]:size-6 font-semibold tracking-wide text-lg"
      >
        <UIcon name="i-lucide-shirt" class="shrink-0 text-emerald-400" />
        <span>Camera!!!</span>
      </UButton>

    </div>
  </UMain>
</template>