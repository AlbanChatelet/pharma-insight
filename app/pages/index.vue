<script setup>
import { ref, computed, onMounted } from "vue";

const config = useRuntimeConfig();

const selectedYear = ref(null);
const years = ref([]);
const categories = ref([]);
const selectedCategoryId = ref("ALL");
const pointsYear = ref([]);
const pointsRef = ref([]);
const compare = ref(null);
const loading = ref(true);
const errorMsg = ref("");

const direction = ref("");
const animating = ref(false);

const selectedIndex = computed(() => years.value.indexOf(selectedYear.value));
const prevYear = computed(() => selectedIndex.value > 0 ? years.value[selectedIndex.value - 1] : null);
const nextYear = computed(() => selectedIndex.value < years.value.length - 1 ? years.value[selectedIndex.value + 1] : null);

const categoryIdParam = computed(() =>
  selectedCategoryId.value === "ALL" ? "" : `&categoryId=${selectedCategoryId.value}`
);

const selectedCategoryLabel = computed(() => {
  if (selectedCategoryId.value === "ALL") return "Toutes catégories";
  const c = categories.value.find((x) => x.id_categorie === selectedCategoryId.value);
  return c?.nom ?? "Catégorie";
});

function refYearFor(y) {
  const idx = years.value.indexOf(y);
  return idx > 0 ? years.value[idx - 1] : null;
}

async function goToYear(newYear, dir) {
  if (!newYear || animating.value) return;
  direction.value = dir;
  animating.value = true;
  await new Promise((r) => setTimeout(r, 260));
  selectedYear.value = newYear;
  direction.value = "";
  await new Promise((r) => setTimeout(r, 20));
  animating.value = false;
  await loadAll();
}

function goPrev() { goToYear(prevYear.value, "right"); }
function goNext() { goToYear(nextYear.value, "left"); }

let touchStartX = 0;
function onTouchStart(e) { touchStartX = e.touches[0].clientX; }
function onTouchEnd(e) {
  const diff = touchStartX - e.changedTouches[0].clientX;
  if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
}

function onCategoryChange(newId) {
  selectedCategoryId.value = newId;
  loadAll();
}

onMounted(async () => {
  try {
    const [yearsRes, catsRes] = await Promise.all([
      fetch(`${config.public.apiBase}/meta/years`),
      fetch(`${config.public.apiBase}/meta/categories`)
    ]);
    years.value = (await yearsRes.json()).years || [];
    categories.value = (await catsRes.json()).categories || [];
    selectedYear.value = years.value.at(-1) ?? null;
    await loadAll();
  } catch {
    errorMsg.value = "Impossible de charger les données de base (API).";
  } finally {
    loading.value = false;
  }
});

