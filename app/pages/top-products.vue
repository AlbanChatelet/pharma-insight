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
function effectTextClass(n) {
  const v = Number(n || 0);
  if (v > 0) return "text-emerald-600";
  if (v < 0) return "text-red-600";
  return "text-slate-600";
}

async function loadTop() {
  result.value = null;
  errorMsg.value = "";
  if (!selectedYear.value || !refYear.value) return;
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
  <div class="mx-auto max-w-6xl px-4 sm:px-6 py-6 sm:py-10">

    <!-- Header -->
    <header class="mb-6 sm:mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl sm:text-3xl font-semibold tracking-tight text-slate-900">
          Top produits contributeurs
        </h1>
        <p class="mt-1 sm:mt-2 text-sm text-slate-600">
          Les produits qui expliquent le plus le delta de CA (N vs N-1)
        </p>
      </div>

      <!-- Filtres -->
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
        <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
          <span class="text-sm font-medium text-slate-700">Année</span>
          <select
            v-model="selectedYear"
            @change="loadTop"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
          >
            <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
          </select>
        </div>

        <div class="flex items-center justify-between sm:justify-start gap-3 bg-white sm:bg-transparent rounded-xl sm:rounded-none px-4 sm:px-0 py-2.5 sm:py-0 border border-slate-200 sm:border-0 shadow-sm sm:shadow-none">
          <span class="text-sm font-medium text-slate-700">Catégorie</span>
          <select
            v-model="selectedCategoryId"
            @change="loadTop"
            class="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10 max-w-[160px]"
          >
            <option value="ALL">Toutes catégories</option>
            <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">
              {{ c.nom }}
            </option>
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

    <div v-else-if="selectedYear && !refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
      <p class="text-sm text-slate-600">
        Sélectionne une année qui possède une année précédente pour activer l'analyse.
      </p>
    </div>

    <template v-else-if="result">
      <section class="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">

        <!-- Section header -->
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between mb-5">
          <div>
            <h2 class="text-base font-semibold text-slate-900">
              {{ selectedCategoryLabel }} — {{ selectedYear }} vs {{ refYear }}
            </h2>
            <p class="text-xs text-slate-500">
              Delta total : <strong>{{ formatMoney(result.total_delta) }}</strong>
            </p>
          </div>
          <p class="text-xs text-slate-400 sm:text-slate-500">Top 10 produits (triés par impact)</p>
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
              <tr v-for="p in result.items" :key="p.id_produit" class="border-t border-slate-200">
                <td class="px-4 py-3">
                  <NuxtLink :to="`/products/${p.id_produit}`" class="font-medium text-slate-900 hover:underline">
                    {{ p.produit }}
                  </NuxtLink>
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
            v-for="(p, index) in result.items"
            :key="p.id_produit"
            class="rounded-xl border border-slate-200 bg-slate-50 p-4"
          >
            <!-- Rang + nom + badge delta -->
            <div class="flex items-start justify-between gap-2 mb-3">
              <div class="flex items-start gap-2">
                <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {{ index + 1 }}
                </span>
                <div>
                  <NuxtLink :to="`/products/${p.id_produit}`" class="font-semibold text-slate-900 text-sm leading-tight hover:underline">
                    {{ p.produit }}
                  </NuxtLink>
                  <div class="text-xs text-slate-500 mt-0.5">{{ p.categorie }}</div>
                </div>
              </div>
              <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-xs font-medium" :class="badgeClass(p.delta)">
                {{ formatMoney(p.delta) }}
              </span>
            </div>

            <!-- Part du delta -->
            <div class="mb-3 flex items-center justify-between rounded-lg bg-white border border-slate-200 px-3 py-2">
              <span class="text-xs text-slate-500">Part du delta total</span>
              <span class="text-sm font-semibold text-slate-800">{{ formatPct(p.share_of_delta) }}</span>
            </div>

            <!-- Effets : grille 3 colonnes -->
            <div class="grid grid-cols-3 gap-2">
              <div class="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                <p class="text-xs text-slate-400 mb-1">Volume</p>
                <p class="text-xs font-semibold" :class="effectTextClass(p.decomposition.effet_volume)">
                  {{ formatMoney(p.decomposition.effet_volume) }}
                </p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                <p class="text-xs text-slate-400 mb-1">Prix</p>
                <p class="text-xs font-semibold" :class="effectTextClass(p.decomposition.effet_prix)">
                  {{ formatMoney(p.decomposition.effet_prix) }}
                </p>
              </div>
              <div class="rounded-lg bg-white border border-slate-200 px-2 py-2 text-center">
                <p class="text-xs text-slate-400 mb-1">Mix</p>
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