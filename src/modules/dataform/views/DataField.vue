<script setup lang="ts">
import { computed, nextTick, ref, toRefs, watch } from "vue";
import IconField from "primevue/iconfield";
import InputIcon from "primevue/inputicon";
import { getMessage } from "@/compositions/useIntl";

import {
  type DataFieldRenderer,
  type UIDataFieldInterface,
} from "@/modules/dataform";

const props = withDefaults(defineProps<UIDataFieldInterface<any>>(), {
  labelled: true,
  rounded: true,
  showError: true,
});

const {
  icon,
  iconClick,
  validator,
  errorMessage,
  locale,
  label,
  labelled,
  prepend,
  append,
  instant,
} = toRefs(props);

const model = ref();
const isLoaded = ref(false);
const inputRefKey = props.builder?.form.getInputRef(props.field!) ?? ref(0);
const inputRef = ref<HTMLElement>();
const isSwitcher = ref(false);

const renderer = computed<Partial<DataFieldRenderer> | void>(() => {
  const renderer = getRenderer();
  const snippet = props.builder?.snippet.get(props.field!);

  if (!renderer.component) return;

  renderer.props ||= snippet ? {} : props;

  return renderer;
});

const getLabel = computed(() =>
  labelled.value
    ? label?.value && typeof label.value === "object"
      ? label.value[locale?.value as string]
      : label?.value
    : "",
);

const validatorState = validator.value?.getState() ?? ref("");

const switcherField = ref("");

const fieldSet = new Set<string>([]);

const errorValue = computed<string>(() => {
  if (!props.showError) return "";

  if (!validatorState.value) return errorMessage?.value || "";

  const errors: string[] = [];

  errors.push(
    ...(validator!.value?.getFieldErrorMessages(
      switcherField.value || props.field!,
      getMessage("app.invalidValue"),
    ) ?? []),
  );

  if (fieldSet.size) {
    [...fieldSet].forEach((field) => {
      errors.push(
        ...(validator!.value?.getFieldErrorMessages(
          field,
          getMessage("app.invalidValue"),
        ) ?? []),
      );
    });
  }

  return errors?.length
    ? [...new Set(errors)].join("; ")
    : errorMessage?.value || "";
});

const prependValue = ref<string | void>();
const appendValue = ref<string | void>();

async function init() {
  fieldSet.clear();

  await props.builder?.form.awaitSelectionSource(props.field).then(() => {
    setTimeout(() => {
      model.value = props.builder?.form.getInputValue(props.field);

      nextTick(() => {
        if (!isLoaded.value && instant.value) {
          props.builder?.form.update(props.field);
        }

        isLoaded.value = true;

        setFocusStateListeners();
      });
    });
  });

  prepend.value && (prependValue.value = prepend.value(model.value, props));
  append.value && (appendValue.value = append.value(model.value, props));
}

function onSwitchField(fieldName: string) {
  switcherField.value = fieldName;
}

function onAttachField(fieldName: string) {
  fieldName && fieldSet.add(fieldName);
}

function getRenderer(): Partial<DataFieldRenderer> {
  const input = props.builder?.form.getRenderer(props);
  const snippet = props.builder?.snippet.get(props.field!);
  const renderer = snippet || input;

  return renderer ?? {};
}

const emit = defineEmits<{
  (e: "change", value: any): void;
  (e: "focus", event: Event): void;
  (e: "blur", value: Event): void;
}>();

props.builder &&
  watch(model, (value, oldValue) => {
    if (!isLoaded.value) return;

    const data = props.builder!.getDataField(props.field!)!;

    props.builder!.form.getWatcher(props.field!)?.({
      value,
      oldValue,
      data,
    });

    emit("change", props.builder!.fields[props.field!]);
  });

watch(inputRefKey, () => {
  init();
});

function setFocusStateListeners() {
  const inputs = inputRef.value?.querySelectorAll("input,select,textarea");

  inputs?.forEach((el) => {
    el.addEventListener("focus", function (event) {
      emit("focus", event);
    });

    el.addEventListener("blur", function (event) {
      emit("blur", event);
    });
  });
}

init();
</script>

<template>
  <div :key="inputRefKey" class="data-form-field flex flex-col gap-1.5">
    <label
      v-if="getLabel"
      :for="id"
      :class="
        Array.isArray(labelClass)
          ? labelClass
          : [
              'text-primary-black',
              'text-label',
              'font-medium',
              isSwitcher && 'w-2/3',
              labelClass,
            ]
      "
    >
      {{ getLabel }}
    </label>

    <slot name="label" />

    <component
      :is="icon ? IconField : 'div'"
      :icon-position="icon ? (iconRight ? 'right' : 'left') : undefined"
      class="relative"
    >
      <InputIcon
        v-if="icon"
        @click="iconClick?.($event)"
        :class="[iconClick && 'cursor-pointer']"
      >
        <i :class="[icon, iconClass]" />
      </InputIcon>

      <slot :scope="props" />

      <div ref="inputRef" class="flex items-center gap-2">
        <div v-if="prependValue" v-html="prependValue" />

        <component
          v-if="renderer && renderer.component"
          :is="renderer.component"
          v-model="model"
          v-bind="renderer.props"
          :label="getLabel"
          :error-message="errorValue"
          @switchField="onSwitchField"
          @setSwitcher="isSwitcher = true"
          @attachField="onAttachField"
          class="data-form-field-component flex-1"
        />

        <div v-if="appendValue" v-html="appendValue" />
      </div>

      <div class="absolute left-1">
        <small v-if="errorValue" class="text-sm text-red-500">
          {{ errorValue }}
        </small>
      </div>
    </component>
  </div>
</template>
