<template>
  <div class="w-full min-h-screen bg-neutral-950 text-slate-200 selection:bg-emerald-500/30 selection:text-emerald-300 font-sans antialiased overflow-x-hidden">

    <div class="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[500px] pointer-events-none overflow-hidden z-0 opacity-40">
      <div class="absolute -top-[250px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[120px]"></div>
      <div class="absolute -top-[180px] left-1/3 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px]"></div>
    </div>

    <div class="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-20 relative z-10 flex flex-col gap-16 sm:gap-24">

      <header class="text-center space-y-4 max-w-2xl mx-auto">

        <h1 class="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
          Stitch your closet together, <br/>
          <span class="bg-gradient-to-r from-emerald-400 via-teal-400 to-blue-500 bg-clip-text text-transparent">effortlessly.</span>
        </h1>

        <div class="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <NuxtLink to="/camera" class="w-full sm:w-auto h-11 px-6 rounded-xl bg-white text-neutral-950 hover:bg-slate-200 font-bold text-xs shadow-lg shadow-white/5 transition flex items-center justify-center gap-2 group">
            Capture your wardrobe
            <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </NuxtLink>
          <a href="/wardrobe" class="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs transition flex items-center justify-center">
            View your wardrobe
          </a>
          <a href="/outfits" class="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs transition flex items-center justify-center">
            Create outfits
          </a>
          <a href="/settings" class="w-full sm:w-auto h-11 px-5 rounded-xl bg-slate-900/60 hover:bg-slate-900 border border-slate-800 text-slate-300 font-bold text-xs transition flex items-center justify-center">
            Settings
          </a>
        </div>
      </header>

      <section id="how-it-works" class="space-y-8 scroll-mt-12">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-800 transition">
            <div class="space-y-2">
              <div class="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-camera" class="w-4 h-4 text-emerald-400" />
              </div>
              <h3 class="text-sm font-bold text-white">1. Instant Capture</h3>
              <p class="text-[11px] leading-relaxed text-slate-400">
                A streamlined capture design. Click the button to upload clothes for classification.
              </p>
            </div>
            <ul class="text-[10px] font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-900">
              <li class="flex items-center gap-1.5"><span class="w-1 h-1 bg-emerald-400 rounded-full"></span> Instant photo capture</li>
              <li class="flex items-center gap-1.5"><span class="w-1 h-1 bg-emerald-400 rounded-full"></span> Background upload</li>
            </ul>
          </div>
          <div class="bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-800 transition">
            <div class="space-y-2">
              <div class="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-bolt" class="w-4 h-4 text-blue-400" />
              </div>
              <h3 class="text-sm font-bold text-white">2. Queue & Classify</h3>
              <p class="text-[11px] leading-relaxed text-slate-400">
                Images are stored inside our database for property classification in the background.
              </p>
            </div>
            <ul class="text-[10px] font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-900">
              <li class="flex items-center gap-1.5"><span class="w-1 h-1 bg-blue-400 rounded-full"></span> Color palette profiling</li>
              <li class="flex items-center gap-1.5"><span class="w-1 h-1 bg-blue-400 rounded-full"></span> Occasion & weather flags</li>
            </ul>
          </div>

          <div class="bg-slate-900/20 border border-slate-800/60 p-5 rounded-2xl space-y-4 flex flex-col justify-between hover:border-slate-800 transition">
            <div class="space-y-2">
              <div class="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <UIcon name="i-heroicons-sparkles" class="w-4 h-4 text-purple-400" />
              </div>
              <h3 class="text-sm font-bold text-white">3. Tinder-Style Match</h3>
              <p class="text-[11px] leading-relaxed text-slate-400">
                Outfits always combine a Top and a Bottom. Review results in a Tinder format.
              </p>
            </div>
            <ul class="text-[10px] font-mono text-slate-500 space-y-1 pt-2 border-t border-slate-900">
              <li class="flex items-center gap-1.5"><span class="w-1 h-1 bg-purple-400 rounded-full"></span> Structured rules</li>
              <li class="flex items-center gap-1.5"><span class="w-1 h-1 bg-purple-400 rounded-full"></span> Learns habits over time</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>
<script setup lang="ts">
</script>