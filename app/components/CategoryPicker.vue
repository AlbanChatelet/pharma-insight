<script setup>
import { ref } from "vue";

const props = defineProps({
  categories: { type: Array, required: true },
  modelValue: { type: String, default: "ALL" },
});

const emit = defineEmits(["update:modelValue"]);

const failedImages = ref(new Set());

function onImageError(slug) {
  failedImages.value = new Set([...failedImages.value, slug]);
}

function imageLoaded(slug) {
  return !failedImages.value.has(slug);
}

const nameToMeta = {
  "dermocosmétique":          { slug: "dermocosmetique",          emoji: "✨", color: "from-pink-400 to-rose-500" },
  "compléments alimentaires": { slug: "complements-alimentaires", emoji: "💊", color: "from-green-400 to-emerald-600" },
  "otc":                      { slug: "otc",                      emoji: "💉", color: "from-blue-400 to-blue-600" },
  "hygiène & soins":          { slug: "hygiene-soins",            emoji: "🧴", color: "from-cyan-400 to-teal-500" },
  "bébé & maternité":         { slug: "bebe-maternite",           emoji: "🍼", color: "from-yellow-300 to-amber-400" },
};

function getMeta(category) {
  const key = category.nom?.toLowerCase().trim();
  return nameToMeta[key] ?? { slug: category.id_categorie, emoji: "📦", color: "from-slate-300 to-slate-500" };
}

function select(id) {
  emit("update:modelValue", id);
}
</script>

<template>
  <div class="w-full">
    <p class="mb-4 text-xs font-semibold uppercase tracking-widest text-slate-400 text-center">
      Catégorie
    </p>

    <div class="flex items-center justify-center gap-3 sm:gap-4 overflow-x-auto scrollbar-none -mx-4 px-4 sm:mx-0 sm:px-0">

      <!-- ── Toutes catégories ── -->
      <button
        @click="select('ALL')"
        class="group shrink-0 transition-all duration-300 ease-out
               hover:scale-110 active:scale-95"
        :class="modelValue === 'ALL' ? 'scale-110' : ''"
      >
        <div
          class="relative w-16 h-16 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-2 transition-all duration-300"
          :class="modelValue === 'ALL'
            ? 'ring-slate-900 shadow-2xl shadow-slate-900/30'
            : 'ring-transparent shadow-md group-hover:ring-slate-300 group-hover:shadow-xl'"
        >
          <img
            v-if="imageLoaded('all')"
            src="/categories/all.jpg"
            alt="Toutes"
            class="absolute inset-0 w-full h-full object-cover"
            @error="onImageError('all')"
          />
          <div v-else class="absolute inset-0 bg-gradient-to-br from-slate-400 to-slate-600" />

          <!-- Overlay hover : flou + assombrissement -->
          <div
            class="absolute inset-0 transition-all duration-300
                   opacity-0 group-hover:opacity-100
                   backdrop-blur-[2px] bg-black/40"
          />

          <!-- Nom : caché au repos, visible au hover -->
          <div
            class="absolute inset-0 flex items-center justify-center px-2
                   transition-all duration-300
                   opacity-0 translate-y-2
                   group-hover:opacity-100 group-hover:translate-y-0"
          >
            <span class="text-white font-bold text-xs sm:text-sm text-center leading-snug drop-shadow-lg">
              Toutes
            </span>
          </div>

          <!-- Check badge -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-50"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-50"
          >
            <div
              v-if="modelValue === 'ALL'"
              class="absolute top-2 right-2 h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-md z-10"
            >
              <svg class="h-3.5 w-3.5 text-slate-900" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </Transition>

          <!-- Ring intérieur si sélectionné -->
          <div v-if="modelValue === 'ALL'" class="absolute inset-0 rounded-2xl ring-2 ring-inset ring-white/25 z-10" />
        </div>
      </button>

      <!-- Séparateur -->
      <div class="shrink-0 self-center w-px h-10 sm:h-20 bg-slate-200" />

      <!-- ── Catégories dynamiques ── -->
      <button
        v-for="cat in categories"
        :key="cat.id_categorie"
        @click="select(cat.id_categorie)"
        class="group shrink-0 transition-all duration-300 ease-out
               hover:scale-110 active:scale-95"
        :class="modelValue === cat.id_categorie ? 'scale-110' : ''"
      >
        <div
          class="relative w-16 h-16 sm:w-40 sm:h-40 rounded-2xl overflow-hidden ring-2 transition-all duration-300"
          :class="modelValue === cat.id_categorie
            ? 'ring-slate-900 shadow-2xl shadow-slate-900/30'
            : 'ring-transparent shadow-md group-hover:ring-slate-300 group-hover:shadow-xl'"
        >
          <img
            v-if="imageLoaded(getMeta(cat).slug)"
            :src="`/categories/${getMeta(cat).slug}.jpg`"
            :alt="cat.nom"
            class="absolute inset-0 w-full h-full object-cover"
            @error="onImageError(getMeta(cat).slug)"
          />
          <div
            v-else
            class="absolute inset-0 bg-gradient-to-br flex items-center justify-center text-3xl"
            :class="getMeta(cat).color"
          >
            {{ getMeta(cat).emoji }}
          </div>

          <!-- Overlay hover -->
          <div
            class="absolute inset-0 transition-all duration-300
                   opacity-0 group-hover:opacity-100
                   backdrop-blur-[2px] bg-black/40"
          />

          <!-- Nom caché → visible au hover -->
          <div
            class="absolute inset-0 flex items-center justify-center px-2
                   transition-all duration-300
                   opacity-0 translate-y-2
                   group-hover:opacity-100 group-hover:translate-y-0"
          >
            <span class="text-white font-bold text-xs sm:text-sm text-center leading-snug drop-shadow-lg">
              {{ cat.nom }}
            </span>
          </div>

          <!-- Check badge -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 scale-50"
            enter-to-class="opacity-100 scale-100"
            leave-active-class="transition-all duration-150"
            leave-from-class="opacity-100 scale-100"
            leave-to-class="opacity-0 scale-50"
          >
            <div
              v-if="modelValue === cat.id_categorie"
              class="absolute top-2 right-2 h-6 w-6 rounded-full bg-white flex items-center justify-center shadow-md z-10"
            >
              <svg class="h-3.5 w-3.5 text-slate-900" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
          </Transition>

          <div v-if="modelValue === cat.id_categorie" class="absolute inset-0 rounded-2xl ring-2 ring-inset ring-white/25 z-10" />
        </div>
      </button>

    </div>
  </div>
</template>

<style scoped>
.scrollbar-none { scrollbar-width: none; }
.scrollbar-none::-webkit-scrollbar { display: none; }
</style>