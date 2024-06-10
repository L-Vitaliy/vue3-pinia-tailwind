<script setup lang="ts">
import { provide, reactive, toRefs } from "vue";
import UnitCard from "@/modules/units/views/UnitCard.vue";
import { UnitManager } from "@/modules/units/entities/UnitManager";
import UnitsList from "@/modules/units/views/UnitsList.vue";
import ManageUnit from "@/modules/units/views/ManageUnit.vue";

const props = defineProps<{ id?: number }>();

const manager = reactive(new UnitManager());

const { card, listRef } = toRefs(manager);

props.id && manager.fetch().cardUnit(props.id);

provide("unitManager", manager);
</script>

<template>
  <div>
    <UnitCard v-if="id && card" />

    <UnitsList
      v-show="!id"
      :key="listRef"
      :fetch="manager.fetch().unitList"
      :on-action="manager.gridActions"
    />

    <ManageUnit />
  </div>
</template>
