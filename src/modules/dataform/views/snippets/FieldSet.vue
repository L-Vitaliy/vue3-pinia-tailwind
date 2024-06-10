<script setup lang="ts">
import InputGroup from "primevue/inputgroup";
import InputGroupAddon from "primevue/inputgroupaddon";

import { ref, watch } from "vue";

import type { CalendarProps } from "primevue/calendar";
import type { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";
import type { DataFieldDescriptor } from "@/modules/dataform";
import type { UIBaseInputPropsInterface } from "@/app/data/uiTypes";

import DataField from "@/modules/dataform/views/DataField.vue";

const props = withDefaults(
  defineProps<
    Omit<UIBaseInputPropsInterface, "label"> & {
      fields: string[];
      field: string;
      builder: DataFormBuilder<any>;
      alignCenter?: boolean;
    }
  >(),
  {
    rounded: true,
    alignCenter: true,
  },
);

const emit = defineEmits(["update:modelValue", "attachField", "change"]);

const builder = props.builder;

const formFields = builder.fields;

const dataField = builder.getDataField(props.field)!;

const renderer = builder.form.getRenderer(dataField);

const model = ref();

const modelKey = ref(0);

const isReadonly = dataField.readonly;

props.props && Object.assign((dataField.props ||= {}), props.props);

function init() {
  builder.form.awaitSelectionSource(props.field).then(() => {
    setTimeout(() => {
      model.value = builder.form.getInputValue(props.field);

      dataField.instant && modelKey.value++;
    });
  });
}

function attach(data: DataFieldDescriptor<any>): DataFieldDescriptor<any> {
  const descriptor: DataFieldDescriptor<any> = {
    props: {},
    ...data,
    label: "",
    showError: false,
  };

  if (data.dataType === "date:time") {
    Object.assign(descriptor.props!, {
      timeOnly: true,
    } satisfies CalendarProps);
  }

  emit("attachField", data.field);

  return descriptor;
}

watch(model, (value) => {
  emit("update:modelValue", value);
});

init();
</script>

<template>
  <InputGroup
    class="data-form-fieldset"
    :class="{
      'rounded-lg': rounded,
      '--invalid': !!props.errorMessage || invalid,
      '--centered': alignCenter,
      '--readonly': isReadonly,
    }"
  >
    <template v-for="name in fields" :key="name">
      <template v-if="!(name in formFields)">
        <div class="flex items-center px-2" v-html="name" />
      </template>

      <template v-else-if="name === field">
        <InputGroupAddon class="data-form-fieldset__addon flex-1 relative">
          <component
            :is="renderer.component"
            :key="modelKey"
            v-model="model"
            v-bind="dataField"
          />
        </InputGroupAddon>
      </template>

      <template v-else>
        <template
          v-for="dataField in [builder.getDataField(name)]"
          :key="dataField?.field"
        >
          <InputGroupAddon
            v-if="dataField"
            class="data-form-fieldset__addon flex-1 relative"
          >
            <DataField
              v-bind="attach(dataField)"
              @change="(value) => emit('change', value)"
            />
          </InputGroupAddon>
        </template>
      </template>
    </template>
  </InputGroup>
</template>

<style scoped lang="scss">
.data-form-fieldset {
  &__addon:first-child {
    @apply pl-0.5;
  }

  &__addon:last-child {
    @apply pr-0.5;
  }

  &__addon:not(:last-child):after {
    content: "";
    display: block;
    border-left: 1px solid var(--gray-300);
    height: 65%;
    width: 0;
  }

  :deep(*) {
    border: none;

    &:focus {
      outline: none !important;
      box-shadow: none;
      border-color: transparent;
    }
  }

  border: $primeBorderColor 1px solid;

  &.--invalid {
    border: var(--red-500) 1px solid;
  }
  &.--centered {
    .data-form-fieldset__addon {
      :deep(input) {
        text-align: center !important;
      }
    }
  }

  &.--readonly {
    border: none !important;
    background: none !important;
    box-shadow: none !important;
    gap: 0.5rem;

    .p-inputgroup-addon {
      flex: none;
      color: var(--text-color) !important;

      &:after {
        border-left-color: var(--text-color) !important;
        margin-left: 0.5rem;
      }
    }
  }
}
</style>
