<script setup lang="ts">
import { type DataFieldDescriptor } from "@/modules/dataform";

const props = defineProps<DataFieldDescriptor<any>>();

function resetDate() {
  props.builder!.save({ [props.field!]: null });
}
</script>

<template>
  <UIDate
    v-bind="props"
    :invalid="!!props.errorMessage"
    @reset-date="resetDate"
  />
</template>
