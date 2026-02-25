<script setup>
const config = useRuntimeConfig()

const selectedYear = ref(null)
const years = ref([])
const data = ref([])

onMounted(async () => {
  const res = await fetch(`${config.public.apiBase}/meta/years`)
  const json = await res.json()
  years.value = json.years
  selectedYear.value = years.value[0]
  await loadData()
})

async function loadData() {
  if (!selectedYear.value) return

  const res = await fetch(
    `${config.public.apiBase}/timeseries/revenue?year=${selectedYear.value}`
  )
  const json = await res.json()
  data.value = json.points
}
</script>

<template>
  <div class="container">
    <h1>PharmaInsight</h1>

    <div class="selector">
      <label>Année :</label>
      <select v-model="selectedYear" @change="loadData">
        <option v-for="y in years" :key="y" :value="y">
          {{ y }}
        </option>
      </select>
    </div>

    <table v-if="data.length">
      <thead>
        <tr>
          <th>Mois</th>
          <th>CA</th>
          <th>Quantité</th>
          <th>Prix moyen</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in data" :key="row.mois">
          <td>{{ row.mois }}</td>
          <td>{{ row.chiffre_affaires.toLocaleString() }} €</td>
          <td>{{ row.quantite }}</td>
          <td>{{ row.prix_moyen_pondere }} €</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.container {
  padding: 40px;
  font-family: sans-serif;
}

.selector {
  margin-bottom: 20px;
}

table {
  border-collapse: collapse;
  width: 100%;
}

th, td {
  border: 1px solid #ddd;
  padding: 8px;
}
</style>