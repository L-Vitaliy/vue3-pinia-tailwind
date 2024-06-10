<script setup lang="ts">
import { type Ref, computed, ref, watch } from "vue";
import type { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";
import {
  type DataFieldDescriptor,
  type DataFormBuild,
  type UIDataFilterFormInterface,
} from "@/modules/dataform";

import { type LocaleRecord, i18n } from "@/plugins/vuei18n";

import DataField from "@/modules/dataform/views/DataField.vue";
import { DataFilterForm } from "@/modules/dataform/entities/DataFilterForm";

const props = withDefaults(defineProps<UIDataFilterFormInterface>(), {
  inline: true,
  useSearch: true,
  useSearchPlaceholder: true,
});

const build = ref<DataFormBuild<any>>();

const dataForm = ref<DataFilterForm<any> | undefined>();

const builder = ref() as Ref<DataFormBuilder<any>>;

const isReady = ref(false);

const { locale } = i18n();

const labels = ref<Record<string, Partial<LocaleRecord>>>({});

const dataFields = ref<object>({});

const searchLock = ref(false);

const searchValue = ref("");

const searchFocus = ref(false);

const dataSearchValue = computed(() =>
  dataFields.value[dataForm.value?.config.searchField!]?.toString(),
);

const isSearch = computed(() => {
  const config = dataForm.value?.config;

  return Boolean(
    props.useSearch &&
      config?.searchField &&
      config?.searchField in dataFields.value,
  );
});

(async () => {
  dataForm.value =
    props.form instanceof Promise ? await props.form : props.form;

  builder.value = dataForm.value.builder;

  build.value = builder.value.build;

  await builder.value.snippet.load();

  Object.keys(dataForm.value.fields).forEach((field) => {
    const data = builder.value.getDataField(field);
    const label = data?.label ?? {};

    labels.value[field] = typeof label === "object" ? label : {};
  });

  const config = dataForm.value.config;

  dataFields.value = dataForm.value.fields;

  if (isSearch.value) {
    dataFields.value[config.searchField!] ??= null;
    builder.value.unsetFields([config.searchField!]);
  }

  watch(locale, () => {
    build.value = builder.value.buildForm();
  });

  isReady.value = true;

  watch(
    () => dataFields.value,
    () => {
      dataForm.value?.setFilter();
    },
    { deep: true },
  );
})();

function getLabel(field: string) {
  return labels.value[field]?.[locale.value];
}

function getMaxWidth(data: DataFieldDescriptor<any>) {
  if (!data.maxWidth) return;

  const maxWidth =
    typeof data.maxWidth === "number" ? `${data.maxWidth}px` : data.maxWidth;

  return {
    maxWidth,
    "--data-filter-group-container-flex": "initial",
  };
}

function search(resetSearch = false) {
  if (searchLock.value) return;

  if (resetSearch) {
    builder.value.update({ [dataForm.value?.config.searchField!]: null });
    searchValue.value = "";
  }

  if (searchValue.value && searchValue.value === dataSearchValue.value) return;

  dataForm.value?.setFilter();

  searchValue.value = resetSearch ? "" : dataSearchValue.value;
}
</script>

<template>
  <div
    :key="locale"
    class="wrap-data-filter flex flex-wrap items-center gap-1.5 my-6 justify-between justify-items-start"
    :class="[inline || 'flex-col']"
  >
    <div
      class="data-filter"
      :class="[{ 'data-filter__inline': inline }]"
      @focus="searchLock = true"
      @blur="searchLock = false"
    >
      <template v-if="isReady && builder && build">
        <div
          v-for="group in build"
          :key="group.id"
          class="wrap-data-filter-group"
          :class="group.wrapCss"
        >
          <div class="data-filter-group" :id="group.id" :class="group.css">
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
                  : group.name[builder.locale]
              }}
            </h3>

            <div
              v-for="(data, index) in group.fields"
              :key="data.id || data.field || index"
              class="data-filter-group-wrap-container"
            >
              <template
                v-if="data.field ? builder.isSetField(data.field) : true"
              >
                <div
                  v-if="getLabel(data.field as string)"
                  class="data-filter-field__label"
                  :class="data.labelClass"
                >
                  {{ getLabel(data.field as string) }}
                </div>

                <div
                  class="data-filter-group-container"
                  :class="[
                    ...(Array.isArray(data.containerClass)
                      ? data.containerClass
                      : [data.containerClass]),
                    data.field && dataForm?.isEmpty(data.field) && '--empty',
                    builder.form.isSelectionType(data) && '--dropdown',
                  ]"
                  :style="
                    typeof data.containerStyle === 'string'
                      ? data.containerStyle
                      : {
                          ...data.containerStyle,
                          ...getMaxWidth(data),
                        }
                  "
                >
                  <template
                    v-for="(prepend, key) in [
                      data.containerPrepend?.(
                        builder.form.getInputValue(data.field),
                        data,
                      ),
                    ]"
                    :key="key"
                  >
                    <div v-if="prepend" v-html="prepend" />
                  </template>

                  <DataField v-bind="data" :labelled="false" class="w-full">
                    <slot
                      v-if="
                        data.field && $slots[`field_${data.field as string}`]
                      "
                      :name="`field_${data.field as string}`"
                      :scope="data"
                    />
                  </DataField>

                  <template
                    v-for="(append, key) in [
                      data.containerAppend?.(
                        builder.form.getInputValue(data.field),
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
            </div>

            <template v-if="group.renderer">
              <template
                v-for="(renderer, index) in [
                  group.renderer(builder.form.getGroupRenderer, builder),
                ]"
                :key="index"
              >
                <component :is="renderer.component" v-bind="renderer.props" />
              </template>
            </template>
          </div>
        </div>
      </template>
    </div>

    <template v-if="isSearch">
      <div />
      <div
        v-for="(data, index) in [
          builder.getDataField(dataForm?.config.searchField!),
        ]"
        :key="index"
        class="data-filter-search"
        :class="{
          'data-filter-search__inline': inline,
          'data-filter-search__active': searchFocus || !!searchValue,
        }"
      >
        <div v-if="data" class="data-filter-search-container">
          <div
            v-if="getLabel(data.field as string)"
            class="data-filter-field__label"
            :class="data.labelClass"
          >
            {{ getLabel(data.field as string) }}
          </div>

          <DataField
            v-bind="data"
            :labelled="false"
            class="data-filter-search__input"
            icon="pi pi-search"
            icon-right
            icon-class="text-primary"
            :icon-click="
              () => {
                searchLock = false;
                dataSearchValue && search();
              }
            "
            :props="{
              placeholder:
                (data.props as any)?.placeholder ?? useSearchPlaceholder
                  ? $t('app.whatSearching')
                  : '',
            }"
            @focus="searchFocus = true"
            @blur="searchFocus = false"
            @keydown="searchLock = true"
            @keyup.enter="
              () => {
                searchLock = false;
                dataSearchValue && search();
              }
            "
          />

          <div
            v-if="dataSearchValue"
            type="button"
            class="text-gray-400 pos-y-center w-[20px] h-[20px] right-9 mt-0.5 cursor-pointer"
            @click="
              () => {
                searchLock = false;
                dataSearchValue && search(true);
              }
            "
          >
            <i class="pi pi-times" />
          </div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss">
