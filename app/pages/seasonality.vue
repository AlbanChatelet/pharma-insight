<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const years = ref([]);
const categories = ref([]);
const selectedCategoryId = ref("ALL");

const metric = ref("chiffre_affaires"); // chiffre_affaires | quantite | prix_moyen_pondere

const loading = ref(true);
const errorMsg = ref("");
const matrix = ref([]); // [{year, values:[{month,value,display,raw}]}]

const months = Array.from({ length: 12 }, (_, i) => i + 1);

const categoryIdParam = computed(() =>
  selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`
);

const metricLabel = computed(() => {
  if (metric.value === "quantite") return "Quantité";
  if (metric.value === "prix_moyen_pondere") return "Prix moyen pondéré";
  return "Chiffre d’affaires";
});

function formatCellValue(v) {
  const n = Number(v || 0);
  if (metric.value === "chiffre_affaires") return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + "€";
  if (metric.value === "prix_moyen_pondere") return n.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}

async function loadHeatmap() {
  loading.value = true;
  errorMsg.value = "";
  matrix.value = [];

  try {
    // On cible 2020..2025 si dispo
    const yList = (years.value || []).filter((y) => y >= 2020 && y <= 2025).sort((a,b)=>a-b);

    const reqs = yList.map((y) =>
      fetch(`${config.public.apiBase}/timeseries/revenue?year=${y}${categoryIdParam.value}`)
        .then((r) => r.json())
        .then((j) => ({ year: y, points: j.points || [] }))
    );

    const perYear = await Promise.all(reqs);

    matrix.value = perYear.map((block) => ({
      year: block.year,
      values: months.map((m) => {
        const raw = block.points.find((p) => p.mois === m) || {
          mois: m,
          chiffre_affaires: 0,
          quantite: 0,
          prix_moyen_pondere: 0
        };
        const value = Number(raw[metric.value]) || 0;

        return {
          month: m,
          value,
          display: formatCellValue(value),
          raw,
        };
      }),
    }));
  } catch (e) {
    errorMsg.value = "Impossible de charger la heatmap saisonnalité.";
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

    await loadHeatmap();
  } catch {
    errorMsg.value = "Impossible de charger les métadonnées (API).";
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10">
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-slate-900">
          Saisonnalité
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Vue heatmap 2020 → 2025 (lecture immédiate des tendances)
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            v-model="selectedCategoryId"
            @change="loadHeatmap"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="ALL">Toutes catégories</option>
            <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">
              {{ c.nom }}
            </option>
          </select>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Métrique</span>
          <select
            v-model="metric"
            @change="loadHeatmap"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
          >
            <option value="chiffre_affaires">Chiffre d’affaires</option>
            <option value="quantite">Quantités</option>
            <option value="prix_moyen_pondere">Prix moyen pondéré</option>
          </select>
        </div>
      </div>
    </header>

    <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ errorMsg }}
    </div>

    <div v-if="loading" class="text-sm text-slate-500">Chargement…</div>

    <template v-else>
      <SeasonalityHeatmap
        v-if="matrix.length"
        :years="years"
        :months="months"
        :matrix="matrix"
        :metric-label="metricLabel"
      />
    </template>
  </div>
</template>