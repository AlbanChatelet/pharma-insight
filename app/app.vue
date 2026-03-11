<script setup>
const route = useRoute();
const menuOpen = ref(false);

function isActive(path) {
  return route.path === path;
}

// Ferme le menu quand on change de page
watch(() => route.path, () => {
  menuOpen.value = false;
});

// Bloque le scroll quand le menu est ouvert
watch(menuOpen, (val) => {
  if (process.client) {
    document.body.style.overflow = val ? 'hidden' : '';
  }
});

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/contribution', label: 'Contribution catégories' },
  { to: '/price-volume', label: 'Prix vs Volume' },
  { to: '/diagnostic', label: 'Diagnostic' },
  { to: '/top-products', label: 'Top produits' },
  { to: '/evolution', label: 'Évolution' },
  { to: '/seasonality', label: 'Saisonnalité' },
];
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <!-- Header global -->
    <header class="border-b border-slate-200 bg-white relative z-50">
      <div class="mx-auto max-w-6xl px-6 py-4 flex items-center justify-between">

        <!-- Logo + titre -->
        <div class="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="PharmaInsight logo"
            class="h-10 w-10 object-contain"
          />
          <div>
            <h1 class="text-lg font-semibold tracking-tight text-slate-900">
              PharmaInsight
            </h1>
            <p class="text-xs text-slate-500">
              Outil interne ACAT LH
            </p>
          </div>
        </div>

        <!-- Navigation desktop -->
        <nav class="hidden md:flex items-center gap-6 text-sm font-medium">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.to"
            :to="link.to"
            class="pb-1 border-b-2 transition"
            :class="isActive(link.to)
              ? 'border-slate-900 text-slate-900'
              : 'border-transparent text-slate-500 hover:text-slate-900'"
          >
            {{ link.label }}
          </NuxtLink>
        </nav>

        <!-- Burger button mobile -->
        <button
          class="md:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          @click="menuOpen = !menuOpen"
          :aria-label="menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'"
          aria-controls="mobile-menu"
        >
          <!-- Barre 1 -->
          <span
            class="block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-300 origin-center"
            :class="menuOpen ? 'rotate-45 translate-y-2' : ''"
          />
          <!-- Barre 2 -->
          <span
            class="block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-300"
            :class="menuOpen ? 'opacity-0 scale-x-0' : ''"
          />
          <!-- Barre 3 -->
          <span
            class="block h-0.5 w-5 bg-slate-700 rounded-full transition-all duration-300 origin-center"
            :class="menuOpen ? '-rotate-45 -translate-y-2' : ''"
          />
        </button>

      </div>

      <!-- Menu mobile déroulant -->
      <Transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-2"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-2"
      >
        <div
          v-if="menuOpen"
          id="mobile-menu"
          class="md:hidden border-t border-slate-100 bg-white"
        >
          <nav class="flex flex-col px-6 py-3">
            <NuxtLink
              v-for="(link, index) in navLinks"
              :key="link.to"
              :to="link.to"
              class="flex items-center justify-between py-3.5 text-sm font-medium border-b border-slate-100 last:border-0 transition-colors"
              :class="isActive(link.to)
                ? 'text-slate-900'
                : 'text-slate-500 hover:text-slate-900'"
              :style="{ transitionDelay: menuOpen ? `${index * 30}ms` : '0ms' }"
            >
              <span>{{ link.label }}</span>
              <!-- Indicateur actif -->
              <span
                v-if="isActive(link.to)"
                class="w-1.5 h-1.5 rounded-full bg-slate-900"
              />
            </NuxtLink>
          </nav>
        </div>
      </Transition>
    </header>

    <!-- Overlay sombre derrière le menu -->
    <Transition
      enter-active-class="transition-opacity duration-300"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-200"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="menuOpen"
        class="md:hidden fixed inset-0 bg-slate-900/20 z-40"
        @click="menuOpen = false"
      />
    </Transition>

    <!-- Contenu pages -->
    <main>
      <NuxtPage />
    </main>
  </div>
</template>