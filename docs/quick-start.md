# OpenClaw AI Platform - 快速開始指南

本指南將幫助您在 5 分鐘內啟動 OpenClaw AI Platform。

## 📋 前置需求

### 必要軟體

| 軟體 | 最低版本 | 推薦版本 | 檢查命令 |
|------|---------|---------|---------|
| Docker | 24.0+ | 最新版 | `docker --version` |
| Docker Compose | 2.20+ | 最新版 | `docker compose version` |
| Git | 2.30+ | 最新版 | `git --version` |

### 硬體需求

| 配置 | CPU | RAM | 磁碟 | 適用場景 |
|------|-----|-----|------|---------|
| 最小 | 2 核 | 4 GB | 20 GB | 測試、開發 |
| 推薦 | 4 核 | 16 GB | 100 GB | 生產環境 |
| 理想 | 8 核+ | 32 GB+ | 500 GB+ | 多模型、高負載 |

## 🚀 快速啟動

### 步驟 1：取得專案

```bash
git clone https://github.com/your-org/openclaw-all-in.git
cd openclaw-all-in
```

### 步驟 2：配置環境變數

```bash
# 複製環境變數模板
cp .env.example .env

# 編輯配置（至少修改以下參數）
vim .env
```

**必須修改的參數：**

```bash
# 安全配置（必須修改！）
JWT_SECRET=<使用 openssl rand -base64 48 生成>
SEARXNG_SECRET_KEY=<使用 openssl rand -hex 32 生成>
ADMIN_EMAIL=<您的 Email>
ADMIN_PASSWORD=<強密碼>
```

生成密鑰命令：

```bash
# JWT Secret
openssl rand -base64 48

# SearxNG Secret Key
openssl rand -hex 32
```

### 步驟 3：啟動服務

#### 方式 A：使用初始化腳本（推薦）

```bash
chmod +x init.sh
./init.sh
```

#### 方式 B：手動啟動

```bash
# 建立數據目錄
mkdir -p data/{openclaw,ollama,redis,searxng,portainer}

# 啟動核心服務
docker compose --profile core up -d

# 查看服務狀態
docker compose ps
```

### 步驟 4：驗證服務

```bash
# 檢查所有服務健康狀態
docker compose ps --format "table {{.Service}}\t{{.Status}}"

# 檢查 OpenClaw Gateway
curl -f http://localhost:18789/health

# 檢查 SearxNG
curl -f http://localhost:8080/health

# 檢查 Ollama
curl -f http://localhost:11434/api/version
```

## 🌐 存取服務

| 服務 | URL | 用途 |
|------|-----|------|
| OpenClaw Gateway | http://localhost:18789 | AI Agent 主要入口 |
| SearxNG | http://localhost:8080 | 搜尋引擎 |
| Ollama API | http://localhost:11434 | AI 模型 API |
| Portainer | http://localhost:9000 | 容器管理界面 |

### Portainer 初始設置

首次訪問 Portainer 時需要設置管理員密碼：

1. 訪問 http://localhost:9000
2. 設置管理員密碼（至少 12 字元）
3. 選擇 "Docker Standalone" 環境
4. 點擊 "Connect"

## 🤖 下載 AI 模型

### 方式 A：使用 init.sh 腳本

init.sh 會自動下載 .env 中配置的預設模型。

### 方式 B：手動下載

```bash
# 下載推薦模型（3B 參數，約 2GB）
docker exec openclaw_ollama ollama pull qwen2.5:3b
docker exec openclaw_ollama ollama pull llama3.2:3b

# 查看已下載模型
docker exec openclaw_ollama ollama list
```

### 模型選擇建議

