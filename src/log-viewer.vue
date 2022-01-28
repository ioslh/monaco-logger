<template>
  <div ref="container" class="container"></div>
</template>

<script lang="ts">
import { onMounted, watch, type DeepReadonly, type CSSProperties } from 'vue'
import type Monaco from 'monaco-editor'
import type { LogLine, LogGroup } from './types'

let editor: Monaco.editor.IStandaloneCodeEditor | null = null

const ensureDispose = () => {
  if (editor) {
    editor.dispose()
    editor = null
  }
}
</script>

<script setup lang="ts">
let container = $ref<HTMLDivElement>()

const props = defineProps<{
  monaco: DeepReadonly<typeof Monaco>
  wrap?: boolean
  showLineNumber?: boolean
  showTimestamp?: boolean
  logs: Array<LogLine | LogGroup>
  styles?: Record<string, CSSProperties>
}>()

let flattenLogs = $ref<LogLine[]>([])
const setValue = () => {
  if (editor) {
    editor.setValue(flattenLogs.map(l => l.message).join('\n'))
    editor.deltaDecorations([], [{
      range: new props.monaco.Range(1, 1, 2, 10),
      options: {
        before: {
          content: 'hello world',
          inlineClassName: 'timestamp'
        }
      }
    }])
  }
}

const setWrap = () => {
  if (editor) {
    editor.updateOptions({
      wordWrap: props.wrap ? 'on' : 'off'
    })
  }
}

const internalParse = () => {
  let ls: LogLine[] = []
  for(let i = 0; i < props.logs.length; i++) {
    const l = props.logs[i]
    if ('groupName' in l) {
      ls.push({
        message: l.groupName,
        timestamp: l.timestamp,
        lineNo: l.lineNo
      })
      ls = ls.concat(l.lines)
    } else {
      ls.push(l)
    }
  }
  flattenLogs = ls
}

const initLogViewer = () => {
  ensureDispose()
  editor = props.monaco.editor.create(container, {
    glyphMargin: true,
    value: '',
    language: 'plaintext',
    theme: 'vs-dark',
    fontSize: 14,
    lineDecorationsWidth: -5,
    fixedOverflowWidgets: true,
    smoothScrolling: true,
    minimap: { enabled: false },
    readOnly: true,
    padding: {
      top: 5,
      bottom: 15,
    },
  })

  setValue()
  setWrap()
}

watch(() => [...props.logs], internalParse, { immediate: true })
watch(() => props.wrap, setWrap, { immediate: true })

onMounted(initLogViewer)
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  height: 100%;
}
</style>