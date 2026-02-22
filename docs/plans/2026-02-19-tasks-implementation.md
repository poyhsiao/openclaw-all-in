# OpenClaw AI Platform Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement all features from the design document to complete the OpenClaw AI Platform enhancement.

**Architecture:** 
- Frontend: React + TypeScript + Vite + shadcn/ui + TanStack Router
- Backend: Express + TypeScript + Prisma + SQLite
- Services: Docker Compose with profiles (core, ui, voice, agent)
- Auth: JWT + bcrypt + RBAC

**Tech Stack:** React 18, TypeScript, Vite, shadcn/ui, Tailwind CSS, Zustand, TanStack Query, TanStack Router, Express, Prisma, SQLite, Docker SDK, JWT

---

## Phase 1: Infrastructure (COMPLETED ✅)

These tasks are already completed:
- [x] docker-compose.yml with profiles configuration
- [x] .env.example comprehensive parameters
- [x] control-panel frontend project setup
- [x] api-server backend project setup
- [x] Prisma schema with User, Session, ApiKey, Audit, Model, EnvVar
- [x] Shared networks and volumes

---

## Phase 2: Core Features

### Task 1: Dashboard Module (Frontend)

**Files:**
- Modify: `control-panel/src/routes/__root.tsx`
- Create: `control-panel/src/pages/Dashboard.tsx`
- Create: `control-panel/src/components/dashboard/ServiceStatus.tsx`
- Create: `control-panel/src/components/dashboard/ResourceUsage.tsx`
- Create: `control-panel/src/components/dashboard/QuickActions.tsx`
- Create: `control-panel/src/services/dashboard-hooks.ts`

**Step 1: Write the failing test**

```typescript
// control-panel/src/__tests__/Dashboard.test.tsx
import { render, screen } from '@testing-library/react';
import { Dashboard } from '../pages/Dashboard';

describe('Dashboard', () => {
  it('should display service status cards', () => {
    render(<Dashboard />);
    expect(screen.getByText(/openclaw/i)).toBeInTheDocument();
    expect(screen.getByText(/ollama/i)).toBeInTheDocument();
    expect(screen.getByText(/redis/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `cd control-panel && npm test -- --testPathPattern=Dashboard --passWithNoTests`
Expected: FAIL or PASS (if test infrastructure not ready)

**Step 3: Create Dashboard page**

```typescript
// control-panel/src/pages/Dashboard.tsx
import { ServiceStatus } from '../components/dashboard/ServiceStatus';
import { ResourceUsage } from '../components/dashboard/ResourceUsage';
import { QuickActions } from '../components/dashboard/QuickActions';

export function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ServiceStatus />
      </div>
      <ResourceUsage />
      <QuickActions />
    </div>
  );
}
```

**Step 4: Run verification**

Run: `cd control-panel && npm run build`
Expected: Build succeeds

**Step 5: Commit**

```bash
git add control-panel/src/pages/ control-panel/src/components/dashboard/ control-panel/src/services/dashboard-hooks.ts
git commit -m "feat(dashboard): add dashboard page with service status"
```

---

### Task 2: Service Details Page

**Files:**
- Create: `control-panel/src/routes/services.$name.tsx`
- Create: `control-panel/src/pages/ServiceDetails.tsx`
- Create: `control-panel/src/components/services/ServiceLogs.tsx`
- Create: `control-panel/src/components/services/ServiceActions.tsx`

**Step 1: Write test**

```typescript
// control-panel/src/__tests__/ServiceDetails.test.tsx
import { render, screen } from '@testing-library/react';
import { ServiceDetails } from '../pages/ServiceDetails';

describe('ServiceDetails', () => {
  it('should display service name from params', () => {
    render(<ServiceDetails />);
    // Test with route param mock
  });
});
```

**Step 2: Create Service Details page with tabs for Overview, Logs, Actions**

```typescript
// control-panel/src/pages/ServiceDetails.tsx
import { useParams } from 'react-router';
import { useServiceDetails } from '../hooks/service-hooks';

export function ServiceDetails() {
  const { name } = useParams();
  const { data: service } = useServiceDetails(name);
  
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold capitalize">{name}</h1>
      {/* Tabs: Overview, Logs, Actions */}
    </div>
  );
}
```

**Step 3: Run build and verify**

**Step 4: Commit**

---

### Task 3: Agent Console (WebSocket Integration)

**Files:**
- Create: `control-panel/src/routes/agent.tsx`
- Create: `control-panel/src/pages/AgentConsole.tsx`
- Create: `control-panel/src/hooks/useOpenClawWebSocket.ts`
- Create: `control-panel/src/components/agent/ChatPanel.tsx`
- Create: `control-panel/src/components/agent/SessionList.tsx`

**Step 1: Create WebSocket hook**

```typescript
// control-panel/src/hooks/useOpenClawWebSocket.ts
import { useEffect, useState, useCallback } from 'react';

