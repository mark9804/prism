import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { HSITemplate } from "@/types/HSITypes";

/**
 * HSI Template Store
 * Manages hyperspectral image templates with different band configurations
 */
export const hsiTemplateStore = defineStore(
  "hsiTemplate",
  () => {
    // Template definitions for different HSI datasets
    const templates = ref<HSITemplate[]>([
      {
        name: "KAIST/CASSI-28",
        bands: 28,
        wavelengthStart: 450,
        wavelengthEnd: 650,
        rgbBands: [23, 14, 3], // Red, Green, Blue band indices
        defaultFieldName: "img",
      },
      {
        name: "CAVE-31",
        bands: 31,
        wavelengthStart: 400,
        wavelengthEnd: 700,
        rgbBands: [27, 16, 4],
        defaultFieldName: "img",
      },
    ]);

    // Current selected template
    const currentTemplate = ref<HSITemplate>(templates.value[0]!);

    // Computed getters
    const getCurrentTemplate = computed(() => currentTemplate.value);
    const getTemplates = computed(() => templates.value);

    const getBandCount = computed(() => currentTemplate.value.bands);
    const getWavelengthRange = computed(() => [
      currentTemplate.value.wavelengthStart,
      currentTemplate.value.wavelengthEnd,
    ]);
    const getRgbBands = computed(() => currentTemplate.value.rgbBands);

    // Actions
    function setTemplateByName(name: string): boolean {
      const template = templates.value.find((t) => t.name === name);
      if (template) {
        currentTemplate.value = template;
        return true;
      }
      return false;
    }

    function setTemplateByBands(bands: number): boolean {
      const template = templates.value.find((t) => t.bands === bands);
      if (template) {
        currentTemplate.value = template;
        return true;
      }
      return false;
    }

    function addTemplate(template: HSITemplate) {
      templates.value.push(template);
    }

    return {
      templates,
      currentTemplate,
      getCurrentTemplate,
      getTemplates,
      getBandCount,
      getWavelengthRange,
      getRgbBands,
      setTemplateByName,
      setTemplateByBands,
      addTemplate,
    };
  },
  {
    persist: true,
  }
);
