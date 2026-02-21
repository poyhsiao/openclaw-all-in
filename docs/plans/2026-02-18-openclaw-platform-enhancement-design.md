# OpenClaw AI 平台增強設計文檔

> 設計日期：2026-02-18
> 設計目標：彈性化架構、增強服務、控制面板

---

## 一、專案背景

### 使用場景
AI Agent 開發平台 - 作為其他 AI 應用的後端服務

### 核心需求
1. **架構彈性化** - 服務可選、配置靈活、所有參數可透過 .env 配置
2. **服務增強** - 添加語音服務、Agent 通訊、向量搜尋等服務
3. **控制面板** - 完整的平台管理介面

### 控制面板功能
- 服務監控儀表板
- 配置管理中心
- Agent 開發工具
- 用戶管理與權限控制
- API 文檔

---

## 二、整體架構

### 架構方案：漸進增強架構

```
┌─────────────────────────────────────────────────────────────┐
│                    OpenClaw AI Platform                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐    ┌──────────────────┐               │
│  │   openclaw       │    │   control-panel  │               │
│  │   (現有 Gateway)  │◄──►│   (新增 React)    │               │
│  │   :18789         │    │   :4000          │               │
│  └────────┬─────────┘    └────────┬─────────┘               │
│           │                       │                          │
│           ▼                       ▼                          │
│  ┌──────────────────────────────────────────┐               │
│  │              Core Services               │               │
│  │  ollama:11434 │ redis:6379 │ searxng:8080│               │
│  │  portainer:9000 (監控管理)               │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
│  ┌──────────────────────────────────────────┐               │
│  │         Enhanced Services (可選)          │               │
│  │  whisper.cpp:8080 (語音識別)              │               │
│  │  edge-tts:5050 (語音合成)                 │               │
│  │  nats:4222 (Agent 通訊)                   │               │
│  │  sqlite-vec (向量搜尋，內嵌於 API)        │               │
│  └──────────────────────────────────────────┘               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 設計理念
1. **分層架構**：前端層 → API 層 → 服務層
2. **混合 API**：OpenClaw WebSocket + 控制 Panel REST API
3. **Profile 控制**：Docker Compose Profiles 實現服務可選性
4. **環境變數**：所有端口和路徑可透過 .env 檔案配置
5. **輕量化**：使用 SQLite + sqlite-vec 取代 Qdrant，減少資源佔用

---

## 三、服務規劃

### Docker Compose Profiles

| Profile | 服務 | 用途 |
|---------|------|------|
| `core` | ollama, redis, searxng, openclaw, portainer | 核心服務（預設） |
| `ui` | open-webui, control-panel | 用戶介面 |
| `voice` | whisper.cpp, edge-tts | 語音服務 |
| `agent` | nats | Agent 通訊 |
| `vector` | (sqlite-vec 內嵌於 API Server) | 向量搜尋 |

### 啟動命令

```bash
# 最小核心服務
docker compose --profile core up -d

# 核心 + UI
docker compose --profile core --profile ui up -d

# 核心 + UI + 語音服務
docker compose --profile core --profile ui --profile voice up -d

