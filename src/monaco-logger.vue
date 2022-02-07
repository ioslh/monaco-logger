<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { onMounted, watch, type DeepReadonly, type CSSProperties } from 'vue'
import type Monaco from 'monaco-editor'
import { GROUP_START, GROUP_END, parseLineFragments } from './utils'
import type { RawLog, LogLine, LogGroup, InternalLogLine } from './types'

const supportDecos = ['command', 'info', 'general']
let editor = $shallowRef<Monaco.editor.IStandaloneCodeEditor | null>()
let container = $ref<HTMLDivElement>()
const ensureDispose = () => {
  if (editor) {
    editor.dispose()
    editor = null
  }
}

const props = defineProps<{
  monaco: DeepReadonly<typeof Monaco>
  wrap?: boolean
  showLineNumber?: boolean
  showTimestamp?: boolean
  logs: RawLog[]
  styles?: Record<string, CSSProperties>
  stylePrefix?: string
}>()

let decorationPrefix = $computed(() => props.stylePrefix || 'monaco-logger')
let maxLineNoWidth = $ref(0)
let timestampWidth = $ref(0)
let monacoFolders = $shallowRef<Array<[number, number]>>([])
let monacoValue = $ref('')
let monacoDecorations = $shallowRef<Monaco.editor.IModelDeltaDecoration[]>([])

const internalParse = () => {
  let maxLineNo = 0
  const groups: Array<[number, number]> = []
  let groupStart: number | undefined
  const monacoLogs: string[] = []
  const decorations: Monaco.editor.IModelDeltaDecoration[] = []
  if (props.logs.length) {
    timestampWidth = props.logs[0].timestamp.length
    props.logs.forEach((raw, idx) => {
      maxLineNo = Math.max(raw.lineNo, maxLineNo)
      if (raw.message.startsWith(GROUP_END) && typeof groupStart === 'number') {
        monacoLogs.push(raw.message)
        groups.push([groupStart, idx + 1])
        groupStart = undefined
        return
      }
      if (raw.message.startsWith(GROUP_START)) {
        monacoLogs.push(raw.message)
        groupStart = idx + 1
        return
      }
      let row = raw.lineNo
      const found = supportDecos.find(deco => {
        const start = `[${deco}]`
        if (raw.message.startsWith(start)) {
          decorations.push({
            range: new props.monaco.Range(row, 1, row, raw.message.length + 1),
            options: {
              inlineClassName: `${decorationPrefix}-style-${deco}`
            }
          })
          return true
        }
      })
      if (found) {
        monacoLogs.push(raw.message)
        return
      }

      const fragments = parseLineFragments(raw.message)
      let col = 0
      fragments.forEach(frg => {
        const klass = []
        if (frg.italic) {
          klass.push(`${decorationPrefix}-style-italic`)
        }
        if (frg.bold) {
          klass.push(`${decorationPrefix}-style-bold`)
        }
        if (frg.underline) {
          klass.push(`${decorationPrefix}-style-underline`)
        }
        if (frg.color) {
          klass.push(`${decorationPrefix}-color-${frg.color}`)
        }
        if (frg.background) {
          klass.push(`${decorationPrefix}-color-${frg.background}`)
        }
        const end = col + frg.message.length
        if (klass.length) {
          decorations.push({
            range: new props.monaco.Range(row, col + 1, row, end + 1),
            options: {
              inlineClassName: klass.join(' ')
            }
          })
        }
        col = end
      })
      monacoLogs.push(fragments.map(f => f.message).join(''))
    })
  }
  maxLineNoWidth = String(maxLineNo).length
  monacoValue = monacoLogs.join('\n')
  monacoFolders = groups
  monacoDecorations = decorations
  if (editor) {
    applyValue()
    applyMargin()
    applyFolders()
    applyDecorations()
  }
}

const applyValue = () => {
  if (editor) {
    editor.setValue(monacoValue)
  }
}

let prevFolder: Monaco.IDisposable | null = null
const applyFolders = () => {
  if (prevFolder) {
    prevFolder.dispose()
    prevFolder = null
  }
  prevFolder = props.monaco.languages.registerFoldingRangeProvider('plaintext', {
    provideFoldingRanges: () => monacoFolders.map(([start, end]) => ({
      start,
      end,
      kind: props.monaco.languages.FoldingRangeKind.Region,
    }))
  })
}

const SPACE = 1
const applyMargin = () => {
  if (!editor) return
  if (!props.showLineNumber && !props.showTimestamp) {
    editor.updateOptions({
      lineNumbers: 'off'
    })
    return
  }
  let prefixGen = (n: number) => String(n)
  let prefixWidth = 5
  if (props.showTimestamp && props.showLineNumber) {
    prefixWidth = SPACE + maxLineNoWidth + timestampWidth
    prefixGen = (n: number) => {
      const line = props.logs[n - 1]
      return `
        <div class="monaco-logger-margin">
          <span class="lineno">${line.lineNo}</span>
          <span class="timestamp">${line.timestamp}</div>
        </div>
      `
    }
  } else if (props.showTimestamp) {
    // only show timestamp
    prefixWidth = timestampWidth
    prefixGen = (n: number) => {
      const line = props.logs[n - 1]
      return `
        <div class="monaco-logger-margin">
          <span class="timestamp">${line.timestamp}</div>
        </div>
      `
    }
  } else {
    // only show line no
    prefixWidth = maxLineNoWidth
    prefixGen = (n: number) => {
      const line = props.logs[n - 1]
      return `
        <div class="monaco-logger-margin">
          <span class="lineno">${line.lineNo}</span>
        </div>
      `
    }
  }
  editor.updateOptions({
    lineNumbersMinChars: prefixWidth,
    lineNumbers: prefixGen
  })
}

const applyDecorations = () => {
  if (!editor) return
  editor.deltaDecorations([], monacoDecorations)
}

const applyWrap = () => {
  if (!editor) return
  editor.updateOptions({
    wordWrap: props.wrap ? 'on' : 'off'
  })
}

const initLogViewer = () => {
  ensureDispose()
  editor = props.monaco.editor.create(container, {
    glyphMargin: true,
    value: '',
    language: 'plaintext',
    theme: 'vs-dark',
    fontSize: 14,
    fixedOverflowWidgets: true,
    scrollBeyondLastLine: false,
    smoothScrolling: true,
    minimap: { enabled: false },
    readOnly: true,
    padding: {
      top: 5,
      bottom: 15,
    },
  })
  internalParse()
}

defineExpose({
  editor: $$(editor),
})

watch(() => props.logs, internalParse)
watch(() => props.wrap, applyWrap, { immediate: true })
watch(() => `${props.showTimestamp}-${props.showLineNumber}`, applyMargin)


onMounted(initLogViewer)
</script>

<style lang="scss" scoped>
@import url(./theme.scss);

.container {
  width: 100%;
  height: 100%;
  :deep(.monaco-logger-margin) {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .timestamp {
      color: #fff;
    }
  }
}
</style>