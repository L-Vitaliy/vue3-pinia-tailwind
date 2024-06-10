import type { AutoCompleteCompleteEvent } from "primevue/autocomplete";
import { type Ref, ref } from "vue";
import type {
  DefineAuthorDates,
  DefineEntity,
  DefineEntityRecord,
  DefineFilter,
} from "@/api/metadata/attributes/dataAttributes";
import type { SearchLookupResponse } from "@/api/metadata/dataResponse";
import { request } from "@/api/service/Request";

import type { SearchLookupCode } from "@/api/metadata/dataRequest";
import type { DataFieldDescriptor, DataFieldRecords } from "@/modules/dataform";
import { getMessage } from "@/compositions/useIntl";
import dataFilterForm from "@/app/data/app_config/metadata/dataFilterForm";
import type { PartialBy } from "@/app/data/types";
import dataAutoCompleteOptionKeys from "@/app/data/app_config/metadata/dataAutoCompleteOptionKeys";
import utils from "@/utils";
import type { Dictionary } from "@/app/dictionary/Dictionary";
import type { DefineAttributeName } from "@/api/metadata/attributes/dataDefineAttributes";
import {
  ATTRIBUTE_ORGANIZATION,
  ATTRIBUTE_TENANT_ID,
  ATTRIBUTE_WAREHOUSE,
} from "@/api/constants/attributeNames";

type DataFieldProperty<DTO extends object = object> = Pick<
  DataFieldDescriptor<DTO>,
  | "autocomplete"
  | "selection"
  | "selectContext"
  | "search"
  | "numeric"
  | "dataType"
  | "onSetValue"
  | "switcher"
  | "switcherTexts"
  | "valueGetter"
  | "valueSetter"
>;

export function searchLookup<DTO extends object>(
  code: SearchLookupCode,
  getTenantID?: (data: DataFieldDescriptor<DTO>) => number,
  onGetList?: (searchList: SearchLookupResponse) => SearchLookupResponse,
): DataFieldProperty<DTO> {
  return {
    dataType: "select",
    selectContext: true,
    numeric: true,
    search: true,
    selection: async (make, data, searchValue) => {
      let tenantID: any = undefined;

      if (getTenantID && !(tenantID = getTenantID(data))) {
        return make([], "id", "name");
      }

      const searchList =
        (await searchContext(code, searchValue, tenantID)) ?? [];

      return make(onGetList ? onGetList(searchList) : searchList, "id", "name");
    },
  };
}

export function getAutocomplete<DTO extends object>(
  search: NonNullable<DataFieldDescriptor<DTO>["autocomplete"]>["search"],
  keys?: Pick<
    NonNullable<DataFieldDescriptor["autocomplete"]>,
    "labelKey" | "valueKey"
  >,
): DataFieldProperty<DTO> {
  return {
    autocomplete: {
      search,
      ...(keys ?? dataAutoCompleteOptionKeys()),
    },
  };
}

export function searchLookupAutocomplete<DTO extends object>(
  code: SearchLookupCode,
  getTenantID?: null | ((data: DataFieldDescriptor<DTO>) => number),
  onGetList?: (searchList: SearchLookupResponse) => SearchLookupResponse,
): DataFieldProperty<DTO> {
  return getAutocomplete(async (searchValue, data) => {
    const tenantID = getTenantID?.(data);

    const searchList = (await searchContext(code, searchValue, tenantID)) ?? [];

    return onGetList?.(searchList) ?? searchList;
  });
}

export async function searchContext(
  code: SearchLookupCode,
  searchValue?: string,
  tenantID?: number,
) {
  const result =
    (await request
      .bg()
      .repo("search")
      .lookup({
        topic: code,
        t: searchValue ?? "",
        u: tenantID || undefined,
      })) ?? [];

  return utils.object.sortObjects(result, "name");
}

export function getManualSwitcher<DTO extends object>({
  assign,
  iterable,
}: {
  assign?: Partial<DataFieldRecords>;
  iterable?: boolean;
} = {}): DataFieldProperty<DTO> {
  const setter: DataFieldProperty<DTO>["valueSetter"] = iterable
    ? (value: string): DefineEntityRecord[] | null =>
        value ? [{ name: value }] : null
    : (value: string): DefineEntityRecord | null =>
        value ? { name: value } : null;

  const getter: DataFieldProperty<DTO>["valueGetter"] = iterable
    ? (value: DefineEntityRecord[]) => value?.[0]?.name
    : (value: DefineEntity) => value?.name;

  return {
    switcher: () => ({
      valueSetter: setter,
      valueGetter: getter,
      ...assign,
    }),
    ...switcherTexts(),
  };
}

