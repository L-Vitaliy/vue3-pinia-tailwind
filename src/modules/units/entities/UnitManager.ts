import { type Ref, reactive, ref } from "vue";
import { RestAPI } from "@/app/RestAPI";

import type { UnitAttributes } from "@/modules/units/metadata/dataUnitAttributes";
import type { RequestArg } from "@/api/metadata/dataRequest";

import { BaseAppServiceDispatcher } from "@/app/App";
import { FormService } from "@/modules/units/services/FormService";
import type { UseDataTableActions } from "@/modules/data_table";
import { routeTo } from "@/compositions/usePage";
import type { UseInstanceRef } from "@/compositions/useComponent";
import type Dialog from "@/views/ui/Dialog.vue";

export class UnitManager extends RestAPI {
  readonly serviceLocator = UnitManagerServiceLocator;

  readonly card: Ref<UnitAttributes | null> = ref(null);
  readonly cardDialog: UseInstanceRef<typeof Dialog> = ref(null);
  readonly listRef = ref(0);

  readonly restAPI = {
    newUnit: async (arg: RequestArg<"unit", "create">) => {
      return this.request
        .repo("unit")
        .create(arg)
        .then((res) => {
          res && this.updateList();

          return res;
        });
    },

    editUnit: async (arg: RequestArg<"unit", "edit">) => {
      return this.request
        .repo("unit")
        .edit(arg)
        .then((res) => {
          if (res) {
            const item = this.data.unitList?.list.find(
              (item) => item.id === res.id,
            );

            item && Object.assign(reactive(item), res);
          }

          if (res?.id === this.card.value?.id) {
            this.card.value = res;
          }

          return res;
        });
    },

    getUnit: async (arg: RequestArg<"unit", "get">) => {
      return this.request.repo("unit").get(arg);
    },

    cardUnit: async (arg: RequestArg<"unit", "get">) => {
      return this.restAPI.getUnit(arg).then((res) => {
        return (this.card.value = res);
      });
    },

    deleteUnit: async (arg: RequestArg<"unit", "delete">) => {
      return this.request.repo("unit").delete(arg);
    },

    unitList: async (arg: RequestArg<"unit", "list">) => {
      return this.request.repo("unit").list(arg);
    },
  };

  readonly gridActions: UseDataTableActions<UnitAttributes> = {
    rowClick: ({ row }) => {
      this.fetch()
        .cardUnit(row.id)
        .then((res) => {
          res && routeTo("units", { id: res.id });
        });
    },
    menu: {
      removeRow: (row) => {
        return this.fetch().deleteUnit(row.id);
      },
    },
  };

  updateList = () => {
    this.listRef.value++;
  };
}

export class UnitManagerServiceLocator extends BaseAppServiceDispatcher<
  UnitManager,
  { form: typeof FormService }
> {
  constructor(manager: UnitManager) {
    super(manager);
  }

  readonly records = {
    form: FormService,
  };
}
