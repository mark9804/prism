<script setup lang="ts">
import { ref, computed } from "vue";
import type { DatasetType } from "@/types/DatasetType";
import { configStore } from "@/store/configStore";

const useConfigStore = configStore();

const datasetTypes = ref<DatasetType[]>([
  {
    label: "KAIST-10",
    value: "kaist-10",
  },
]);

const selectedDatasetType = computed({
  get: () => useConfigStore.getDatasetType,
  set: (value: string) => useConfigStore.setDatasetType(value),
});

const additionalRows = computed({
  get: () => useConfigStore.getAdditionalRows,
  set: (value: number) => useConfigStore.setAdditionalRows(value),
});

const additionalColumns = computed({
  get: () => useConfigStore.getAdditionalColumns,
  set: (value: number) => useConfigStore.setAdditionalColumns(value),
});
</script>

<template>
  <a-space>
    <template #split>
      <a-divider direction="vertical" />
    </template>
    <a-select v-model="selectedDatasetType" :options="datasetTypes">
      <template #prefix> Data Format </template>
    </a-select>
    <a-input-number
      v-model="additionalRows"
      :min="0"
      :max="10"
      :style="{ width: '8rem' }"
    >
      <template #prefix> Rows </template>
    </a-input-number>
    <a-input-number
      v-model="additionalColumns"
      :min="0"
      :max="10"
      :style="{ width: '8rem' }"
    >
      <template #prefix> Columns </template>
    </a-input-number>
  </a-space>
</template>

<style scoped lang="scss"></style>
