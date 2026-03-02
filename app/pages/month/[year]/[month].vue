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

const monthName = computed(() => (
  ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"][month.value - 1]
));

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
function formatMoney2(n) {
  return Number(n || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}
function formatInt(n) {
  return Number(n || 0).toLocaleString("fr-FR");
}
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

async function loadMonthDetail() {
  data.value = null;
  errorMsg.value = "";

  // Sécurité : pas de ref si année = première
  if (!refYear.value || refYear.value < 2000) return;

  loading.value = true;
  try {
    const url =
      `${config.public.apiBase}/analysis/month-detail?year=${year.value}&ref=${refYear.value}&month=${month.value}${categoryIdParam.value}&limit=10`;
    const res = await fetch(url);
    data.value = await res.json();
  } catch {
    errorMsg.value = "Impossible de charger le détail du mois.";
  } finally {
    loading.value = false;
  }
}

onMounted(async () => {
  try {
    const catsRes = await fetch(`${config.public.apiBase}/meta/categories`);
    const catsJson = await catsRes.json();
    categories.value = catsJson.categories || [];

    // Récupère categoryId depuis la heatmap si présent
    const qCat = route.query.categoryId ? String(route.query.categoryId) : "ALL";
    selectedCategoryId.value = qCat || "ALL";

    await loadMonthDetail();
  } catch {
    errorMsg.value = "Impossible de charger les catégories (API).";
    loading.value = false;
  }
});

// reload si category change
watch(selectedCategoryId, () => loadMonthDetail());
</script>

<template>
  <div class="mx-auto max-w-6xl px-6 py-10">
    <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <NuxtLink
          to="/seasonality"
          class="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Retour à la saisonnalité
        </NuxtLink>

        <h1 class="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
          {{ monthName }} {{ year }}
        </h1>

        <p class="mt-2 text-sm text-slate-600">
          {{ selectedCategoryLabel }} — comparaison avec {{ refYear }}
        </p>
      </div>

      <div class="flex items-center gap-3">
        <span class="text-sm font-medium text-slate-700">Catégorie</span>
        <select
          v-model="selectedCategoryId"
          class="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm outline-none focus:border-slate-300 focus:ring-2 focus:ring-slate-900/10"
        >
          <option value="ALL">Toutes catégories</option>
          <option v-for="c in categories" :key="c.id_categorie" :value="c.id_categorie">
            {{ c.nom }}
          </option>
        </select>
      </div>
    </header>

    <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      {{ errorMsg }}
    </div>

    <div v-if="loading" class="text-sm text-slate-500">Chargement…</div>

    <template v-else-if="data">
      <!-- KPI -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <div class="flex items-start justify-between gap-4">
            <p class="text-xs font-medium text-slate-500">CA du mois</p>
            <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                  :class="badgeClass(data.delta.chiffre_affaires)">
              {{ formatPct(data.delta.pct_chiffre_affaires) }}
            </span>
          </div>

          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ formatMoney(data.month.chiffre_affaires) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Réf. {{ refYear }} : {{ formatMoney(data.ref.chiffre_affaires) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Δ : {{ formatMoney(data.delta.chiffre_affaires) }}
          </p>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">Quantité</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ formatInt(data.month.quantite) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Réf. {{ refYear }} : {{ formatInt(data.ref.quantite) }}
          </p>
        </div>

        <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <p class="text-xs font-medium text-slate-500">Prix moyen pondéré</p>
          <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            {{ formatMoney2(data.month.prix_moyen_pondere) }}
          </p>
          <p class="mt-1 text-xs text-slate-500">
            Réf. {{ refYear }} : {{ formatMoney2(data.ref.prix_moyen_pondere) }}
          </p>
        </div>
      </div>

      <!-- Décomposition -->
      <section class="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Décomposition du delta (mois)</h2>
            <p class="text-xs text-slate-500">Volume / Prix / Mix</p>
          </div>
          <p class="text-xs text-slate-500">Interprétation business (marketing)</p>
        </div>

        <div class="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
            <p class="text-xs font-medium text-slate-500">Effet volume</p>
            <p class="mt-2 text-xl font-semibold text-slate-900">
              {{ formatMoney(data.decomposition.effet_volume) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Variation quantités × prix ref</p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
            <p class="text-xs font-medium text-slate-500">Effet prix</p>
            <p class="mt-2 text-xl font-semibold text-slate-900">
              {{ formatMoney(data.decomposition.effet_prix) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Variation prix × volume N</p>
          </div>

          <div class="rounded-2xl bg-slate-50 p-5 ring-1 ring-black/5">
            <p class="text-xs font-medium text-slate-500">Effet mix</p>
            <p class="mt-2 text-xl font-semibold text-slate-900">
              {{ formatMoney(data.decomposition.effet_mix) }}
            </p>
            <p class="mt-1 text-xs text-slate-500">Structure ventes / interactions</p>
          </div>
        </div>
      </section>

      <!-- Top produits -->
      <section class="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 class="text-base font-semibold text-slate-900">Top produits contributeurs (mois)</h2>
            <p class="text-xs text-slate-500">Top 10 par impact sur le delta</p>
          </div>
          <p class="text-xs text-slate-500">Clique sur un produit pour ouvrir la fiche</p>
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
              <tr
                v-for="p in data.top_products"
                :key="p.id_produit"
                class="border-t border-slate-200 hover:bg-slate-50"
              >
                <td class="px-4 py-3">
                  <NuxtLink
                    :to="`/products/${p.id_produit}`"
                    class="font-medium text-slate-900 hover:underline"
                  >
                    {{ p.produit }}
                  </NuxtLink>
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