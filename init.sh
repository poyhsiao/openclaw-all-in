#!/bin/bash
# 完整一鍵部署

set -e

echo "🚀 部署 OpenClaw 全功能 stack..."

# 建置
docker compose build openclaw

# 啟動
docker compose up -d

echo "⏳ 等待服務就緒 (2min)..."
sleep 60

# 初始化 Ollama
docker exec openclaw_ollama ollama serve &
sleep 10
docker exec openclaw_ollama ollama pull qwen2.5:3b
docker exec openclaw_ollama ollama pull llama3.2:3b

# 初始化 QMD
docker exec openclaw_gateway qmd update
docker exec openclaw_gateway qmd embed

# 安裝 skills
docker exec openclaw_gateway npx playbooks add skill openclaw/skills --skill searxng-local || true
docker exec openclaw_gateway npx playbooks add skill openclaw/skills --skill qmd || true

echo "✅ 部署完成！"
echo ""
echo "🌐 服務入口："
echo "  Dashboard: http://localhost:3000"
echo "  Portainer: http://localhost:9000"
echo "  SearxNG: http://localhost:8080"
echo "  Ollama: http://localhost:11434"
echo ""
echo "📱 Telegram: 建立 bot 後在 Dashboard 設定"
echo "🔄 更新: docker compose pull && docker compose up -d"
echo "📊 狀態: docker compose ps"

