<script setup>
import { computed } from "vue";

const props = defineProps({
  years: { type: Array, required: true },
  months: { type: Array, required: true },
  matrix: { type: Array, required: true }, // [{year, values:[{month,value,display,raw}]}]
  metricLabel: { type: String, required: true },
  selectedCategoryId: { type: String, default: "ALL" }, // pour le drilldown
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

// Palette (clair -> foncé)
const palette = [
  { name: "Light Cyan", hex: "#caf0f8" },
  { name: "Frosted Blue", hex: "#ade8f4" },
  { name: "Frosted Blue", hex: "#90e0ef" },
  { name: "Sky Aqua", hex: "#48cae4" },
  { name: "Turquoise Surf", hex: "#00b4d8" },
  { name: "Blue Green", hex: "#0096c7" },
  { name: "Bright Teal Blue", hex: "#0077b6" },
  { name: "French Blue", hex: "#023e8a" },
  { name: "Deep Twilight", hex: "#03045e" },
];

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
  return Number(v || 0).toLocaleString("fr-FR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + " €";
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

function binIndex(value) {
  const x = intensity(value);
  const idx = Math.floor(x * palette.length);
  return clamp(idx, 0, palette.length - 1);
}

function cellStyle(value) {
  const idx = binIndex(value);
  const hex = palette[idx].hex;
  return {
    backgroundColor: hex,
    borderColor: "rgba(15, 23, 42, 0.12)",
  };
}

function textClassForBin(idx) {
  return idx >= 5 ? "text-white" : "text-slate-900";
}

function tooltipText(year, month, raw) {
  const m = String(month).padStart(2, "0");
  return `${year}-${m}
CA: ${formatMoney(raw.chiffre_affaires)}
Qté: ${formatValue(raw.quantite)}
Prix: ${formatMoney2(raw.prix_moyen_pondere)}`;
}

function monthLabel(m) {
  return ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc"][m - 1];
}
</script>

<template>
  <div class="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5">
    <!-- Header -->
    <div class="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h2 class="text-base font-semibold text-slate-900">Saisonnalité</h2>
        <p class="text-xs text-slate-500">
          Heatmap — intensité par mois ({{ metricLabel }})
        </p>
      </div>

      <div class="text-xs text-slate-500">
        min:
        <span class="font-semibold text-slate-700">{{ minV.toLocaleString("fr-FR") }}</span>
        · max:
        <span class="font-semibold text-slate-700">{{ maxV.toLocaleString("fr-FR") }}</span>
      </div>
    </div>

    <!-- Légende -->
    <div class="mt-4 rounded-3xl bg-slate-50 p-4 ring-1 ring-black/5">
      <div class="flex items-center justify-between">
        <p class="text-xs font-semibold text-slate-700">Légende</p>
        <p class="text-xs text-slate-500">Faible → Fort</p>
      </div>

      <div class="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-9">
        <div
          v-for="b in legendBins"
          :key="b.hex"
          class="flex items-center justify-center gap-2 rounded-xl border px-2 py-2 text-[11px] font-semibold"
          :class="legendTextClass(b.hex)"
          :style="{ backgroundColor: b.hex, borderColor: 'rgba(15, 23, 42, 0.12)' }"
          :title="b.label"
        >
          
          <span class="truncate">{{ b.label }}</span>
        </div>
      </div>
    </div>

    <!-- Table (fixe, sans scroll) -->
    <div class="mt-5">
      <!-- Desktop : cases 60px / Mobile : cases 52px -->
      <div class="grid gap-2 [grid-template-columns:72px_repeat(12,60px)] max-lg:[grid-template-columns:64px_repeat(12,52px)]">
        <!-- header mois -->
        <div class="text-xs font-medium text-slate-500"></div>
        <div
          v-for="m in months"
          :key="m"
          class="text-center text-xs font-semibold text-slate-500"
        >
          {{ monthLabel(m) }}
        </div>

        <!-- rows -->
        <template v-for="row in matrix" :key="row.year">
          <div class="flex items-center text-sm font-semibold text-slate-900">
            {{ row.year }}
          </div>

          <NuxtLink
            v-for="cell in row.values"
            :key="`${row.year}-${cell.month}`"
            :to="`/month/${row.year}/${cell.month}${props.selectedCategoryId !== 'ALL' ? `?categoryId=${props.selectedCategoryId}` : ''}`"
            class="group relative h-12 max-lg:h-11 rounded-xl border
                   flex items-center justify-center text-[11px] max-lg:text-[10px]
                   font-semibold tracking-tight
                   transition-all duration-200 ease-out
                   focus:outline-none focus-visible:ring-4 focus-visible:ring-slate-900/15"
            :class="textClassForBin(binIndex(cell.value))"
            :style="cellStyle(cell.value)"
            :title="tooltipText(row.year, cell.month, cell.raw)"
          >
            <!-- glow -->
            <span
              class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style="box-shadow: 0 10px 25px rgba(2,62,138,0.22);"
            ></span>

            <!-- sheen -->
            <span
              class="pointer-events-none absolute -inset-8 rotate-12 opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style="background: linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.35), rgba(255,255,255,0));"
            ></span>

            <span class="relative z-10 select-none">
              {{ cell.display }}
            </span>

            <span
              class="pointer-events-none absolute inset-0 rounded-xl transition-transform duration-200 ease-out group-hover:scale-[1.06]"
            ></span>

            <span
              class="pointer-events-none absolute inset-0 rounded-xl opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style="outline: 2px solid rgba(3,4,94,0.25); outline-offset: 2px;"
            ></span>
          </NuxtLink>
        </template>
      </div>
    </div>

    <p class="mt-4 text-xs text-slate-500">
      Survole une case pour voir CA / Qté / Prix — clique pour ouvrir le détail du mois.
    </p>
  </div>
</template>