import {
  EditUnitDataForm,
  NewUnitDataForm,
} from "@/modules/units/entities/UnitDataForm";
import type { UnitManager } from "@/modules/units/entities/UnitManager";

export class FormService {
  private declare _newUnit: NewUnitDataForm;
  private declare _editUnit: EditUnitDataForm;

  constructor(readonly manager: UnitManager) {}

  get newUnit() {
    return (this._newUnit ||= new NewUnitDataForm(this.manager));
  }

  get editUnit() {
    return (this._editUnit ||= new EditUnitDataForm(this.manager));
  }
}
