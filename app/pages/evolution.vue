<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const years = ref([]);
const categories = ref([]);
const selectedCategoryId = ref("ALL");
const metric = ref("chiffre_affaires");
const loading = ref(true);
const errorMsg = ref("");
const allPoints = ref([]);
const startIdx = ref(0);
const endIdx = ref(71);

const categoryIdParam = computed(() =>
  selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategoryId.value === "ALL") return "Toutes catégories";
  const c = categories.value.find((x) => x.id_categorie === selectedCategoryId.value);
  return c?.nom ?? "Catégorie";
});

const displayedPoints = computed(() => {
  const s = Math.min(startIdx.value, endIdx.value);
  const e = Math.max(startIdx.value, endIdx.value);
  return allPoints.value.slice(s, e + 1);
});

// Label lisible pour les sliders
function pointLabel(idx) {
  const p = allPoints.value[idx];
  if (!p) return "—";
  return `${p.year}-${String(p.month).padStart(2, "0")}`;
}

async function loadSeries() {
  loading.value = true;
  errorMsg.value = "";
  allPoints.value = [];
  try {
    const yList = years.value.filter((y) => y >= 2020 && y <= 2025);
    const reqs = yList.map((y) =>
      fetch(`${config.public.apiBase}/timeseries/revenue?year=${y}${categoryIdParam.value}`)
        .then((r) => r.json())
        .then((j) => ({ year: y, points: j.points || [] }))
    );
    const perYear = await Promise.all(reqs);
    const flat = [];
    for (const block of perYear.sort((a, b) => a.year - b.year)) {
      for (const p of block.points) {
        flat.push({
          year: block.year,
          month: p.mois,
          chiffre_affaires: p.chiffre_affaires,
          quantite: p.quantite,
          prix_moyen_pondere: p.prix_moyen_pondere,
        });
      }
    }
    allPoints.value = flat;
    startIdx.value = 0;
    endIdx.value = Math.max(0, flat.length - 1);
  } catch {
    errorMsg.value = "Impossible de charger l'évolution 2020-2025.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const [yearsRes, catsRes] = await Promise.all([
      fetch(`${config.public.apiBase}/meta/years`),
      fetch(`${config.public.apiBase}/meta/categories`)
    ]);
    years.value = (await yearsRes.json()).years || [];
    categories.value = (await catsRes.json()).categories || [];
    await loadSeries();
  } catch {
    errorMsg.value = "Impossible de charger les métadonnées (API).";
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

    <!-- Header -->
    <header class="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Évolution 2020 → 2025
        </h1>
        <p class="mt-1 sm:mt-2 text-sm text-slate-600">
          Courbe interactive sur toute la période — {{ selectedCategoryLabel }}
        </p>
      </div>

      <!-- Filtres -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
          <span class="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            v-model="selectedCategoryId"
            @change="loadSeries"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10 max-w-[160px]"
          >
            <option value="ALL">Toutes catégories</option>
            <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">{{ c.nom }}</option>
          </select>
        </div>

        <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
          <span class="text-sm font-medium text-slate-700">Métrique</span>
          <select
            v-model="metric"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10 max-w-[160px]"
          >
            <option value="chiffre_affaires">Chiffre d'affaires</option>
            <option value="quantite">Quantités</option>
            <option value="prix_moyen_pondere">Prix moyen pondéré</option>
          </select>
        </div>
      </div>
    </header>

    <!-- Erreur -->
    <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ errorMsg }}
    </div>

    <!-- Loading -->
    <div v-if="loading" class="flex items-center gap-2 text-sm text-slate-500 py-8">
      <svg class="animate-spin h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
      </svg>
      Chargement…
    </div>

    <template v-else>
      <section class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">

        <!-- Sliders zoom -->
        <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span class="font-medium">Début</span>
              <span class="text-slate-400">{{ pointLabel(startIdx) }}</span>
            </div>
            <input
              v-model.number="startIdx"
              type="range"
              :min="0"
              :max="Math.max(0, allPoints.length - 1)"
              class="w-full accent-slate-900"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-600 mb-1">
              <span class="font-medium">Fin</span>
              <span class="text-slate-400">{{ pointLabel(endIdx) }}</span>
            </div>
            <input
              v-model.number="endIdx"
              type="range"
              :min="0"
              :max="Math.max(0, allPoints.length - 1)"
              class="w-full accent-slate-900"
            />
          </div>
        </div>

        <!-- Info période sélectionnée -->
        <p class="mb-4 text-xs text-slate-400">
          {{ displayedPoints.length }} mois affichés
          <span v-if="displayedPoints.length"> — de {{ pointLabel(startIdx) }} à {{ pointLabel(endIdx) }}</span>
        </p>

        <EvolutionLineChart
          v-if="displayedPoints.length"
          :points="displayedPoints"
          :metric="metric"
          :title="`Évolution ${selectedCategoryLabel} — 2020→2025`"
        />

        <p v-else class="text-sm text-slate-500">Aucune donnée sur la période.</p>
      </section>
    </template>
  </div>
</template>