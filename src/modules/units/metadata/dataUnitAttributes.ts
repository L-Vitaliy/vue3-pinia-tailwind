import type {
  DefineField,
  DefineUserEntity,
} from "@/api/metadata/attributes/dataAttributes";
import type { PartialBy } from "@/app/data/types";

export type UnitAttributes = ReturnType<typeof attributes>;
export type NewUnitAttributes = PartialBy<UnitAttributes, "id">;

const attributes = () => ({
  id: 0,
  name: null as DefineField<string>,
  nameFull: null as DefineField<string>,
  extId: "",
  refId: "", // uuid
  createdBy: null as DefineUserEntity,
  createdDate: "", // iso
  lastModifiedBy: null as DefineUserEntity,
  lastModifiedDate: "", // iso
});

export default attributes;
