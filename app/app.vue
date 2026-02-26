<script setup>
const route = useRoute();

function isActive(path) {
  return route.path === path;
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header global -->
    <header class="border-b border-slate-200 bg-white">
      <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">
        
        <!-- Logo / titre -->
        <div>
          <h1 class="text-lg font-semibold tracking-tight text-slate-900">
            PharmaInsight
          </h1>
          <p class="text-xs text-slate-500">
            Outil interne ACAT LH
          </p>
        </div>

        <!-- Navigation -->
        <nav class="flex items-center gap-6 text-sm font-medium">
          <NuxtLink
            to="/"
            class="pb-1 border-b-2 transition"
            :class="isActive('/') 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'"
          >
            Dashboard
          </NuxtLink>

          <NuxtLink
            to="/contribution"
            class="pb-1 border-b-2 transition"
            :class="isActive('/contribution') 
              ? 'border-slate-900 text-slate-900' 
              : 'border-transparent text-slate-500 hover:text-slate-900'"
          >
            Contribution catégories
          </NuxtLink>
          <NuxtLink
  to="/price-volume"
  class="pb-1 border-b-2 transition"
  :class="isActive('/price-volume')
    ? 'border-slate-900 text-slate-900'
    : 'border-transparent text-slate-500 hover:text-slate-900'"
>
  Prix vs Volume
</NuxtLink>
<NuxtLink
  to="/diagnostic"
  class="pb-1 border-b-2 transition"
  :class="isActive('/diagnostic')
    ? 'border-slate-900 text-slate-900'
    : 'border-transparent text-slate-500 hover:text-slate-900'"
>
  Diagnostic
</NuxtLink>
<NuxtLink
  to="/top-products"
  class="pb-1 border-b-2 transition"
  :class="isActive('/top-products')
    ? 'border-slate-900 text-slate-900'
    : 'border-transparent text-slate-500 hover:text-slate-900'"
>
  Top produits
</NuxtLink>
<NuxtLink
  to="/evolution"
  class="pb-1 border-b-2 transition"
  :class="isActive('/evolution')
    ? 'border-slate-900 text-slate-900'
    : 'border-transparent text-slate-500 hover:text-slate-900'"
>
  Évolution
</NuxtLink>
        </nav>

      </div>
    </header>

    <!-- Contenu pages -->
    <main>
      <NuxtPage />
    </main>
  </div>
</template>