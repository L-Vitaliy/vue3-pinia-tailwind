<script setup lang="ts">
import { ref } from "vue";
import { type DataFieldDescriptor } from "@/modules/dataform";
import {
  UI_SELECTION_LABEL,
  UI_SELECTION_VALUE,
} from "@/app/data/app_config/constants/uiSettings";

const props = defineProps<DataFieldDescriptor<any> & { modelValue: any }>();

const emit = defineEmits<{
  "update:modelValue": [any];
}>();

const options = ref<{ [UI_SELECTION_VALUE]: any; [UI_SELECTION_LABEL]: any }[]>(
  [],
);

const valueMap = new Map();

if (props.selection) {
  load();
}

async function load() {
  const builder = props.builder;
  const field = props.field;

  if (!builder || !field) return;

  await builder.form.awaitSelectionSource(field).then(() => {
    setTimeout(() => {
      const values = builder.form.getSelectionRecords(field) ?? {};

      for (const key in values) {
        const value = props.numeric ? parseFloat(key) : key;
        const label = values[key];

        options.value.push({
          [UI_SELECTION_VALUE]: value,
          [UI_SELECTION_LABEL]: label,
        });

        valueMap.set(value, label);
      }
    });
  });
}
</script>

<template>
  <div class="flex flex-wrap gap-4">
    <UIRadioButton
      v-for="el in options"
      :id="`${props.id}-${el[UI_SELECTION_VALUE]}`"
      :key="el[UI_SELECTION_VALUE]"
      :name="id"
      :value="el[UI_SELECTION_VALUE]"
      :props="{
        ...props,
        ['onUpdate:modelValue'](val: any) {
          emit('update:modelValue', val);
        },
      }"
    >
      {{ el[UI_SELECTION_LABEL] }}
    </UIRadioButton>
  </div>
</template>
