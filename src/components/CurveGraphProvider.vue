<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from "vue";
import { matrixStore } from "@/store/matrixStore";
import { HSIUtils } from "@/utils/HSIUtils";
import { Chart } from "@antv/g2";

const useMatrixStore = matrixStore();
const chartRef = ref<HTMLDivElement | null>(null);
let chart: Chart | null = null;

// Initialize chart
function initChart() {
  if (!chartRef.value) return;

  chart = new Chart({
    container: chartRef.value,
    autoFit: true,
  });

  chart
    .line()
    .encode("x", "wavelength")
    .encode("y", "intensity")
    .encode("color", "type")
    .style("lineWidth", 2)
    .axis("x", {
      title: "Wavelength (nm)",
      titleFontSize: 14,
    })
    .axis("y", {
      title: "Mean Intensity",
      titleFontSize: 14,
    })
    .legend("color", {
      position: "top-right",
    });

  renderSpectralCurve();
}

// Render spectral curve
function renderSpectralCurve() {
  if (!chart || !useMatrixStore.groundTruthData) {
    if (chart) {
      chart.clear();
      chart.render();
    }
    return;
  }

  const hsiData = useMatrixStore.groundTruthData;
  const data = hsiData.data as number[][][];

  // Calculate mean spectrum from center patch
  const centerH = Math.floor(hsiData.height / 2);
  const centerW = Math.floor(hsiData.width / 2);
  const patchSize = 30;

  const spectrum = HSIUtils.calculateMeanSpectrum(
    data,
    centerH,
    centerW,
    patchSize
  );

  // Prepare data for G2
  const chartData = spectrum.map((intensity, index) => ({
    wavelength: hsiData.wavelengths[index],
    intensity: intensity,
    type: "Ground Truth",
  }));

  // Update chart
  chart.clear();
  chart.data(chartData);
  chart.render();
}

// Watch for changes in ground truth data
watch(
  () => useMatrixStore.groundTruthData,
  () => {
    renderSpectralCurve();
  }
);

onMounted(() => {
  initChart();
});

onBeforeUnmount(() => {
  if (chart) {
    chart.destroy();
  }
});
</script>

<template>
  <div class="flex flex-col gap-2" :style="{ gridArea: 'spectral-curve' }">
    <div class="curve-graph-wrapper">
      <div ref="chartRef" class="curve-graph-container"></div>
      <div v-if="!useMatrixStore.groundTruthData" class="placeholder">
        <p>Load a .mat file to view spectral curve</p>
      </div>
    </div>
    <div class="legend">Spectral Signature</div>
  </div>
</template>

<style scoped lang="scss">
.curve-graph-wrapper {
  min-width: 512px;
  min-height: 300px;
  background-color: #ffffff;
  border: 2px solid #d9d9d9;
  border-radius: 4px;
  position: relative;

  .curve-graph-container {
    width: 100%;
    height: 100%;
    min-height: 300px;
  }

  .placeholder {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #8c8c8c;
  }
}

.legend {
  text-align: center;
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}
</style>
