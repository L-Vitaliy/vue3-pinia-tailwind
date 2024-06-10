import type { DataFieldRecords } from "@/modules/dataform";

import type {
  NewUnitAttributes,
  UnitAttributes,
} from "@/modules/units/metadata/dataUnitAttributes";
import { Dictionary } from "@/app/dictionary/Dictionary";

export default <
  DTO extends NewUnitAttributes | UnitAttributes = NewUnitAttributes,
>(): DataFieldRecords<DTO> => ({
  name: {
    label: Dictionary.attr.shortName,
    rules: ["required", { maxLength: 100 }],
  },
  nameFull: {
    label: Dictionary.attr.fullName,
    rules: ["required", { maxLength: 100 }],
  },
});
