<script setup lang="ts">
import type { DataFieldDescriptor } from "@/modules/dataform";

const props = defineProps<DataFieldDescriptor<any>>();
</script>

<template>
  <UIInput
    :invalid="!!props.errorMessage"
    password
    :props="{ toggleMask: true, ...props.props }"
  />
</template>

<style scoped lang="scss">
:deep(.p-icon) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
}
</style>
