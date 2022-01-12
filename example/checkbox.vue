<template>
  <label :for="inputId">
    <input
      type="checkbox"
      :id="inputId"
      :checked="checked"
      @change="e => checked = (e as any).target.checked"
    />
    <slot></slot>
  </label>
</template>

<script lang="ts">
let id = 0

const getId = () => `${Math.random().toString(16).slice(2)}-${id++}`
</script>

<script setup lang="ts">
const props = defineProps<{
  value?: boolean
}>()

const emit = defineEmits(['update:value'])
const inputId = getId()

const checked = $computed({
  get: () => props.value,
  set: v => emit('update:value', v)
})
</script>

<style lang="scss" scoped>
label {
  cursor: pointer;
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>