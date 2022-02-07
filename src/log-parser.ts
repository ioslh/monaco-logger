import type { LogLine, LogGroup, Fragment } from './types'

const ESC_KEY = '\u001b'
const ERASE_KEY = '\u0008'
const FORE_PALETTE = {
  '30': 'rgba(0,0,0,1)',
  '31': 'rgba(247,49,49,1)',
  '32': 'rgba(127,202,84,1)',
  '33': 'rgba(246,222,84,1)',
  '34': 'rgba(0,0,255,1)',
  '35': 'rgba(255,0,255,1)',
  '36': 'rgba(0,255,255,1)',
  '37': 'rgba(255,255,255,1)',
  '90': 'rgba(128,128,128,1)',
} as Record<number | string, string>

const FILL_PALETTE = {
  '40': 'rgba(0,0,0,1)',
  '41': 'rgba(247,49,49,1)',
  '42': 'rgba(127,202,84,1)',
  '43': 'rgba(246,222,84,1)',
  '44': 'rgba(0,0,255,1)',
  '45': 'rgba(255,0,255,1)',
  '46': 'rgba(0,255,255,1)',
  '47': 'rgba(255,255,255,1)',
} as Record<number | string, string>


const STYLE = {
  '1': 'bold',
  '3': 'italic',
  '4': 'underline',
} as Record<number | string, string>

export const parseLineFragments = (str: string): Fragment[] => {
  let matchingControl = null
  let matchingData = null
  let matchingText = ''
  let ansiState: string[] = []
  const result: Fragment[] = []
  let state: Partial<Fragment> = {}

  // take care of multi line fragment message
  const addFragment = (frg: Fragment) => {
    (frg.message || '').split('\n').forEach(part => {
      result.push({
        ...frg,
        message: part,
      })
    })
  }

  const eraseChar = function () {
    let index
    let message
    if (matchingText.length) {
      matchingText = matchingText.substr(0, matchingText.length - 1)
    } else if (result.length) {
      index = result.length - 1
      message = result[index].message || ''
      if (message.length === 1) result.pop()
      else result[index].message = message.substr(0, message.length - 1)
    }
  }

  for (let i = 0; i < str.length; i++) {
    if (matchingControl !== null) {
      if (matchingControl === ESC_KEY && str[i] === '[') {
        if (matchingText) {
          state.message = matchingText
          addFragment(state as Fragment)
          state = {}
          matchingText = ''
        }
        matchingControl = null
        matchingData = ''
      } else {
        matchingText += matchingControl + str[i]
        matchingControl = null
      }
      continue
    } else if (matchingData !== null) {
      if (str[i] === ';') {
        ansiState.push(matchingData)
        matchingData = ''
      } else if (str[i] === 'm') {
        ansiState.push(matchingData)
        matchingData = null
        matchingText = ''
        ansiState.forEach(function (ac) {
          const ansiCode = Number(ac)
          if (FORE_PALETTE[ansiCode]) {
            state.color = FORE_PALETTE[ansiCode]
          } else if (FILL_PALETTE[ansiCode]) {
            state.background = FILL_PALETTE[ansiCode]
          } else if (ansiCode === 39) {
            delete state.color
          } else if (ansiCode === 49) {
            delete state.background
          } else if (STYLE[ansiCode]) {
            ;(state as any)[STYLE[ansiCode]] = true
          } else if (ansiCode === 22) {
            state.bold = false
          } else if (ansiCode === 23) {
            state.italic = false
          } else if (ansiCode === 24) {
            state.underline = false
          }
        })
        ansiState = []
      } else {
        matchingData += str[i]
      }
      continue
    }

    if (str[i] === ESC_KEY) {
      matchingControl = str[i]
    } else if (str[i] === ERASE_KEY) {
      eraseChar()
    } else {
      matchingText += str[i]
    }
  }

  if (matchingText) {
    state.message = matchingText + (matchingControl || '')
    addFragment(state as Fragment)
  }
  return result
}

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
          fragments: ansiParser(content),
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
        fragments: ansiParser(content),
      })
    }
  }
  return result
}