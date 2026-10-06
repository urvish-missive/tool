import { PrismaClient } from '@prisma/client'
import { resolveMongoUrl } from './mongoSrv.js'

// Resolve mongodb+srv:// with Node's DNS before Prisma sees it (see mongoSrv.js).
// Top-level await: importers get a client that is ready to use.
const datasourceUrl = await resolveMongoUrl(process.env.DATABASE_URL)

const prisma = new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined)
export default prisma
