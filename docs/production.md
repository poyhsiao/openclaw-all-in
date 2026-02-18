# OpenClaw AI Platform - 生產環境配置指南

本指南提供生產環境部署的最佳實踐和配置建議。

## 🎯 生產環境檢查清單

### 安全配置

- [ ] 修改所有預設密碼和密鑰
- [ ] 啟用 HTTPS/TLS
- [ ] 配置防火牆規則
- [ ] 設置適當的 CORS 策略
- [ ] 啟用 Redis 密碼認證
- [ ] 配置日誌審計
- [ ] 設置備份策略

### 性能配置

- [ ] 根據負載調整資源限制
- [ ] 配置 GPU 加速（如適用）
- [ ] 優化 Redis 記憶體設置
- [ ] 配置模型並行限制
- [ ] 設置適當的日誌級別

### 可靠性配置

- [ ] 配置健康檢查
- [ ] 設置自動重啟策略
- [ ] 配置數據持久化
- [ ] 設置監控警報
- [ ] 準備災難恢復計畫

## 🔐 安全配置

### 1. 生成安全密鑰

```bash
# JWT Secret（至少 48 字元）
openssl rand -base64 48

# SearxNG Secret Key
openssl rand -hex 32

# Redis Password
openssl rand -base64 32

# Portainer Admin Password
htpasswd -nbB admin "your-strong-password"
```

### 2. 配置環境變數

創建生產環境配置文件 `.env.production`：

```bash
# ============================================================
# 生產環境配置
# ============================================================

# OpenClaw 核心服務
OPENCLAW_PORT=18789
OPENCLAW_DATA_PATH=/var/lib/openclaw

# AI 模型服務
OLLAMA_PORT=11434
OLLAMA_MODELS_PATH=/var/lib/ollama
OLLAMA_DEFAULT_MODELS=qwen2.5:7b llama3.1:8b

# 資料服務
REDIS_PORT=6379
REDIS_DATA_PATH=/var/lib/redis
REDIS_PASSWORD=<生成的強密碼>

# 搜尋服務
SEARXNG_PORT=8080
SEARXNG_DATA_PATH=/var/lib/searxng
SEARXNG_SECRET_KEY=<生成的密鑰>

# 監控服務
PORTAINER_PORT=9000
PORTAINER_DATA_PATH=/var/lib/portainer

# 控制面板
CONTROL_PANEL_PORT=4000
API_SERVER_PORT=5000
DATABASE_PATH=/var/lib/openclaw/openclaw.db

# 語音服務（可選）
ENABLE_VOICE_SERVICES=true
WHISPER_PORT=8081
WHISPER_MODEL=medium
EDGE_TTS_PORT=5050
EDGE_TTS_DEFAULT_VOICE=zh-TW-HsiaoChenNeural

# Agent 通訊（可選）
ENABLE_AGENT_MESSAGING=true
NATS_PORT=4222
NATS_MONITOR_PORT=8222
NATS_DATA_PATH=/var/lib/nats

# 安全配置
JWT_SECRET=<生成的 48+ 字元密鑰>
JWT_EXPIRES_IN=1d
ADMIN_EMAIL=admin@yourdomain.com
ADMIN_PASSWORD=<強密碼>

# 效能配置
API_RATE_LIMIT=100
LOG_LEVEL=warn

# 開發配置
NODE_ENV=production
DEBUG_MODE=false
ENABLE_CORS=false

# 備份配置
ENABLE_BACKUP=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=/var/backups/openclaw
```

### 3. 配置 HTTPS/TLS

#### 方式 A：使用 Nginx 反向代理

