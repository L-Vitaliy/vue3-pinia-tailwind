<script setup lang="ts">
import { inject } from "vue";
import DataForm from "@/modules/dataform/views/DataForm.vue";
import type { UnitManager } from "@/modules/units/entities/UnitManager";

const manager = inject("unitManager") as UnitManager;

const form = manager.service.form.newUnit.init().createForm();
</script>

<template>
  <DataForm :builder="form" inline />
</template>
