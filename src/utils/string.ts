
export function normalizePath(path: string) {
  if (path === '/') return '/'
  return path.replace(/\/index$/, '').replace(/\/$/, '')
}
