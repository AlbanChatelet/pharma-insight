<script setup>
const config = useRuntimeConfig()

const selectedYear = ref(null)
const years = ref([])
const points = ref([])
const kpis = ref(null)

const loading = ref(true)
const errorMsg = ref("")

onMounted(async () => {
  try {
    const res = await fetch(`${config.public.apiBase}/meta/years`)
    const json = await res.json()
    years.value = json.years
    selectedYear.value = years.value[0]
    await loadAll()
  } catch (e) {
    errorMsg.value = "Impossible de charger les années (API)."
  } finally {
    loading.value = false
  }
})

async function loadAll() {
  if (!selectedYear.value) return
  loading.value = true
  errorMsg.value = ""

  try {
    const [tsRes, kpiRes] = await Promise.all([
      fetch(`${config.public.apiBase}/timeseries/revenue?year=${selectedYear.value}`),
      fetch(`${config.public.apiBase}/kpis/yearly?year=${selectedYear.value}`)
    ])

    const tsJson = await tsRes.json()
    const kpiJson = await kpiRes.json()

    points.value = tsJson.points || []
    kpis.value = kpiJson.kpis || null
  } catch (e) {
    errorMsg.value = "Impossible de charger les données du dashboard."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50">
    <div class="mx-auto max-w-6xl px-6 py-10">
      <header class="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 class="text-3xl font-semibold tracking-tight text-slate-900">
            PharmaInsight
          </h1>
          <p class="mt-2 text-sm text-slate-600">
            Outil interne ACAT — Analyse des performances mensuelles d’une pharmacie
          </p>
        </div>

        <div class="flex items-center gap-3">
          <span class="text-sm font-medium text-slate-700">Année</span>
          <select
            v-model="selectedYear"
            @change="loadAll"
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
        <KpiCards v-if="kpis" :kpis="kpis" />

        <section class="mt-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-base font-semibold text-slate-900">Chiffre d’affaires mensuel</h2>
            <p class="text-xs text-slate-500">Source : données fictives (CSV)</p>
          </div>

          <RevenueChart v-if="points.length" :points="points" />
          <p v-else class="text-sm text-slate-500">Aucune donnée à afficher.</p>
        </section>
      </template>
    </div>
  </div>
</template>