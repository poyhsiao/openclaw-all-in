# OpenClaw AI Platform - 疑難排解指南

本指南提供常見問題的診斷和解決方法。

## 📋 目錄

- [服務啟動問題](#服務啟動問題)
- [網絡連接問題](#網絡連接問題)
- [AI 模型問題](#ai-模型問題)
- [性能問題](#性能問題)
- [數據存儲問題](#數據存儲問題)
- [安全配置問題](#安全配置問題)
- [日誌診斷](#日誌診斷)

## 🚨 服務啟動問題

### 問題：Docker Compose 啟動失敗

**症狀：**
```
Error: failed to create network
Error: failed to build image
```

**診斷步驟：**

```bash
# 1. 檢查 Docker 服務狀態
docker info

# 2. 檢查 Docker Compose 版本
docker compose version

# 3. 檢查磁碟空間
df -h

# 4. 檢查 .env 文件是否存在
test -f .env && echo "OK" || echo "Missing .env file"
```

**解決方法：**

```bash
# 方法 1：清理並重啟
docker compose down -v
docker system prune -a
docker compose --profile core up -d

# 方法 2：檢查配置語法
docker compose config

# 方法 3：重建映像
docker compose build --no-cache
docker compose --profile core up -d
```

### 問題：服務健康檢查失敗

**症狀：**
```
Container is unhealthy
```

**診斷步驟：**

```bash
# 檢查服務狀態
docker compose ps

# 查看健康檢查日誌
docker inspect openclaw_gateway | jq '.[0].State.Health'

# 手動執行健康檢查命令
docker exec openclaw_gateway curl -f http://localhost:18789/health
```

**解決方法：**

```bash
# 重啟失敗的服務
docker compose restart openclaw

# 檢查服務依賴
docker compose logs searxng
docker compose logs ollama
docker compose logs redis

# 增加啟動等待時間（修改 docker-compose.yml）
healthcheck:
  start_period: 60s  # 增加啟動緩衝時間
```

### 問題：服務依賴錯誤

**症狀：**
```
Service 'openclaw' depends on service 'searxng' which is unhealthy
```

**診斷步驟：**

```bash
# 檢查依賴服務狀態
docker compose ps searxng ollama redis

# 查看依賴服務日誌
docker compose logs searxng --tail 100
```

**解決方法：**

```bash
# 按順序重啟服務
docker compose restart redis
sleep 10
docker compose restart searxng
sleep 15
docker compose restart openclaw

# 或完全重建
docker compose down
docker compose --profile core up -d
```

## 🌐 網絡連接問題

### 問題：無法訪問服務

**症狀：**
```
curl: (7) Failed to connect to localhost port 18789
Connection refused
```

**診斷步驟：**

```bash
# 1. 檢查容器是否運行
docker compose ps

# 2. 檢查端口映射
docker port openclaw_gateway

# 3. 檢查防火牆
sudo lsof -i :18789
netstat -tlnp | grep 18789

# 4. 檢查容器內部網絡
docker exec openclaw_gateway netstat -tlnp
```

**解決方法：**

```bash
# 方法 1：重啟服務
docker compose restart openclaw

# 方法 2：檢查 .env 端口配置
cat .env | grep PORT

# 方法 3：檢查端口衝突
lsof -i :18789
kill -9 <PID>  # 如果有衝突進程

# 方法 4：修改端口配置
# 編輯 .env 文件
OPENCLAW_PORT=18800
docker compose up -d
```

### 問題：服務間無法通信

**症狀：**
```
SearxNG cannot connect to Redis
OpenClaw cannot connect to SearxNG
```

**診斷步驟：**

```bash
# 檢查 Docker 網絡
docker network ls
docker network inspect openclaw-network

# 檢查容器網絡連接
docker exec openclaw_searxng ping -c 3 redis
docker exec openclaw_gateway ping -c 3 searxng

# 檢查 DNS 解析
docker exec openclaw_gateway nslookup searxng
```

**解決方法：**

```bash
# 方法 1：重建網絡
docker compose down
docker network prune
docker compose --profile core up -d

# 方法 2：檢查服務名稱
docker compose ps --format "table {{.Service}}\t{{.Name}}"

# 方法 3：使用容器名稱而非服務名稱
# 在 docker-compose.yml 中確保 container_name 設置正確
```

### 問題：端口衝突

**症狀：**
```
Error: port is already allocated
Bind for 0.0.0.0:8080 failed: port is already allocated
```

**診斷步驟：**

```bash
# 查找佔用端口的進程
lsof -i :8080
netstat -tlnp | grep 8080

# 查找佔用端口的 Docker 容器
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep 8080
```

**解決方法：**

```bash
# 方法 1：停止衝突服務
kill -9 <PID>

# 方法 2：停止衝突容器
docker stop <container_name>

# 方法 3：修改端口配置
# 編輯 .env 文件
SEARXNG_PORT=8081
docker compose up -d
```

## 🤖 AI 模型問題

### 問題：模型下載失敗

**症狀：**
```
Error: failed to pull model
Error: connection refused
```

**診斷步驟：**

```bash
# 檢查網絡連接
curl -I https://ollama.com
ping ollama.com

# 檢查 Ollama 服務狀態
docker compose logs ollama --tail 50

# 檢查磁碟空間
df -h data/ollama
```

**解決方法：**

```bash
# 方法 1：手動下載模型
docker exec openclaw_ollama ollama pull qwen2.5:3b

# 方法 2：設置代理（如果在中國）
# 在 docker-compose.yml 中添加環境變量
environment:
  - HTTP_PROXY=http://proxy.example.com:8080
  - HTTPS_PROXY=http://proxy.example.com:8080

# 方法 3：使用鏡像源
# 從其他來源下載模型後手動載入
ollama create mymodel -f Modelfile

# 方法 4：清理並重試
docker exec openclaw_ollama ollama rm qwen2.5:3b
docker exec openclaw_ollama ollama pull qwen2.5:3b
```

### 問題：模型載入失敗

**症狀：**
```
Error: model not found
OOMKilled
```

**診斷步驟：**

```bash
# 檢查已下載的模型
docker exec openclaw_ollama ollama list

# 檢查記憶體使用
free -h
docker stats --no-stream

# 檢查模型大小
docker exec openclaw_ollama du -sh /root/.ollama
```

**解決方法：**

```bash
# 方法 1：使用更小的模型
# 修改 .env 文件
OLLAMA_DEFAULT_MODELS=qwen2.5:1.5b

# 方法 2：增加記憶體限制
# Docker Desktop -> Settings -> Resources -> Memory

# 方法 3：清理舊模型
docker exec openclaw_ollama ollama list
docker exec openclaw_ollama ollama rm <old_model>

# 方法 4：設置模型並行限制
# 在 docker-compose.yml 中添加
environment:
  - OLLAMA_NUM_PARALLEL=1
  - OLLAMA_MAX_LOADED_MODELS=1
```

### 問題：模型響應緩慢

**症狀：**
- 模型響應時間超過 30 秒
- 推理速度極慢

**診斷步驟：**

```bash
# 檢查 CPU 使用率
top

# 檢查記憶體使用
free -h

# 檢查 GPU 使用（如果有）
nvidia-smi

# 檢查磁碟 I/O
iostat -x 1
```

**解決方法：**

```bash
# 方法 1：啟用 GPU 加速
# 取消 docker-compose.yml 中的 GPU 配置註釋

# 方法 2：減少推理參數
# 調用模型時設置較低的溫度和 token 限制
curl http://localhost:11434/api/generate -d '{
  "model": "qwen2.5:3b",
  "prompt": "你好",
  "options": {
    "temperature": 0.7,
    "num_predict": 100
  }
}'

# 方法 3：使用量化模型
docker exec openclaw_ollama ollama pull qwen2.5:3b-q4_0

# 方法 4：增加 CPU 優先級
docker update --cpus 4 openclaw_ollama
```

## 💾 性能問題

### 問題：磁碟空間不足

**症狀：**
```
No space left on device
```

**診斷步驟：**

```bash
# 檢查磁碟使用
df -h

# 檢查各目錄大小
du -sh data/*

# 檢查 Docker 使用
docker system df
```

**解決方法：**

```bash
# 方法 1：清理未使用的 Docker 資源
docker system prune -a --volumes

# 方法 2：刪除舊模型
docker exec openclaw_ollama ollama list
docker exec openclaw_ollama ollama rm <old_model>

# 方法 3：清理日誌
truncate -s 0 /var/lib/docker/containers/*/*-json.log

# 方法 4：移動數據目錄
# 修改 .env 文件
OLLAMA_MODELS_PATH=/mnt/large-disk/ollama
```

### 問題：記憶體不足

**症狀：**
```
OOMKilled
Cannot allocate memory
```

**診斷步驟：**

```bash
# 檢查記憶體使用
free -h
cat /proc/meminfo | grep -E 'MemTotal|MemFree|MemAvailable'

# 檢查進程記憶體使用
ps aux --sort=-%mem | head -20

# 檢查容器記憶體限制
docker stats --no-stream
```

**解決方法：**

```bash
# 方法 1：增加 Docker 記憶體限制
# Docker Desktop -> Settings -> Resources -> Memory

# 方法 2：設置容器記憶體限制
# 在 docker-compose.yml 中添加
deploy:
  resources:
    limits:
      memory: 8G

# 方法 3：減少 Redis 記憶體
# 修改 docker-compose.yml
command: redis-server --maxmemory 256mb

# 方法 4：使用更小的模型
OLLAMA_DEFAULT_MODELS=qwen2.5:1.5b
```

### 問題：CPU 過載

**症狀：**
- 系統響應緩慢
- CPU 使用率 100%

**診斷步驟：**

```bash
# 檢查 CPU 使用
top
htop

# 檢查容器 CPU 使用
docker stats --no-stream
```

**解決方法：**

```bash
# 方法 1：限制容器 CPU
docker update --cpus 2 openclaw_ollama

# 方法 2：調整並行限制
# 在 docker-compose.yml 中
environment:
  - OLLAMA_NUM_PARALLEL=1

# 方法 3：降低優先級
docker update --cpu-shares 512 openclaw_ollama
```

## 🔐 安全配置問題

### 問題：JWT 驗證失敗

**症狀：**
```
Error: invalid token
Error: jwt malformed
```

**診斷步驟：**

```bash
# 檢查 JWT Secret
cat .env | grep JWT_SECRET

# 檢查 JWT Secret 長度（至少 32 字元）
echo -n "your-jwt-secret" | wc -c
```

**解決方法：**

```bash
# 方法 1：重新生成 JWT Secret
openssl rand -base64 48
# 更新 .env 文件
JWT_SECRET=<新的密鑰>

# 方法 2：重啟 API Server
docker compose restart api-server

# 方法 3：清除舊的 Session
# 用戶需要重新登入
```

### 問題：權限拒絕

**症狀：**
```
Permission denied
Access denied
```

**診斷步驟：**

```bash
# 檢查文件權限
ls -la data/

# 檢查 Docker socket 權限
ls -la /var/run/docker.sock

# 檢查當前用戶
whoami
groups
```

**解決方法：**

```bash
# 方法 1：修復數據目錄權限
chmod -R 755 data/
chown -R $(whoami):$(id -gn) data/

# 方法 2：添加用戶到 docker 組
sudo usermod -aG docker $(whoami)
# 需要重新登入

# 方法 3：使用 sudo
sudo docker compose up -d
```

## 📊 日誌診斷

### 查看服務日誌

```bash
# 查看所有服務日誌
docker compose logs -f

# 查看特定服務日誌
docker compose logs -f openclaw
docker compose logs -f ollama
docker compose logs -f searxng

# 查看最近 N 行日誌
docker compose logs --tail 100 openclaw

# 查看帶時間戳的日誌
docker compose logs -f --timestamps openclaw
```

### 日誌級別調整

```bash
# 調整日誌級別（編輯 .env）
LOG_LEVEL=debug  # 詳細日誌
LOG_LEVEL=info   # 標準日誌
LOG_LEVEL=warn   # 警告和錯誤
LOG_LEVEL=error  # 僅錯誤

# 重啟服務使配置生效
docker compose restart
```

### 日誌分析

```bash
# 搜索錯誤日誌
docker compose logs openclaw | grep -i error

# 搜索特定時間段的日誌
docker compose logs --since 2024-01-01T00:00:00 openclaw

# 導出日誌
docker compose logs openclaw > openclaw.log
```

## 🆘 獲取幫助

如果以上方法都無法解決問題：

1. **收集診斷信息**
   ```bash
   # 導出診斷信息
   docker compose ps > diagnostic.txt
   docker compose logs --tail 200 >> diagnostic.txt
   docker info >> diagnostic.txt
   ```

2. **查閱文檔**
   - [OpenClaw 官方文檔](https://docs.openclaw.ai)
   - [Docker Compose 文檔](https://docs.docker.com/compose/)
   - [Ollama 文檔](https://ollama.com/docs)

3. **提交問題**
   - [GitHub Issues](https://github.com/coollabsio/openclaw/issues)
   - 提供診斷信息和環境配置

4. **社區支持**
   - [OpenClaw Discord](https://discord.gg/openclaw)
   - [GitHub Discussions](https://github.com/coollabsio/openclaw/discussions)
