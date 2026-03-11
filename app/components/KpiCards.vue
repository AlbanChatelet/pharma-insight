<script setup>
const props = defineProps({
  yearKpis: { type: Object, required: true },
  refKpis: { type: Object, required: true },
  delta: { type: Object, required: true },
  yearLabel: { type: [String, Number], required: true },
  refLabel: { type: [String, Number], required: true }
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

const pct = computed(() => Number(props.delta.pct_chiffre_affaires || 0));
const pctText = computed(() => `${pct.value > 0 ? "+" : ""}${pct.value.toLocaleString("fr-FR")} %`);
const pctClass = computed(() =>
  pct.value > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
  : pct.value < 0 ? "text-red-700 bg-red-50 border-red-200"
  : "text-slate-700 bg-slate-50 border-slate-200"
);

const deltaCA = computed(() => Number(props.delta.chiffre_affaires || 0));
const deltaCAClass = computed(() =>
  deltaCA.value > 0 ? "text-emerald-600" : deltaCA.value < 0 ? "text-red-600" : "text-slate-600"
);
</script>

<template>
  <div class="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">

    <!-- CA annuel -->
    <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
      <div class="flex items-start justify-between gap-3">
        <p class="text-xs font-medium text-slate-500">Chiffre d'affaires annuel</p>
        <span class="inline-flex shrink-0 items-center rounded-full border px-2 py-1 text-xs font-semibold" :class="pctClass">
          {{ pctText }}
        </span>
      </div>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatMoney(yearKpis.chiffre_affaires) }}
      </p>
      <!-- Mobile : ref + delta sur une ligne -->
      <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <p class="text-xs text-slate-500">Réf. {{ refLabel }} : {{ formatMoney(refKpis.chiffre_affaires) }}</p>
        <p class="text-xs font-medium" :class="deltaCAClass">
          Δ {{ formatMoney(deltaCA) }}
        </p>
      </div>
    </div>

    <!-- Quantité -->
    <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Quantité totale vendue</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatInt(yearKpis.quantite) }}
      </p>
      <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <p class="text-xs text-slate-500">Réf. {{ refLabel }} : {{ formatInt(refKpis.quantite) }}</p>
        <p class="text-xs font-medium" :class="Number(delta.quantite) > 0 ? 'text-emerald-600' : Number(delta.quantite) < 0 ? 'text-red-600' : 'text-slate-500'">
          Δ {{ Number(delta.quantite || 0).toLocaleString("fr-FR") }}
        </p>
      </div>
    </div>

    <!-- Prix moyen -->
    <div class="rounded-2xl bg-white p-4 sm:p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Prix moyen pondéré</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatMoney2(yearKpis.prix_moyen_pondere) }}
      </p>
      <div class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
        <p class="text-xs text-slate-500">Réf. {{ refLabel }} : {{ formatMoney2(refKpis.prix_moyen_pondere) }}</p>
        <p class="text-xs font-medium" :class="Number(delta.prix_moyen_pondere) > 0 ? 'text-emerald-600' : Number(delta.prix_moyen_pondere) < 0 ? 'text-red-600' : 'text-slate-500'">
          Δ {{ formatMoney2(delta.prix_moyen_pondere) }}
        </p>
      </div>
    </div>

  </div>
</template>