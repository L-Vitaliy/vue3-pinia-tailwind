import type { StyleValue } from "vue";
import type { ValidationRulesInterface } from "@/app/validation/ValidationRules";
import type {
  ValidationMessages,
  ValidationModel,
  ValidationRuleOptions,
} from "@/app/validation/Validator";

import type { Locale, LocaleMessageRegistry } from "@/plugins/vuei18n";
import type { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";
import type { Validator } from "@/app/validation/Validator";
import type { FormService } from "@/modules/dataform/services/FormService";
import type { SnippetService } from "@/modules/dataform/services/SnippetService";

import type { UIBaseInputPropsInterface } from "@/app/data/uiTypes";

import type Password from "@/modules/dataform/views/snippets/Password.vue";
import type FieldSet from "@/modules/dataform/views/snippets/FieldSet.vue";
import type Switcher from "@/modules/dataform/views/snippets/Switcher.vue";
import { DataFilterForm } from "@/modules/dataform/entities/DataFilterForm";

export const INLINE_DATA_FIELD_CLASS =
  "sm:w-full smd:min-w-[288px] smd:max-w-[288px] lgm:min-w-[360px] lgm:max-w-[360px]";

export interface DataFormBuilderConfigInterface<DTO extends object = object> {
  dataFields: DataFieldRecords<DTO>;
  defaults: DataFieldDescriptor<DTO>;
  groups: DataFormFieldGroup<DTO>[];
  groupCss: string | string[];
  validationModel: ValidationModel<DTO>;
  validationRules: ValidationRulesInterface<DTO>;
  validationMessages: ValidationMessages<this["validationRules"]>;
  locale: Locale;
}

export type DataFormBuild<DTO extends object = object> = Array<
  Omit<DataFormFieldGroup<DTO>, "fields"> & {
    fields: Array<DataFieldDescriptor<DTO>>;
  }
>;

export type DataFormFieldGroup<DTO extends object = object> = {
  id: string;
  name:
    | LocaleMessageRegistry
    | {
        [K in Locale]: string;
      };
  fields: Array<keyof DTO>;
  wrapCss?: string | string[];
  css?: string | string[];
  nameCss?: string | string[];
  bordered?: boolean;
  borderTop?: boolean;
  wide?: boolean;
  renderer?: (
    make: FormService["getGroupRenderer"],
    builder: DataFormBuilder<DTO>,
  ) => ReturnType<FormService["getGroupRenderer"]>;
  expand?: {
    openLabel:
      | LocaleMessageRegistry
      | {
          [K in Locale]: string;
        };
    hideLabel:
      | LocaleMessageRegistry
      | {
          [K in Locale]: string;
        };
    css?: string | string[];
    style?: string | StyleValue;
  };
};

export type DataFieldRecords<DTO extends object = object> = {
  [K in keyof DTO]?: DataFieldDescriptor<DTO>;
};

export type DataFieldDescriptor<DTO extends object = object> =
  UIBaseInputPropsInterface & {
    id?: string;
    field?: keyof DTO;
    readonly?: boolean;
    dataType?: DataFieldInputType;
    locale?: Locale | "";
    validator?: Validator<DTO>;
    rules?: ValidationRuleOptions<DTO>;
    builder?: DataFormBuilder<DTO>;
    valueGetter?: (value: any, data: DataFieldDescriptor<DTO>) => any;
    valueSetter?: (value: any, data: DataFieldDescriptor<DTO>) => any;
    valueRaw?: (value: any, data: DataFieldDescriptor<DTO>) => any;
    onSetValue?: (value: any, data: DataFieldDescriptor<DTO>) => any;
    watcher?: (options: {
      value: any;
      oldValue: any;
      data: DataFieldDescriptor<DTO>;
    }) => any;
    numeric?: boolean;
    search?: boolean;
    selectContext?: boolean;
    selection?: (
      make: FormService<DTO>["createSelectionSource"],
      data: DataFieldDescriptor<DTO>,
      searchValue?: string,
    ) => DataFieldSelectionSource<DTO>;
    autocomplete?: {
      search: (
        searchValue: string,
        data: DataFieldDescriptor<DTO>,
      ) => Promise<Array<any>> | Array<any>;
      labelKey?: string;
      valueKey?: string;
    };
    currentDate?: boolean;
    instant?: boolean;

    // Visuals
    snippet?: DefineDataFieldSnippet | CallDataFieldSnippet<DTO>;
    fieldset?: Array<keyof DTO | string>;
    switcher?: (builder: DataFormBuilder<DTO>) => DataFieldDescriptor<DTO>;
    switcherTexts?: Pick<
      InstanceType<typeof Switcher>["$props"],
      "textSwitcherOn" | "textSwitcherOff" | "textSwitchLoading"
    >;
    labelClass?: string | string[];
    containerClass?: string | string[];
    containerStyle?: string | StyleValue;
    maxWidth?: string | number;
    minWidth?: string | number;
    icon?: string;
    iconRight?: boolean;
    iconClass?: string;
    iconClick?: (e: Event) => any;
    mask?: string;
    maskPlaceholder?: string;
    listView?: boolean;
    breakRow?: boolean;
    prepend?: (value: any, data: DataFieldDescriptor<DTO>) => string | void;
    containerPrepend?: (
      value: any,
      data: DataFieldDescriptor<DTO>,
    ) => string | void;
    append?: (value: any, data: DataFieldDescriptor<DTO>) => string | void;
    containerAppend?: (
      value: any,
      data: DataFieldDescriptor<DTO>,
    ) => string | void;
  };

export type DataFieldSelectionSource<DTO extends object = object> =
  | Record<string, any>
  | Promise<Record<string, any>>
  | ReturnType<FormService<DTO>["createSelectionSource"]>;

export type DataFieldInputType =
  | DataFieldDateInputType
  | "input"
  | "select"
  | "select:multiple"
  | "select:boolean"
  | "textarea"
  | "input:number"
  | "input:password"
  | "input:email"
  | "input:checkbox"
  | "radio"
  | "checkbox"
  | "input:decimal";

export type DataFieldDateInputType =
  | "date"
  | "date:time"
  | "date:datetime"
  | "date:timestamp";

export type DataFieldEmbedSnippets = {
  password: typeof Password;
  fieldset: typeof FieldSet;
  switcher: typeof Switcher;
};

export type DefineDataFieldSnippet =
  | keyof DataFieldEmbedSnippets
  | (abstract new (...args: any[]) => any);

export type CallDataFieldSnippet<DTO extends object = object> = (
  make: SnippetService<DTO>["make"],
  data: DataFieldDescriptor<DTO>,
) =>
  | ReturnType<SnippetService["make"]>
  | Promise<ReturnType<SnippetService["make"]>>;

export type DataFieldRenderer<
  S extends DefineDataFieldSnippet = DefineDataFieldSnippet,
> = {
  component: S extends keyof DataFieldEmbedSnippets
    ? DataFieldEmbedSnippets[S] extends abstract new (...args: any[]) => any
      ? DataFieldEmbedSnippets[S]
      : never
    : S extends abstract new (...args: any[]) => any
      ? S
      : never;
  props?: S extends keyof DataFieldEmbedSnippets
    ? DataFieldEmbedSnippets[S] extends abstract new (...args: any[]) => any
      ? InstanceType<DataFieldEmbedSnippets[S]>["$props"]
      : never
    : S extends abstract new (...args: any[]) => any
      ? InstanceType<S>["$props"]
      : never;
};

export type DataFieldGroupRenderer<
  R extends abstract new (...args: any[]) => any,
> = {
  component: R;
  props: InstanceType<R>["$props"];
};

export interface UIDataFormInterface {
  builder: DataFormBuilder<any> | Promise<DataFormBuilder<any>>;
  inline?: boolean;
  gap?: number;
  groupGap?: number;
}

export interface UIDataFieldInterface<DTO extends object = object>
  extends DataFieldDescriptor<DTO> {
  labelled?: boolean;
}

export interface UIDataFilterFormInterface
  extends Omit<UIDataFormInterface, "builder"> {
  form: DataFilterForm<any> | Promise<DataFilterForm<any>>;
  useSearch?: boolean;
  useSearchPlaceholder?: boolean;
}

export interface DataFilterFormConfigInterface<DTO extends object = object> {
  builder: Partial<DataFormBuilderConfigInterface<DTO>>;
  actions?: DataFilterFormActions<DTO>;
  searchField?: keyof DTO;
  checkEmpty?: (field: keyof DTO | string, value: any) => boolean;
}

export type DataFilterFormActions<DTO extends object = object> = {
  onChange?: (fields: DTO | null) => any;
  onSet?: (fields: DTO) => any;
  onEmpty?: (fields: DTO) => any;
};
