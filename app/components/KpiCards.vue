<script setup>
const props = defineProps({
  kpis: {
    type: Object,
    required: true
  }
})

function formatMoney(n) {
  const v = Number(n || 0)
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"
}

function formatMoney2(n) {
  const v = Number(n || 0)
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"
}

function formatInt(n) {
  const v = Number(n || 0)
  return v.toLocaleString("fr-FR")
}
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Chiffre d’affaires annuel</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatMoney(kpis.chiffre_affaires) }}
      </p>
    </div>

    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Quantité totale vendue</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatInt(kpis.quantite) }}
      </p>
    </div>

    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Prix moyen pondéré</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatMoney2(kpis.prix_moyen_pondere) }}
      </p>
    </div>
  </div>
</template>