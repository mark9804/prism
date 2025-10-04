import { defineStore } from "pinia";
import { ref } from "vue";
import type { HSIData } from "@/types/HSITypes";

/**
 * Matrix Store - stores HSI data (NOT persisted for performance)
 * Handles ground truth, mask, and reconstructed HSI data
 */
export const matrixStore = defineStore("matrix", () => {
  // Ground truth HSI data (loaded from .mat file)
  const groundTruthData = ref<HSIData | null>(null);

  // Mask data for CASSI measurement (loaded from mask.mat)
  const maskData = ref<number[][][] | null>(null);

  // Reconstructed HSI data (from models)
  const reconstructedData = ref<HSIData | null>(null);

  // Clear all data
  function clearData() {
    groundTruthData.value = null;
    maskData.value = null;
    reconstructedData.value = null;
  }

  return {
    groundTruthData,
    maskData,
    reconstructedData,
    clearData,
  };
});
