<template>
  <div class="page">
    <div class="left">
      <checkbox v-model:value="wrap">wrap line</checkbox>
      <checkbox v-model:value="showTimestamp">show timestamp</checkbox>
      <checkbox v-model:value="showLineNumber">show line number</checkbox>
    </div>
    <div class="right" ref="containerRef">
      <monaco-provider #default="{ monaco }">
        <monaco-logger
          ref="loggerRef"
          :logs="logs"
          :monaco="monaco"
          :wrap="wrap"
          :show-timestamp="showTimestamp"
          :show-line-number="showLineNumber"
          :styles="presetStyles"
        />
      </monaco-provider>
    </div>
  </div>
</template>

<script setup lang="ts">
import MonacoProvider from '@src/monaco-provider.vue'
import MonacoLogger from '@src/monaco-logger.vue'
import type { RawLog } from '@src/types'
import { onMounted, watch, type CSSProperties } from 'vue'
import useNodeSize from './use-node-size'
import Checkbox from './checkbox.vue'

const presetStyles = {
  info: {
    color: 'red',
    background: 'blue',
    textDecoration: 'underline'
  },
  warn: {},
  error: {
    color: 'red',
  },
  command: {},
} as Record<string, CSSProperties>

let containerRef = $ref<HTMLDivElement>()
let loggerRef = $ref<typeof MonacoLogger>()
let logs = $ref<RawLog[]>([])
let wrap = $ref(true)
let showTimestamp = $ref(true)
let showLineNumber = $ref(true)

const rect = useNodeSize<HTMLDivElement>($$(containerRef))
watch(rect, () => {
  if (loggerRef) {
    console.log('wull resize')
    loggerRef.editor.layout()
  }
})

onMounted(() => {
  fetch('/monaco-logger/github-log.txt').then(async res => {
    const raw = await res.text()
    let spaceIndex: number
    logs = raw.split('\n').map((l, idx) => {
      spaceIndex = spaceIndex || l.indexOf(' ')
      return {
        lineNo: idx + 1,
        timestamp: l.slice(0, spaceIndex),
        message: l.slice(spaceIndex + 1),
      }
    })
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
  overflow: hidden;
}
</style>