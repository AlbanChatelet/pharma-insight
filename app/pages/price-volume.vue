<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const selectedYear = ref(null);
const years = ref([]);
const categories = ref([]);
const selectedCategoryId = ref("ALL");
const loading = ref(true);
const errorMsg = ref("");
const data = ref(null);

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

const refYear = computed(() => refYearFor(selectedYear.value));

function formatMoney(n) {
  return Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}
function formatPct(n) {
  const v = Number(n || 0);
  return (v > 0 ? "+" : "") + v.toLocaleString("fr-FR", { maximumFractionDigits: 2 }) + " %";
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

async function loadAll() {
  if (!selectedYear.value) return;
  loading.value = true;
  errorMsg.value = "";
  data.value = null;
  try {
    if (!refYear.value) return;
    const url = `${config.public.apiBase}/analysis/price-volume?year=${selectedYear.value}&ref=${refYear.value}${categoryIdParam.value}`;
    const res = await fetch(url);
    data.value = await res.json();
  } catch {
    errorMsg.value = "Impossible de charger l'analyse prix vs volume.";
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
    selectedYear.value = years.value.at(-1) ?? null;
    selectedCategoryId.value = "ALL";
    await loadAll();
  } catch {
    errorMsg.value = "Impossible de charger les données de base (API).";
  } finally {
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
          Analyse Prix vs Volume
        </h1>
        <p class="mt-1 sm:mt-2 text-sm text-slate-600">
          Décomposition du delta de CA : effet volume, effet prix, effet mix (résiduel)
        </p>
      </div>

      <!-- Filtres -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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

        <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
          <span class="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            v-model="selectedCategoryId"
            @change="loadAll"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10 max-w-[160px]"
          >
            <option value="ALL">Toutes catégories</option>
            <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">{{ c.nom }}</option>
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
      <div v-if="!refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p class="text-sm text-slate-600">
          Sélectionne une année qui possède une année précédente pour activer l'analyse.
        </p>
      </div>

      <section v-else-if="data" class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">

        <!-- Section header -->
        <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              {{ selectedCategoryLabel }} — {{ selectedYear }} vs {{ refYear }}
            </h2>
            <!-- Delta CA : inline sur desktop, empilé sur mobile -->
            <div class="mt-1.5 flex flex-wrap items-center gap-2">
              <span class="text-xs text-slate-500">Delta CA total :</span>
              <span class="inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
                    :class="badgeClass(data.delta.chiffre_affaires)">
                {{ formatMoney(data.delta.chiffre_affaires) }}
              </span>
              <span class="text-xs text-slate-500">{{ formatPct(data.delta.pct_chiffre_affaires) }}</span>
            </div>
          </div>
          <p class="text-xs text-slate-400 sm:text-slate-500">Source : données fictives (CSV)</p>
        </div>

        <!-- Cartes effets : 1 col mobile, 3 col desktop -->
        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4 mb-6">

          <!-- Effet volume -->
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet volume</p>
              <p class="text-xl sm:text-2xl font-semibold tracking-tight sm:mt-2"
                 :class="effectTextClass(data.decomposition.effet_volume)">
                {{ formatMoney(data.decomposition.effet_volume) }}
              </p>
            </div>
            <p class="hidden sm:block mt-1 text-xs text-slate-500">
              Variation de quantités valorisée au prix {{ refYear }}
            </p>
            <!-- Description courte mobile -->
            <p class="sm:hidden mt-1 text-xs text-slate-400">
              Quantités × prix {{ refYear }}
            </p>
          </div>

          <!-- Effet prix -->
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet prix</p>
              <p class="text-xl sm:text-2xl font-semibold tracking-tight sm:mt-2"
                 :class="effectTextClass(data.decomposition.effet_prix)">
                {{ formatMoney(data.decomposition.effet_prix) }}
              </p>
            </div>
            <p class="hidden sm:block mt-1 text-xs text-slate-500">
              Variation de prix appliquée au volume {{ selectedYear }}
            </p>
            <p class="sm:hidden mt-1 text-xs text-slate-400">
              Prix × volume {{ selectedYear }}
            </p>
          </div>

          <!-- Effet mix -->
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet mix (résiduel)</p>
              <p class="text-xl sm:text-2xl font-semibold tracking-tight sm:mt-2"
                 :class="effectTextClass(data.decomposition.effet_mix)">
                {{ formatMoney(data.decomposition.effet_mix) }}
              </p>
            </div>
            <p class="hidden sm:block mt-1 text-xs text-slate-500">
              Effet mix produit / interaction / arrondis
            </p>
            <p class="sm:hidden mt-1 text-xs text-slate-400">
              Mix produit / interaction
            </p>
          </div>
        </div>

        <!-- Tableau comparatif -->
        <!-- Desktop -->
        <div class="hidden sm:block overflow-hidden rounded-xl border border-slate-200">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 text-slate-600">
              <tr>
                <th class="px-4 py-3 text-left font-medium">Indicateur</th>
                <th class="px-4 py-3 text-right font-medium">{{ refYear }}</th>
                <th class="px-4 py-3 text-right font-medium">{{ selectedYear }}</th>
              </tr>
            </thead>
            <tbody>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-3 font-medium text-slate-900">Chiffre d'affaires</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatMoney(data.ref.chiffre_affaires) }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ formatMoney(data.year.chiffre_affaires) }}</td>
              </tr>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-3 font-medium text-slate-900">Quantités</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ Number(data.ref.quantite).toLocaleString("fr-FR") }}</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ Number(data.year.quantite).toLocaleString("fr-FR") }}</td>
              </tr>
              <tr class="border-t border-slate-200">
                <td class="px-4 py-3 font-medium text-slate-900">Prix moyen pondéré</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ Number(data.ref.prix_moyen_pondere).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €</td>
                <td class="px-4 py-3 text-right text-slate-700">{{ Number(data.year.prix_moyen_pondere).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Mobile : cards comparatives -->
        <div class="sm:hidden flex flex-col gap-2">
          <!-- CA -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs font-semibold text-slate-500 mb-2">Chiffre d'affaires</p>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <p class="text-[10px] text-slate-400 mb-0.5">{{ refYear }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ formatMoney(data.ref.chiffre_affaires) }}</p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <p class="text-[10px] text-slate-400 mb-0.5">{{ selectedYear }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ formatMoney(data.year.chiffre_affaires) }}</p>
              </div>
            </div>
          </div>

          <!-- Quantités -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs font-semibold text-slate-500 mb-2">Quantités</p>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <p class="text-[10px] text-slate-400 mb-0.5">{{ refYear }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ Number(data.ref.quantite).toLocaleString("fr-FR") }}</p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <p class="text-[10px] text-slate-400 mb-0.5">{{ selectedYear }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ Number(data.year.quantite).toLocaleString("fr-FR") }}</p>
              </div>
            </div>
          </div>

          <!-- Prix moyen -->
          <div class="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
            <p class="text-xs font-semibold text-slate-500 mb-2">Prix moyen pondéré</p>
            <div class="grid grid-cols-2 gap-2">
              <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <p class="text-[10px] text-slate-400 mb-0.5">{{ refYear }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ Number(data.ref.prix_moyen_pondere).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €</p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-3 py-2">
                <p class="text-[10px] text-slate-400 mb-0.5">{{ selectedYear }}</p>
                <p class="text-sm font-semibold text-slate-700">{{ Number(data.year.prix_moyen_pondere).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }} €</p>
              </div>
            </div>
          </div>
        </div>

      </section>
    </template>
  </div>
</template>