export function parseJson(str, fallback = null) {
  if (!str) return fallback
  try {
    return JSON.parse(str)
  } catch {
    return fallback
  }
}

export function stringifyJson(val) {
  return JSON.stringify(val ?? null)
}
