<script setup>
import { ref, computed, onMounted, watch } from "vue";

const config = useRuntimeConfig();
const route = useRoute();

const year = computed(() => Number(route.params.year));
const month = computed(() => Number(route.params.month));
const refYear = computed(() => year.value - 1);

const categories = ref([]);
const selectedCategoryId = ref("ALL");
const loading = ref(true);
const errorMsg = ref("");
const data = ref(null);

const legendBins = [
  { label: "Très faible", hex: "#caf0f8" },
  { label: "Faible", hex: "#ade8f4" },
  { label: "Plutôt faible", hex: "#90e0ef" },
  { label: "Modéré", hex: "#48cae4" },
  { label: "Soutenu", hex: "#00b4d8" },
  { label: "Élevé", hex: "#0096c7" },
  { label: "Très élevé", hex: "#0077b6" },
  { label: "Exceptionnel", hex: "#023e8a" },
  { label: "Pic", hex: "#03045e" },
];

const palette = legendBins.map((b) => b.hex);

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function binIndex(value, min, max) {
  const t = max > min ? (value - min) / (max - min) : 0.5;
  return clamp(Math.floor(clamp(t, 0, 1) * palette.length), 0, palette.length - 1);
}

const monthName = computed(() =>
  ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][month.value - 1]
);

const categoryIdParam = computed(() =>
  selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategoryId.value === "ALL") return "Toutes catégories";
  const c = categories.value.find((x) => x.id_categorie === selectedCategoryId.value);
  return c?.nom ?? "Catégorie";
});

const contextMin = ref(0);
const contextMax = ref(0);

const monthBin = computed(() => {
  const v = Number(data.value?.month?.chiffre_affaires || 0);
  return binIndex(v, contextMin.value, contextMax.value);
});
const monthLegend = computed(() => legendBins[monthBin.value] || legendBins[0]);
const monthLegendTextClass = computed(() => monthBin.value >= 5 ? "text-white" : "text-slate-900");

