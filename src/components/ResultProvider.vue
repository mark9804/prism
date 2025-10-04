<script setup lang="ts"></script>

<template>
  <div class="result-provider">
    <MeasurementContainer />
    <ComparationProvider />
  </div>
</template>

<style scoped lang="scss">
.result-provider {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 20px;
  width: 100%;
}
</style>
