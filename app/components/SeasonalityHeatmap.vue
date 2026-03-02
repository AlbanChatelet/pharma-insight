<script setup>
import { computed } from "vue";

const props = defineProps({
  years: { type: Array, required: true },        // [2020..2025]
  months: { type: Array, required: true },       // [1..12]
  matrix: { type: Array, required: true },       // [{ year, values: [{month, value, raw}] }]
  metricLabel: { type: String, required: true }, // "CA", "Quantité", "Prix moyen"
});

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function formatValue(v) {
  return Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 });
}
function formatMoney(v) {
  return Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}
function formatMoney2(v) {
  return Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

const flatValues = computed(() => {
  const arr = [];
  for (const row of props.matrix) {
    for (const c of row.values) arr.push(Number(c.value) || 0);
  }
  return arr;
});

const minV = computed(() => Math.min(...flatValues.value));
const maxV = computed(() => Math.max(...flatValues.value));

function cellClass(value) {
  // Intensité 0..1
  const min = minV.value;
  const max = maxV.value;
  const t = max > min ? (value - min) / (max - min) : 0.5;
  const x = clamp(t, 0, 1);

  // Palette simple Tailwind (sans couleur custom Chart) :
  // plus x est haut -> plus foncé
  if (x < 0.15) return "bg-slate-50 text-slate-700";
  if (x < 0.30) return "bg-slate-100 text-slate-800";
  if (x < 0.45) return "bg-slate-200 text-slate-900";
  if (x < 0.60) return "bg-slate-300 text-slate-900";
  if (x < 0.75) return "bg-slate-400 text-white";
  if (x < 0.90) return "bg-slate-600 text-white";
  return "bg-slate-900 text-white";
}

function tooltipText(year, month, raw) {
  // raw = { chiffre_affaires, quantite, prix_moyen_pondere }
  const m = String(month).padStart(2, "0");
  return `${year}-${m}\nCA: ${formatMoney(raw.chiffre_affaires)}\nQté: ${formatValue(raw.quantite)}\nPrix: ${formatMoney2(raw.prix_moyen_pondere)}`;
}
</script>

<template>
  <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
    <div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Saisonnalité</h2>
        <p class="text-xs text-slate-500">
          Heatmap — intensité par mois ({{ metricLabel }})
        </p>
      </div>

      <div class="text-xs text-slate-500">
        min: {{ minV.toLocaleString("fr-FR") }} · max: {{ maxV.toLocaleString("fr-FR") }}
      </div>
    </div>

    <div class="mt-5 overflow-auto">
      <div class="min-w-[820px]">
        <!-- header mois -->
        <div class="grid grid-cols-[90px_repeat(12,1fr)] gap-2">
          <div class="text-xs font-medium text-slate-500"></div>
          <div
            v-for="m in months"
            :key="m"
            class="text-center text-xs font-medium text-slate-500"
          >
            {{ ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"][m-1] }}
          </div>
        </div>

        <!-- rows -->
        <div
          v-for="row in matrix"
          :key="row.year"
          class="mt-2 grid grid-cols-[90px_repeat(12,1fr)] gap-2 items-stretch"
        >
          <div class="flex items-center text-sm font-semibold text-slate-900">
            {{ row.year }}
          </div>

          <div
            v-for="cell in row.values"
            :key="`${row.year}-${cell.month}`"
            class="h-10 rounded-xl border border-slate-200 flex items-center justify-center text-xs font-medium"
            :class="cellClass(cell.value)"
            :title="tooltipText(row.year, cell.month, cell.raw)"
          >
            {{ cell.display }}
          </div>
        </div>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-500">
      Astuce : survole une case pour voir CA / Qté / Prix.
    </p>
  </div>
</template>