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

  if (!selectedYear.value) return;

  // Si pas de N-1 dispo
  if (!refYear.value) return;

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

    // année la plus récente par défaut
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
  <div class="mx-auto max-w-4xl px-6 py-10">
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold text-slate-900">Diagnostic automatique</h1>
        <p class="mt-2 text-sm text-slate-600">
          Interprétation synthétique des performances (N vs N-1)
        </p>
      </div>

      <!-- ✅ Select année -->
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-slate-700">Année</span>
        <select
          v-model="selectedYear"
          @change="loadDiagnostic"
          class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
        >
          <option v-for="y in years" :key="y" :value="y">
            {{ y }}
          </option>
        </select>
      </div>
    </header>

    <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ errorMsg }}
    </div>

    <div v-if="loading" class="text-sm text-slate-500">
      Chargement…
    </div>

    <!-- ✅ si pas de N-1 -->
    <div v-else-if="selectedYear && !refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p class="text-sm text-slate-600">
        Sélectionne une année qui possède une année précédente pour activer le diagnostic.
      </p>
    </div>

    <div v-else-if="data" class="space-y-6">
      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="font-semibold text-slate-900 mb-2">Évolution globale</h2>
        <p class="text-sm text-slate-700">
          Entre <strong>{{ refYear }}</strong> et <strong>{{ selectedYear }}</strong>, le chiffre d’affaires évolue de
          <strong>{{ formatMoney(data.summary.delta_ca) }}</strong>
          <span class="ml-2 inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                :class="badge(data.summary.pct_ca)">
            {{ formatPct(data.summary.pct_ca) }}
          </span>.
        </p>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="font-semibold text-slate-900 mb-2">Moteur principal</h2>
        <p class="text-sm text-slate-700">
          L’évolution est principalement expliquée par
          <strong>
            {{
              Math.abs(data.drivers.effet_volume) > Math.abs(data.drivers.effet_prix)
                ? "la variation des volumes"
                : "la variation des prix"
            }}
          </strong>.
        </p>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="font-semibold text-slate-900 mb-2">Catégorie clé</h2>
        <p class="text-sm text-slate-700">
          La catégorie la plus contributrice est <strong>{{ data.top_category.categorie }}</strong>
          avec un impact de <strong>{{ formatMoney(data.top_category.delta) }}</strong>.
        </p>
      </div>

      <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <h2 class="font-semibold text-slate-900 mb-4">Top produits contributeurs</h2>
        <ul class="space-y-2 text-sm text-slate-700">
          <li v-for="p in data.top_products" :key="p.produit" class="flex items-center justify-between">
            <span class="font-medium">{{ p.produit }}</span>
            <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                  :class="badge(p.delta)">
              {{ formatMoney(p.delta) }}
            </span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>