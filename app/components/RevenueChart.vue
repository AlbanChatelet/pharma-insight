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
    { label: `CA ${props.refLabel} (€)`, data: dataRef.value },
    { label: `CA ${props.yearLabel} (€)`, data: dataYear.value }
  ]
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    title: { display: true, text: "CA mensuel (comparaison)" },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.parsed.y.toLocaleString("fr-FR")} €`
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (v) => `${Number(v).toLocaleString("fr-FR")} €`
      }
    }
  }
};
</script>

<template>
  <div class="h-[420px] w-full">
    <Bar :data="chartData" :options="options" />
  </div>
</template>