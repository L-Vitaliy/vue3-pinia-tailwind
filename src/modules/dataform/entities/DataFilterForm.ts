import { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";
import utils from "@/utils";
import type { DataFilterFormConfigInterface } from "@/modules/dataform";

export class DataFilterForm<DTO extends object = object> {
  readonly builder: DataFormBuilder<DTO>;

  constructor(
    readonly fields: DTO,
    readonly config: DataFilterFormConfigInterface<DTO>,
  ) {
    this.builder = new DataFormBuilder<DTO>(fields, config.builder);
  }

  get isSetFilter() {
    return Object.keys(this.fields).some((field) => !this.isEmpty(field));
  }

  isEmpty(field: keyof DTO | string) {
    const value = this.fields[field as string];

    return this.config.checkEmpty
      ? this.config.checkEmpty(field, value)
      : utils.isEmpty(value);
  }

  setFilter = (fields?: DTO) => {
    const isSet = this.isSetFilter;

    fields ||= this.fields;

    this.config.actions?.onChange?.(isSet ? fields : null);

    isSet
      ? this.config.actions?.onSet?.(fields)
      : this.config.actions?.onEmpty?.(fields);
  };
}
