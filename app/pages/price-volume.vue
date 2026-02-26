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
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
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
  } catch (e) {
    errorMsg.value = "Impossible de charger l’analyse prix vs volume.";
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

    selectedYear.value = years.value.at(-1) ?? null;
    selectedCategoryId.value = "ALL";

    await loadAll();
  } catch (e) {
    errorMsg.value = "Impossible de charger les données de base (API).";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10">
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight text-slate-900">
          Analyse Prix vs Volume
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Décomposition du delta de CA : effet volume, effet prix, effet mix (résiduel)
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
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
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
      <div v-if="!refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <p class="text-sm text-slate-600">
          Sélectionne une année qui possède une année précédente pour activer l’analyse.
        </p>
      </div>

      <section v-else-if="data" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              {{ selectedCategoryLabel }} — {{ selectedYear }} vs {{ refYear }}
            </h2>
            <p class="text-xs text-slate-500">
              Delta CA total :
              <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                    :class="badgeClass(data.delta.chiffre_affaires)">
                {{ formatMoney(data.delta.chiffre_affaires) }}
              </span>
              <span class="ml-2 text-slate-500">({{ formatPct(data.delta.pct_chiffre_affaires) }})</span>
            </p>
          </div>
          <p class="text-xs text-slate-500">Source : données fictives (CSV)</p>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
            <p class="text-xs font-medium text-slate-500">Effet volume</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {{ formatMoney(data.decomposition.effet_volume) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Variation de quantités valorisée au prix {{ refYear }}
            </p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
            <p class="text-xs font-medium text-slate-500">Effet prix</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {{ formatMoney(data.decomposition.effet_prix) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Variation de prix appliquée au volume {{ selectedYear }}
            </p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
            <p class="text-xs font-medium text-slate-500">Effet mix (résiduel)</p>
            <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
              {{ formatMoney(data.decomposition.effet_mix) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">
              Effet mix produit / interaction / arrondis
            </p>
          </div>
        </div>

        <div class="mt-6 overflow-hidden rounded-xl border border-slate-200">
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
                <td class="px-4 py-3 font-medium text-slate-900">Chiffre d’affaires</td>
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
      </section>
    </template>
  </div>
</template>