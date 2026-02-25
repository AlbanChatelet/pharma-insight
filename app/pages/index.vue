<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const selectedYear = ref(null);
const years = ref([]);

const categories = ref([]);
const selectedCategoryId = ref("ALL"); // "ALL" = global

const pointsYear = ref([]);
const pointsRef = ref([]);

const compare = ref(null);

const loading = ref(true);
const errorMsg = ref("");

const categoryIdParam = computed(() => {
  return selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`;
});

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

    selectedYear.value = years.value[0] ?? null;
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
    const tsRefUrl = refY
      ? `${config.public.apiBase}/timeseries/revenue?year=${refY}${categoryIdParam.value}`
      : null;

    const cmpUrl = refY
      ? `${config.public.apiBase}/compare/yearly?year=${selectedYear.value}&ref=${refY}${categoryIdParam.value}`
      : null;

    const reqs = [
      fetch(tsYearUrl),
      tsRefUrl ? fetch(tsRefUrl) : Promise.resolve(null),
      cmpUrl ? fetch(cmpUrl) : Promise.resolve(null)
    ];

    const [tsYearRes, tsRefRes, cmpRes] = await Promise.all(reqs);

    const tsYearJson = await tsYearRes.json();
    pointsYear.value = tsYearJson.points || [];

    if (tsRefRes) {
      const tsRefJson = await tsRefRes.json();
      pointsRef.value = tsRefJson.points || [];
    } else {
      pointsRef.value = [];
    }

    if (cmpRes) {
      compare.value = await cmpRes.json();
    } else {
      compare.value = null;
    }
  } catch (e) {
    errorMsg.value = "Impossible de charger les données du dashboard.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-6 py-10">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">
            PharmaInsight
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            Outil interne ACAT — Analyse des performances mensuelles d’une pharmacie
          </p>
        </div>

        <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-slate-700">Année</span>
            <select
              v-model="selectedYear"
              @change="loadAll"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
            >
              <option v-for="y in years" :key="y" :value="y">
                {{ y }}
              </option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <span class="text-sm font-medium text-slate-700">Catégorie</span>
            <select
              v-model="selectedCategoryId"
              @change="loadAll"
              class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
            >
              <option value="ALL">Toutes catégories</option>
              <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">
                {{ c.nom }}
              </option>
            </select>
          </div>
        </div>
      </header>

      <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {{ errorMsg }}
      </div>

      <div v-if="loading" class="text-sm text-slate-500">
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

        <section class="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">
                Chiffre d’affaires mensuel
              </h2>
              <p class="text-xs text-slate-500">
                {{ selectedCategoryLabel }} — comparaison avec l’année précédente
              </p>
            </div>
            <p class="text-xs text-slate-500">Source : données fictives (CSV)</p>
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