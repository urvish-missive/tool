/**
 * Production entry point.
 *
 * No top-level await here or in anything imported statically: some hosts
 * (e.g. Hostinger's LiteSpeed lsnode.js) load this file with require(), which
 * cannot load ESM that uses top-level await (ERR_REQUIRE_ASYNC_MODULE).
 * The app is therefore loaded with a dynamic import() after the async setup.
 */
import 'dotenv/config'
import { resolveMongoUrl } from './src/utils/mongoSrv.js'

// Resolve mongodb+srv:// with Node's DNS before Prisma reads DATABASE_URL,
// avoiding Prisma's "Error parsing resolv.conf" failure on some hosts.
resolveMongoUrl(process.env.DATABASE_URL)
  .then((url) => {
    if (url) process.env.DATABASE_URL = url
  })
  .catch(() => {})
  .then(() => import('./src/app.js'))
  .catch((err) => {
    console.error('[ERROR] Failed to start server:', err)
    process.exit(1)
  })
