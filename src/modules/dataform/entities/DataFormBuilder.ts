import type {
  DataFieldDescriptor,
  DataFieldRecords,
  DataFormBuild,
  DataFormBuilderConfigInterface,
  DataFormFieldGroup,
} from "@/modules/dataform";

import type { ValidationRulesInterface } from "@/app/validation/ValidationRules";
import type {
  ValidationMessages,
  ValidationModel,
} from "@/app/validation/Validator";

import type { Locale } from "@/plugins/vuei18n";

import { App } from "@/app/App";
import { Validator } from "@/app/validation/Validator";
import { ValidationRules } from "@/app/validation/ValidationRules";
import { FormService } from "@/modules/dataform/services/FormService";
import { SnippetService } from "@/modules/dataform/services/SnippetService";

import utils from "@/utils";
import dataValidationMessages from "@/app/validation/metadata/dataValidationMessages";
import { Dictionary } from "@/app/dictionary/Dictionary";

export class DataFormBuilder<DTO extends object = object> {
  readonly form: FormService<DTO> = new FormService(this);

  readonly snippet: SnippetService<DTO> = new SnippetService(this);

  readonly locale: Locale | "" = "";

  protected _dataFields: DataFieldRecords<DTO> = {};

  protected _rules: ValidationModel<DTO> = {};

  protected _groups: DataFormFieldGroup<DTO>[] = [];

  protected _formID = utils.randomNodeId(5);

  protected _groupID = utils.randomNodeId(5);

  protected declare _validator: Validator<DTO>;

  private _build: DataFieldRecords<DTO> = {};

  private _formBuild: DataFormBuild<DTO> = [];

  private _unsetFields = new Set<keyof DTO>([]);

  private readonly _fieldStore: Partial<DTO> = {};

  constructor(
    readonly fields: DTO,
    {
      dataFields = {},
      groups,
      groupCss,
      validationModel,
      validationRules,
      validationMessages,
      locale,
      defaults,
    }: Partial<DataFormBuilderConfigInterface<DTO>>,
  ) {
    this._fieldStore = utils.object.copy(fields);
    this.locale = locale || App.locale;

    Object.assign(this._dataFields, dataFields);
    defaults && this.setDataFieldDefaults(defaults);

    this.setGroups(groups);
    groupCss && this.setGroupsCss(groupCss);

    this.setValidator(
      validationModel ?? {},
      validationRules,
      validationMessages,
    );
  }

  get build(): DataFormBuild<DTO> {
    return this._formBuild.length ? this._formBuild : this.buildForm();
  }

  get validator(): Validator<DTO> {
    return this._validator;
  }

  buildForm(): DataFormBuild<DTO> {
    return (this._formBuild = this._groups.map((group) => ({
      ...group,
      id: group.id.startsWith(this._formID)
        ? group.id
        : `${this._formID}_group_${group.id}`,
      fields: group.fields.map((field) => this.compile(field)),
    })));
  }

  getDataField<Field extends keyof DTO>(
    field: keyof DTO,
  ): DataFieldRecords<DTO>[Field] {
    return this._build[field] || this._dataFields[field];
  }

  setDataFields(data: DataFieldRecords<DTO>, groupID: string = "") {
    this._dataFields = utils.object.merge(this._dataFields, data);

    const group = this.getGroup(groupID);

    group &&
      (group.fields = [
        ...new Set([
          ...group.fields,
          ...(Object.keys(this._dataFields) as (keyof DTO)[]),
        ]),
      ]);
  }

  setDataFieldDefaults(data: DataFieldDescriptor<DTO>) {
    Object.keys(this._dataFields).forEach((field) => {
      Object.assign(this._dataFields[field], {
        ...data,
        ...this._dataFields[field],
      });
    });

    return this;
  }

  getFormBuild() {
    return { ...this._build };
  }

  setBuild(
    field: keyof DTO,
    data: DataFieldDescriptor<DTO>,
  ): DataFieldDescriptor<DTO> {
    return Object.assign((this._build[field] ||= {}), data);
  }

  update(fields: { [K in keyof DTO]?: any }) {
    Object.assign(this.fields, fields);

    this.form.update(Object.keys(fields) as Array<keyof DTO>);
  }

  save(fields: { [K in keyof DTO]?: any }) {
    this.form.saveLock(Object.keys(fields) as Array<keyof DTO>);

    this.update(fields);
  }

