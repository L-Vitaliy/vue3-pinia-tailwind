import { type Ref, ref, toRaw, toRef } from "vue";
import "moment-timezone";

import type {
  DataFieldDateInputType,
  DataFieldDescriptor,
  DataFieldGroupRenderer,
  DataFieldInputType,
  DataFieldRenderer,
  DataFieldSelectionSource,
} from "@/modules/dataform";

import { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";

import RenderInput from "@/modules/dataform/views/renderers/RenderInput.vue";
import RenderSelect from "@/modules/dataform/views/renderers/RenderSelect.vue";
import RenderReadonly from "@/modules/dataform/views/renderers/RenderReadonly.vue";
import RenderDate from "@/modules/dataform/views/renderers/RenderDate.vue";
import RenderRadio from "@/modules/dataform/views/renderers/RenderRadio.vue";
import RenderCheckbox from "@/modules/dataform/views/renderers/RenderCheckbox.vue";

import utils from "@/utils";
import { getFormatDate, setFormatDate } from "@/compositions/useDate";

export class FormService<DTO extends object = object> {
  private _inputTypes: { [K in DataFieldInputType]?: string } = {
    "input:password": "password",
    "input:email": "email",
    "input:number": "number",
    "input:decimal": "number",
  };

  private _inputRefs: {
    [K in keyof DTO]?: Ref<number>;
  } = {};

  private _renderers = {
    input: RenderInput,
    select: RenderSelect,
    readonly: RenderReadonly,
    date: RenderDate,
    radio: RenderRadio,
    checkbox: RenderCheckbox,
  };

  private _selectionSources: {
    [K in keyof DTO]?: DataFieldSelectionSource<DTO>;
  } = {};

  private _selectionRecords: {
    [K in keyof DTO]?: Record<string, any>;
  } = {};

  private _watchers: {
    [K in keyof DTO]?: DataFieldDescriptor<DTO>["watcher"];
  } = {};

  private _saveLock: {
    [K in keyof DTO]?: boolean;
  } = {};

  private _resetLock: {
    [K in keyof DTO]?: boolean;
  } = {};

  constructor(readonly builder: DataFormBuilder<DTO>) {}

  saveLock(fields: Array<keyof DTO>) {
    for (const field of fields) {
      this._saveLock[field] = true;
    }
  }

  resetLock(fields: Array<keyof DTO>) {
    for (const field of fields) {
      this._resetLock[field] = true;
    }
  }

  resetUnlock(fields: Array<keyof DTO>) {
    for (const field of fields) {
      this._resetLock[field] = false;
    }
  }

  isResetLock(field: keyof DTO) {
    return Boolean(this._resetLock[field]);
  }

  setWatcher(field: keyof DTO, data: DataFieldDescriptor<DTO>) {
    const watcher = data.watcher || (() => {});
    const onSetValue = data.onSetValue || (() => {});

    this._watchers[field] = ({ value, oldValue }) => {
      watcher({ data, value, oldValue });

      if (this._saveLock[field]) {
        return (this._saveLock[field] = false);
      }

      data.builder!.fields[field] = data.valueSetter
        ? data.valueSetter(value, data)
        : data.numeric && typeof value !== "object"
          ? parseFloat(value)
          : value;

      onSetValue(data.builder!.fields[field], data);
    };
  }

  getWatcher(field: keyof DTO) {
    return this._watchers[field];
  }

  getInputValue(field: keyof DTO | undefined) {
    if (!field) return;

    const data = this.builder.getDataField(field);

    const value = this.builder.fields[field];

    return data?.valueGetter ? data.valueGetter(value, data) : value;
  }

  update = (fields?: keyof DTO | Array<keyof DTO>) => {
    const keys: Array<keyof DTO> = Array.isArray(fields)
      ? fields
      : fields
        ? [fields]
        : [];

    for (const key of keys.length ? keys : Object.keys(this.builder.fields)) {
      this._inputRefs[key as string] ||= ref(0);
      this._inputRefs[key as string].value++;
    }
  };

  getInputRef = (field: keyof DTO) => {
    return toRef((this._inputRefs[field] ||= ref(0)));
  };

  getInputSubType(data: DataFieldDescriptor<DTO>) {
    return this._inputTypes[data.dataType || ""];
  }

  getRenderer(data: DataFieldDescriptor<DTO>): DataFieldRenderer {
    if (data.readonly) {
      return {
        component: toRaw(this._renderers.readonly),
      };
    }

    const name = data.dataType?.split(":")[0] ?? "";

    return {
      component: toRaw(this._renderers[name]),
    };
  }

  getGroupRenderer<R extends abstract new (...args: any[]) => any>(
    renderer: R,
    props: InstanceType<R>["$props"],
  ): DataFieldGroupRenderer<R> {
    return {
      component: toRaw(renderer),
      props,
    };
  }

  isSelectionType(data: DataFieldDescriptor<DTO>) {
    return !!data.dataType?.startsWith("select");
  }

  isMultiSelectionType(data: DataFieldDescriptor<DTO>) {
    return data.dataType === "select:multiple";
  }

  intersectBooleanSelection(data: DataFieldDescriptor<DTO>) {
    if (data.dataType !== "select:boolean") return;

    data.selection ||= () => ({
      "0": "No",
      "1": "Yes",
    });

    data.valueGetter ||= (value) => {
      return value ? "1" : "0";
    };

    data.valueSetter ||= (value: any) => {
      return Boolean(+value);
    };
  }

  callSelection(
    field: keyof DTO,
    data: DataFieldDescriptor<DTO>,
    searchValue?: string,
  ) {
    if (!data.selection) return;

    return (this._selectionSources[field] = data.selection(
      this.createSelectionSource,
      data,
      searchValue,
    ));
  }

  createSelectionSource<List extends object[]>(
    list: List,
    valueKey: keyof List[0],
    labelKey: keyof List[0],
  ): [List, keyof List[0], keyof List[0]] {
    return [list ?? [], valueKey, labelKey];
  }

  getSelectionSource(
    field: keyof DTO | undefined,
  ): DataFieldSelectionSource<DTO> | null {
    return field ? this._selectionSources[field] : null;
  }

  getSelectionRecords(
    field: keyof DTO | undefined,
  ): DataFieldSelectionSource<DTO> | null {
    return field && field in this._selectionRecords
      ? this._selectionRecords[field] ?? null
      : null;
  }

  async setSelectionRecords(
    field: keyof DTO | undefined,
    records: Record<string, any> | Array<any>,
  ) {
    if (!field) return;

    if (Array.isArray(records)) {
      records = await this.mapSelectionRecords(field, records);
    }

    if (!utils.isPlainObject(records)) return;

    Object.assign((this._selectionRecords[field] ||= {}), records);
  }

  async mapSelectionRecords(
    field: keyof DTO | undefined,
    records: Array<any>,
  ): Promise<Record<string, any>> {
    if (!field) return {};

    const context = await this.getSelectionContext(field);

    if (!context) return {};

    const { valueKey, labelKey } = context;

    records = utils.object.uniqBy(records, valueKey);

    records = records
      .map((item) => {
        if (!utils.isPlainObject(item)) {
          item = { [valueKey]: item, [labelKey]: item };
        }

        return { [valueKey]: item[labelKey], [labelKey]: item[labelKey] };
      })
      .filter((item) => {
        return item[valueKey] !== null && item[valueKey] !== undefined;
      });

    return utils.object.records(records as any[], valueKey, labelKey);
  }

  resetSelectionRecords(field: keyof DTO | undefined) {
    field &&
      field in this._selectionRecords &&
      delete this._selectionRecords[field];
  }

  async awaitSelectionSource(field: keyof DTO | undefined) {
    field && (await this._selectionSources[field]);
  }

  async getSelectionContext(
    field: keyof DTO | undefined,
  ): Promise<{ list: any[]; valueKey: string; labelKey: string } | void> {
    const source = await this.getSelectionSource(field);

    if (
      Array.isArray(source) &&
      Array.isArray(source[0]) &&
      typeof source[1] === "string" &&
      typeof source[2] === "string"
    ) {
      const [list, valueKey, labelKey] = source;

      return {
        list,
        valueKey,
        labelKey,
      };
    }
  }

  async makeSelection(field: keyof DTO): Promise<Record<string, any>> {
    const data = this.builder.getDataField(field)!;
    const context = await this.getSelectionContext(field);
    const source = await this.getSelectionSource(field);

    if (context) {
      const { list, valueKey, labelKey } = context;

      const records = utils.object.records(list, valueKey, labelKey) as Record<
        string,
        string | number
      >;

      if (Object.keys(records).length) {
        this._selectionRecords[field] = records;
      }

      this.intersectSelection(field, data, source);

      return records;
    }

    return (this._selectionRecords[field] = utils.isPlainObject(source)
      ? source
      : {});
  }

  intersectSelection(
    field: keyof DTO,
    data: DataFieldDescriptor<DTO>,
    source: DataFieldSelectionSource<DTO>,
  ) {
    if (data.dataType !== "select" || !Array.isArray(source?.[0])) return;

    const [, valueKey, labelKey] = source;

    const sourceValue = this.builder.fields[field];

    const sourceValueLabel =
      sourceValue && typeof sourceValue === "object" && labelKey in sourceValue
        ? sourceValue[labelKey]
        : null;

    data.valueGetter ||= (value) => {
      if (value && typeof value === "object") {
        return data.search ? value[labelKey] : value[valueKey];
      }

      return value;
    };

    data.valueSetter ||= (value) => {
      return data.selectContext
        ? this._selectionRecords[field] &&
          String(value) in this._selectionRecords[field]!
          ? {
              [valueKey]: data.numeric ? parseFloat(value) : value,
              [labelKey]: this._selectionRecords[field]![value],
            }
          : value?.toString().trim()
            ? value === sourceValueLabel
              ? sourceValue
              : { [labelKey]: value }
            : null
        : value ?? null;
    };
  }

  async intersectMultiSelection(data: DataFieldDescriptor<DTO>) {
    if (!this.isMultiSelectionType(data)) return;

    const context = await this.getSelectionContext(data.field);

    if (!context) return;

    const { valueKey, labelKey } = context;

    await this.setSelectionRecords(data.field, this.getInputValue(data.field));

    data.valueGetter ||= (value) => {
      return Array.isArray(value)
        ? value
            .map((item) => {
              return utils.isPlainObject(item)
                ? valueKey in item
                  ? item[valueKey] !== null &&
                    item[valueKey] !== undefined &&
                    !Number.isNaN(item[valueKey])
                    ? item[valueKey]
                    : item[labelKey]
                  : item[labelKey]
                : item;
            })
            .filter((value) => value !== undefined && value !== null)
        : [];
    };

    data.valueSetter ||= (value: string[]) => {
      const out: object[] = [];
      const records = this._selectionRecords[data.field!] ?? {};

      value.forEach((id) => {
        id in records
          ? out.push({
              [valueKey]: data.numeric ? parseFloat(id) : id,
              [labelKey]: records[id],
            })
          : out.push({
              [labelKey]: id,
            });
      });

      return out;
    };

    this.builder.setBuild(data.field!, data);
  }

  isDateType(data: DataFieldDescriptor<DTO>) {
    return !!data.dataType?.startsWith("date");
  }

  intersectDate(data: DataFieldDescriptor<DTO>) {
    if (!this.isDateType(data)) return;

    const type = data.dataType as DataFieldDateInputType;

    if (data.currentDate && data.field && !this.getInputValue(data.field)) {
      this.builder.fields[data.field] = setFormatDate(
        type === "date:time" ? new Date() : new Date().getTime(),
        type,
      ) as any;
    }

    data.valueGetter ||= (value: any) => {
      value = getFormatDate(value, type);

      return value;
    };

    data.valueSetter ||= (value: any) => {
      value = setFormatDate(value, type);

      return value;
    };
  }
}