function formatMoney(n) { return Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"; }
function formatMoney2(n) { return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
function formatInt(n) { return Number(n || 0).toLocaleString("fr-FR"); }
function formatPct(n) {
  const v = Number(n || 0);
  return `${v > 0 ? "+" : ""}${v.toLocaleString("fr-FR", { maximumFractionDigits: 2 })} %`;
}
function badgeClass(n) {
  const v = Number(n || 0);
  if (v > 0) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (v < 0) return "text-red-700 bg-red-50 border-red-200";
  return "text-slate-700 bg-slate-50 border-slate-200";
}
function effectTextClass(n) {
  const v = Number(n || 0);
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-600";
  return "text-slate-700";
}

async function loadMonthDetail() {
  data.value = null;
  errorMsg.value = "";
  if (!refYear.value || refYear.value < 2000) return;
  loading.value = true;
  try {
    const url = `${config.public.apiBase}/analysis/month-detail?year=${year.value}&ref=${refYear.value}&month=${month.value}${categoryIdParam.value}&limit=10`;
    const res = await fetch(url);
    data.value = await res.json();
  } catch {
    errorMsg.value = "Impossible de charger le détail du mois.";
  } finally {
    loading.value = false;
  }

  const yearsRange = [2020, 2021, 2022, 2023, 2024, 2025];
  const q = selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`;
  const blocks = await Promise.all(
    yearsRange.map((y) =>
      fetch(`${config.public.apiBase}/timeseries/revenue?year=${y}${q}`)
        .then((r) => r.json())
        .then((j) => j.points || [])
    )
  );
  const allVals = blocks.flat().map((p) => Number(p.chiffre_affaires) || 0);
  contextMin.value = allVals.length ? Math.min(...allVals) : 0;
  contextMax.value = allVals.length ? Math.max(...allVals) : 0;
}

onMounted(async () => {
  try {
    const catsRes = await fetch(`${config.public.apiBase}/meta/categories`);
    categories.value = (await catsRes.json()).categories || [];
    selectedCategoryId.value = route.query.categoryId ? String(route.query.categoryId) : "ALL";
    await loadMonthDetail();
  } catch {
    errorMsg.value = "Impossible de charger les catégories (API).";
    loading.value = false;
  }
});

watch(selectedCategoryId, () => loadMonthDetail());
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

    <!-- Header -->
    <header class="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <NuxtLink to="/seasonality" class="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Retour à la saisonnalité
        </NuxtLink>

        <h1 class="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          {{ monthName }} {{ year }}
        </h1>

        <!-- Badge intensité -->
        <div class="mt-3 flex flex-wrap items-center gap-2">
          <span
            class="inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold shadow-sm"
            :class="monthLegendTextClass"
            :style="{ backgroundColor: monthLegend.hex, borderColor: 'rgba(15, 23, 42, 0.12)' }"
          >
            <span class="h-2.5 w-2.5 rounded-full border border-black/10" :style="{ backgroundColor: monthLegend.hex }"></span>
            {{ monthLegend.label }}
          </span>
          <span class="text-xs text-slate-500">Échelle 2020–2025 · {{ selectedCategoryLabel }}</span>
        </div>

        <p class="mt-1.5 text-sm text-slate-600">
          {{ selectedCategoryLabel }} — comparaison avec {{ refYear }}
        </p>
      </div>

      <!-- Filtre catégorie -->
      <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none shrink-0">
        <span class="text-sm font-medium text-slate-700">Catégorie</span>
        <select
          v-model="selectedCategoryId"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10 max-w-[160px]"
        >
          <option value="ALL">Toutes catégories</option>
          <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">{{ c.nom }}</option>
        </select>
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

    <template v-else-if="data">

      <!-- KPI cards : 1 col mobile, 3 col desktop -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

        <!-- CA -->
        <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
          <div class="flex items-start justify-between gap-3">
            <p class="text-xs font-medium text-slate-500">CA du mois</p>
            <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-xs font-semibold"
                  :class="badgeClass(data.delta.chiffre_affaires)">
              {{ formatPct(data.delta.pct_chiffre_affaires) }}
            </span>
          </div>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ formatMoney(data.month.chiffre_affaires) }}
          </p>
          <!-- Sur mobile : ref + delta sur une ligne -->
          <div class="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
            <p class="text-xs text-slate-500">Réf. {{ refYear }} : {{ formatMoney(data.ref.chiffre_affaires) }}</p>
            <p class="text-xs text-slate-500">Δ : {{ formatMoney(data.delta.chiffre_affaires) }}</p>
          </div>
        </div>

        <!-- Quantité -->
        <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">Quantité</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ formatInt(data.month.quantite) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">Réf. {{ refYear }} : {{ formatInt(data.ref.quantite) }}</p>
        </div>

        <!-- Prix moyen -->
        <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">Prix moyen pondéré</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ formatMoney2(data.month.prix_moyen_pondere) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">Réf. {{ refYear }} : {{ formatMoney2(data.ref.prix_moyen_pondere) }}</p>
        </div>
      </div>

      <!-- Décomposition -->
      <section class="mt-4 sm:mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Décomposition du delta</h2>
            <p class="text-xs text-slate-500">Volume / Prix / Mix</p>
          </div>
          <p class="text-xs text-slate-400 sm:text-slate-500">Interprétation business (marketing)</p>
        </div>

        <!-- 1 col mobile flex label+valeur, 3 col desktop empilé -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet volume</p>
              <p class="text-xl font-semibold sm:mt-2" :class="effectTextClass(data.decomposition.effet_volume)">
                {{ formatMoney(data.decomposition.effet_volume) }}
              </p>
            </div>
            <p class="hidden sm:block mt-1 text-xs text-slate-500">Variation quantités × prix ref</p>
            <p class="sm:hidden mt-1 text-xs text-slate-400">Quantités × prix {{ refYear }}</p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet prix</p>
              <p class="text-xl font-semibold sm:mt-2" :class="effectTextClass(data.decomposition.effet_prix)">
                {{ formatMoney(data.decomposition.effet_prix) }}
              </p>
            </div>
            <p class="hidden sm:block mt-1 text-xs text-slate-500">Variation prix × volume N</p>
            <p class="sm:hidden mt-1 text-xs text-slate-400">Prix × volume {{ year }}</p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet mix</p>
              <p class="text-xl font-semibold sm:mt-2" :class="effectTextClass(data.decomposition.effet_mix)">
                {{ formatMoney(data.decomposition.effet_mix) }}
              </p>
            </div>
            <p class="hidden sm:block mt-1 text-xs text-slate-500">Structure ventes / interactions</p>
            <p class="sm:hidden mt-1 text-xs text-slate-400">Mix produit</p>
          </div>
        </div>
      </section>

      <!-- Top produits -->
      <section class="mt-4 sm:mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-5">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Top produits contributeurs</h2>
            <p class="text-xs text-slate-500">Top 10 par impact sur le delta du mois</p>
          </div>
          <p class="text-xs text-slate-400 sm:text-slate-500 hidden sm:block">Clique sur un produit pour ouvrir la fiche</p>
        </div>

        <!-- TABLE desktop -->
        <div class="hidden sm:block overflow-hidden rounded-xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-3 text-left font-medium">Produit</th>
                <th class="px-4 py-3 text-right font-medium">Delta</th>
                <th class="px-4 py-3 text-right font-medium">Part du delta</th>
                <th class="px-4 py-3 text-right font-medium">Effet volume</th>
                <th class="px-4 py-3 text-right font-medium">Effet prix</th>
                <th class="px-4 py-3 text-right font-medium">Effet mix</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="p in data.top_products" :key="p.id_produit" class="border-t border-slate-200 hover:bg-slate-50">
                <td class="px-4 py-3">
                  <NuxtLink :to="`/products/${p.id_produit}`" class="font-medium text-slate-900 hover:underline">{{ p.produit }}</NuxtLink>
                  <div class="text-xs text-slate-500">{{ p.categorie }}</div>
                </td>
                <td class="px-4 py-3 text-right">
                  <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium" :class="badgeClass(p.delta)">
                    {{ formatMoney(p.delta) }}
                  </span>
                </td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatPct(p.share_of_delta) }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatMoney(p.decomposition.effet_volume) }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatMoney(p.decomposition.effet_prix) }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatMoney(p.decomposition.effet_mix) }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- CARDS mobile -->
        <div class="sm:hidden flex flex-col gap-3">
          <div
            v-for="(p, index) in data.top_products"
            :key="p.id_produit"
            class="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <!-- Rang + nom + delta -->
            <div class="flex items-start justify-between gap-2 mb-3">
              <div class="flex items-start gap-2 min-w-0">
                <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                  {{ index + 1 }}
                </span>
                <div class="min-w-0">
                  <NuxtLink :to="`/products/${p.id_produit}`" class="font-semibold text-slate-900 text-sm leading-tight hover:underline truncate block">
                    {{ p.produit }}
                  </NuxtLink>
                  <span class="text-xs text-slate-500">{{ p.categorie }}</span>
                </div>
              </div>
              <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-xs font-semibold" :class="badgeClass(p.delta)">
                {{ formatMoney(p.delta) }}
              </span>
            </div>

            <!-- Part du delta -->
            <div class="flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2 mb-2">
              <span class="text-xs text-slate-500">Part du delta</span>
              <span class="text-sm font-semibold text-slate-800">{{ formatPct(p.share_of_delta) }}</span>
            </div>

            <!-- Effets grille 3 colonnes -->
            <div class="grid grid-cols-3 gap-1.5">
              <div class="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                <p class="text-[10px] text-slate-400 mb-0.5">Volume</p>
                <p class="text-xs font-semibold" :class="effectTextClass(p.decomposition.effet_volume)">
                  {{ formatMoney(p.decomposition.effet_volume) }}
                </p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                <p class="text-[10px] text-slate-400 mb-0.5">Prix</p>
                <p class="text-xs font-semibold" :class="effectTextClass(p.decomposition.effet_prix)">
                  {{ formatMoney(p.decomposition.effet_prix) }}
                </p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                <p class="text-[10px] text-slate-400 mb-0.5">Mix</p>
                <p class="text-xs font-semibold" :class="effectTextClass(p.decomposition.effet_mix)">
                  {{ formatMoney(p.decomposition.effet_mix) }}
                </p>
              </div>
            </div>
          </div>
        </div>

      </section>
    </template>
  </div>
</template>