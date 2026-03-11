<script setup>
import { computed } from "vue";

const props = defineProps({
  years: { type: Array, required: true },
  months: { type: Array, required: true },
  matrix: { type: Array, required: true },
  metricLabel: { type: String, required: true },
  selectedCategoryId: { type: String, default: "ALL" },
});

const legendBins = [
  { label: "Très faible", hex: "#caf0f8" },
  { label: "Faible", hex: "#ade8f4" },
  { label: "Plutôt faible", hex: "#90e0ef" },
  { label: "Modéré", hex: "#48cae4" },
  { label: "Soutenu", hex: "#00b4d8" },
  { label: "Élevé", hex: "#0096c7" },
  { label: "Très élevé", hex: "#0077b6" },
  { label: "Exceptionnel", hex: "#023e8a" },
  { label: "Pic", hex: "#03045e" },
];

function legendTextClass(hex) {
  return ["#0096c7", "#0077b6", "#023e8a", "#03045e"].includes(hex)
    ? "text-white"
    : "text-slate-900";
}

const palette = [
  { hex: "#caf0f8" }, { hex: "#ade8f4" }, { hex: "#90e0ef" },
  { hex: "#48cae4" }, { hex: "#00b4d8" }, { hex: "#0096c7" },
  { hex: "#0077b6" }, { hex: "#023e8a" }, { hex: "#03045e" },
];

function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

