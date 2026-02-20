import { config } from './src/config/unifiedConfig';
import { fileURLToPath } from 'node:url';

// Prisma configuration with environment-driven datasource URL
const prismaConfig = {
  schema: fileURLToPath(new URL('./prisma/schema.prisma', import.meta.url)),
  datasource: {
    url: config.database.url,
  },
};

export default prismaConfig;
