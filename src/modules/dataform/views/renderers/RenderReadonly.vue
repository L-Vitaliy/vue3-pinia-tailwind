<script setup lang="ts">
import { ref } from "vue";
import { type DataFieldDescriptor } from "@/modules/dataform";

const props = defineProps<DataFieldDescriptor<any>>();

const builder = props.builder!;
const field = props.field!;
const value = builder.form.getInputValue(field);
const data = ref(typeof value === "object" ? "" : value);
const dataList = ref<string[]>([]);

props.valueRaw ||
  (builder.form.isSelectionType(props) &&
    builder.form.awaitSelectionSource(field).then(() => {
      setTimeout(() => {
        const records = builder.form.getSelectionRecords(field);
        const value = builder.form.getInputValue(field);

        if (!records) return (data.value = value ?? "");

        if (Array.isArray(value)) {
          const output: string[] = [];
          const dataSet = new Set(value.map((value) => String(value)));

          for (const record in records) {
            dataSet.has(record) && output.push(records[record]);
          }

          if (!output.length && value.length) {
            output.push(...value);
          }

          if (props.listView) {
            return (dataList.value = [...new Set(output)]);
          }

          return (data.value = [...new Set(output)].join(", "));
        }

        data.value = records[value] ?? "";
      });
    }));
</script>

<template>
  <div v-if="valueRaw" :id="id" v-html="valueRaw(value, props)" />
  <div v-else-if="autocomplete">
    {{ value?.[autocomplete!.labelKey!] ?? value ?? "-" }}
  </div>
  <template v-else-if="dataList.length">
    <ul :id="id" class="m-0">
      <li v-for="item in dataList" :key="item" class="mb-2">{{ item }}</li>
    </ul>
  </template>
  <div v-else :id="id">{{ data || "-" }}</div>
</template>
