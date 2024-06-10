import type { DataTableColumns } from "@/app/data/app_config/metadata/dataColumns";
import { Dictionary } from "@/app/dictionary/Dictionary";
import type { UnitAttributes } from "@/modules/units/metadata/dataUnitAttributes";

export default (): DataTableColumns<UnitAttributes> => ({
  name: {
    name: Dictionary.attr.shortName,
  },
  nameFull: {
    name: Dictionary.attr.fullName,
  },
});
