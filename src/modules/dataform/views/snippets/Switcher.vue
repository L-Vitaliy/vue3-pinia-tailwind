<script setup lang="ts">
import { nextTick, ref, toRaw, watch } from "vue";
import type { UIBaseInputPropsInterface } from "@/app/data/uiTypes";
import type {
  DataFieldDescriptor,
  DataFieldRenderer,
} from "@/modules/dataform";
import type { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";

const props = withDefaults(
  defineProps<
    Omit<UIBaseInputPropsInterface, "label" | "props"> & {
      field: string;
      builder: DataFormBuilder<any>;
      onSwitch: (builder: DataFormBuilder<any>) => DataFieldDescriptor<any>;
      textSwitcherOn?: string;
      textSwitcherOff?: string;
      textSwitchLoading?: string;
      switchButtonCss?: string;
      switchLoadingCss?: string;
    }
  >(),
  {
    rounded: true,
    textSwitcherOn: "Switcher on",
    textSwitcherOff: "Switcher off",
    textSwitchLoading: "...",
    switchButtonCss: "text-sm text-primary cursor-pointer pr-2",
    switchLoadingCss: "flex justify-center text-gray-400 py-2",
  },
);

const emit = defineEmits(["switchField", "setSwitcher"]);

const builder = props.builder;

const dataField = ref<DataFieldDescriptor<any> | undefined>();

const watchField = ref<string>("");

const renderer = ref<DataFieldRenderer | undefined>();

const model = ref();

const isSwitchOn = ref(false);

const switchLock = ref(false);

const inputRef = ref<any>();

async function init(compile = true) {
  switchLock.value = true;
  dataField.value = undefined;
  renderer.value = undefined;
  watchField.value = "";

  if (compile) {
    const data = isSwitchOn.value
      ? builder.compile(props.field, props.onSwitch(builder))
      : builder.compile(props.field);

    watchField.value = (data.field as string) || props.field;
  } else {
    watchField.value = props.field;
  }

  dataField.value = builder.getDataField(watchField.value)!;
  renderer.value = builder.form.getRenderer(dataField.value);

  emit("switchField", watchField.value);

  watchField.value &&
    (await builder.form.awaitSelectionSource(watchField.value).then(() => {
      setTimeout(() => {
        builder.resetFields([props.field, watchField.value]);

        if (isSwitchOn.value) {
          builder.form.resetSelectionRecords(watchField.value);
          watchField.value === props.field || builder.resetRules(props.field);
        }

        model.value = builder.form.getInputValue(watchField.value);
        switchLock.value = false;
        builder.form.resetUnlock([watchField.value]);

        nextTick(() => {
          inputRef.value?.$el?.focus();
        });
      });
    }));
}

function switchToggle() {
  if (switchLock.value) return;

  isSwitchOn.value = !isSwitchOn.value;
  init();
}

async function checkoutSwitcher(): Promise<boolean> {
  const value = builder.fields[props.field];
  const context = await builder.form.getSelectionContext(props.field);

  if (!context || typeof value !== "object" || value?.constructor !== Object) {
    return false;
  }

  const { valueKey, labelKey } = context;

  if (
    labelKey in value &&
    (value[valueKey] === null || value[valueKey] === undefined)
  ) {
    isSwitchOn.value = true;
    await init();

    return true;
  }

  return false;
}

watch(model, (value, oldValue) => {
  if (!watchField.value) return;

  const data = builder.getDataField(watchField.value)!;

  builder.form.getWatcher(watchField.value)?.({
    value,
    oldValue,
    data,
  });
});

checkoutSwitcher().then((checked) => {
  checked || init(false);
});

emit("setSwitcher");
</script>

<template>
  <div class="data-form-field-switch">
    <div v-if="switchLock" :class="switchLoadingCss">
      {{ textSwitchLoading }}
    </div>

    <component
      v-else-if="renderer && dataField"
      ref="inputRef"
      :is="toRaw(renderer.component)"
      v-model="model"
      v-bind="dataField"
      :error-message="errorMessage"
    />

    <div
      v-if="!dataField?.readonly"
      class="data-form-field-switch__button flex"
      :class="switchButtonCss"
      @click="switchToggle"
    >
      {{ isSwitchOn ? textSwitcherOn : textSwitcherOff }}
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-form-field-switch {
  position: relative;

  &__button {
    position: absolute;
    top: 0;
    right: 0;

    @apply -mt-6;
  }
}
</style>
