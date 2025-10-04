<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { matrixStore } from "@/store/matrixStore";
import { hsiTemplateStore } from "@/store/HSITemplateStore";
import { HSIUtils } from "@/utils/HSIUtils";
import { IconUpload, IconLoading } from "@arco-design/web-vue/es/icon";
import { Message } from "@arco-design/web-vue";

const useMatrixStore = matrixStore();
const useTemplateStore = hsiTemplateStore();

const canvasRef = ref<HTMLCanvasElement | null>(null);
const isDragging = ref(false);
const isLoading = ref(false);
const error = ref<string | null>(null);

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

  await loadMatFile(file);
}

// Handle file input
async function handleFileInput(event: Event) {
  const input = event.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  const file = files[0];
  if (!file) return;

  await loadMatFile(file);
}

// Load and process .mat file
async function loadMatFile(file: File) {
  isLoading.value = true;
  error.value = null;

  try {
    // Load mat file using HSIUtils
    const hsiData = await HSIUtils.loadMatFile(file);

    if (!hsiData) {
      error.value = "Failed to load .mat file";
      return;
    }

    // Auto-detect template based on band count
    useTemplateStore.setTemplateByBands(hsiData.bands);

    // Update wavelengths based on selected template
    const wlRange = useTemplateStore.getWavelengthRange;
    const startWl = wlRange[0]!;
    const endWl = wlRange[1]!;
    hsiData.wavelengths = HSIUtils.generateWavelengths(
      hsiData.bands,
      startWl,
      endWl
    );

    // Store in matrix store
    useMatrixStore.groundTruthData = hsiData;

    // Render RGB image
    renderRGBImage();
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Unknown error";
    Message.error(error.value || "Unknown error");
    // eslint-disable-next-line no-undef
    console.error("Error loading mat file:", err);
  } finally {
    isLoading.value = false;
  }
}

// Render RGB image on canvas
function renderRGBImage() {
  if (!canvasRef.value || !useMatrixStore.groundTruthData) return;

  const canvas = canvasRef.value;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const hsiData = useMatrixStore.groundTruthData;
  const rgbBands = useTemplateStore.getRgbBands;

  // Convert HSI to RGB
  const rgbImage = HSIUtils.hsiToRgb(hsiData.data as number[][][], rgbBands);

  // Convert to ImageData and draw
  const imageData = HSIUtils.toImageData(rgbImage);

  // Resize canvas to match image dimensions
  canvas.width = hsiData.width;
  canvas.height = hsiData.height;

  ctx.putImageData(imageData, 0, 0);
}

// Watch for changes in ground truth data
watch(
  () => useMatrixStore.groundTruthData,
  () => {
    renderRGBImage();
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
  // Render if data already exists
  if (useMatrixStore.groundTruthData) {
    renderRGBImage();
  }
});
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      class="rgb-image-container"
      :class="{
        dragging: isDragging,
        loading: isLoading,
        hasImage: useMatrixStore.groundTruthData,
      }"
      @drop="handleDrop"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
    >
      <canvas v-show="useMatrixStore.groundTruthData" ref="canvasRef"></canvas>

      <div
        v-if="!useMatrixStore.groundTruthData && !isLoading"
        class="upload-prompt color-gray-400"
      >
        <icon-upload :size="32" />
        <p>Drag & drop .mat file here</p>
        <p class="text-sm">or</p>
        <label class="upload-button">
          <input hidden type="file" accept=".mat" @change="handleFileInput" />
          Click to upload
        </label>
      </div>

      <div v-if="isLoading" class="loading-indicator">
        <icon-loading :size="32" />
        <p>Loading...</p>
      </div>
    </div>
    <div class="legend">Ground Truth RGB</div>
  </div>
</template>

<style scoped lang="scss">
.rgb-image-container {
  width: 256px;
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

  &.dragging {
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

  .upload-prompt {
    text-align: center;

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
