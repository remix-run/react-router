import * as fs from 'node:fs'

export function fileExists(filename: string): boolean {
  return fs.existsSync(filename)
}

export function readFile(filename: string, encoding: BufferEncoding = 'utf-8'): string {
  try {
    return fs.readFileSync(filename, encoding)
  } catch (error) {
    if (isFsError(error) && error.code === 'ENOENT') {
      console.error(`Not found: "${filename}"`)
      process.exit(1)
    } else {
      throw error
    }
  }
}

function isFsError(error: unknown): error is { code: string } {
  return (
    typeof error === 'object' && error != null && 'code' in error && typeof error.code === 'string'
  )
}

export function writeFile(filename: string, data: string): void {
  fs.writeFileSync(filename, data)
}

export function readJson(filename: string): any {
  return JSON.parse(readFile(filename))
}

export function writeJson(filename: string, data: any): void {
  writeFile(filename, JSON.stringify(data, null, 2) + '\n')
}
