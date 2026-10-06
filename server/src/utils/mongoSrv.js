/**
 * Resolve a mongodb+srv:// URL into a standard mongodb:// seed-list URL using
 * Node's DNS resolver.
 *
 * Why: Prisma's MongoDB connector does its own SRV/TXT lookup with a Rust DNS
 * library that parses /etc/resolv.conf strictly. On some hosts that fails with
 * "Error parsing resolv.conf: option at line N is not recognized" and every
 * query errors. Node's resolver (c-ares) handles those files fine, so we do the
 * lookup here and give Prisma a URL that needs no SRV resolution.
 */
import { promises as dns } from 'node:dns'

const SRV_PREFIX = 'mongodb+srv://'

/**
 * Pure URL builder (unit-tested). Follows the MongoDB SRV spec:
 * hosts/ports from SRV records, replicaSet/authSource from the TXT record,
 * tls on by default, and anything set explicitly in the original URL wins.
 *
 * @param {string} srvUrl mongodb+srv://user:pass@cluster.example.net/db?opts
 * @param {{name: string, port: number}[]} srvRecords
 * @param {string[][]} txtRecords as returned by dns.resolveTxt
 */
export function buildSeedListUrl(srvUrl, srvRecords, txtRecords = []) {
  if (!srvUrl.startsWith(SRV_PREFIX)) throw new Error('Not a mongodb+srv URL')
  if (!srvRecords.length) throw new Error('No SRV records found')

  const rest = srvUrl.slice(SRV_PREFIX.length)
  const at = rest.lastIndexOf('@', rest.search(/[/?]|$/))
  const credentials = at >= 0 ? rest.slice(0, at + 1) : ''
  const afterCreds = at >= 0 ? rest.slice(at + 1) : rest

  const pathStart = afterCreds.search(/[/?]/)
  const tail = pathStart >= 0 ? afterCreds.slice(pathStart) : ''
  const queryStart = tail.indexOf('?')
  const path = queryStart >= 0 ? tail.slice(0, queryStart) : tail
  const userParams = new URLSearchParams(queryStart >= 0 ? tail.slice(queryStart + 1) : '')

  const params = new URLSearchParams()
  // TXT record options (only replicaSet, authSource, loadBalanced are allowed by spec).
  const txt = new URLSearchParams(txtRecords.map((chunks) => chunks.join('')).join('&'))
  for (const key of ['replicaSet', 'authSource', 'loadBalanced']) {
    if (txt.has(key)) params.set(key, txt.get(key))
  }
  params.set('tls', 'true')
  for (const [key, value] of userParams) params.set(key, value)

  const hosts = srvRecords
    .map((r) => `${r.name.replace(/\.$/, '')}:${r.port}`)
    .sort()
    .join(',')

  const query = params.toString()
  return `mongodb://${credentials}${hosts}${path || '/'}${query ? `?${query}` : ''}`
}

/**
 * Returns a URL Prisma can use without its own SRV lookup. Falls back to the
 * original URL (and logs why, without credentials) if resolution fails.
 */
export async function resolveMongoUrl(url, { resolver = dns } = {}) {
  if (!url || !url.startsWith(SRV_PREFIX)) return url
  if (process.env.MONGODB_RESOLVE_SRV === 'false') return url

  const host = url.slice(SRV_PREFIX.length).replace(/^[^@/?]*@/, '').split(/[/?]/)[0]
  try {
    const [srv, txt] = await Promise.all([
      resolver.resolveSrv(`_mongodb._tcp.${host}`),
      resolver.resolveTxt(host).catch(() => []),
    ])
    const resolved = buildSeedListUrl(url, srv, txt)
    console.log(`[OK] Resolved MongoDB SRV for ${host} to ${srv.length} host(s)`)
    return resolved
  } catch (err) {
    console.warn(`[WARN] MongoDB SRV lookup for ${host} failed (${err.code || err.message}); using the original URL`)
    return url
  }
}
