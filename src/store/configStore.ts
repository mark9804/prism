import { defineStore } from "pinia";
import { ref, computed } from "vue";

export const useConfigStore = defineStore("config", () => {
  const datasetType = ref<string>("kaist-10");
  const additionalRows = ref<number>(2);
  const additionalColumns = ref<number>(4);

  const getDatasetType = computed(() => datasetType.value);
  const getAdditionalRows = computed(() => additionalRows.value);
  const getAdditionalColumns = computed(() => additionalColumns.value);

  function setDatasetType(type: string) {
    datasetType.value = type;
  }
  function setAdditionalRows(rows: number) {
    additionalRows.value = rows;
  }
  function setAdditionalColumns(columns: number) {
    additionalColumns.value = columns;
  }

  return {
    datasetType,
    additionalRows,
    additionalColumns,
    getDatasetType,
    getAdditionalRows,
    getAdditionalColumns,
    setDatasetType,
    setAdditionalRows,
    setAdditionalColumns,
  };
});
