<script setup lang="ts">
import { type DataFieldDescriptor } from "@/modules/dataform";

const props = defineProps<DataFieldDescriptor<any>>();
</script>

<template>
  <UISelect
    v-bind="props"
    :invalid="!!props.errorMessage"
    :multiple="props.builder?.form.isMultiSelectionType(props)"
  />
</template>
