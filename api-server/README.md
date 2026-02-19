# OpenClaw API Server

Express-based backend API for OpenClaw AI Platform control panel.

## Tech Stack

- Express + TypeScript
- SQLite + Prisma
- JWT Authentication
- Docker SDK

## Development

```bash
npm install
npx prisma generate
npm run dev
```

## Build

```bash
npm run build
```

## API Endpoints

### Services
- GET /api/services - List all services
- GET /api/services/:name - Service details
- POST /api/services/:name/start - Start service
- POST /api/services/:name/stop - Stop service
- POST /api/services/:name/restart - Restart service
- GET /api/services/:name/logs - Service logs

### Configuration
- GET /api/config/models - List models
- POST /api/config/models - Create model
- DELETE /api/config/models/:id - Delete model
- GET /api/config/keys - List API keys
- POST /api/config/keys - Create API key
- DELETE /api/config/keys/:id - Delete API key

### Authentication
- POST /api/auth/login - Login
- POST /api/auth/logout - Logout
- POST /api/auth/refresh - Refresh token

### Users
- GET /api/users - List users
- POST /api/users - Create user
- PUT /api/users/:id - Update user
- DELETE /api/users/:id - Delete user
- GET /api/users/me - Current user