interface WebSocketMessage {
  type: 'req' | 'res';
  id: string;
  method?: string;
  params?: any;
  ok?: boolean;
  payload?: any;
}

export function useOpenClawWebSocket(url: string) {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [messages, setMessages] = useState<WebSocketMessage[]>([]);
  
  useEffect(() => {
    const ws = new WebSocket(url);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    setSocket(ws);
    return () => ws.close();
  }, [url]);
  
  const send = useCallback((message: WebSocketMessage) => {
    socket?.send(JSON.stringify(message));
  }, [socket]);
  
  return { socket, messages, send };
}
```

**Step 2: Create Agent Console page**

```typescript
// control-panel/src/pages/AgentConsole.tsx
import { useOpenClawWebSocket } from '../hooks/useOpenClawWebSocket';
import { ChatPanel } from '../components/agent/ChatPanel';

export function AgentConsole() {
  const wsUrl = import.meta.env.VITE_OPENCLAW_URL || 'ws://localhost:18789';
  const { messages, send } = useOpenClawWebSocket(wsUrl);
  
  return (
    <div className="flex h-full">
      <SessionList />
      <ChatPanel messages={messages} onSend={send} />
    </div>
  );
}
```

**Step 3: Commit**

---

### Task 4: Agent Sessions Management

**Files:**
- Create: `control-panel/src/routes/agent.sessions.tsx`
- Create: `control-panel/src/routes/agent.sessions.$id.tsx`
- Create: `control-panel/src/pages/AgentSessions.tsx`
- Create: `control-panel/src/pages/AgentSessionDetails.tsx`

---

### Task 5: Config Center - Models

**Files:**
- Create: `control-panel/src/routes/config.models.tsx`
- Create: `control-panel/src/pages/ConfigModels.tsx`
- Create: `control-panel/src/components/config/ModelCard.tsx`
- Create: `control-panel/src/components/config/ModelForm.tsx`

---

### Task 6: Config Center - API Keys

**Files:**
- Create: `control-panel/src/routes/config.keys.tsx`
- Create: `control-panel/src/pages/ConfigKeys.tsx`
- Create: `control-panel/src/components/config/ApiKeyCard.tsx`
- Create: `control-panel/src/components/config/ApiKeyForm.tsx`

---

### Task 7: Monitoring Center (Portainer Integration)

**Files:**
- Create: `control-panel/src/routes/monitor.tsx`
- Create: `control-panel/src/pages/Monitor.tsx`
- Create: `control-panel/src/components/monitor/ContainerList.tsx`
- Create: `control-panel/src/components/monitor/ContainerStats.tsx`
- Create: `control-panel/src/services/monitor-hooks.ts`

**Backend - create:**
- Create: `api-server/src/routes/monitorRoutes.ts`
- Create: `api-server/src/services/portainerService.ts`

```typescript
// api-server/src/services/portainerService.ts
import axios from 'axios';

const PORTAINER_URL = process.env.PORTAINER_URL || 'http://portainer:9000';

export async function getContainers() {
  // Call Portainer API to get containers
  // GET /api/docker/containers/json
}

export async function getContainerStats(containerId: string) {
  // Get container stats
  // GET /api/docker/containers/${containerId}/stats
}
```

---

### Task 8: Settings Page

**Files:**
- Create: `control-panel/src/routes/settings.tsx`
- Create: `control-panel/src/pages/Settings.tsx`
- Create: `control-panel/src/components/settings/GeneralSettings.tsx`
- Create: `control-panel/src/components/settings/SecuritySettings.tsx`
- Create: `control-panel/src/components/settings/NotificationSettings.tsx`

---

## Phase 3: Enhanced Features

### Task 9: Voice Services Integration

**Backend - create:**
- Create: `api-server/src/routes/voiceRoutes.ts`
- Create: `api-server/src/services/whisperService.ts`
- Create: `api-server/src/services/edgeTtsService.ts`

```typescript
// api-server/src/routes/voiceRoutes.ts
import { Router } from 'express';
import { transcribeAudio } from '../services/whisperService';
import { synthesizeSpeech } from '../services/edgeTtsService';

const router = Router();

