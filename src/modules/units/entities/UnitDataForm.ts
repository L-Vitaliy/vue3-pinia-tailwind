import { BaseDataForm } from "@/modules/dataform/entities/BaseDataForm";
import type {
  NewUnitAttributes,
  UnitAttributes,
} from "@/modules/units/metadata/dataUnitAttributes";

import dataUnitAttributes from "@/modules/units/metadata/dataUnitAttributes";
import dataUnitForm from "@/modules/units/metadata/dataUnitForm";
import type { UnitManager } from "@/modules/units/entities/UnitManager";

export class NewUnitDataForm<
  DTO extends NewUnitAttributes | UnitAttributes = NewUnitAttributes,
> extends BaseDataForm<DTO> {
  constructor(readonly manager: UnitManager) {
    super(dataUnitAttributes());
  }

  get dataFields() {
    return dataUnitForm<DTO>();
  }

  onSubmit() {
    delete this._fields.id;

    return this.manager.fetch().newUnit(this._fields);
  }
}

export class EditUnitDataForm extends NewUnitDataForm<UnitAttributes> {
  onSubmit() {
    return this.manager.fetch().editUnit(this._fields);
  }
}
