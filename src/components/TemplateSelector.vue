<script setup lang="ts">
import { ref, computed } from "vue";
import type { DatasetType } from "@/types/DatasetType";
import { useConfigStore } from "@/store/configStore";

const configStore = useConfigStore();

const datasetTypes = ref<DatasetType[]>([
  {
    label: "KAIST-10",
    value: "kaist-10",
  },
]);

const selectedDatasetType = computed({
  get: () => configStore.getDatasetType,
  set: (value: string) => configStore.setDatasetType(value),
});

const additionalRows = computed({
  get: () => configStore.getAdditionalRows,
  set: (value: number) => configStore.setAdditionalRows(value),
});

const additionalColumns = computed({
  get: () => configStore.getAdditionalColumns,
  set: (value: number) => configStore.setAdditionalColumns(value),
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
