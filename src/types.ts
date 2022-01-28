export interface RawLog {
  lineNo: number
  message: string
  timestamp: string
}

interface LogBase {
  lineNo: number
  timestamp: string
  groupName: string
}

export interface LogGroup extends LogBase {
  lines: LogLine[]
}

export interface LogLine extends Omit<LogBase, 'groupName'> {
  message: string
}

// -----


interface Line {
  lineNo: number
  message: string
}