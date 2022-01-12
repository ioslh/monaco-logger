<template>
  <div class="page">
    <div class="left">
      <checkbox v-model:value="softWrap">soft wrap</checkbox>
      <checkbox v-model:value="showTimestamp">show timestamp</checkbox>
      <checkbox v-model:value="showLineNumber">show line number</checkbox>
    </div>
    <div class="right">
      <monaco-provider #default="{ monaco }">
        <log-viewer
          :logs="logs"
          :monaco="monaco"
          :soft-wrap="softWrap"
          :show-timestamp="showTimestamp"
          :show-line-number="showLineNumber"
        />
      </monaco-provider>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonacoProvider from './monaco.vue'
import LogViewer from './log-viewer.vue'
import type { LogLine, LogGroup } from './types'
import { onMounted } from 'vue'
import logParser from './log-parser'
import Checkbox from './checkbox.vue'

let logs = $ref<Array<LogLine | LogGroup>>([])
let softWrap = $ref(true)
let showTimestamp = $ref(true)
let showLineNumber = $ref(true)


onMounted(() => {
  fetch('/github-log.txt').then(async res => {
    const raw = await res.text()
    console.log(logs = logParser(raw))
  })
})
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}
</style>

<style lang="scss" scoped>
.page {
  width: 100vw;
  height: 100vh;
  display: flex;
}
.left {
  flex: 0 0 300px;
  border-right: 1px solid #aaa;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 20px;
}

.right {
  flex: 1;
}
</style>