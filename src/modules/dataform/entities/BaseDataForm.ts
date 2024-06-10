import type { DataFieldDescriptor, DataFieldRecords } from "@/modules/dataform";
import type { ValidationErrors } from "@/app/validation/Validator";

import { DataFormBuilder } from "@/modules/dataform/entities/DataFormBuilder";

import utils from "@/utils";

export interface BaseDataFormInterface<DTO extends object> {
  readonly dataFields: DataFieldRecords<DTO> | Promise<DataFieldRecords<DTO>>;
  readonly builder: DataFormBuilder<DTO> | null;
  readonly readonly: boolean;

  init(fields?: DTO): this;
  reset(): Promise<void>;
  setFields(fields: DTO): void;
  createForm(
    defaults?: DataFieldDescriptor<DTO>,
    onCreate?: (form: DataFormBuilder<DTO>) => void | Promise<void>,
  ): Promise<DataFormBuilder<DTO>>;
  submit(): Promise<
    | (ReturnType<this["onSubmit"]> extends Promise<any>
        ? Awaited<ReturnType<this["onSubmit"]>>
        : ReturnType<this["onSubmit"]>)
    | null
  >;
  onCreateForm(form: DataFormBuilder<DTO>): Promise<DataFormBuilder<DTO>>;
  onSubmit(): any;
  onErrors(): any;
}

export abstract class BaseDataForm<DTO extends object>
  implements BaseDataFormInterface<DTO>
{
  abstract readonly dataFields:
    | DataFieldRecords<DTO>
    | Promise<DataFieldRecords<DTO>>;

  protected _builder: DataFormBuilder<DTO> | null = null;
  protected _errors: ValidationErrors<DTO> | null = null;

  private declare readonly _fieldStore: DTO;

  protected _fields: DTO;

  protected constructor(fields: object) {
    this._fieldStore = utils.object.copy((this._fields = fields as DTO));
  }

  get builder() {
    return this._builder;
  }

  get readonly() {
    return false;
  }

  async reset() {
    this._fields = utils.object.copy(this._fieldStore);
    this._builder?.update(this._fields);

    this._builder && (await this.onCreateForm(this._builder));
  }

  init(fields?: Partial<DTO> | undefined | null, copy: boolean = true) {
    this._fields = utils.object.copy(this._fieldStore);
    this._builder = null;
    this._errors = null;

    fields && this.setFields(fields, copy);

    return this;
  }

  setFields(fields: Partial<DTO>, copy: boolean = true) {
    Object.assign(this._fields, copy ? utils.object.copy(fields) : fields);
  }

  get form() {
    return this._builder;
  }

  async createForm(
    defaults?: DataFieldDescriptor<DTO>,
    onCreate?: ((form: DataFormBuilder<DTO>) => void | Promise<void>) | null,
    dataFields?: DataFieldRecords<DTO>,
  ) {
    this._builder = new DataFormBuilder(this._fields, {
      dataFields: { ...(await this.dataFields), ...dataFields },
      defaults: {
        readonly: this.readonly,
        ...defaults,
      },
    });

    this._builder = await this.onCreateForm(this._builder);

    await onCreate?.(this._builder);

    return this._builder;
  }

  async submit(): Promise<
    | (ReturnType<this["onSubmit"]> extends Promise<any>
        ? Awaited<ReturnType<this["onSubmit"]>>
        : ReturnType<this["onSubmit"]>)
    | null
  > {
    this._errors = null;

    await this._builder?.validator.validate().catch((errors) => {
      this._errors = errors;
      this.onErrors();
      console.error(errors);
    });

    return this._errors ? null : await this.onSubmit();
  }

  abstract onSubmit(): any;

  async onCreateForm(form: DataFormBuilder<DTO>) {
    return form;
  }

  onErrors() {}
}
