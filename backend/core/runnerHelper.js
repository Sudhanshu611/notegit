import { execFileSync } from 'child_process'
import path from 'path'

const runnerPath = path.join(process.cwd(), 'cpp', process.platform === 'win32' ? 'runner.exe' : 'runner')

export function runCpp(structure, action, state, args = []) {
  try {
    const result = execFileSync(runnerPath, [structure, action, state, ...args], { encoding: 'utf8' })
    const lines = result.trim().split('\n')
    let newState = null
    let resVal = null
    let errVal = null
    
    for (const line of lines) {
      if (line.startsWith('STATE:')) {
        newState = line.slice(6)
      } else if (line.startsWith('RESULT:')) {
        resVal = line.slice(7)
      } else if (line.startsWith('ERROR:')) {
        errVal = line.slice(6)
      }
    }
    
    if (errVal) {
      throw new Error(errVal)
    }
    
    return { newState, result: resVal }
  } catch (error) {
    console.error(`[C++ Bridge Error] structure=${structure}, action=${action}`, error)
    throw error;
  }
}

export const hexEncode = (str) => {
  if (str == null) return 'EMPTY'
  return Buffer.from(str).toString('hex')
}

export const hexDecode = (hex) => {
  if (hex === 'EMPTY' || !hex) return ''
  return Buffer.from(hex, 'hex').toString('utf8')
}
