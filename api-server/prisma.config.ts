import type { PrismaConfig } from '@prisma/client'

const config: PrismaConfig = {
  schema: './prisma/schema.prisma',
  datasource: {
    url: 'file:./data/dev.db',
  },
}

export default config
