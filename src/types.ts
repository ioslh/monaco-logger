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
  fragments: Fragment[]
}

type AnsiCode = number

export interface Fragment {
  color?: AnsiCode
  background?: AnsiCode
  bold?: boolean
  italic?: boolean
  underline?: boolean
  message: string

}

export interface InternalLogLine {
  fragments: Fragment[]
  lineNo: number
  timestamp: string
}

// -----


interface Line {
  lineNo: number
  message: string
}