function formatValue(v) { return Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }); }
function formatMoney(v) { return Number(v || 0).toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €"; }
function formatMoney2(v) { return Number(v || 0).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €"; }

const flatValues = computed(() => {
  const arr = [];
  for (const row of props.matrix)
    for (const c of row.values) arr.push(Number(c.value) || 0);
  return arr.length ? arr : [0];
});

const minV = computed(() => Math.min(...flatValues.value));
const maxV = computed(() => Math.max(...flatValues.value));

function binIndex(value) {
  const min = minV.value, max = maxV.value;
  const t = max > min ? (value - min) / (max - min) : 0.5;
  return clamp(Math.floor(clamp(t, 0, 1) * palette.length), 0, palette.length - 1);
}

function cellStyle(value) {
  return {
    backgroundColor: palette[binIndex(value)].hex,
    borderColor: "rgba(15, 23, 42, 0.12)",
  };
}

function textClassForBin(idx) { return idx >= 5 ? "text-white" : "text-slate-900"; }

function tooltipText(year, month, raw) {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}\nCA: ${formatMoney(raw.chiffre_affaires)}\nQté: ${formatValue(raw.quantite)}\nPrix: ${formatMoney2(raw.prix_moyen_pondere)}`;
}

function monthLabel(m) {
  return ["Jan","Fév","Mar","Avr","Mai","Juin","Juil","Aoû","Sep","Oct","Nov","Déc"][m - 1];
}

function monthLabelShort(m) {
  return ["J","F","M","A","M","J","J","A","S","O","N","D"][m - 1];
}
</script>

<template>
  <div class="rounded-3xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">

    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Saisonnalité</h2>
        <p class="text-xs text-slate-500">
          Heatmap — intensité par mois ({{ metricLabel }})
        </p>
      </div>
      <div class="text-xs text-slate-500">
        min : <span class="font-semibold text-slate-700">{{ minV.toLocaleString("fr-FR") }}</span>
        · max : <span class="font-semibold text-slate-700">{{ maxV.toLocaleString("fr-FR") }}</span>
      </div>
    </div>

    <!-- Légende desktop : 9 colonnes -->
    <div class="mt-4 hidden sm:block rounded-3xl bg-slate-50 p-4 ring-1 ring-black/5">
      <div class="flex items-center justify-between mb-3">
        <p class="text-xs font-semibold text-slate-700">Légende</p>
        <p class="text-xs text-slate-500">Faible → Fort</p>
      </div>
      <div class="grid grid-cols-9 gap-2">
        <div
          v-for="b in legendBins" :key="b.hex"
          class="flex items-center justify-center rounded-xl border px-2 py-2 text-[11px] font-semibold"
          :class="legendTextClass(b.hex)"
          :style="{ backgroundColor: b.hex, borderColor: 'rgba(15,23,42,0.12)' }"
        >
          {{ b.label }}
        </div>
      </div>
    </div>

    <!-- Légende mobile : barre dégradé -->
    <div class="mt-4 sm:hidden rounded-2xl bg-slate-50 p-3 ring-1 ring-black/5">
      <div class="flex items-center justify-between mb-2">
        <p class="text-xs font-semibold text-slate-700">Intensité</p>
        <p class="text-xs text-slate-500">Faible → Fort</p>
      </div>
      <div class="h-4 w-full rounded-xl overflow-hidden flex">
        <div
          v-for="b in legendBins" :key="b.hex"
          class="flex-1 h-full"
          :style="{ backgroundColor: b.hex }"
        />
      </div>
      <div class="flex justify-between mt-1">
        <span class="text-[10px] text-slate-400">{{ legendBins[0].label }}</span>
        <span class="text-[10px] text-slate-400">{{ legendBins[legendBins.length - 1].label }}</span>
      </div>
    </div>

    <!-- Hint scroll mobile -->
    <div class="mt-4 sm:hidden flex items-center gap-1.5 text-xs text-slate-400">
      <svg class="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
      Glisse pour voir tous les mois
    </div>

    <!-- HEATMAP desktop -->
    <div class="mt-5 hidden sm:block">
      <div class="grid gap-2 [grid-template-columns:72px_repeat(12,60px)] max-lg:[grid-template-columns:64px_repeat(12,52px)]">
        <div class="text-xs font-medium text-slate-500"></div>
        <div v-for="m in months" :key="m" class="text-center text-xs font-semibold text-slate-500">
          {{ monthLabel(m) }}
        </div>

        <template v-for="row in matrix" :key="row.year">
          <div class="flex items-center text-sm font-semibold text-slate-900">{{ row.year }}</div>
          <NuxtLink
            v-for="cell in row.values"
            :key="`${row.year}-${cell.month}`"
            :to="`/month/${row.year}/${cell.month}${props.selectedCategoryId !== 'ALL' ? `?categoryId=${props.selectedCategoryId}` : ''}`"
            class="group relative h-12 max-lg:h-11 rounded-xl border flex items-center justify-center text-[11px] max-lg:text-[10px] font-semibold tracking-tight transition-all duration-200 ease-out focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
            :class="textClassForBin(binIndex(cell.value))"
            :style="cellStyle(cell.value)"
            :title="tooltipText(row.year, cell.month, cell.raw)"
          >
            <span class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" style="box-shadow:0 10px 25px rgba(2,62,138,0.22);"></span>
            <span class="pointer-events-none absolute -inset-8 rotate-12 opacity-0 transition-opacity duration-200 group-hover:opacity-100" style="background:linear-gradient(90deg,rgba(255,255,255,0),rgba(255,255,255,.35),rgba(255,255,255,0));"></span>
            <span class="relative z-10 select-none">{{ cell.display }}</span>
            <span class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100" style="outline:2px solid rgba(3,4,94,0.25);outline-offset:2px;"></span>
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- HEATMAP mobile : scroll horizontal -->
    <div class="mt-4 sm:hidden overflow-x-auto rounded-xl">
      <!-- Largeur fixe : 44px année + 12 * 44px mois = 572px -->
      <div style="width: 572px;">

        <!-- Header mois -->
        <div class="grid gap-1.5 mb-1" style="grid-template-columns: 44px repeat(12, 44px)">
          <div></div>
          <div
            v-for="m in months" :key="m"
            class="text-center text-[10px] font-semibold text-slate-500"
          >
            {{ monthLabelShort(m) }}
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="row in matrix" :key="row.year"
          class="grid gap-1.5 mb-1.5"
          style="grid-template-columns: 44px repeat(12, 44px)"
        >
          <!-- Année -->
          <div class="flex items-center text-xs font-bold text-slate-700">
            {{ row.year }}
          </div>

          <!-- Cases -->
          <NuxtLink
            v-for="cell in row.values"
            :key="`${row.year}-${cell.month}`"
            :to="`/month/${row.year}/${cell.month}${props.selectedCategoryId !== 'ALL' ? `?categoryId=${props.selectedCategoryId}` : ''}`"
            class="h-10 rounded-lg border flex items-center justify-center text-[9px] font-bold tracking-tight active:scale-95 transition-transform"
            :class="textClassForBin(binIndex(cell.value))"
            :style="cellStyle(cell.value)"
          >
            {{ cell.display }}
          </NuxtLink>
        </div>

      </div>
    </div>

    <p class="mt-4 text-xs text-slate-500 hidden sm:block">
      Survole une case pour voir CA / Qté / Prix — clique pour ouvrir le détail du mois.
    </p>
    <p class="mt-3 text-xs text-slate-500 sm:hidden">
      Appuie sur une case pour ouvrir le détail du mois.
    </p>
  </div>
</template>