| 模型 | 參數量 | 大小 | RAM 需求 | 速度 | 品質 |
|------|-------|------|---------|------|------|
| qwen2.5:1.5b | 1.5B | 1GB | 4GB | ⚡⚡⚡ | ⭐⭐ |
| qwen2.5:3b | 3B | 2GB | 8GB | ⚡⚡ | ⭐⭐⭐ |
| qwen2.5:7b | 7B | 4GB | 16GB | ⚡ | ⭐⭐⭐⭐ |
| llama3.2:1b | 1B | 1GB | 4GB | ⚡⚡⚡ | ⭐⭐ |
| llama3.2:3b | 3B | 2GB | 8GB | ⚡⚡ | ⭐⭐⭐ |

## 🎯 啟用額外服務

### 啟用控制面板

```bash
# 啟動控制面板（包含 API Server）
docker compose --profile core --profile ui up -d

# 訪問控制面板
open http://localhost:4000
```

### 啟用語音服務

```bash
# 啟動語音服務
docker compose --profile core --profile voice up -d

# 語音識別 API
curl -X POST http://localhost:8081/transcribe \
  -F "audio=@test.wav"

# 語音合成 API
curl -X POST http://localhost:5050/synthesize \
  -d "text=你好，世界" \
  -d "voice=zh-TW-HsiaoChenNeural"
```

### 啟用 Agent 通訊

```bash
# 啟動 NATS
docker compose --profile core --profile agent up -d

# NATS 監控界面
open http://localhost:8222
```

### 啟動完整平台

```bash
# 啟動所有服務
docker compose --profile core --profile ui --profile voice --profile agent up -d
```

## 📊 監控服務

### 查看日誌

```bash
# 查看所有服務日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f openclaw
docker compose logs -f ollama
docker compose logs -f searxng
```

### 查看資源使用

```bash
# 容器資源使用
docker stats

# 磁碟使用
du -sh data/*
```

## 🛠️ 常用操作

### 服務管理

```bash
# 停止所有服務
docker compose down

# 重啟特定服務
docker compose restart openclaw

# 更新服務
docker compose pull && docker compose up -d
```

### 數據管理

```bash
# 備份數據
tar -czf openclaw-backup-$(date +%Y%m%d).tar.gz data/

# 清理未使用的資源
docker system prune -a
```

### 進入容器

```bash
# 進入 OpenClaw 容器
docker exec -it openclaw_gateway bash

# 進行 QMD 操作
docker exec openclaw_gateway qmd update
docker exec openclaw_gateway qmd embed
```

## 🔧 故障排除

### 常見問題

#### 1. 端口衝突

**錯誤訊息：** `Error: port is already allocated`

**解決方法：**

```bash
# 查找佔用端口的進程
lsof -i :8080

# 修改 .env 中的端口配置
SEARXNG_PORT=8081
```

#### 2. 權限問題

**錯誤訊息：** `Permission denied`

**解決方法：**

```bash
# 確保數據目錄權限正確
chmod -R 755 data/

# 確保 Docker socket 可訪問
ls -la /var/run/docker.sock
```

#### 3. 記憶體不足

**錯誤訊息：** `OOMKilled` 或模型載入失敗

**解決方法：**

```bash
# 增加 Docker 記憶體限制
# Docker Desktop -> Settings -> Resources -> Memory

# 或使用更小的模型
OLLAMA_DEFAULT_MODELS=qwen2.5:1.5b
```

#### 4. 模型下載失敗

**解決方法：**

```bash
# 手動下載模型
docker exec openclaw_ollama ollama pull qwen2.5:3b

# 檢查網絡連接
curl -I https://ollama.com
```

### 獲取幫助

1. 查看日誌：`docker compose logs -f [service_name]`
2. 查看文檔：[docs.openclaw.ai](https://docs.openclaw.ai)
3. 提交問題：[GitHub Issues](https://github.com/coollabsio/openclaw/issues)

## 📚 下一步

- [疑難排解指南](./troubleshooting.md)
- [生產環境配置](./production.md)
- [設計文檔](./plans/2026-02-18-openclaw-platform-enhancement-design.md)
