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
  points: { type: Array, required: true }, // [{year, month, chiffre_affaires, quantite, prix_moyen_pondere}]
  metric: { type: String, required: true }, // "chiffre_affaires" | "quantite" | "prix_moyen_pondere"
  title: { type: String, default: "Évolution" },
});

const labels = computed(() =>
  props.points.map((p) => `${p.year}-${String(p.month).padStart(2, "0")}`)
);

const series = computed(() => props.points.map((p) => Number(p[props.metric]) || 0));

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label:
        props.metric === "chiffre_affaires"
          ? "Chiffre d’affaires (€)"
          : props.metric === "quantite"
          ? "Quantités"
          : "Prix moyen pondéré (€)",
      data: series.value,
      tension: 0.25,
      pointRadius: 0,
      pointHoverRadius: 4,
    },
  ],
}));

const options = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    title: { display: true, text: props.title },
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
        callback: (v) => {
          if (props.metric === "chiffre_affaires") return `${Number(v).toLocaleString("fr-FR")} €`;
          if (props.metric === "prix_moyen_pondere") return `${Number(v).toLocaleString("fr-FR")} €`;
          return Number(v).toLocaleString("fr-FR");
        },
      },
    },
  },
}));
</script>

<template>
  <div class="h-[440px] w-full">
    <Line :data="chartData" :options="options" />
  </div>
</template>