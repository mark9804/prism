import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const matrixStore = defineStore("matrix", () => {
  const gt_matrix = ref<number[][]>([]);

  return {
    gt_matrix,
  };
});