@include reset-inputs(data-filter, ".data-form-field");
@include reset-inputs(
  "data-filter-search:not(.data-filter-search__active)",
  ".data-form-field"
);
@include reset-inputs-bg(data-filter, ".data-form-field");
@include reset-inputs-bg(
  "data-filter-search:not(.data-filter-search__active)",
  ".data-form-field"
);
@include reset-after(data-filter, ".data-form-fieldset__addon");

.wrap-data-filter {
  @apply flex items-center min-h-[50px];

  .data-filter {
    --data-filter-gap: 1rem;
    --data-filter-group-gap: 2rem;
    --data-filter-group-container-flex: 1;

    @apply flex flex-1 flex-col flex-wrap items-center;
    gap: var(--data-filter-group-gap);

    &-group {
      @apply flex flex-col;
      gap: var(--data-filter-gap);

      &-wrap-container {
        @apply flex items-center gap-6 pr-2;
      }

      &-container {
        @apply flex flex-row items-center gap-2;

        .p-dropdown-trigger-icon {
          color: var(--primary-color);
        }

        .p-calendar {
          max-width: 120px;

          input {
            min-width: 120px;

            &::placeholder {
              text-align: left;
            }
          }
        }
      }

      &-container {
        &:not(.--empty.--dropdown) {
          flex: var(--data-filter-group-container-flex);
        }

        &.--empty.--dropdown {
          .data-form-field {
            @apply mr-4;

            max-width: 0 !important;
            min-width: 0 !important;

            > * {
              max-width: 0 !important;
              min-width: 0 !important;
            }

            .p-dropdown-label {
              display: none;
            }
            .p-dropdown-trigger-icon {
              @apply mt-1;
            }
          }
        }

        &:not(.--empty) {
          .p-dropdown {
            min-width: 220px;
          }
        }
      }
    }

    &__inline {
      @apply flex flex-row;

      .data-filter-group {
        @apply flex flex-row flex-wrap items-center max-w-full;
      }

      @include laptop() {
        @apply w-full;
      }
    }

    &-field__label {
      @apply -mr-4;
      font-size: 13px;
    }

    .--break {
      flex-basis: 100%;
    }
  }

  @include laptop() {
    @apply flex-col;

    .data-filter {
      &__inline {
        @apply flex-col w-full flex-initial;
      }
    }
  }
}

.data-filter-search {
  @apply flex  min-h-[50px];

  &-container {
    @apply w-full;
    position: relative;
  }

  &__input {
    .p-inputtext {
      width: 150px !important;

      &::placeholder {
        text-align: center;
      }
    }

    i {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
    }
  }

  &__active {
    .data-filter-search {
      &__input {
        .p-inputtext {
          width: 100% !important;

          &::placeholder {
            text-align: left;
          }
        }
      }
    }
  }

  &__inline {
    @apply flex flex-row items-center;
  }

  @include laptop() {
    @apply w-full;

    &__input {
      .p-inputtext {
        width: 100% !important;

        &::placeholder {
          text-align: left;
        }
      }
    }
  }
}
</style>
