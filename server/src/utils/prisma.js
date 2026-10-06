import { PrismaClient } from '@prisma/client'

// DATABASE_URL may already have been rewritten from mongodb+srv:// to a plain
// mongodb:// URL by server.js before this module loads (see mongoSrv.js).
const prisma = new PrismaClient()
export default prisma
