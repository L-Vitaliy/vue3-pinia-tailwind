<script setup lang="ts">
import Checkbox from "primevue/checkbox";
import { toRefs } from "vue";
import type { DataFieldDescriptor } from "@/modules/dataform";

const props = defineProps<DataFieldDescriptor<any>>();

const { props: inputProps } = toRefs(props);

const modelValue = defineModel();

const emit = defineEmits(["change"]);
</script>

<template>
  <Checkbox
    binary
    v-bind="inputProps"
    v-model="modelValue"
    @update:model-value="
      (value: boolean) => {
        emit('change', value);
      }
    "
  />
</template>

<style scoped lang="scss"></style>