```nginx
# /etc/nginx/sites-available/openclaw
server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # OpenClaw Gateway
    location / {
        proxy_pass http://localhost:18789;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # API Server
    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Control Panel
    location /panel/ {
        proxy_pass http://localhost:4000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

#### 方式 B：使用 Caddy（自動 HTTPS）

```caddyfile
# Caddyfile
yourdomain.com {
    reverse_proxy localhost:18789
    
    handle /api/* {
        reverse_proxy localhost:5000
    }
    
    handle /panel/* {
        reverse_proxy localhost:4000
    }
}
```

### 4. 配置防火牆

```bash
# UFW（Ubuntu）
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 允許 SSH
sudo ufw allow ssh

# 允許 HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# 允許 OpenClaw 端口（如果直接暴露）
sudo ufw allow 18789/tcp

# 啟用防火牆
sudo ufw enable

# 查看狀態
sudo ufw status
```

### 5. 配置 CORS

```bash
# .env 文件
ENABLE_CORS=true
CORS_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

## 🚀 性能優化

### 1. 資源配置

根據硬體配置調整 Docker Compose：

```yaml
# docker-compose.yml
services:
  ollama:
    deploy:
      resources:
        reservations:
          cpus: '4'
          memory: 8G
        limits:
          cpus: '8'
          memory: 16G
    # GPU 支持
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]

  redis:
    deploy:
      resources:
        limits:
          memory: 2G
    command: >
      redis-server 
      --appendonly yes 
      --maxmemory 1gb 
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}

  api-server:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

### 2. GPU 加速配置

```yaml
# docker-compose.yml
services:
  ollama:
    environment:
      - NVIDIA_VISIBLE_DEVICES=all
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: all
              capabilities: [gpu]
```

安裝 NVIDIA Container Toolkit：

```bash
# Ubuntu/Debian
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

sudo apt-get update
sudo apt-get install -y nvidia-container-toolkit
sudo nvidia-ctk runtime configure --runtime=docker
sudo systemctl restart docker
```

### 3. Redis 優化

```yaml
# docker-compose.yml
services:
  redis:
    command: >
      redis-server 
      --appendonly yes
      --appendfsync everysec
      --maxmemory 2gb
      --maxmemory-policy allkeys-lru
      --requirepass ${REDIS_PASSWORD}
      --save 900 1
      --save 300 10
      --save 60 10000
```

### 4. 模型優化

```bash
# .env 配置
# 限制並行推理數量
OLLAMA_NUM_PARALLEL=2
OLLAMA_MAX_LOADED_MODELS=2

# 使用量化模型節省記憶體
OLLAMA_DEFAULT_MODELS=qwen2.5:7b-q4_0
```

## 📊 監控配置

### 1. 健康檢查端點

所有服務都應配置健康檢查：

```yaml
# docker-compose.yml
services:
  openclaw:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:18789/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s
```

### 2. Portainer 監控

Portainer 提供容器監控和管理：

1. 訪問 http://localhost:9000
2. 設置管理員密碼
3. 選擇 "Docker Standalone" 環境
4. 使用儀表板監控容器狀態

### 3. 日誌管理

```yaml
# docker-compose.yml
services:
  openclaw:
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
```

### 4. 自定義監控腳本

```bash
#!/bin/bash
# scripts/health-check.sh

# 服務健康檢查
services=(
  "openclaw_gateway:http://localhost:18789/health"
  "openclaw_searxng:http://localhost:8080/health"
  "openclaw_ollama:http://localhost:11434/api/version"
  "openclaw_redis:redis-cli ping"
)

for service in "${services[@]}"; do
  name="${service%%:*}"
  url="${service#*:}"
  
  if curl -f -s "$url" > /dev/null 2>&1; then
    echo "✅ $name is healthy"
  else
    echo "❌ $name is unhealthy"
    # 發送警報通知
    # curl -X POST $WEBHOOK_URL -d "{\"text\": \"$name is down\"}"
  fi
done
```

## 💾 備份策略

### 1. 自動備份腳本

```bash
#!/bin/bash
# scripts/backup.sh

set -e

# 配置
BACKUP_DIR=/var/backups/openclaw
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# 創建備份目錄
mkdir -p "$BACKUP_DIR"

# 備份資料庫
echo "Backing up database..."
sqlite3 /var/lib/openclaw/openclaw.db ".backup '$BACKUP_DIR/openclaw_$DATE.db'"

# 備份配置
echo "Backing up configuration..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
  .env \
  docker-compose.yml \
  searxng-settings.yml

# 備份 Redis
echo "Backing up Redis..."
docker exec openclaw_redis redis-cli BGSAVE
docker cp openclaw_redis:/data/dump.rdb "$BACKUP_DIR/redis_$DATE.rdb"

# 清理舊備份
echo "Cleaning old backups..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

### 2. 定時備份（Cron）

```bash
# 編輯 crontab
crontab -e

# 每天凌晨 2 點執行備份
0 2 * * * /path/to/scripts/backup.sh >> /var/log/openclaw-backup.log 2>&1
```

### 3. 災難恢復

```bash
#!/bin/bash
# scripts/restore.sh

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
  echo "Usage: $0 <backup_file>"
  exit 1
fi

# 停止服務
docker compose down

# 恢復資料庫
cp "$BACKUP_FILE/openclaw_*.db" /var/lib/openclaw/openclaw.db

# 恢復配置
tar -xzf "$BACKUP_FILE/config_*.tar.gz"

# 恢復 Redis
docker compose up -d redis
sleep 5
docker cp "$BACKUP_FILE/redis_*.rdb" openclaw_redis:/data/dump.rdb
docker compose restart redis

# 啟動所有服務
docker compose --profile core up -d

echo "Restore completed from: $BACKUP_FILE"
```

## 🔄 更新策略

### 1. 滾動更新

```bash
#!/bin/bash
# scripts/update.sh

set -e

echo "Pulling latest images..."
docker compose pull

echo "Recreating services..."
docker compose up -d --remove-orphans

echo "Cleaning up..."
docker image prune -f

echo "Update completed"
```

### 2. 藍綠部署

```bash
# 準備新版本
docker compose -f docker-compose.yml -f docker-compose.v2.yml up -d

# 驗證新版本
curl -f http://localhost:18790/health

# 切換流量（更新負載均衡器配置）

# 停止舊版本
docker compose -f docker-compose.v1.yml down
```

## 📈 擴展配置

### 1. 水平擴展

```yaml
# docker-compose.yml
services:
  api-server:
    deploy:
      replicas: 3
```

### 2. 負載均衡

```yaml
# docker-compose.yml
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api-server
```

## 🔧 維護操作

### 日誌輪替

```bash
# /etc/logrotate.d/openclaw
/var/log/openclaw/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

### 定期清理

```bash
#!/bin/bash
# scripts/cleanup.sh

# 清理未使用的 Docker 資源
docker system prune -f

# 清理舊模型版本
docker exec openclaw_ollama ollama list | \
  awk 'NR>1 {print $1}' | \
  tail -n +4 | \
  xargs -I {} docker exec openclaw_ollama ollama rm {}

# 清理舊日誌
find /var/log/openclaw -type f -mtime +7 -delete
```

## 📚 參考資源

- [OpenClaw 官方文檔](https://docs.openclaw.ai)
- [Docker 生產環境最佳實踐](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx 反向代理配置](https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/)
- [Redis 生產環境配置](https://redis.io/docs/management/optimization/)
- [Ollama 生產環境部署](https://ollama.com/docs/production)