# 完整平台（含 Agent 通訊）
docker compose --profile core --profile ui --profile voice --profile agent up -d
```

---

## 四、控制面板設計

### 功能模組

| 模組 | 功能 | 數據來源 |
|------|------|----------|
| **儀表板** | 服務狀態總覽、資源使用、快速操作 | Docker API |
| **服務管理** | 啟停服務、查看日誌、重啟、擴縮容 | Docker Socket |
| **Agent 控制台** | 測試 Agent、查看 Session、執行 Tool | OpenClaw WebSocket |
| **配置中心** | 模型管理、API Keys、環境變量 | API Server |
| **監控中心** | Portainer 整合、容器狀態、資源監控 | Portainer API |
| **用戶管理** | 用戶註冊、權限控制、操作審計 | API Server + SQLite |

### 頁面路由

```
/                    → 儀表板
/services            → 服務管理
/services/:name      → 服務詳情
/agent               → Agent 控制台
/agent/sessions      → Session 列表
/agent/sessions/:id  → Session 詳情
/config              → 配置中心
/config/models       → 模型配置
/config/keys         → API Keys
/monitor             → 監控中心 (Portainer)
/users               → 用戶管理
/settings            → 系統設定
```

### 技術選型

- **前端**：React 18 + TypeScript + Vite
- **UI 庫**：shadcn/ui + Tailwind CSS + Lucide Icons
- **狀態管理**：Zustand + TanStack Query
- **路由**：TanStack Router
- **表單**：React Hook Form + Zod
- **圖表**：Recharts

---

## 五、API 設計

### 數據流

```
前端 (React)
  │
  ├─ TanStack Query ──► REST API (http://localhost:5000)
  │                      │
  │                      └─► Docker API / Services
  │
  └─ WebSocket Hook ───► OpenClaw Gateway (ws://localhost:18789)
```

### REST API 端點

```
# 服務管理
GET    /api/services                    # 列出所有服務
GET    /api/services/:name              # 服務詳情
POST   /api/services/:name/start        # 啟動服務
POST   /api/services/:name/stop         # 停止服務
POST   /api/services/:name/restart      # 重啟服務
GET    /api/services/:name/logs         # 服務日誌

# 配置管理
GET    /api/config/models               # 列出模型
POST   /api/config/models               # 新增模型
DELETE /api/config/models/:id           # 刪除模型
GET    /api/config/keys                 # 列出 API Keys
POST   /api/config/keys                 # 新增 API Key
DELETE /api/config/keys/:id             # 刪除 API Key
GET    /api/config/env                  # 環境變量
PUT    /api/config/env                  # 更新環境變量

# 監控 (Portainer)
GET    /api/monitor/containers          # 容器列表
GET    /api/monitor/container/:id       # 容器詳情
GET    /api/monitor/stats               # 資源統計
GET    /api/monitor/health              # 健康檢查總覽

# 語音服務
POST   /api/voice/transcribe            # 語音識別 (whisper.cpp)
POST   /api/voice/synthesize            # 語音合成 (edge-tts)
GET    /api/voice/status                # 語音服務狀態

# 向量搜尋
POST   /api/vector/embed                # 生成向量嵌入
POST   /api/vector/search               # 向量相似度搜尋
GET    /api/vector/status               # 向量服務狀態

# 用戶管理
GET    /api/users                       # 列出用戶
POST   /api/users                       # 創建用戶
PUT    /api/users/:id                   # 更新用戶
DELETE /api/users/:id                   # 刪除用戶
GET    /api/users/me                    # 當前用戶

# 認證
POST   /api/auth/login                  # 登入
POST   /api/auth/logout                 # 登出
POST   /api/auth/refresh                # 刷新 Token
```

### WebSocket 訊息格式

```typescript
// 發送訊息到 Agent
{
  type: "req",
  id: "uuid",
  method: "sessions.send",
  params: {
    sessionId: "session-uuid",
    message: "你好，請幫我分析這個問題"
  }
}

// 接收 Agent 回應
{
  type: "res",
  id: "uuid",
  ok: true,
  payload: {
    response: "好的，我來分析..."
  }
}
```

---

## 六、資料庫設計

### Schema (Prisma)

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  sessions  Session[]
  apiKeys   ApiKey[]
  audits    Audit[]
}

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())
}

model ApiKey {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  name      String
  key       String   @unique
  lastUsed  DateTime?
  createdAt DateTime @default(now())
}

model Audit {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  action    String
  resource  String
  details   String?
  ip        String?
  createdAt DateTime @default(now())
}

enum Role {
  ADMIN
  USER
  VIEWER
}
```

---

## 七、安全設計

### 安全措施

| 層面 | 措施 |
|------|------|
| **認證** | JWT token + bcrypt 密碼加密 |
| **授權** | Role-based access control (RBAC) |
| **API** | Rate limiting (100 req/min) |
| **網絡** | 內部服務用 internal network |
| **Docker Socket** | 只讀掛載 + 白名單服務 |
| **敏感數據** | 環境變量 + .env 文件（不提交） |
| **HTTPS** | 生產環境強制 TLS |

### 環境變量

```bash
DATABASE_URL="file:./data/openclaw.db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_EXPIRES_IN="7d"
ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD="change-me-in-production"
```

---

## 八、目錄結構

```
openclaw-all-in/
├── docker-compose.yml          # 主配置
├── docker-compose.override.yml # 開發覆蓋
├── .env.example                # 環境變量模板
├── control-panel/              # 控制面板前端
│   ├── src/
│   │   ├── components/         # UI 組件
│   │   ├── hooks/              # 自定義 Hooks
│   │   ├── stores/             # Zustand stores
│   │   ├── services/           # API 服務
│   │   ├── pages/              # 頁面元件
│   │   └── routes/             # 路由配置
│   ├── package.json
│   └── Dockerfile
├── api-server/                 # 控制面板後端
│   ├── src/
│   │   ├── routes/             # API 路由
│   │   ├── services/           # 業務邏輯
│   │   ├── middleware/         # 中間件
│   │   └── prisma/             # 資料庫
│   │       └── extensions/     # sqlite-vec 擴展
│   ├── package.json
│   └── Dockerfile
├── configs/                    # 服務配置
│   ├── whisper/                # whisper.cpp 配置
│   ├── nats/                   # NATS 配置
│   └── searxng/                # SearxNG 配置
├── scripts/                    # 管理腳本
│   ├── start-dev.sh
│   └── start-prod.sh
└── docs/
    ├── quick-start.md          # 快速開始指南
    ├── troubleshooting.md      # 疑難排解
    ├── production.md           # 生產環境配置
    └── plans/
        └── 2026-02-18-openclaw-platform-enhancement-design.md
```

---

## 九、實施計畫

### 階段一：基礎架構（Layer 1 - 優先）
1. 更新 docker-compose.yml（profile 配置 + .env 支援）
2. 創建 .env.example（詳細參數說明）
3. 創建控制面板前端專案（React + shadcn/ui）
4. 創建 API Server 後端專案（Express + SQLite）
5. 配置共享網絡和 volumes

### 階段二：核心功能（Layer 2）
1. 儀表板模組（服務狀態、資源監控）
2. 服務管理模組（啟停、日誌、重啟）
3. Agent 控制台（WebSocket 整合）
4. Portainer 整合（監控中心）

### 階段三：增強功能（Layer 3）
1. 配置中心（模型、API Keys）
2. 用戶管理（認證、授權）
3. 語音服務（whisper.cpp + edge-tts）
4. Agent 通訊（NATS）
5. 向量搜尋（sqlite-vec）

### 階段四：生產就緒
1. 安全加固
2. 效能優化
3. 文檔完善（快速開始、疑難排解、生產配置）
4. CI/CD 配置

---

## 十、新增服務說明

### whisper.cpp（語音識別）
- **用途**：將語音轉換為文字（輸入）
- **端口**：`${WHISPER_PORT:-8080}`
- **配置**：可選擇不同模型大小（tiny/base/small/medium/large）
- **Profile**：`voice`

### edge-tts（語音合成）
- **用途**：將文字轉換為語音（輸出）
- **端口**：`${EDGE_TTS_PORT:-5050}`
- **特性**：微軟 Edge 線上語音服務，支援多種語言和聲音
- **Profile**：`voice`

### NATS（Agent 通訊）
- **用途**：Agent 之間的訊息佇列和通訊
- **端口**：`${NATS_PORT:-4222}` (客戶端) / `${NATS_MONITOR_PORT:-8222}` (監控)
- **特性**：輕量級、高效能的訊息系統
- **Profile**：`agent`

### sqlite-vec（向量搜尋）
- **用途**：向量嵌入儲存和相似度搜尋
- **實現**：作為 SQLite 擴展內嵌於 API Server
- **優勢**：輕量化、無需獨立服務、與控制面板共用資料庫
- **Profile**：內嵌（無需獨立 profile）

---

## 十一、環境變數配置

### .env 檔案結構

```bash
# ===== OpenClaw 核心服務 =====
OPENCLAW_PORT=18789
OPENCLAW_DATA_PATH=./data/openclaw

# ===== AI 模型服務 =====
OLLAMA_PORT=11434
OLLAMA_MODELS_PATH=./data/ollama

# ===== 資料服務 =====
REDIS_PORT=6379
REDIS_DATA_PATH=./data/redis

# ===== 搜尋服務 =====
SEARXNG_PORT=8080
SEARXNG_DATA_PATH=./data/searxng

# ===== 監控服務 =====
PORTAINER_PORT=9000
PORTAINER_DATA_PATH=./data/portainer

# ===== 控制面板 =====
CONTROL_PANEL_PORT=4000
API_SERVER_PORT=5000
DATABASE_PATH=./data/openclaw.db

# ===== 語音服務（可選） =====
WHISPER_PORT=8081
WHISPER_MODEL=base
EDGE_TTS_PORT=5050

# ===== Agent 通訊（可選） =====
NATS_PORT=4222
NATS_MONITOR_PORT=8222

# ===== 安全配置 =====
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-me-in-production

# ===== 可選服務開關 =====
ENABLE_VOICE_SERVICES=false
ENABLE_AGENT_MESSAGING=false
```

### 參數說明

| 參數 | 預設值 | 說明 |
|------|--------|------|
| `OPENCLAW_PORT` | 18789 | OpenClaw Gateway 端口 |
| `OLLAMA_PORT` | 11434 | Ollama API 端口 |
| `WHISPER_MODEL` | base | Whisper 模型大小（tiny/base/small/medium/large） |
| `JWT_SECRET` | - | JWT 簽名密鑰（**必須修改**） |
| `ENABLE_VOICE_SERVICES` | false | 是否啟用語音服務 |
| `ENABLE_AGENT_MESSAGING` | false | 是否啟用 NATS 通訊 |

---

## 十二、參考資源

- [OpenClaw 官方文檔](https://docs.openclaw.ai)
- [OpenClaw GitHub](https://github.com/coollabsio/openclaw)
- [Docker Compose Profiles](https://docs.docker.com/compose/profiles/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)
- [whisper.cpp](https://github.com/ggerganov/whisper.cpp)
- [edge-tts](https://github.com/rany2/edge-tts)
- [NATS](https://nats.io/)
- [sqlite-vec](https://github.com/asg017/sqlite-vec)
- [Portainer](https://www.portainer.io/)
