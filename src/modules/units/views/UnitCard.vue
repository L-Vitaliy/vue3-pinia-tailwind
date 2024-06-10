<script setup lang="ts">
import { inject, toRefs, watch } from "vue";
import { onPageOut } from "@/compositions/usePage";
import DataForm from "@/modules/dataform/views/DataForm.vue";
import PageTitle from "@/views/system/PageTitle.vue";
import { getAuthorFields } from "@/compositions/useDataForm";
import type { UnitManager } from "@/modules/units/entities/UnitManager";

const manager = inject("unitManager") as UnitManager;

const { card, cardDialog } = toRefs(manager);

const cardForm = manager.service.form.editUnit
  .init(card.value)
  .createForm({ readonly: true }, null, getAuthorFields());

watch(card, () => {
  cardForm.then((builder) => card.value && builder.update(card.value));
});

onPageOut(() => {
  card.value = null;
});
</script>

<template>
  <div v-if="card" class="card">
    <PageTitle :title="card.nameFull ?? card.id" page-back-to="units">
      <UIButton
        :props="{ size: 'small', icon: 'pi pi-pencil' }"
        label="app.edit"
        @click="cardDialog?.open"
      />
    </PageTitle>

    <DataForm :builder="cardForm" inline class="max-w-card" />
  </div>
</template>
