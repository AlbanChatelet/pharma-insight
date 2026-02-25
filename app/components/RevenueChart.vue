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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const props = defineProps({
  points: {
    type: Array,
    required: true
  }
});

const labels = computed(() =>
  props.points.map((p) => `M${p.mois}`)
);

const dataset = computed(() =>
  props.points.map((p) => Number(p.chiffre_affaires) || 0)
);

const chartData = computed(() => ({
  labels: labels.value,
  datasets: [
    {
      label: "Chiffre d'affaires (€)",
      data: dataset.value
    }
  ]
}));

const options = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: true },
    title: { display: true, text: "CA mensuel" },
    tooltip: {
      callbacks: {
        label: (ctx) => `${ctx.parsed.y.toLocaleString()} €`
      }
    }
  },
  scales: {
    y: {
      ticks: {
        callback: (v) => `${Number(v).toLocaleString()} €`
      }
    }
  }
};
</script>

<template>
  <div class="chart-wrap">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<style scoped>
.chart-wrap {
  height: 360px;
  width: 100%;
}
</style>