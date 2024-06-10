<script setup lang="ts">
import { inject, onMounted, ref, toRefs } from "vue";
import useDialog from "@/compositions/useDialog";
import DataForm from "@/modules/dataform/views/DataForm.vue";
import type { UnitManager } from "@/modules/units/entities/UnitManager";

const manager = inject("unitManager") as UnitManager;

const { card, cardDialog } = toRefs(manager);

const editForm = ref();

const { dialog } = useDialog({
  dialog: {
    title: "dictionaries.titleEditMeasureUnit",
    onOpen() {
      editForm.value = manager.service.form.editUnit
        .init(card.value)
        .createForm();
    },
    actions: [
      {
        label: "app.save",
        on: {
          click: () => {
            manager.service.form.editUnit.submit().then((res) => {
              res && dialog.value?.close();
            });
          },
        },
      },
    ],
  },
});

onMounted(() => {
  cardDialog.value = dialog.value;
});
</script>

<template>
  <UIDialog ref="dialog" size="medium">
    <DataForm :builder="editForm" inline />
  </UIDialog>
</template>
