<script setup lang="ts">
import { type Ref, inject, nextTick, ref } from "vue";
import { watchDebounced } from "@vueuse/core";
import utilsObject from "@/utils/object";

import type {
  DataFieldDescriptor,
  DataFormBuild,
  UIDataFormInterface,
} from "@/modules/dataform";

import { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";

import DataField from "@/modules/dataform/views/DataField.vue";

import { INLINE_DATA_FIELD_CLASS } from "@/modules/dataform";
import type { DialogProvide } from "@/views/ui/Dialog.vue";

const props = defineProps<UIDataFormInterface>();

const { updateIsCloseOnEscDisabled } =
  (inject("dialogProvide") as DialogProvide) || {};

const build = ref<DataFormBuild<any>>();

const dataForm = ref() as Ref<DataFormBuilder<any>>;

const isReady = ref(false);

const collapseGroups = ref<Record<string, boolean>>({});

const hideGroups = ref<Record<string, boolean>>({});

const initialFieldsState = ref() as Ref<DataFormBuilder<any>["fields"]>;

(async () => {
  dataForm.value =
    props.builder instanceof Promise ? await props.builder : props.builder;

  build.value = dataForm.value.build;

  initialFieldsState.value = utilsObject.cloneDeep(dataForm.value.fields);

  await dataForm.value.snippet.load();

  isReady.value = true;
})();

function getMaxWidth(data: DataFieldDescriptor<any>) {
  if (!data.maxWidth) return;

  const maxWidth =
    typeof data.maxWidth === "number" ? `${data.maxWidth}px` : data.maxWidth;

  return {
    maxWidth,
    "--data-form-field-min-width": maxWidth,
    "--data-form-group-container-flex": "initial",
  };
}

function getMinWidth(data: DataFieldDescriptor<any>) {
  const minWidth =
    typeof data.minWidth === "number" ? `${data.minWidth}px` : data.minWidth;

  return {
    "--data-form-field-min-width": minWidth,
  };
}

function expandGroupToggle(groupId: string) {
  collapseGroups.value[groupId] = !collapseGroups.value[groupId];

  nextTick(() => {
    setTimeout(() => {
      hideGroups.value[groupId] = !collapseGroups.value[groupId];
    }, 240);
  });
}

function getExpandLabel(label: any) {
  return typeof label === "object" ? label[dataForm.value.locale] : label;
}

watchDebounced(
  () => dataForm.value?.fields,
  () => {
    if (updateIsCloseOnEscDisabled) {
      const sourceState = initialFieldsState.value;
      const currentState = dataForm.value?.fields;
      const isStateEqual = utilsObject.isEqual(sourceState, currentState);

      updateIsCloseOnEscDisabled(!isStateEqual);
    }
  },
  {
    deep: true,
    debounce: 500,
  },
);
</script>

<template>
  <div
    class="data-form"
    :class="[{ 'data-form__inline': inline }]"
    :style="[
      groupGap ? `--data-form-group-gap: ${groupGap}rem` : null,
      gap ? `--data-form-gap: ${gap}rem` : null,
    ]"
  >
    <template v-if="isReady">
      <div
        v-for="group in build"
        :key="group.id"
        class="wrap-data-form-group"
        :class="
          Array.isArray(group.wrapCss)
            ? group.wrapCss
            : [
                group.bordered
                  ? 'border-solid border-0 border-b border-delimiter pb-8'
                  : '',
                group.borderTop
                  ? 'border-solid border-0 border-t border-delimiter pt-8'
                  : '',
                group.wide ? 'w-full' : '',
                group.wrapCss,
              ]
        "
      >
        <div
          class="data-form-group"
          v-show="hideGroups[group.id] ?? true"
          :id="group.id"
          :class="[
            ...(Array.isArray(group.css) ? group.css : [group.css]),
            { 'data-form-group__collapse': collapseGroups[group.id] },
          ]"
        >
          <h3
            v-if="group.name"
            :class="
              Array.isArray(group.nameCss)
                ? group.nameCss
                : ['w-full', 'my-0', group.nameCss]
            "
          >
            {{
              typeof group.name === "string"
                ? $t(group.name)
                : group.name[dataForm!.locale]
            }}
          </h3>

          <template
            v-for="(data, index) in group.fields"
            :key="data.id || data.field || index"
          >
            <div
              v-if="data.field ? dataForm.isSetField(data.field) : true"
              class="data-form-group-container"
              :class="
                Array.isArray(data.containerClass)
                  ? data.containerClass
                  : [
                      inline && !data.maxWidth ? INLINE_DATA_FIELD_CLASS : '',
                      data.containerClass,
                    ]
              "
              :style="
                typeof data.containerStyle === 'string'
                  ? data.containerStyle
                  : {
                      ...data.containerStyle,
                      ...getMinWidth(data),
                      ...getMaxWidth(data),
                    }
              "
            >
              <template
                v-for="(prepend, key) in [
                  data.containerPrepend?.(
                    dataForm.form.getInputValue(data.field),
                    data,
                  ),
                ]"
                :key="key"
              >
                <div v-if="prepend" v-html="prepend" />
              </template>

              <DataField v-bind="data" class="w-full">
                <slot
                  v-if="data.field && $slots[`field_${data.field as string}`]"
                  :name="`field_${data.field as string}`"
                  :scope="data"
                />
              </DataField>

              <template
                v-for="(append, key) in [
                  data.containerAppend?.(
                    dataForm.form.getInputValue(data.field),
                    data,
                  ),
                ]"
                :key="key"
              >
                <div v-if="append" v-html="append" />
              </template>
            </div>

            <div v-if="data.breakRow" class="--break" />
          </template>

          <template v-if="group.renderer">
            <template
              v-for="(renderer, index) in [
                group.renderer(dataForm.form.getGroupRenderer, dataForm),
              ]"
              :key="index"
            >
              <component :is="renderer.component" v-bind="renderer.props" />
            </template>
          </template>
        </div>

        <template v-if="group.expand">
          <div
            class="wrap-data-form-group__expand"
            :class="group.expand.css"
            :style="group.expand.style"
            @click="expandGroupToggle(group.id)"
          >
            {{
              collapseGroups[group.id] && !hideGroups[group.id]
                ? getExpandLabel(group.expand.openLabel)
                : getExpandLabel(group.expand.hideLabel)
            }}
          </div>
        </template>
      </div>
    </template>
    <div v-else class="py-24 relative w-full">
      <div class="pos-center">{{ $t("app.loading") }}...</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.data-form {
  --data-form-gap: 1.5rem;
  --data-form-group-gap: 2rem;
  --data-form-field-min-width: 245px;
  --data-form-group-container-flex: 1;

  @apply flex flex-col flex-wrap;
  gap: var(--data-form-group-gap);

  .wrap-data-form-group {
    position: relative;

    &__expand {
      position: absolute;
      cursor: pointer;
      right: 0;
      bottom: 0;
    }
  }

  &-group {
    @apply flex flex-col;
    gap: var(--data-form-gap);
    max-height: 9999px;
    transition: max-height 250ms ease-in;
    will-change: max-height;

    .data-form-field {
      min-width: var(--data-form-field-min-width);
    }

    &__collapse {
      max-height: 0;
      overflow: hidden;
      transition: max-height 250ms ease-out;
    }

    &-container {
      flex: var(--data-form-group-container-flex);
    }
  }

  &__inline {
    @apply flex flex-row;

    .data-form-group {
      @apply flex flex-row flex-wrap items-end max-w-full;
    }
  }

  .--break {
    flex-basis: 100%;
  }
}
</style>