export function getAutoCompleteSwitcher<DTO extends object>(
  code: SearchLookupCode,
  assign: Partial<DataFieldRecords> = {},
): DataFieldProperty<DTO> {
  return {
    ...searchLookupAutocomplete(code),
    ...getManualSwitcher({ assign }),
  };
}

export function useSearchAutocomplete(
  code: SearchLookupCode,
  getTenant?: () => number | undefined,
): {
  list: Ref<SearchLookupResponse>;
  search: (event: AutoCompleteCompleteEvent) => Promise<SearchLookupResponse>;
} {
  const list = ref<SearchLookupResponse>([]);

  async function search(event: AutoCompleteCompleteEvent) {
    const tenantID = getTenant?.();

    const result = await searchContext(code, event.query, tenantID);

    return (list.value = result ?? []);
  }

  return {
    list,
    search,
  };
}

export function getTenantByAirportAutocomplete<
  DTO extends Partial<Record<DefineAttributeName, any>>,
>(
  dictionary: Dictionary,
  {
    warehouse = ATTRIBUTE_WAREHOUSE,
    organization = ATTRIBUTE_ORGANIZATION,
  }: {
    warehouse?: keyof DTO;
    organization?: keyof DTO;
  } = {},
): DataFieldProperty<DTO> {
  return {
    ...getAutocomplete(dictionary.searchAirportsByTenants),
    onSetValue(value: DefineEntity, data) {
      if (!value?.id) return;

      const tenantId = dictionary.getTenantIdByAirport(value) || null;

      const update: { [key in keyof DTO]?: any } = {
        [ATTRIBUTE_TENANT_ID]: tenantId,
      };

      const warehouseEntity = tenantId
        ? (tenantId && dictionary.getWarehouseByTenantId(tenantId)) ?? null
        : null;

      if (tenantId && warehouse && warehouse in data.builder!.fields) {
        update[warehouse] = warehouseEntity;
      }

      if (
        tenantId &&
        warehouse &&
        "items" in data.builder!.fields &&
        Array.isArray(data.builder!.fields.items)
      ) {
        for (const item of data.builder!.fields.items) {
          warehouse in item && (item[warehouse] = warehouseEntity);
        }
      }

      if (
        tenantId &&
        organization &&
        organization in data.builder!.fields &&
        !data.builder!.fields[organization]
      ) {
        update[organization] = dictionary.getOrganizationByTenantId(tenantId);
      }

      data.builder!.update(update);
    },
  };
}

export function switcherTexts<DTO extends object>(): DataFieldProperty<DTO> {
  return {
    switcherTexts: {
      textSwitcherOn: getMessage("app.dataFormSwitcherSelectFromDictionary"),
      textSwitcherOff: getMessage("app.dataFormSwitcherTypeText"),
    },
  };
}

export function getAuthorDateFieldSet<DTO extends DefineAuthorDates>(
  assign: Partial<DataFieldRecords<DTO>> = {},
): DataFieldRecords<DTO> {
  return {
    createdBy: {
      fieldset: ["createdBy", "createdDate"],
      valueGetter(value) {
        return value?.name ?? value;
      },
      ...assign["createdBy"],
      props: {
        disabled: true,
        ...assign["createdBy"]?.props,
      },
    },
    createdDate: {
      dataType: "date",
      ...assign["createdDate"],
      props: {
        disabled: true,
        showIcon: false,
        ...assign["createdDate"]?.props,
      },
    },
    lastModifiedBy: {
      fieldset: ["lastModifiedBy", "lastModifiedDate"],
      valueGetter(value) {
        return value?.name ?? value;
      },
      ...assign["lastModifiedBy"],
      props: {
        disabled: true,
        showIcon: false,
        ...assign["lastModifiedBy"]?.props,
      },
    },
    lastModifiedDate: {
      dataType: "date",
      ...assign["lastModifiedDate"],
      props: {
        disabled: true,
        showIcon: false,
        ...assign["lastModifiedDate"]?.props,
      },
    },
  };
}

export function getAuthorFields<DTO extends DefineAuthorDates>(
  assign: Partial<DataFieldRecords<DTO>> = {},
): DataFieldRecords<DTO> {
  const fields = getAuthorDateFieldSet(assign);

  delete fields.createdBy?.fieldset;
  delete fields.lastModifiedBy?.fieldset;

  return fields;
}

export function getProductFilterFields<
  DTO extends PartialBy<DefineFilter, "documentType">,
>(documentTypes?: Record<string, string>): DataFieldRecords<DTO> {
  const fields = dataFilterForm<DTO>([
    "documentType",
    "exportStatus",
    "periodStart",
    "periodEnd",
    "filter",
  ]);

  if (documentTypes && fields.documentType) {
    fields.documentType.selection = () => documentTypes;
  } else {
    delete fields.documentType;
  }

  return fields;
}
