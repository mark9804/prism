<script setup lang="ts">
import { useConfigStore } from "@/store/configStore";

const configStore = useConfigStore();

const overallResult = computed(() => {
  return configStore.getOverallResult;
});
</script>

<template></template>

<style scoped lang="scss"></style>
