<script setup>
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Bar } from "vue-chartjs";
import { computed } from "vue";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  pointsYear: { type: Array, required: true },
  pointsRef: { type: Array, required: true },
  yearLabel: { type: [String, Number], required: true },
  refLabel: { type: [String, Number], required: true }
});

const labels = computed(() => props.pointsYear.map((p) => `M${p.mois}`));
const dataYear = computed(() => props.pointsYear.map((p) => Number(p.chiffre_affaires) || 0));
const dataRef = computed(() => props.pointsRef.map((p) => Number(p.chiffre_affaires) || 0));

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: `CA ${props.refLabel} (€)`,
      data: dataRef.value,
      backgroundColor: "rgba(148, 163, 184, 0.7)",
      borderRadius: 4
    },
    {
      label: `CA ${props.yearLabel} (€)`,
      data: dataYear.value,
      backgroundColor: "rgba(15, 23, 42, 0.85)",
      borderRadius: 4
    }
  ]
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    title: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.parsed.y.toLocaleString("fr-FR")} €`
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (v) => `${Number(v).toLocaleString("fr-FR")} €`,
        maxTicksLimit: 6
      }
    }
  }
};
</script>

<template>
  <!-- Desktop : comportement normal -->
  <div class="hidden sm:block h-[420px] w-full">
    <Bar :data="chartData" :options="options" />
  </div>

  <!-- Mobile : scroll horizontal avec largeur fixe par mois -->
  <div class="sm:hidden">
    <!-- Hint de scroll -->
    <div class="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
      Glisse pour voir tous les mois
    </div>

    <!-- Conteneur scrollable -->
    <div class="overflow-x-auto rounded-xl">
      <div
        class="h-[300px]"
        :style="{ width: `${Math.max(labels.length * 64, 320)}px` }"
      >
        <Bar
          :data="chartData"
          :options="{
            ...options,
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              ...options.plugins,
              legend: {
                display: true,
                labels: { boxWidth: 10, font: { size: 10 } }
              }
            },
            scales: {
              y: {
                ticks: {
                  callback: (v) => `${(Number(v)/1000).toLocaleString('fr-FR')}k€`,
                  maxTicksLimit: 5,
                  font: { size: 10 }
                }
              },
              x: {
                ticks: { font: { size: 10 } }
              }
            }
          }"
        />
      </div>
    </div>
  </div>
</template>