<template>
  <div class="grid gap-4 measurement-container">
    <RGBImageProvider :class="{ gridArea: 'rgb-image' }" />
    <MeasurementImageProvider :class="{ gridArea: 'measurement-image' }" />
    <CurveGraphProvider :class="{ gridArea: 'spectral-curve' }" />
  </div>
</template>

<style scoped lang="scss">
.measurement-container {
  grid-template-columns: 1fr 1fr;
  grid-template-rows: auto 1fr 1fr;
  grid-template-areas: "rgb-image measurement-image" "spectral-curve spectral-curve" "spectral-curve spectral-curve";
  place-items: stretch;
}
</style>
