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
  { label: "Faible",      hex: "#ade8f4" },
  { label: "Plutôt faible", hex: "#90e0ef" },
  { label: "Modéré",     hex: "#48cae4" },
  { label: "Soutenu",    hex: "#00b4d8" },
  { label: "Élevé",      hex: "#0096c7" },
  { label: "Très élevé", hex: "#0077b6" },
  { label: "Exceptionnel", hex: "#023e8a" },
  { label: "Pic",        hex: "#03045e" },
];

const palette = legendBins.map((b) => b.hex);

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
  const idx = binIndex(value);
  return {
    backgroundColor: palette[idx],
    borderColor: "rgba(15, 23, 42, 0.08)",
  };
}

function textClassForBin(idx) { return idx >= 5 ? "text-white" : "text-slate-800"; }
function legendTextClass(hex) {
  return ["#0096c7","#0077b6","#023e8a","#03045e"].includes(hex) ? "text-white" : "text-slate-800";
}

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
        <p class="text-xs text-slate-500 mt-0.5">
          Heatmap · intensité par mois · <span class="font-medium text-slate-600">{{ metricLabel }}</span>
        </p>
      </div>
      <div class="flex items-center gap-2 text-xs text-slate-500">
        <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
          <span class="h-2 w-2 rounded-full" style="background:#caf0f8; border:1px solid rgba(0,0,0,0.1)"></span>
          Min : <span class="font-semibold text-slate-700">{{ minV.toLocaleString("fr-FR") }}</span>
        </span>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1">
          <span class="h-2 w-2 rounded-full" style="background:#03045e"></span>
          Max : <span class="font-semibold text-slate-700">{{ maxV.toLocaleString("fr-FR") }}</span>
        </span>
      </div>
    </div>

    <!-- Légende desktop -->
    <div class="mt-4 hidden sm:block">
      <!-- Barre dégradée continue -->
      <div class="h-2.5 w-full rounded-full overflow-hidden flex mb-2">
        <div v-for="b in legendBins" :key="b.hex" class="flex-1 h-full" :style="{ backgroundColor: b.hex }" />
      </div>
      <!-- Labels sous la barre -->
      <div class="grid grid-cols-9 gap-1">
        <div
          v-for="b in legendBins" :key="b.hex"
          class="flex items-center justify-center rounded-lg border py-1.5 text-[10px] font-semibold cursor-default transition-transform hover:scale-105"
          :class="legendTextClass(b.hex)"
          :style="{ backgroundColor: b.hex, borderColor: 'rgba(15,23,42,0.08)' }"
          :title="b.label"
        >
          {{ b.label }}
        </div>
      </div>
    </div>

    <!-- Légende mobile : barre uniquement -->
    <div class="mt-4 sm:hidden">
      <div class="flex items-center justify-between mb-1.5">
        <span class="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Intensité</span>
        <span class="text-[10px] text-slate-400">Faible → Fort</span>
      </div>
      <div class="h-3 w-full rounded-full overflow-hidden flex ring-1 ring-black/5">
        <div v-for="b in legendBins" :key="b.hex" class="flex-1 h-full" :style="{ backgroundColor: b.hex }" />
      </div>
    </div>

    <!-- Hint scroll mobile -->
    <div class="mt-3 sm:hidden flex items-center gap-1.5 text-[10px] text-slate-400">
      <svg class="w-3 h-3 shrink-0" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
      </svg>
      Glisse horizontalement pour voir tous les mois
    </div>

    <!-- ═══════════════════════════════ HEATMAP DESKTOP ═══════════════════════════════ -->
    <div class="mt-5 hidden sm:block">
      <div class="grid gap-1.5 [grid-template-columns:68px_repeat(12,1fr)]">

        <!-- Header mois -->
        <div></div>
        <div
          v-for="m in months" :key="m"
          class="text-center text-[11px] font-semibold text-slate-400 pb-1"
        >
          {{ monthLabel(m) }}
        </div>

        <!-- Rows années -->
        <template v-for="(row, rowIdx) in matrix" :key="row.year">

          <!-- Label année -->
          <div class="flex items-center">
            <span class="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600 tabular-nums">
              {{ row.year }}
            </span>
          </div>

          <!-- Cellules -->
          <NuxtLink
            v-for="cell in row.values"
            :key="`${row.year}-${cell.month}`"
            :to="`/month/${row.year}/${cell.month}${props.selectedCategoryId !== 'ALL' ? `?categoryId=${props.selectedCategoryId}` : ''}`"
            class="group relative h-11 rounded-xl border flex flex-col items-center justify-center gap-0.5
                   transition-all duration-200 ease-out cursor-pointer
                   focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-900/20"
            :class="textClassForBin(binIndex(cell.value))"
            :style="cellStyle(cell.value)"
            :title="tooltipText(row.year, cell.month, cell.raw)"
          >
            <!-- Valeur : masquée par défaut, visible au hover -->
            <span class="relative z-10 select-none text-[10px] font-bold tracking-tight
                         opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {{ cell.display }}
            </span>

            <!-- Point discret quand pas de hover -->
            <span class="absolute inset-0 flex items-center justify-center
                         opacity-100 group-hover:opacity-0 transition-opacity duration-150">
              <span class="h-1.5 w-1.5 rounded-full"
                    :class="binIndex(cell.value) >= 5 ? 'bg-white/60' : 'bg-slate-900/20'">
              </span>
            </span>

            <!-- Glow au hover -->
            <span
              class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-all duration-200 group-hover:opacity-100 group-hover:scale-[1.08]"
              style="box-shadow: 0 8px 20px rgba(2,62,138,0.25);"
            ></span>

            <!-- Outline hover -->
            <span
              class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style="outline: 2px solid rgba(3,4,94,0.2); outline-offset: 2px;"
            ></span>
          </NuxtLink>
        </template>
      </div>
    </div>

    <!-- ═══════════════════════════════ HEATMAP MOBILE ═══════════════════════════════ -->
    <div class="mt-4 sm:hidden overflow-x-auto -mx-4 px-4">
      <div style="min-width: 560px;">

        <!-- Header mois -->
        <div class="grid gap-1 mb-1.5" style="grid-template-columns: 48px repeat(12, 1fr)">
          <div></div>
          <div
            v-for="m in months" :key="m"
            class="text-center text-[9px] font-bold text-slate-400 uppercase"
          >
            {{ monthLabelShort(m) }}
          </div>
        </div>

        <!-- Rows -->
        <div
          v-for="row in matrix" :key="row.year"
          class="grid gap-1 mb-1"
          style="grid-template-columns: 48px repeat(12, 1fr)"
        >
          <!-- Année pill -->
          <div class="flex items-center">
            <span class="text-[10px] font-bold text-slate-600 bg-slate-100 rounded-md px-1.5 py-0.5 tabular-nums">
              {{ row.year }}
            </span>
          </div>

          <!-- Cases -->
          <NuxtLink
            v-for="cell in row.values"
            :key="`${row.year}-${cell.month}`"
            :to="`/month/${row.year}/${cell.month}${props.selectedCategoryId !== 'ALL' ? `?categoryId=${props.selectedCategoryId}` : ''}`"
            class="h-9 rounded-lg border flex items-center justify-center
                   active:scale-90 transition-transform duration-100"
            :class="textClassForBin(binIndex(cell.value))"
            :style="cellStyle(cell.value)"
          >
            <!-- Point discret, pas de valeur sur mobile (trop petit) -->
            <span class="h-1.5 w-1.5 rounded-full"
                  :class="binIndex(cell.value) >= 5 ? 'bg-white/50' : 'bg-slate-900/15'">
            </span>
          </NuxtLink>
        </div>

      </div>
    </div>

    <!-- Footer -->
    <p class="mt-4 text-[11px] text-slate-400 hidden sm:block">
      Survole une case pour voir la valeur · clique pour ouvrir le détail du mois
    </p>
    <p class="mt-3 text-[11px] text-slate-400 sm:hidden">
      Appuie sur une case pour ouvrir le détail du mois
    </p>
  </div>
</template>