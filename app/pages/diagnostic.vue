<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const years = ref([]);
const selectedYear = ref(null);
const loading = ref(true);
const data = ref(null);
const errorMsg = ref("");

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
function badge(n) {
  return n > 0
    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
    : n < 0
    ? "text-red-700 bg-red-50 border-red-200"
    : "text-slate-700 bg-slate-50 border-slate-200";
}

async function loadDiagnostic() {
  data.value = null;
  errorMsg.value = "";
  if (!selectedYear.value || !refYear.value) return;
  loading.value = true;
  try {
    const url = `${config.public.apiBase}/analysis/diagnostic?year=${selectedYear.value}&ref=${refYear.value}`;
    const res = await fetch(url);
    data.value = await res.json();
  } catch {
    errorMsg.value = "Impossible de charger le diagnostic.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const yearsRes = await fetch(`${config.public.apiBase}/meta/years`);
    const yearsJson = await yearsRes.json();
    years.value = yearsJson.years || [];
    selectedYear.value = years.value.at(-1) ?? null;
    await loadDiagnostic();
  } catch {
    errorMsg.value = "Impossible de charger les années (API).";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 sm:px-6 py-6 sm:py-10">

    <!-- Header -->
    <header class="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold text-slate-900">Diagnostic automatique</h1>
        <p class="mt-1 sm:mt-2 text-sm text-slate-600">
          Interprétation synthétique des performances (N vs N-1)
        </p>
      </div>

      <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
        <span class="text-sm font-medium text-slate-700">Année</span>
        <select
          v-model="selectedYear"
          @change="loadDiagnostic"
          class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
        >
          <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
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

    <!-- Pas de N-1 -->
    <div v-else-if="selectedYear && !refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p class="text-sm text-slate-600">
        Sélectionne une année qui possède une année précédente pour activer le diagnostic.
      </p>
    </div>

    <!-- Contenu -->
    <div v-else-if="data" class="space-y-4 sm:space-y-6">

      <!-- Évolution globale -->
      <div class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex items-center gap-2 mb-3">
          <!-- Icône tendance -->
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
               :class="data.summary.delta_ca >= 0 ? 'bg-emerald-50' : 'bg-red-50'">
            <svg class="h-4 w-4" :class="data.summary.delta_ca >= 0 ? 'text-emerald-600' : 'text-red-600'"
                 fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round"
                    :d="data.summary.delta_ca >= 0 ? 'M13 7l5 5-5 5M6 12h12' : 'M11 17l-5-5 5-5m6 5H5'"/>
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900">Évolution globale</h2>
        </div>

        <p class="text-sm text-slate-700 leading-relaxed">
          Entre <strong>{{ refYear }}</strong> et <strong>{{ selectedYear }}</strong>,
          le chiffre d'affaires évolue de <strong>{{ formatMoney(data.summary.delta_ca) }}</strong>.
        </p>

        <!-- Badge en dessous sur mobile pour éviter le débordement -->
        <div class="mt-3">
          <span class="inline-flex items-center rounded-full border px-3 py-1.5 text-sm font-semibold"
                :class="badge(data.summary.pct_ca)">
            {{ formatPct(data.summary.pct_ca) }}
          </span>
        </div>
      </div>

      <!-- Moteur principal -->
      <div class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex items-center gap-2 mb-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-blue-50">
            <svg class="h-4 w-4 text-blue-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900">Moteur principal</h2>
        </div>

        <p class="text-sm text-slate-700 leading-relaxed mb-4">
          L'évolution est principalement expliquée par
          <strong>{{
            Math.abs(data.drivers.effet_volume) > Math.abs(data.drivers.effet_prix)
              ? "la variation des volumes"
              : "la variation des prix"
          }}</strong>.
        </p>

        <!-- Décomposition visuelle des 3 effets -->
        <div class="grid grid-cols-3 gap-2">
          <div class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center">
            <p class="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wide">Volume</p>
            <p class="text-sm font-bold"
               :class="data.drivers.effet_volume >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ formatMoney(data.drivers.effet_volume) }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center">
            <p class="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wide">Prix</p>
            <p class="text-sm font-bold"
               :class="data.drivers.effet_prix >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ formatMoney(data.drivers.effet_prix) }}
            </p>
          </div>
          <div class="rounded-xl bg-slate-50 border border-slate-200 px-3 py-3 text-center">
            <p class="text-[10px] text-slate-400 font-medium mb-1 uppercase tracking-wide">Mix</p>
            <p class="text-sm font-bold"
               :class="data.drivers.effet_mix >= 0 ? 'text-emerald-600' : 'text-red-600'">
              {{ formatMoney(data.drivers.effet_mix) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Catégorie clé -->
      <div class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex items-center gap-2 mb-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-50">
            <svg class="h-4 w-4 text-violet-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900">Catégorie clé</h2>
        </div>

        <div class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3">
          <span class="text-sm font-semibold text-slate-900">{{ data.top_category.categorie }}</span>
          <span class="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="badge(data.top_category.delta)">
            {{ formatMoney(data.top_category.delta) }}
          </span>
        </div>
      </div>

      <!-- Top produits -->
      <div class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex items-center gap-2 mb-4">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50">
            <svg class="h-4 w-4 text-amber-600" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
          </div>
          <h2 class="font-semibold text-slate-900">Top produits contributeurs</h2>
        </div>

        <ul class="space-y-2">
          <li
            v-for="(p, index) in data.top_products"
            :key="p.produit"
            class="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-200 px-4 py-3"
          >
            <div class="flex items-center gap-3 min-w-0">
              <span class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                {{ index + 1 }}
              </span>
              <span class="text-sm font-medium text-slate-900 truncate">{{ p.produit }}</span>
            </div>
            <span class="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
                  :class="badge(p.delta)">
              {{ formatMoney(p.delta) }}
            </span>
          </li>
        </ul>
      </div>

    </div>
  </div>
</template>