async function loadAll() {
  if (!selectedYear.value) return;
  const refY = refYearFor(selectedYear.value);
  loading.value = true;
  errorMsg.value = "";
  try {
    const tsYearUrl = `${config.public.apiBase}/timeseries/revenue?year=${selectedYear.value}${categoryIdParam.value}`;
    const tsRefUrl = refY ? `${config.public.apiBase}/timeseries/revenue?year=${refY}${categoryIdParam.value}` : null;
    const cmpUrl = refY ? `${config.public.apiBase}/compare/yearly?year=${selectedYear.value}&ref=${refY}${categoryIdParam.value}` : null;

    const [tsYearRes, tsRefRes, cmpRes] = await Promise.all([
      fetch(tsYearUrl),
      tsRefUrl ? fetch(tsRefUrl) : Promise.resolve(null),
      cmpUrl ? fetch(cmpUrl) : Promise.resolve(null)
    ]);

    pointsYear.value = (await tsYearRes.json()).points || [];
    pointsRef.value = tsRefRes ? (await tsRefRes.json()).points || [] : [];
    compare.value = cmpRes ? await cmpRes.json() : null;
  } catch {
    errorMsg.value = "Impossible de charger les données du dashboard.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div style="min-height: 100vh; background: #f8fafc;">

    <!-- ══════════ YEAR PICKER ══════════ -->
    <div class="mx-auto max-w-6xl px-4 sm:px-6 pt-6 sm:pt-10">
      <div class="mb-8 sm:mb-10 select-none" @touchstart="onTouchStart" @touchend="onTouchEnd">

        <p class="hidden sm:block text-xs font-semibold uppercase tracking-widest text-slate-400 mb-6 text-center">
          Dashboard · PharmaInsight
        </p>

        <div class="relative flex items-center justify-center">

          <!-- Flèche gauche -->
          <button
            @click="goPrev" :disabled="!prevYear"
            class="group relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full
                   bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200
                   hover:shadow-md hover:ring-black/10 active:scale-95
                   disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <svg class="h-4 w-4 text-slate-600 transition-transform duration-200 group-hover:-translate-x-0.5"
                 fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
            </svg>
          </button>

          <!-- Années -->
          <div class="flex items-center justify-center gap-3 sm:gap-6 mx-3 sm:mx-6 w-full max-w-xs sm:max-w-md">

            <button v-if="prevYear" @click="goPrev"
              class="shrink-0 text-2xl sm:text-4xl font-black text-slate-200 hover:text-slate-300
                     transition-all duration-200 hover:scale-110 active:scale-95 tabular-nums cursor-pointer">
              {{ prevYear }}
            </button>
            <div v-else class="shrink-0 w-12 sm:w-20" />

            <div class="relative flex flex-col items-center flex-1">
              <div class="overflow-hidden">
                <div
                  :key="selectedYear"
                  class="tabular-nums font-black text-slate-900 text-5xl sm:text-7xl lg:text-8xl tracking-tight leading-none"
                  :class="{
                    'animate-slide-in-left': direction === '' && !animating,
                    'animate-slide-out-left': animating && direction === 'left',
                    'animate-slide-out-right': animating && direction === 'right',
                  }"
                >
                  {{ selectedYear }}
                </div>
              </div>
              <!-- Dots -->
              <div class="mt-3 flex items-center gap-1.5">
                <button
                  v-for="y in years" :key="y"
                  @click="goToYear(y, years.indexOf(y) > selectedIndex ? 'left' : 'right')"
                  class="rounded-full transition-all duration-300"
                  :class="y === selectedYear ? 'w-5 h-2 bg-slate-900' : 'w-2 h-2 bg-slate-300 hover:bg-slate-400'"
                />
              </div>
            </div>

            <button v-if="nextYear" @click="goNext"
              class="shrink-0 text-2xl sm:text-4xl font-black text-slate-200 hover:text-slate-300
                     transition-all duration-200 hover:scale-110 active:scale-95 tabular-nums cursor-pointer">
              {{ nextYear }}
            </button>
            <div v-else class="shrink-0 w-12 sm:w-20" />

          </div>

          <!-- Flèche droite -->
          <button
            @click="goNext" :disabled="!nextYear"
            class="group relative z-10 flex h-10 w-10 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-full
                   bg-white shadow-sm ring-1 ring-black/5 transition-all duration-200
                   hover:shadow-md hover:ring-black/10 active:scale-95
                   disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <svg class="h-4 w-4 text-slate-600 transition-transform duration-200 group-hover:translate-x-0.5"
                 fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7 7-7"/>
            </svg>
          </button>

        </div>

        <p class="mt-3 text-center text-[10px] text-slate-300 sm:hidden tracking-wide">
          ← Glisse pour changer d'année →
        </p>
      </div>
    </div>

    <!-- ══════════ CATEGORY PICKER — complètement hors du max-w ══════════ -->
    <div style="
      width: 100%;
      padding: 2.5rem 0 3rem;
      position: relative;
      z-index: 10;
      overflow: visible;
    ">
      <CategoryPicker
        :categories="categories"
        :model-value="selectedCategoryId"
        @update:model-value="onCategoryChange"
      />
    </div>

    <!-- ══════════ CONTENU PRINCIPAL ══════════ -->
    <div class="mx-auto max-w-6xl px-4 sm:px-6 pb-10">

      <!-- Titre -->
      <div class="mb-6 sm:mb-8">
        <h1 class="text-lg sm:text-xl font-semibold tracking-tight text-slate-900">PharmaInsight</h1>
        <p class="mt-0.5 text-sm text-slate-500">
          Outil interne ACAT — {{ selectedCategoryLabel }} · {{ selectedYear }}
        </p>
      </div>

      <!-- Erreur -->
      <div v-if="errorMsg" class="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {{ errorMsg }}
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center gap-2 text-sm text-slate-400 py-16">
        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        Chargement de {{ selectedYear }}…
      </div>

      <template v-else>

        <KpiCards
          v-if="compare"
          :year-kpis="compare.year"
          :ref-kpis="compare.ref"
          :delta="compare.delta"
          :year-label="compare.scope.year"
          :ref-label="compare.scope.ref"
        />

        <section class="mt-6 rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-black/5">
          <div class="mb-4 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 class="text-base font-semibold text-slate-900">Chiffre d'affaires mensuel</h2>
              <p class="text-xs text-slate-500">
                {{ selectedCategoryLabel }} — comparaison avec l'année précédente
              </p>
            </div>
            <p class="text-xs text-slate-400">Source : données fictives (CSV)</p>
          </div>

          <RevenueChart
            v-if="pointsYear.length && pointsRef.length"
            :points-year="pointsYear"
            :points-ref="pointsRef"
            :year-label="selectedYear"
            :ref-label="years[years.indexOf(selectedYear) - 1]"
          />

          <p v-else class="text-sm text-slate-500">
            Sélectionne une année qui possède une année précédente pour activer la comparaison.
          </p>
        </section>

      </template>
    </div>

  </div>
</template>

<style scoped>
@keyframes slideInLeft  { from { opacity:0; transform:translateX(40px);  } to { opacity:1; transform:translateX(0); } }
@keyframes slideInRight { from { opacity:0; transform:translateX(-40px); } to { opacity:1; transform:translateX(0); } }
@keyframes slideOutLeft  { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(-40px);  } }
@keyframes slideOutRight { from { opacity:1; transform:translateX(0); } to { opacity:0; transform:translateX(40px); } }

.animate-slide-in-left   { animation: slideInLeft   0.25s cubic-bezier(0.22,1,0.36,1) both; }
.animate-slide-in-right  { animation: slideInRight  0.25s cubic-bezier(0.22,1,0.36,1) both; }
.animate-slide-out-left  { animation: slideOutLeft  0.22s ease-in both; }
.animate-slide-out-right { animation: slideOutRight 0.22s ease-in both; }
</style>