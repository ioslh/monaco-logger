<template>
  <div class="loading" v-if="loading">loading monaco library</div>
  <slot v-else-if="scopeMonaco" :monaco="scopeMonaco" />
  <div class="error" v-else>monaco load failed</div>
</template>

<script lang="ts">
import { DeepReadonly, onMounted, ref, watch } from 'vue'
import MonacoLoader from '@monaco-editor/loader'
import type Monaco from 'monaco-editor'

let monaco: typeof Monaco
let monacoPromise: Promise<typeof Monaco>
;(window as any).MonacoEnvironment = {
  getWorkerUrl: function (workerId: any, label: any) {
    return '/worker-proxy.js'
  },
}

const monacoGetter = () => {
  if (monaco) return Promise.resolve(monaco)
  if (monacoPromise) return monacoPromise
  MonacoLoader.config({
    paths: {
      vs: '//cdn.jsdelivr.net/npm/monaco-editor@0.27.0/min/vs',
    },
  })
  return (monacoPromise = MonacoLoader.init().then(r => {
    return (monaco = r)
  }))
}
</script>

<script setup lang="ts">

let loading = $ref(true)
let scopeMonaco = $ref<DeepReadonly<typeof Monaco>>()

onMounted(async () => {
  loading = true
  scopeMonaco = await monacoGetter()
  loading = false
})
</script>

<style lang="scss" scoped>
.loading, .error {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>