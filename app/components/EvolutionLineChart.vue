<script setup>
import { computed } from "vue";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from "chart.js";
import { Line } from "vue-chartjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const props = defineProps({
  points: { type: Array, required: true },
  metric: { type: String, required: true },
  title: { type: String, default: "Évolution" },
});

const labels = computed(() =>
  props.points.map((p) => `${p.year}-${String(p.month).padStart(2, "0")}`)
);

const series = computed(() => props.points.map((p) => Number(p[props.metric]) || 0));

const datasetLabel = computed(() => {
  if (props.metric === "chiffre_affaires") return "Chiffre d'affaires (€)";
  if (props.metric === "quantite") return "Quantités";
  return "Prix moyen pondéré (€)";
});

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: datasetLabel.value,
      data: series.value,
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
  ],
}));

function buildOptions(isMobile = false) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: isMobile ? { boxWidth: 10, font: { size: 10 } } : undefined,
      },
      title: { display: false },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            const v = ctx.parsed.y;
            if (props.metric === "chiffre_affaires") return `${v.toLocaleString("fr-FR")} €`;
            if (props.metric === "prix_moyen_pondere")
              return `${v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
            return v.toLocaleString("fr-FR");
          },
        },
      },
    },
    interaction: { mode: "index", intersect: false },
    scales: {
      y: {
        ticks: {
          font: isMobile ? { size: 10 } : undefined,
          maxTicksLimit: isMobile ? 5 : undefined,
          callback: (v) => {
            if (isMobile) {
              if (props.metric === "chiffre_affaires") return `${(Number(v) / 1000).toLocaleString("fr-FR")}k€`;
              if (props.metric === "prix_moyen_pondere") return `${Number(v).toLocaleString("fr-FR")}€`;
              return Number(v).toLocaleString("fr-FR");
            }
            if (props.metric === "chiffre_affaires") return `${Number(v).toLocaleString("fr-FR")} €`;
            if (props.metric === "prix_moyen_pondere") return `${Number(v).toLocaleString("fr-FR")} €`;
            return Number(v).toLocaleString("fr-FR");
          },
        },
      },
      x: {
        ticks: isMobile ? { font: { size: 10 }, maxRotation: 45 } : undefined,
      },
    },
  };
}

const optionsDesktop = computed(() => buildOptions(false));
const optionsMobile = computed(() => buildOptions(true));

// Largeur mobile : 48px par point, min 320px
const mobileWidth = computed(() => Math.max(props.points.length * 48, 320));
</script>

<template>
  <!-- Desktop -->
  <div class="hidden sm:block h-[440px] w-full">
    <Line :data="chartData" :options="optionsDesktop" />
  </div>

  <!-- Mobile : scroll horizontal -->
  <div class="sm:hidden">
    <div class="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
      </svg>
      Glisse pour voir toute la période
    </div>
    <div class="overflow-x-auto rounded-xl">
      <div class="h-[280px]" :style="{ width: `${mobileWidth}px` }">
        <Line :data="chartData" :options="optionsMobile" />
      </div>
    </div>
  </div>
</template>