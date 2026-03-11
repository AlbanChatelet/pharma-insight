<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();
const route = useRoute();

const productId = computed(() => String(route.params.id || ""));
const years = ref([]);
const selectedYear = ref(null);
const loading = ref(true);
const errorMsg = ref("");
const diag = ref(null);
const pointsYear = ref([]);
const pointsRef = ref([]);

function refYearFor(y) {
  const idx = years.value.indexOf(y);
  return idx > 0 ? years.value[idx - 1] : null;
}

const refYear = computed(() => refYearFor(selectedYear.value));

function formatMoney(n) { return Number(n || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"; }
function formatMoney2(n) { return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }
function formatInt(n) { return Number(n || 0).toLocaleString("fr-FR"); }
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
  diag.value = null;
  pointsYear.value = [];
  pointsRef.value = [];
  errorMsg.value = "";
  if (!selectedYear.value || !refYear.value) return;
  loading.value = true;
  try {
    const [dRes, yRes, rRes] = await Promise.all([
      fetch(`${config.public.apiBase}/analysis/product?year=${selectedYear.value}&ref=${refYear.value}&productId=${productId.value}`),
      fetch(`${config.public.apiBase}/timeseries/product?year=${selectedYear.value}&productId=${productId.value}`),
      fetch(`${config.public.apiBase}/timeseries/product?year=${refYear.value}&productId=${productId.value}`)
    ]);
    diag.value = await dRes.json();
    pointsYear.value = (await yRes.json()).points || [];
    pointsRef.value = (await rRes.json()).points || [];
  } catch {
    errorMsg.value = "Impossible de charger la fiche produit.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const yearsJson = await fetch(`${config.public.apiBase}/meta/years`).then(r => r.json());
    years.value = yearsJson.years || [];
    selectedYear.value = years.value.at(-1) ?? null;
    await loadAll();
  } catch {
    errorMsg.value = "Impossible de charger les années (API).";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

    <!-- Header -->
    <header class="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="min-w-0">
        <NuxtLink to="/top-products" class="text-sm text-slate-500 hover:text-slate-900 inline-flex items-center gap-1">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
          </svg>
          Retour aux Top produits
        </NuxtLink>

        <h1 class="mt-2 text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900 truncate">
          {{ diag?.product?.nom || "Fiche produit" }}
        </h1>
        <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <span v-if="diag?.product?.categorie" class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {{ diag.product.categorie }}
          </span>
          <span v-if="diag?.product?.marque" class="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
            {{ diag.product.marque }}
          </span>
          <span v-if="diag?.product?.sku" class="text-xs text-slate-400">SKU : {{ diag.product.sku }}</span>
        </div>
      </div>

      <!-- Filtre année -->
      <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none shrink-0">
        <span class="text-sm font-medium text-slate-700">Année</span>
        <select
          v-model="selectedYear"
          @change="loadAll"
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

    <div v-else-if="selectedYear && !refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p class="text-sm text-slate-600">
        Sélectionne une année qui possède une année précédente pour activer la comparaison.
      </p>
    </div>

    <template v-else-if="diag">

      <!-- KPI -->
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">CA annuel</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatMoney(diag.year.chiffre_affaires) }}</p>
          <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
            <p class="text-xs text-slate-500">Réf. {{ refYear }} : {{ formatMoney(diag.ref.chiffre_affaires) }}</p>
            <p class="text-xs font-medium" :class="effectTextClass(diag.delta.chiffre_affaires)">
              Δ {{ formatMoney(diag.delta.chiffre_affaires) }}
            </p>
          </div>
        </div>

        <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">Quantité</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatInt(diag.year.quantite) }}</p>
          <p class="mt-1 text-xs text-slate-500">Réf. {{ refYear }} : {{ formatInt(diag.ref.quantite) }}</p>
        </div>

        <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">Prix moyen pondéré</p>
          <p class="mt-2 text-2xl font-semibold text-slate-900">{{ formatMoney2(diag.year.prix_moyen_pondere) }}</p>
          <p class="mt-1 text-xs text-slate-500">Réf. {{ refYear }} : {{ formatMoney2(diag.ref.prix_moyen_pondere) }}</p>
        </div>
      </div>

      <!-- Décomposition -->
      <section class="mt-4 sm:mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex items-center justify-between gap-3 mb-4">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Décomposition du delta</h2>
            <p class="text-xs text-slate-500">{{ selectedYear }} vs {{ refYear }}</p>
          </div>
          <span class="inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-xs font-semibold"
                :class="badgeClass(diag.delta.chiffre_affaires)">
            Δ {{ formatMoney(diag.delta.chiffre_affaires) }}
          </span>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet volume</p>
              <p class="text-xl font-semibold sm:mt-2" :class="effectTextClass(diag.decomposition.effet_volume)">
                {{ formatMoney(diag.decomposition.effet_volume) }}
              </p>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet prix</p>
              <p class="text-xl font-semibold sm:mt-2" :class="effectTextClass(diag.decomposition.effet_prix)">
                {{ formatMoney(diag.decomposition.effet_prix) }}
              </p>
            </div>
          </div>
          <div class="rounded-2xl bg-slate-50 p-4 sm:p-5 ring-1 ring-black/5">
            <div class="flex items-center justify-between sm:block">
              <p class="text-xs font-medium text-slate-500 sm:mb-2">Effet mix</p>
              <p class="text-xl font-semibold sm:mt-2" :class="effectTextClass(diag.decomposition.effet_mix)">
                {{ formatMoney(diag.decomposition.effet_mix) }}
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Graphique -->
      <section class="mt-4 sm:mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
        <div class="mb-4">
          <h2 class="text-base font-semibold text-slate-900">CA mensuel</h2>
          <p class="text-xs text-slate-500">Comparaison {{ selectedYear }} vs {{ refYear }}</p>
        </div>

        <RevenueChart
          v-if="pointsYear.length && pointsRef.length"
          :points-year="pointsYear"
          :points-ref="pointsRef"
          :year-label="selectedYear"
          :ref-label="refYear"
        />
      </section>

    </template>
  </div>
</template>