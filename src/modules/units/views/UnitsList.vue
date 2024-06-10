<script setup lang="ts">
import type { UseDataTable } from "@/compositions/useDataTable";
import type { UnitAttributes } from "@/modules/units/metadata/dataUnitAttributes";
import dataUnitColumns from "@/modules/units/metadata/dataUnitColumns";

const props = defineProps<UseDataTable<UnitAttributes>>();
</script>

<template>
  <DataList :columns="dataUnitColumns" :data-table="props" />
</template>
