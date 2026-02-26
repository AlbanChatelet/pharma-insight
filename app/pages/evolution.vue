<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const years = ref([]);
const categories = ref([]);
const selectedCategoryId = ref("ALL");

const metric = ref("chiffre_affaires"); // chiffre_affaires | quantite | prix_moyen_pondere

const loading = ref(true);
const errorMsg = ref("");

const allPoints = ref([]); // 72 points
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

async function loadSeries() {
  loading.value = true;
  errorMsg.value = "";
  allPoints.value = [];

  try {
    // On garde la période 2020 -> 2025 si dispo
    const yList = years.value.filter((y) => y >= 2020 && y <= 2025);

    const reqs = yList.map((y) =>
      fetch(`${config.public.apiBase}/timeseries/revenue?year=${y}${categoryIdParam.value}`)
        .then((r) => r.json())
        .then((j) => ({
          year: y,
          points: j.points || [],
        }))
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

    // sliders
    startIdx.value = 0;
    endIdx.value = Math.max(0, flat.length - 1);
  } catch (e) {
    errorMsg.value = "Impossible de charger l’évolution 2020-2025.";
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

    const yearsJson = await yearsRes.json();
    const catsJson = await catsRes.json();

    years.value = yearsJson.years || [];
    categories.value = catsJson.categories || [];

    await loadSeries();
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
          Évolution 2020 → 2025
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Courbe interactive sur toute la période — {{ selectedCategoryLabel }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            v-model="selectedCategoryId"
            @change="loadSeries"
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
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <!-- Zoom simple: plage -->
        <div class="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <div class="flex items-center justify-between text-xs text-slate-600">
              <span>Début</span>
              <span>{{ startIdx + 1 }} / {{ allPoints.length }}</span>
            </div>
            <input
              v-model.number="startIdx"
              type="range"
              :min="0"
              :max="Math.max(0, allPoints.length - 1)"
              class="w-full"
            />
          </div>

          <div>
            <div class="flex items-center justify-between text-xs text-slate-600">
              <span>Fin</span>
              <span>{{ endIdx + 1 }} / {{ allPoints.length }}</span>
            </div>
            <input
              v-model.number="endIdx"
              type="range"
              :min="0"
              :max="Math.max(0, allPoints.length - 1)"
              class="w-full"
            />
          </div>
        </div>

        <EvolutionLineChart
          v-if="displayedPoints.length"
          :points="displayedPoints"
          :metric="metric"
          :title="`Évolution ${selectedCategoryLabel} — 2020→2025`"
        />

        <p v-else class="text-sm text-slate-500">
          Aucune donnée sur la période.
        </p>
      </section>
    </template>
  </div>
</template>