  get fieldPrefix() {
    return `${this._formID}_field`;
  }

  compile(
    field: keyof DTO,
    data?: DataFieldDescriptor<DTO>,
  ): DataFieldDescriptor<DTO> {
    this.resetBuild(field);

    data ||= { ...this._dataFields[field]! };
    data.id ??= `${this.fieldPrefix}_${field as string}`;
    data.field ??= field;
    data.label ??= Dictionary.attr[data.field as string];
    data.builder ||= this;
    data.validator ??= this._validator;
    data.dataType ||= "input";
    data.locale ||= this.locale;

    this.form.intersectBooleanSelection(data);
    this.form.callSelection(data.field, data);
    this.form.intersectDate(data);

    const build = this.setBuild(data.field, data);

    (async () => {
      await this.form.makeSelection(data.field!);
      await this.form.intersectMultiSelection(build);
    })();

    this.form.setWatcher(data.field, build);

    build.rules && (this._rules[data.field] = build.rules);

    return build;
  }

  get groupPrefix() {
    return `${this._formID}_group`;
  }

  getGroup(groupID: string = "") {
    groupID ||= this._groupID;

    return this._groups.find(
      (group) => group.id === `${this.groupPrefix}_${groupID}`,
    );
  }

  setGroups(groups: DataFormFieldGroup<DTO>[] = []) {
    this._groups = groups.length
      ? groups
      : [
          {
            id: this._groupID,
            name: "",
            fields: Object.keys(this._dataFields) as (keyof DTO)[],
          },
        ];

    this._groups.forEach((group) => {
      group.id = `${this.groupPrefix}_${group.id || utils.randomNodeId(5)}`;
    });

    return this;
  }

  setGroupsCss(css: string | string[], groupIds?: string[]) {
    const groupSet = new Set(
      groupIds
        ? groupIds.map((id) => `${this.groupPrefix}_${id}`)
        : this._groups.map(({ id }) => id),
    );

    this._groups.forEach((group) => {
      groupSet.has(group.id) && (group.css = css);
    });

    return this;
  }

  setValidator<Rules extends ValidationRulesInterface<DTO>>(
    model: ValidationModel<DTO>,
    validationRules?: Rules,
    validationMessages?: ValidationMessages<Rules>,
  ) {
    this.setValidationModel(model);

    this._validator = new Validator(
      this.fields,
      this._rules,
      validationRules ??
        new ValidationRules(
          this.fields,
          validationMessages ?? dataValidationMessages()[this.locale],
        ),
    );

    return this;
  }

  setValidationModel(model: ValidationModel<DTO>) {
    Object.assign(this._rules, model);

    Object.keys(this._dataFields).forEach((field) => {
      const dataField: DataFieldDescriptor<DTO> = this._dataFields[field];
      const rules = model[field] || dataField.rules;

      rules && (this._rules[field] = rules);
    });

    return this;
  }

  resetBuild(field: keyof DTO | Array<keyof DTO>) {
    const fields = Array.isArray(field) ? field : [field];

    for (const field of fields) {
      field in this._build && (this._build[field] = {});
    }
  }

  setRules(rules: ValidationModel<DTO>) {
    Object.assign(this._rules, rules);
  }

  resetRules(field: keyof DTO) {
    field in this._rules && (this._rules[field] = []);
  }

  unsetFields(fields: Array<keyof DTO>) {
    for (const field of fields) {
      this._unsetFields.add(field);
    }

    return this;
  }

  restoreFields(fields: Array<keyof DTO>) {
    for (const field of fields) {
      this._unsetFields.delete(field);
    }

    return this;
  }

  isSetField(field: keyof DTO) {
    return !this._unsetFields.has(field) && field in this._dataFields;
  }

  resetFields(fields?: Array<keyof DTO> | keyof DTO) {
    const fieldSet = (
      Array.isArray(fields) ? fields : fields ? [fields] : []
    ) as Array<keyof DTO>;

    const resets = (
      fieldSet.length ? fieldSet : Object.keys(this._fieldStore)
    ) as Array<keyof DTO>;

    resets.forEach((field) => {
      if (this.form.isResetLock(field)) return;

      const value = this._fieldStore[field];

      this.fields[field as string] =
        value && typeof value === "object"
          ? utils.object.copy(value as object)
          : value;
    });
  }
}
