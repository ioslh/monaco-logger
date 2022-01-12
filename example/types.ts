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