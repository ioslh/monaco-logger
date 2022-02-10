<template>
  <div ref="container" class="container"></div>
</template>

<script setup lang="ts">
import { onMounted, watch, type DeepReadonly, type CSSProperties } from 'vue'
import type Monaco from 'monaco-editor'
import { GROUP_START, GROUP_END, parseLineFragments } from './utils'
import type { RawLog, LogLine, LogGroup, InternalLogLine } from './types'

const languageId = 'monaco-logger'
const languageTheme = 'monaco-logger-theme'

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
let monacoValue = $ref('')
let monacoDecorations = $shallowRef<Monaco.editor.IModelDeltaDecoration[]>([])

const internalParse = () => {
  let maxLineNo = 0
  const monacoLogs: string[] = []
  const decorations: Monaco.editor.IModelDeltaDecoration[] = []
  if (props.logs.length) {
    timestampWidth = props.logs[0].timestamp.length
    props.logs.forEach((raw, idx) => {
      maxLineNo = Math.max(raw.lineNo, maxLineNo)
      let row = idx + 1
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
            range: new props.monaco.Range(idx + 1, col + 1, idx + 1, end + 1),
            options: {
              inlineClassName: klass.join(' ')
            }
          })
        }
        col = end
      })
      monacoLogs.push(fragments.map(f => f.message).join(''))
    })
    console.log(decorations)
    monacoDecorations = decorations
    monacoValue = monacoLogs.join('\n')
  }
  maxLineNoWidth = String(maxLineNo).length
  if (editor) {
    applyValue()
    applyMargin()
    applyDecorations()
  }
}

const applyDecorations = () => {
  if (!editor) return
  console.log('will apply')
  editor.deltaDecorations([], monacoDecorations)
}

const applyValue = () => {
  if (editor) {
    editor.setValue(monacoValue)
  }
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

const applyWrap = () => {
  if (!editor) return
  editor.updateOptions({
    wordWrap: props.wrap ? 'on' : 'off'
  })
}

const initLogViewer = () => {
  ensureDispose()
  props.monaco.languages.register({ id: languageId })
  props.monaco.languages.setLanguageConfiguration(languageId, {
    folding: {
      markers: {
        start: /^##\[group\]/,
        end: /^##\[endgroup\]/,
      }
    }
  })
  props.monaco.languages.setMonarchTokensProvider(languageId, {
    tokenizer: {
      root: ['info', 'general', 'command'].reduce((res, t) => {
        // const identify = `\\[${t}\\]`
        // res.push([new RegExp(identify), `monaco-logger-tag`])
        res.push([new RegExp(`^\\[${t}\\].*`), `monaco-logger-${t}`])
        return res
      }, [] as Array<[RegExp, string]>)
    }
  })
  props.monaco.editor.defineTheme(languageTheme, {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'monaco-logger-info', foreground: 'ff0000' },
      { token: 'monaco-logger-general', foreground: 'ff00ff' },
      { token: 'monaco-logger-command', foreground: '00ffff' },
      { token: 'monaco-logger-tag', fontStyle: 'bold', foreground: 'ffff00' },
    ],
    colors: {},
  })
  editor = props.monaco.editor.create(container, {
    glyphMargin: true,
    value: '',
    language: languageId,
    theme: languageTheme,
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
  // editor.executeEdits
  internalParse()
}

defineExpose({
  editor: $$(editor),
})

watch(() => props.logs, internalParse)
watch(() => props.wrap, applyWrap, { immediate: true })
watch(() => `${props.showTimestamp}-${props.showLineNumber}`, applyMargin)
watch($$(monacoValue), applyValue)

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