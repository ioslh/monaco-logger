import type { LogLine, LogGroup } from './types'

export const GROUP_START = '##[group]'
export const GROUP_END = '##[endgroup]'

const getLogLine = (count: number, startLineNo: number): LogLine[] => {
  const ls: LogLine[] = []
  for(let i = 0; i < count; i++) {
    ls.push({
      message: '',
      timestamp: '1',
      lineNo: startLineNo + i,
    })
  }
  return ls
}

export default function logGenerator(startLineNo: number = 1) {
  let lineCursor = startLineNo
  return (count: number): Array<LogLine | LogGroup> => {
    const logs: Array<LogLine | LogGroup> = []
    for(let i = 0; i < count; i++) {

    }
    return logs
  }
}