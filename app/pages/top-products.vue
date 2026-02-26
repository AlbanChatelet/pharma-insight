<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const years = ref([]);
const selectedYear = ref(null);

const categories = ref([]);
const selectedCategoryId = ref("ALL");

const loading = ref(true);
const errorMsg = ref("");
const result = ref(null);

function refYearFor(y) {
  const idx = years.value.indexOf(y);
  return idx > 0 ? years.value[idx - 1] : null;
}

const refYear = computed(() => refYearFor(selectedYear.value));

const categoryIdParam = computed(() =>
  selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategoryId.value === "ALL") return "Toutes catégories";
  const c = categories.value.find((x) => x.id_categorie === selectedCategoryId.value);
  return c?.nom ?? "Catégorie";
});

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

async function loadTop() {
  result.value = null;
  errorMsg.value = "";

  if (!selectedYear.value) return;
  if (!refYear.value) return;

  loading.value = true;
  try {
    const url = `${config.public.apiBase}/analysis/top-products?year=${selectedYear.value}&ref=${refYear.value}${categoryIdParam.value}&limit=10`;
    const res = await fetch(url);
    result.value = await res.json();
  } catch {
    errorMsg.value = "Impossible de charger les top produits.";
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

    await loadTop();
  } catch {
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
          Top produits contributeurs
        </h1>
        <p class="mt-2 text-sm text-slate-600">
          Les produits qui expliquent le plus le delta de CA (N vs N-1)
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Année</span>
          <select
            v-model="selectedYear"
            @change="loadTop"
            class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            v-model="selectedCategoryId"
            @change="loadTop"
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

    <div v-else-if="selectedYear && !refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p class="text-sm text-slate-600">
        Sélectionne une année qui possède une année précédente pour activer l’analyse.
      </p>
    </div>

    <template v-else-if="result">
      <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              {{ selectedCategoryLabel }} — {{ selectedYear }} vs {{ refYear }}
            </h2>
            <p class="text-xs text-slate-500">
              Delta total : <strong>{{ formatMoney(result.total_delta) }}</strong>
            </p>
          </div>
          <p class="text-xs text-slate-500">Top 10 produits (triés par impact)</p>
        </div>

        <div class="mt-5 overflow-hidden rounded-xl border border-slate-200">
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
              <tr v-for="p in result.items" :key="p.id_produit" class="border-t border-slate-200">
                <td class="px-4 py-3">
                  <div class="font-medium text-slate-900">{{ p.produit }}</div>
                  <div class="text-xs text-slate-500">{{ p.categorie }}</div>
                </td>

                <td class="px-4 py-3 text-right">
                  <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                        :class="badgeClass(p.delta)">
                    {{ formatMoney(p.delta) }}
                  </span>
                </td>

                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatPct(p.share_of_delta) }}
                </td>

                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatMoney(p.decomposition.effet_volume) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatMoney(p.decomposition.effet_prix) }}
                </td>
                <td class="px-4 py-3 text-right text-slate-700">
                  {{ formatMoney(p.decomposition.effet_mix) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>
  </div>
</template>