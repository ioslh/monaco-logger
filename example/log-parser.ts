import type { LogLine, LogGroup } from './types'

const GROUP_START = '##[group]'
const GROUP_END = '##[endgroup]'

export default function logParser(raw: string): Array<LogLine | LogGroup> {
  const result: Array<LogLine | LogGroup> = []
  const rawLines = raw.split('\n')

  let groupScope: LogGroup | null = null
  for(let i = 0; i < rawLines.length; i++) {
    const match = rawLines[i].match(/^([^\s]+)\s(.*)$/)
    if (!match) continue 
    const [_, ts, content] = match
    if (groupScope) {
      if (content.startsWith(GROUP_END)) {
        result.push(groupScope)
        groupScope = null
      } else {
        groupScope.lines.push({
          lineNo: i + 1,
          timestamp: ts,
          message: content,
        })
      }
      continue
    }
    if (content.startsWith(GROUP_START)) {
      groupScope = {
        lines: [],
        lineNo: i + 1,
        timestamp: ts,
        groupName: content.slice(GROUP_START.length)
      }
    } else {
      result.push({
        lineNo: i + 1,
        timestamp: ts,
        message: content,
      })
    }
  }
  return result
}