<script setup lang="ts">
import { inject } from "vue";
import useDialog from "@/compositions/useDialog";
import type { UnitManager } from "@/modules/units/entities/UnitManager";
import NewUnitForm from "@/modules/units/views/NewUnitForm.vue";
import PageTabsTeleportActionCreate from "@/views/system/PageTabsTeleportActionCreate.vue";
import UnitEditorDialog from "@/modules/units/views/UnitEditorDialog.vue";

const manager = inject("unitManager") as UnitManager;

const { dialog } = useDialog({
  dialog: {
    title: "dictionaries.titleNewMeasureUnit",
    actions: [
      {
        label: "app.save",
        on: {
          click: () => {
            manager.service.form.newUnit.submit().then((res) => {
              res && dialog.value?.close();
            });
          },
        },
      },
    ],
  },
});
</script>

<template>
  <PageTabsTeleportActionCreate :open="() => dialog?.open()" />

  <UIDialog ref="dialog" size="medium">
    <NewUnitForm />
  </UIDialog>

  <UnitEditorDialog />
</template>
