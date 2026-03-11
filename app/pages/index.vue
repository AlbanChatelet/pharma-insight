<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const selectedYear = ref(null);
const years = ref([]);
const categories = ref([]);
const selectedCategoryId = ref("ALL");
const pointsYear = ref([]);
const pointsRef = ref([]);
const compare = ref(null);
const loading = ref(true);
const errorMsg = ref("");

const categoryIdParam = computed(() =>
  selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategoryId.value === "ALL") return "Toutes catégories";
  const c = categories.value.find((x) => x.id_categorie === selectedCategoryId.value);
  return c?.nom ?? "Catégorie";
});

function refYearFor(y) {
  const idx = years.value.indexOf(y);
  return idx > 0 ? years.value[idx - 1] : null;
}

onMounted(async () => {
  try {
    const [yearsRes, catsRes] = await Promise.all([
      fetch(`${config.public.apiBase}/meta/years`),
      fetch(`${config.public.apiBase}/meta/categories`)
    ]);
    const yearsJson = await yearsRes.json();
    const catsJson = await catsRes.json();
    years.value = yearsJson.years || [];
    categories.value = catsJson.categories || [];
    selectedYear.value = years.value.at(-1) ?? null;
    selectedCategoryId.value = "ALL";
    await loadAll();
  } catch (e) {
    errorMsg.value = "Impossible de charger les données de base (API).";
  } finally {
    loading.value = false;
  }
});

async function loadAll() {
  if (!selectedYear.value) return;
  const refY = refYearFor(selectedYear.value);
  loading.value = true;
  errorMsg.value = "";
  try {
    const tsYearUrl = `${config.public.apiBase}/timeseries/revenue?year=${selectedYear.value}${categoryIdParam.value}`;
    const tsRefUrl = refY ? `${config.public.apiBase}/timeseries/revenue?year=${refY}${categoryIdParam.value}` : null;
    const cmpUrl = refY ? `${config.public.apiBase}/compare/yearly?year=${selectedYear.value}&ref=${refY}${categoryIdParam.value}` : null;

    const [tsYearRes, tsRefRes, cmpRes] = await Promise.all([
      fetch(tsYearUrl),
      tsRefUrl ? fetch(tsRefUrl) : Promise.resolve(null),
      cmpUrl ? fetch(cmpUrl) : Promise.resolve(null)
    ]);

    const tsYearJson = await tsYearRes.json();
    pointsYear.value = tsYearJson.points || [];

    if (tsRefRes) {
      const tsRefJson = await tsRefRes.json();
      pointsRef.value = tsRefJson.points || [];
    } else {
      pointsRef.value = [];
    }

    compare.value = cmpRes ? await cmpRes.json() : null;
  } catch (e) {
    errorMsg.value = "Impossible de charger les données du dashboard.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

      <!-- Header -->
      <header class="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
            PharmaInsight
          </h1>
          <p class="mt-1 sm:mt-2 text-sm text-slate-600">
            Outil interne ACAT — Analyse des performances mensuelles d'une pharmacie
          </p>
        </div>

        <!-- Filtres : stack sur mobile, row sur desktop -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">

          <!-- Filtre Année -->
          <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
            <span class="text-sm font-medium text-slate-700">Année</span>
            <select
              v-model="selectedYear"
              @change="loadAll"
              class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
            >
              <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
            </select>
          </div>

          <!-- Filtre Catégorie -->
          <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
            <span class="text-sm font-medium text-slate-700">Catégorie</span>
            <select
              v-model="selectedCategoryId"
              @change="loadAll"
              class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10 max-w-[160px] truncate"
            >
              <option value="ALL">Toutes catégories</option>
              <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">
                {{ c.nom }}
              </option>
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
        <KpiCards
          v-if="compare"
          :year-kpis="compare.year"
          :ref-kpis="compare.ref"
          :delta="compare.delta"
          :year-label="compare.scope.year"
          :ref-label="compare.scope.ref"
        />

        <section class="mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
          <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">
                Chiffre d'affaires mensuel
              </h2>
              <p class="text-xs text-slate-500">
                {{ selectedCategoryLabel }} — comparaison avec l'année précédente
              </p>
            </div>
            <p class="text-xs text-slate-400 sm:text-slate-500">Source : données fictives (CSV)</p>
          </div>

          <RevenueChart
            v-if="pointsYear.length && pointsRef.length"
            :points-year="pointsYear"
            :points-ref="pointsRef"
            :year-label="selectedYear"
            :ref-label="years[years.indexOf(selectedYear) - 1]"
          />

          <p v-else class="text-sm text-slate-500">
            Sélectionne une année qui possède une année précédente pour activer la comparaison.
          </p>
        </section>
      </template>

    </div>
  </div>
</template>