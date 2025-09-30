<script setup lang="ts">
import {ref} from "vue"

const message=ref("Test Component")
</script>

<template>
  <div>
    <h2>{{message}}</h2>
  </div>
</template>

<style scoped>
h2{color:blue;}
</style>
