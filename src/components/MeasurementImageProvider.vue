<script setup lang="ts">
import { ref, watch, onMounted, computed } from "vue";
import { matrixStore } from "@/store/matrixStore";
import { HSIUtils } from "@/utils/HSIUtils";
import { IconUpload } from "@arco-design/web-vue/es/icon";

const useMatrixStore = matrixStore();
const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDragging = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Check if we can render measurement (need both GT and mask)
const canRenderMeasurement = computed(() => {
  return useMatrixStore.groundTruthData && useMatrixStore.maskData;
});

// Handle file drop
async function handleDrop(event: DragEvent) {
  event.preventDefault();
  isDragging.value = false;

  const files = event.dataTransfer?.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file) return;

  if (!file.name.endsWith(".mat")) {
    error.value = "Please upload a .mat file";
    return;
  }

  await loadMaskFile(file);
}

// Handle file input
async function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file) return;

  await loadMaskFile(file);
}

// Load mask file
async function loadMaskFile(file: File) {
  isLoading.value = true;
  error.value = null;

  try {
    // Load mask file
    const maskHsiData = await HSIUtils.loadMatFile(file, "mask");

    if (!maskHsiData) {
      error.value = "Failed to load mask file";
      return;
    }

    // Store mask data
    useMatrixStore.maskData = maskHsiData.data as number[][][];

    // Render measurement
    renderMeasurement();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
    // eslint-disable-next-line no-undef
    console.error("Error loading mask file:", err);
  } finally {
    isLoading.value = false;
  }
}

// Render measurement image using mask
function renderMeasurement() {
  if (
    !canvasRef.value ||
    !useMatrixStore.groundTruthData ||
    !useMatrixStore.maskData
  )
    return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const hsiData = useMatrixStore.groundTruthData;
  const maskData = useMatrixStore.maskData;

  // Calculate CASSI measurement using mask
  const measurement = HSIUtils.calculateMeasurement(
    hsiData.data as number[][][],
    maskData
  );

  // Apply grayscale colormap
  const measurementRgb = HSIUtils.applyColorMap(measurement, "hot");
  const imageData = HSIUtils.toImageData(measurementRgb);

  // Set canvas dimensions
  canvas.width = hsiData.width;
  canvas.height = hsiData.height;

  ctx.putImageData(imageData, 0, 0);
}

// Watch for changes
watch(
  [() => useMatrixStore.groundTruthData, () => useMatrixStore.maskData],
  () => {
    if (canRenderMeasurement.value) {
      renderMeasurement();
    }
  }
);

// Drag handlers
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

onMounted(() => {
  if (canRenderMeasurement.value) {
    renderMeasurement();
  }
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="measurement-image-container"
      :class="{
        dragging: isDragging,
        loading: isLoading,
        hasImage: canRenderMeasurement,
        disabled: !useMatrixStore.groundTruthData,
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <canvas v-show="canRenderMeasurement" ref="canvasRef"></canvas>

      <!-- Need GT first -->
      <div
        v-if="!useMatrixStore.groundTruthData && !isLoading"
        class="placeholder disabled-state"
      >
        <p>⚠️</p>
        <p>Upload Ground Truth first</p>
      </div>

      <!-- Need mask -->
      <div
        v-else-if="
          useMatrixStore.groundTruthData &&
          !useMatrixStore.maskData &&
          !isLoading
        "
        class="upload-prompt"
      >
        <div class="upload-icon">
          <icon-upload />
        </div>
        <p>Drag & drop mask.mat here</p>
        <p class="text-sm">or</p>
        <label class="upload-button">
          <input hidden type="file" accept=".mat" @change="handleFileInput" />
          Click to upload
        </label>
      </div>

      <!-- Loading -->
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>Loading mask...</p>
      </div>

      <!-- Error -->
      <div v-if="error" class="error-message">
        {{ error }}
      </div>
    </div>
    <div class="legend">CASSI Measurement</div>
  </div>
</template>

<style scoped lang="scss">
.measurement-image-container {
  width: 310px;
  height: 256px;
  background-color: #f5f5f5;
  border: 2px dashed #d9d9d9;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s;
  cursor: pointer;

  &.disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }

  &.dragging:not(.disabled) {
    border-color: #165dff;
    background-color: #e6f7ff;
  }

  &.hasImage {
    border-style: solid;
    border-color: #52c41a;
    cursor: default;
  }

  canvas {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .placeholder {
    text-align: center;
    color: #8c8c8c;
    padding: 20px;

    &.disabled-state {
      p:first-child {
        font-size: 32px;
        margin-bottom: 8px;
      }
    }
  }

  .upload-prompt {
    text-align: center;
    color: #8c8c8c;

    .upload-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    p {
      margin: 4px 0;
    }

    .upload-button {
      display: inline-block;
      padding: 8px 16px;
      background-color: #165dff;
      color: white;
      border-radius: 4px;
      cursor: pointer;
      margin-top: 8px;
      transition: background-color 0.3s;

      &:hover {
        background-color: #40a6ff;
      }
    }
  }

  .loading-indicator {
    text-align: center;
    color: #165dff;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #165dff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 12px;
    }
  }

  .error-message {
    color: #ff4d4f;
    padding: 12px;
    text-align: center;
  }
}

.legend {
  text-align: center;
  font-size: 14px;
  color: #595959;
  font-weight: 500;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
