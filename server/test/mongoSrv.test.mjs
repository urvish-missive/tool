import { test, describe } from 'node:test'
import assert from 'node:assert/strict'
import { buildSeedListUrl, resolveMongoUrl } from '../src/utils/mongoSrv.js'

const SRV = [
  { name: 'ac-2.cluster0.example.mongodb.net', port: 27017 },
  { name: 'ac-1.cluster0.example.mongodb.net.', port: 27017 },
]
const TXT = [['authSource=admin&replicaSet=atlas-abc-shard-0']]

describe('buildSeedListUrl', () => {
  test('expands hosts, adds TXT options and tls, keeps credentials, db and user options', () => {
    const url = buildSeedListUrl(
      'mongodb+srv://user:p%40ss@cluster0.example.mongodb.net/seo-analyzer?retryWrites=true&w=majority&appName=Cluster0',
      SRV,
      TXT,
    )
    assert.equal(
      url,
      'mongodb://user:p%40ss@ac-1.cluster0.example.mongodb.net:27017,ac-2.cluster0.example.mongodb.net:27017/seo-analyzer' +
        '?replicaSet=atlas-abc-shard-0&authSource=admin&tls=true&retryWrites=true&w=majority&appName=Cluster0',
    )
  })

  test('explicit options in the original URL override TXT and defaults', () => {
    const url = buildSeedListUrl('mongodb+srv://u:p@c.example.net/db?tls=false&authSource=other', SRV, TXT)
    const params = new URLSearchParams(url.split('?')[1])
    assert.equal(params.get('tls'), 'false')
    assert.equal(params.get('authSource'), 'other')
  })

  test('works without credentials, path or query', () => {
    assert.equal(
      buildSeedListUrl('mongodb+srv://c.example.net', [{ name: 'h.example.net', port: 27017 }]),
      'mongodb://h.example.net:27017/?tls=true',
    )
  })
})

describe('resolveMongoUrl', () => {
  test('leaves non-SRV URLs untouched', async () => {
    assert.equal(await resolveMongoUrl('mongodb://localhost:27017/db'), 'mongodb://localhost:27017/db')
    assert.equal(await resolveMongoUrl(undefined), undefined)
  })

  test('falls back to the original URL when DNS fails', async () => {
    const resolver = { resolveSrv: async () => { throw Object.assign(new Error('x'), { code: 'ENOTFOUND' }) }, resolveTxt: async () => [] }
    const original = 'mongodb+srv://u:p@c.example.net/db'
    assert.equal(await resolveMongoUrl(original, { resolver }), original)
  })

  test('uses the resolver results', async () => {
    const resolver = { resolveSrv: async () => SRV, resolveTxt: async () => TXT }
    const url = await resolveMongoUrl('mongodb+srv://u:p@cluster0.example.mongodb.net/db', { resolver })
    assert.match(url, /^mongodb:\/\/u:p@ac-1\..*,ac-2\..*\/db\?replicaSet=atlas-abc-shard-0&authSource=admin&tls=true$/)
  })
})
