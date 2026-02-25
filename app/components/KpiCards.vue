<script setup>
const props = defineProps({
  yearKpis: { type: Object, required: true },
  refKpis: { type: Object, required: true },
  delta: { type: Object, required: true },
  yearLabel: { type: [String, Number], required: true },
  refLabel: { type: [String, Number], required: true }
});

function formatMoney(n) {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}

function formatMoney2(n) {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

function formatInt(n) {
  const v = Number(n || 0);
  return v.toLocaleString("fr-FR");
}

const pct = computed(() => Number(props.delta.pct_chiffre_affaires || 0));
const pctText = computed(() => `${pct.value > 0 ? "+" : ""}${pct.value.toLocaleString("fr-FR")} %`);
const pctClass = computed(() =>
  pct.value > 0 ? "text-emerald-700 bg-emerald-50 border-emerald-200"
  : pct.value < 0 ? "text-red-700 bg-red-50 border-red-200"
  : "text-slate-700 bg-slate-50 border-slate-200"
);
</script>

<template>
  <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <div class="flex items-start justify-between gap-4">
        <p class="text-xs font-medium text-slate-500">Chiffre d’affaires annuel</p>
        <span class="inline-flex items-center rounded-full border px-2 py-1 text-xs font-medium" :class="pctClass">
          {{ pctText }}
        </span>
      </div>

      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatMoney(yearKpis.chiffre_affaires) }}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Réf. {{ refLabel }} : {{ formatMoney(refKpis.chiffre_affaires) }}
      </p>
    </div>

    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Quantité totale vendue</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatInt(yearKpis.quantite) }}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Réf. {{ refLabel }} : {{ formatInt(refKpis.quantite) }}
      </p>
    </div>

    <div class="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
      <p class="text-xs font-medium text-slate-500">Prix moyen pondéré</p>
      <p class="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
        {{ formatMoney2(yearKpis.prix_moyen_pondere) }}
      </p>
      <p class="mt-1 text-xs text-slate-500">
        Réf. {{ refLabel }} : {{ formatMoney2(refKpis.prix_moyen_pondere) }}
      </p>
    </div>
  </div>
</template>