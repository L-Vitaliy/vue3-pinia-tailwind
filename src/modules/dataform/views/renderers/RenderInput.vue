<script setup lang="ts">
import { ref, toRefs } from "vue";
import { type DataFieldDescriptor } from "@/modules/dataform";

const props = defineProps<DataFieldDescriptor<any>>();

const { props: inputProps } = toRefs(props);

const options = ref<Array<object>>([]);

async function complete({ query }: { query: string }) {
  const data = props.builder!.getDataField(props.field!) as DataFieldDescriptor;

  options.value = (await data.autocomplete?.search(query, data)) ?? [];
}
</script>

<template>
  <UIAutoComplete
    v-if="autocomplete"
    class="w-full"
    :option-label="autocomplete.labelKey"
    :data-key="autocomplete.valueKey"
    :suggestions="options"
    :invalid="!!props.errorMessage"
    :pt="{
      input: {
        name: props.field,
      },
    }"
    :name="props.field"
    force-selection
    auto-option-focus
    v-bind="inputProps"
    @complete="complete"
  />
  <UIInput
    v-else
    v-bind="props"
    :invalid="!!props.errorMessage"
    :type="builder?.form.getInputSubType(props) || 'text'"
  />
</template>
