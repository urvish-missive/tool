/**
 * Bulk search helpers for the Portal API Data Fetcher.
 *
 * The user copies ONE real search request from the portal (e.g. BNI Connect
 * member search for "Telecom" in "South Africa") and tells us which values
 * they searched for. We find those values inside the cURL (in the URL query,
 * JSON body or form body, in whatever encoding the browser used) and swap in
 * every other keyword / country, so one captured request becomes N x M searches.
 */

const isWordChar = (ch) => !!ch && /[A-Za-z0-9]/.test(ch)

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/** The forms a value can take inside a copied request, each with its encoder. */
function encodings(curl) {
  const isCmd = /\^"/.test(curl)
  const list = [
    { name: 'raw', enc: (v) => v },
    { name: 'url', enc: (v) => encodeURIComponent(v) },
    { name: 'form', enc: (v) => encodeURIComponent(v).replace(/%20/g, '+') },
    { name: 'json', enc: (v) => JSON.stringify(v).slice(1, -1) },
    { name: 'unicode', enc: (v) => v.replace(/ /g, '\\u0020') },
  ]
  if (isCmd) {
    // Windows "Copy as cURL (cmd)" escapes % as ^%
    list.push({ name: 'cmd-url', enc: (v) => encodeURIComponent(v).replace(/%/g, '^%') })
  }
  return list
}

/** Find where a sample value occurs in the cURL text (whole-word, case-sensitive first). */
export function findSample(curl, sample) {
  const value = String(sample || '').trim()
  if (!value || !curl) return { count: 0, forms: [], caseInsensitive: false }

  const tryFind = (flags) => {
    const forms = []
    let count = 0
    const seenPatterns = new Set()
    for (const e of encodings(curl)) {
      const pat = e.enc(value)
      if (!pat || seenPatterns.has(pat)) continue
      seenPatterns.add(pat)
      const re = new RegExp(escapeRegExp(pat), flags)
      let m
      let n = 0
      while ((m = re.exec(curl))) {
        const before = curl[m.index - 1]
        const after = curl[m.index + m[0].length]
        if (!isWordChar(pat[0]) || !isWordChar(before)) {
          if (!isWordChar(pat[pat.length - 1]) || !isWordChar(after)) n++
        }
      }
      if (n) {
        forms.push(e.name)
        count += n
      }
    }
    return { count, forms }
  }

  const exact = tryFind('g')
  if (exact.count) return { ...exact, caseInsensitive: false }
  return { ...tryFind('gi'), caseInsensitive: true }
}

/**
 * Replace every sample value with the new value, keeping each occurrence's
 * encoding. vars: [{ sample, value }]
 */
export function substitute(curl, vars) {
  let out = String(curl)
  const pending = []
  vars.forEach((v, vi) => {
    const sample = String(v.sample || '').trim()
    if (!sample) return
    const ci = findSample(out, sample).caseInsensitive
    encodings(out).forEach((e, ei) => {
      const pat = e.enc(sample)
      if (!pat) return
      const marker = `\u0000${vi}_${ei}\u0000`
      const re = new RegExp(escapeRegExp(pat), ci ? 'gi' : 'g')
      out = out.replace(re, (m, idx, str) => {
        const before = str[idx - 1]
        const after = str[idx + m.length]
        if (isWordChar(pat[0]) && isWordChar(before)) return m
        if (isWordChar(pat[pat.length - 1]) && isWordChar(after)) return m
        return marker
      })
      pending.push({ marker, value: e.enc(String(v.value)) })
    })
  })
  for (const p of pending) out = out.split(p.marker).join(p.value)
  return out
}

/**
 * Parse a list textarea. Each line is a value, or "Label = value sent to the
 * portal" when the portal uses IDs or codes (e.g. "United States = US").
 */
export function parseValueList(text) {
  const seen = new Set()
  const items = []
  const lines = String(text || '')
    .split(/\r?\n/)
    .flatMap((l) => (l.includes('=') ? [l] : l.split(',')))
  for (const raw of lines) {
    const line = raw.replace(/^\s*\d+[.)]\s*/, '').trim()
    if (!line) continue
    const eq = line.indexOf('=')
    const label = (eq > 0 ? line.slice(0, eq) : line).trim()
    const value = (eq > 0 ? line.slice(eq + 1) : line).trim()
    if (!value || seen.has(label.toLowerCase())) continue
    seen.add(label.toLowerCase())
    items.push({ label, value })
  }
  return items
}

/** Cartesian product of the variable lists. */
export function buildCombinations(variables) {
  const active = variables.filter((v) => v.sample?.trim() && v.items.length)
  if (!active.length) return []
  let combos = [[]]
  for (const v of active) {
    const next = []
    for (const c of combos)
      for (const item of v.items) next.push([...c, { name: v.name, sample: v.sample, ...item }])
    combos = next
  }
  return combos
}

const ID_COLUMN = /^(id|uuid|_id|.*[._]id|.*Id|.*ID)$/

/**
 * Merge rows from many searches. Adds one "Search: <name>" column per
 * variable and de-duplicates records found by several searches, listing every
 * search that matched.
 */
export function mergeResults(batches, variableNames) {
  const searchCols = variableNames.map((n) => `Search: ${n}`)
  const allCols = new Set()
  for (const b of batches) for (const c of b.columns || []) allCols.add(c)

  // Prefer a unique ID column for de-duplication; otherwise the whole record.
  const idCol =
    [...allCols].find((c) => ID_COLUMN.test(c.split('.').pop()) && !c.includes('.')) ||
    [...allCols].find((c) => ID_COLUMN.test(c.split('.').pop()))

  const byKey = new Map()
  for (const b of batches) {
    for (const row of b.rows || []) {
      const key =
        idCol && row[idCol] !== undefined && row[idCol] !== ''
          ? `id:${row[idCol]}`
          : JSON.stringify(row)
      const existing = byKey.get(key)
      if (existing) {
        b.combo.forEach((part, i) => existing.__search[i].add(part.label))
      } else {
        byKey.set(key, { row, __search: b.combo.map((part) => new Set([part.label])) })
      }
    }
  }

  const rows = [...byKey.values()].map(({ row, __search }) => {
    const out = {}
    searchCols.forEach((c, i) => {
      out[c] = [...(__search[i] || [])].join(', ')
    })
    return Object.assign(out, row)
  })

  const totalFound = batches.reduce((n, b) => n + (b.rows?.length || 0), 0)
  return {
    rows,
    columns: [...searchCols, ...allCols],
    duplicates: totalFound - rows.length,
    idColumn: idCol || null,
  }
}

/**
 * When the user leaves "value used in the copied search" empty, look for one
 * of their list values inside the copied request and use it. Longer values win
 * (so "South Africa" beats "Africa"); values under 4 characters, like "IT",
 * must match the letter case exactly to avoid false hits.
 */
export function autoDetectSample(curl, items) {
  if (!curl || !items?.length) return null
  const candidates = []
  for (const item of items) {
    for (const v of new Set([item.value, item.label])) {
      if (!v) continue
      const hit = findSample(curl, v)
      if (!hit.count || (hit.caseInsensitive && v.length < 4)) continue
      candidates.push({ value: v, label: item.label, count: hit.count })
    }
  }
  candidates.sort((a, b) => b.value.length - a.value.length || b.count - a.count)
  return candidates[0] || null
}
