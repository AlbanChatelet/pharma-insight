<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const years = ref([]);
const selectedYear = ref(null);

const loading = ref(true);
const errorMsg = ref("");

const result = ref(null);

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

function deltaClass(n) {
  const v = Number(n || 0);
  if (v > 0) return "text-emerald-700 bg-emerald-50 border-emerald-200";
  if (v < 0) return "text-red-700 bg-red-50 border-red-200";
  return "text-slate-700 bg-slate-50 border-slate-200";
}

async function loadContribution() {
  if (!selectedYear.value) return;
  if (!refYear.value) {
    result.value = null;
    return;
  }

  loading.value = true;
  errorMsg.value = "";

  try {
    const url = `${config.public.apiBase}/analysis/category-contribution?year=${selectedYear.value}&ref=${refYear.value}`;
    const res = await fetch(url);
    result.value = await res.json();
  } catch (e) {
    errorMsg.value = "Impossible de charger la contribution des catégories.";
    result.value = null;
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

    await loadContribution();
  } catch (e) {
    errorMsg.value = "Impossible de charger les années (API).";
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-6 py-10">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">
            Contribution des catégories
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            Décomposition du delta de CA entre N et N-1 (par catégorie)
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Année</span>
          <select
            v-model="selectedYear"
            @change="loadContribution"
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

      <template v-else>
        <div v-if="!refYear" class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <p class="text-sm text-slate-600">
            Sélectionne une année qui possède une année précédente pour activer l’analyse.
          </p>
        </div>

        <template v-else-if="result">
          <section class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 class="text-base font-semibold text-slate-900">
                  Delta total CA : {{ formatMoney(result.total_delta) }}
                </h2>
                <p class="text-xs text-slate-500">
                  Comparaison {{ selectedYear }} vs {{ refYear }}
                </p>
              </div>
              <p class="text-xs text-slate-500">Source : données fictives (CSV)</p>
            </div>

            <div class="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <table class="w-full text-sm">
                <thead class="bg-slate-50 text-slate-600">
                  <tr>
                    <th class="px-4 py-3 text-left font-medium">Catégorie</th>
                    <th class="px-4 py-3 text-right font-medium">CA {{ refYear }}</th>
                    <th class="px-4 py-3 text-right font-medium">CA {{ selectedYear }}</th>
                    <th class="px-4 py-3 text-right font-medium">Delta</th>
                    <th class="px-4 py-3 text-right font-medium">Part du delta</th>
                  </tr>
                </thead>

                <tbody>
                  <tr
                    v-for="c in result.contributions"
                    :key="c.id_categorie"
                    class="border-t border-slate-200"
                  >
                    <td class="px-4 py-3 font-medium text-slate-900">
                      {{ c.categorie }}
                    </td>

                    <td class="px-4 py-3 text-right text-slate-700">
                      {{ formatMoney(c.ca_ref) }}
                    </td>

                    <td class="px-4 py-3 text-right text-slate-700">
                      {{ formatMoney(c.ca_year) }}
                    </td>

                    <td class="px-4 py-3 text-right">
                      <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium"
                            :class="deltaClass(c.delta)">
                        {{ formatMoney(c.delta) }}
                      </span>
                    </td>

                    <td class="px-4 py-3 text-right text-slate-700">
                      {{ formatPct(c.share_of_delta) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>
        </template>
      </template>
    </div>
  </div>
</template>