router.post('/transcribe', async (req, res) => {
  const { audioUrl } = req.body;
  const text = await transcribeAudio(audioUrl);
  res.json({ text });
});

router.post('/synthesize', async (req, res) => {
  const { text, voice } = req.body;
  const audioUrl = await synthesizeSpeech(text, voice);
  res.json({ audioUrl });
});

router.get('/status', (req, res) => {
  res.json({ whisper: 'available', edgeTts: 'available' });
});

export default router;
```

**Frontend - create:**
- Create: `control-panel/src/pages/VoiceServices.tsx`
- Create: `control-panel/src/components/voice/TranscribePanel.tsx`
- Create: `control-panel/src/components/voice/SynthesizePanel.tsx`

---

### Task 10: Vector Search Integration

**Backend - create:**
- Create: `api-server/src/routes/vectorRoutes.ts`
- Create: `api-server/src/services/vectorService.ts`
- Install: `npm install @huggingface/inference-js`

```typescript
// api-server/src/services/vectorService.ts
import { pipeline } from '@xenova/transformers';

let embeddingModel: any = null;

async function getModel() {
  if (!embeddingModel) {
    embeddingModel = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return embeddingModel;
}

export async function createEmbedding(text: string) {
  const model = await getModel();
  const output = await model(text, { pooling: 'mean', normalize: true });
  return Array.from(output.data);
}

export async function searchSimilar(text: string, limit: number = 10) {
  const queryEmbedding = await createEmbedding(text);
  // Search in database
  // Return similar results
}
```

**Database - add model:**
- Create: `api-server/prisma/migrations/add_vector_tables.sql`

```sql
CREATE TABLE IF NOT EXISTS embeddings (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  embedding BLOB NOT NULL,
  metadata TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embeddings_embedding ON embeddings(embedding);
```

---

### Task 11: NATS Agent Communication

**Backend - create:**
- Create: `api-server/src/services/natsService.ts`
- Install: `npm install nats`

```typescript
// api-server/src/services/natsService.ts
import { connect, NatsConnection } from 'nats';

let nc: NatsConnection | null = null;

export async function getNatsConnection() {
  if (!nc) {
    nc = await connect({
      servers: [process.env.NATS_URL || 'nats:4222'],
    });
  }
  return nc;
}

export async function publishMessage(subject: string, message: any) {
  const conn = await getNatsConnection();
  conn.publish(subject, JSON.stringify(message));
}

export async function subscribeToMessages(subject: string, callback: (msg: any) => void) {
  const conn = await getNatsConnection();
  const sub = conn.subscribe(subject);
  (async () => {
    for await (const msg of sub) {
      callback(JSON.parse(msg.data.toString()));
    }
  })();
}
```

---

## Phase 4: Production Ready

### Task 12: Security Hardening

**Files:**
- Modify: `api-server/src/middleware/auth.ts` - Add rate limiting
- Modify: `api-server/src/middleware/rbac.ts` - Implement RBAC
- Create: `api-server/src/middleware/security.ts` - Add security headers
- Modify: `docker-compose.yml` - Add HTTPS/TLS configuration

```typescript
// api-server/src/middleware/security.ts
import helmet from 'helmet';
import cors from 'cors';

export const securityMiddleware = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
      },
    },
  }),
  cors({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:4000'],
    credentials: true,
  }),
];
```

---

### Task 13: Performance Optimization

- Add caching with Redis for frequently accessed data
- Implement database query optimization
- Add connection pooling
- Implement pagination for list endpoints

---

### Task 14: Documentation

**Files:**
- Create: `docs/api-reference.md`
- Create: `docs/deployment.md`
- Update: `docs/quick-start.md`
- Update: `docs/troubleshooting.md`

---

### Task 15: CI/CD Configuration

**Files:**
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/cd.yml`
- Create: `docker-compose.production.yml`

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

---

## Summary

| Phase | Tasks | Status |
|-------|-------|--------|
| Phase 1: Infrastructure | 6 items | ✅ Complete |
| Phase 2: Core Features | 8 tasks | 🔲 Pending |
| Phase 3: Enhanced Features | 3 tasks | 🔲 Pending |
| Phase 4: Production | 4 tasks | 🔲 Pending |

**Total: 21 tasks**

---

## Execution Options

**Plan complete and saved to `docs/plans/2026-02-18-openclaw-platform-enhancement-design.md`.**

Two execution options:

1. **Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration

2. **Parallel Session (separate)** - Open new session with executing-plans, batch execution with checkpoints

Which approach?
