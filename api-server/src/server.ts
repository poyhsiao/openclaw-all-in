import { createApp } from './app';
import { config } from '@/config/unifiedConfig';

const app = createApp();

const server = app.listen(config.server.port, () => {
  console.log(`🚀 Server is running on port ${config.server.port}`);
  console.log(`📝 Environment: ${config.server.nodeEnv}`);
  console.log(`🔗 Health check: http://localhost:${config.server.port}/health`);
});

let isShuttingDown = false;
let shutdownTimeout: NodeJS.Timeout;

const gracefulShutdown = (signal: string) => {
  if (isShuttingDown) {
    console.log(`⚠️  ${signal} received, but shutdown already in progress`);
    return;
  }

  isShuttingDown = true;
  console.log(`\n${signal} received. Starting graceful shutdown...`);

  server.close(() => {
    console.log('✅ Server closed successfully');
    process.exit(0);
  });

  shutdownTimeout = setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  gracefulShutdown('uncaughtException');
});
