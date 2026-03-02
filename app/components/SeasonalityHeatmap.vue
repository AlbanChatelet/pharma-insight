<script setup>
import { computed } from "vue";

const props = defineProps({
  years: { type: Array, required: true },
  months: { type: Array, required: true },
  matrix: { type: Array, required: true },
  metricLabel: { type: String, required: true },
  selectedCategoryId: { type: String, default: "ALL" }, // ✅ ajouté
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
  return arr.length ? arr : [0];
});

const minV = computed(() => Math.min(...flatValues.value));
const maxV = computed(() => Math.max(...flatValues.value));

function intensity(value) {
  const min = minV.value;
  const max = maxV.value;
  const t = max > min ? (value - min) / (max - min) : 0.5;
  return clamp(t, 0, 1);
}

/**
 * Palette “froid → chaud”
 * Low  -> bleu
 * mid  -> vert
 * high -> jaune/orange/rouge
 */
function cellClass(value) {
  const x = intensity(value);

  // 8 paliers de couleur (lisible, contrasté)
  if (x < 0.12) return "bg-blue-100 text-slate-900 border-blue-200";
  if (x < 0.25) return "bg-sky-200 text-slate-900 border-sky-300";
  if (x < 0.38) return "bg-emerald-200 text-slate-900 border-emerald-300";
  if (x < 0.50) return "bg-lime-200 text-slate-900 border-lime-300";
  if (x < 0.62) return "bg-yellow-200 text-slate-900 border-yellow-300";
  if (x < 0.75) return "bg-orange-300 text-slate-900 border-orange-400";
  if (x < 0.88) return "bg-red-300 text-slate-900 border-red-400";
  return "bg-red-600 text-white border-red-700";
}

function tooltipText(year, month, raw) {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}
CA: ${formatMoney(raw.chiffre_affaires)}
Qté: ${formatValue(raw.quantite)}
Prix: ${formatMoney2(raw.prix_moyen_pondere)}`;
}

// Légende : mêmes paliers que cellClass
const legendBins = [
  { label: "Très faible", cls: "bg-blue-100 border-blue-200" },
  { label: "Faible", cls: "bg-sky-200 border-sky-300" },
  { label: "Moyen -", cls: "bg-emerald-200 border-emerald-300" },
  { label: "Moyen", cls: "bg-lime-200 border-lime-300" },
  { label: "Moyen +", cls: "bg-yellow-200 border-yellow-300" },
  { label: "Élevé", cls: "bg-orange-300 border-orange-400" },
  { label: "Très élevé", cls: "bg-red-300 border-red-400" },
  { label: "Pic", cls: "bg-red-600 border-red-700" },
];
</script>

<template>
  <div class="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Saisonnalité</h2>
        <p class="text-xs text-slate-500">
          Heatmap — intensité par mois ({{ metricLabel }})
        </p>
      </div>

      <div class="text-xs text-slate-500">
        min: <span class="font-medium text-slate-700">{{ minV.toLocaleString("fr-FR") }}</span>
        ·
        max: <span class="font-medium text-slate-700">{{ maxV.toLocaleString("fr-FR") }}</span>
      </div>
    </div>

    <!-- Légende -->
    <div class="mt-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-black/5">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p class="text-xs font-medium text-slate-700">Légende</p>
        <p class="text-xs text-slate-500">Faible → Fort</p>
      </div>

      <div class="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-8">
        <div
          v-for="b in legendBins"
          :key="b.label"
          class="flex items-center gap-2 rounded-xl border px-2 py-2 text-[11px] text-slate-700"
          :class="b.cls"
        >
          <span class="h-3 w-3 rounded-md border border-black/10" :class="b.cls"></span>
          <span class="truncate">{{ b.label }}</span>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="mt-5 overflow-auto">
      <div class="min-w-[860px]">
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

          <NuxtLink
  v-for="cell in row.values"
  :key="`${row.year}-${cell.month}`"
  :to="`/month/${row.year}/${cell.month}${props.selectedCategoryId !== 'ALL' ? `?categoryId=${props.selectedCategoryId}` : ''}`"
  class="group relative h-11 rounded-2xl border flex items-center justify-center text-xs font-semibold tracking-tight transition-all duration-150"
  :class="cellClass(cell.value)"
  :title="tooltipText(row.year, cell.month, cell.raw)"
>
  <div
    class="absolute inset-0 rounded-2xl transition-all duration-150
           group-hover:scale-[1.05] group-hover:shadow-xl
           group-hover:ring-2 group-hover:ring-slate-900/30"
  ></div>

  <span class="relative z-10 select-none">
    {{ cell.display }}
  </span>
</NuxtLink>
        </div>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-500">
      Astuce : survole une case pour voir CA / Qté / Prix.
    </p>
  </div>
</template>