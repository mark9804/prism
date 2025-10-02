<script setup lang="ts">
import { ref, computed } from "vue";
import { configStore } from "@/store/configStore";

const useConfigStore = configStore();

const overallResult = computed(() => {
  return useConfigStore.getOverallResult;
});
</script>

<template></template>

<style scoped lang="scss"></style>
