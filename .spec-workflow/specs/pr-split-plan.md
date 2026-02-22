# PR 拆分計劃 - PR #2

**目標**: 將 PR #2 (77 個文件) 拆分為多個更小、更易審查的 PR

**原始 PR**: `feat(security,persistence): implement encryption and fix docker log parsing`

**原則**:
1. 每個 PR 專關注單一功能領域
2. 依賴關係必須清晰（拆分順序）
3. 每個 PR 的文件數量控制在 10-20 個
4. 測試和主程式碼在同一 PR 中提交
5. 確保每個 PR 可獨立審查、測試、合併

---

## PR 拆分概述

| PR # | 標題 | 範圍 | 文件數 | 優先級 | 依賴 |
|------|------|------|--------|--------|------|
| PR 1 | ✅ 基礎設施與配置驗證 | 數據庫初始化、環境變量驗證 | ~12 | **P0** | 無置依賴 |
| PR 2 | 🔒 安全增強：加密與 JWT | 加密工具、JWT token 類型驗證 | ~6 | **P0** | 依賴 PR 1 |
| PR 3 | ✅ 輸入驗證模組 | 驗驗證工具、錯誤處理 | ~12 | **P1** | 依賴 PR 2 |
| PR 4 | 🐋 Docker 服務改進 | 日誌解析、容器狀態映射 | ~4 | **P1** | 無置依賴 |
| PR 5 | 👤 用戶管理與配置增強 | 用戶保護、配置服務優化 | ~10 | **P1** | 依賴 PR 3 |
| PR 6 | 🎨 前端路由與 UI 改進 | 新增路由組件、樣式優化 | ~30 | **P1** | 依賴 PR 2,5 |

---

## PR 1: ✅ 基礎設施與配置驗證

**目標**: 建立數據庫基礎、環境變量驗證機制、生產環境安全檢查

### 範圍
- Prisma schema 初始化（users, sessions, api_keys, audits）
- 環境變量配置增強（.env.example, unifiedConfig.ts）
- Prisma 配置改進
- 數據庫遷移文件

### 文件列表
```
api-server/
├── prisma/
│   ├── schema.prisma                     # 新增 DATABASE_URL, schema comment
│   └── migrations/
│       ├── 20260218143831_init/        # 新增初始化遷移
│       ├── 20260218144620/migration.sql   # 修改：移除重複索引
│       └── migration_lock.toml              # 新增遷移鎖文件
├── prisma.config.ts                     # 修改：環境驅動配置
├── prisma/seed.ts                         # 修改：密碼輸出掩碼
└── .env.example                            # 修改：安全警告、ENC_KEY
```

**估計文件數**: 5-8 個文件

### 技術細節
- ✅ 新增 Prisma 數據庫 schema 定義
- ✅ 新增遷移創建必要資料表和索引
- ✅ 生產環境強制要求 DATABASE_URL, JWT_SECRET, ENC_KEY
- ✅ 改進種子腳本安全（密碼輸出掩碼）

### 驗證收
- [ ] 檢查 Prisma schema 設註清晰
- [ ] 確認所有索引和外鍵約約束正確
- [ ] 測試數據庫遷移可執行
- [ ] 驗證生產環境驗證邏輯正確

### 合併檢查清單
- [ ] 遷移執行成功（`npm run prisma:migrate`）
- [ ] 種子腳本成功執行
- [ ] 伺服器啟動無報錯
- [ ] 新的環境變量已記錄在文檔中

---

## PR 2: 🔒 安全增強：加密與 JWT

**目標**: 實現 AES-256-GCM 加密工具，改進 JWT token 驗證（type 區分），增強系統安全

### 範圍
- 加密模組（encryption.ts）
- JWT token 類型驗證（auth.ts）
- 配置服務加密集成（configService.ts）

### 文件列表
```
api-server/
├── src/
│   ├── utils/
│   │   ├── encryption.ts                  # 新增：完整加密模組
│   │   └── auth.ts                       # 修改：JWT token 類型驗證
│   ├── config/
│   │   └── unifiedConfig.ts               # 修改：ENC_KEY 驗證
│   ├── services/
│   └── configService.ts                # 修改：加密存儲環境變量
└── .env.example                            # 修改：加密配置範例
```

**估計文件數**: 5-6 個文件

### 技術細節
- 🎉 AES-256-GCM 加密（經認證的加密標準）
- ✅ PBKDF2 密鑰派生（100,000 iterations）
- ✅ 每次加密使用唯一隨機 IV 和 salt
- ✅ JWT payload 添加 `type` 欄位區分（access vs refresh）
- ✅ 環境變量 `ENC_KEY` 密鑰管理
- ⚠️ 開發環境密鑰硬編碼問題需修復（見審查報告）

### 修復計劃
```typescript
// 問題：開發環境密鑰硬編碼
// api-server/src/utils/encryption.ts:26

// 修復：使用環境變量或隨機密鑰
const ENCRYPTION_KEY = (() => {
  if (process.env.ENC_KEY) {
    const decoded = Buffer.from(process.env.ENC_KEY, 'base64');
    if (decoded.length !== 32) {
      throw new Error(`Invalid ENC_KEY: ${decoded.length} bytes, expected 32`);
    }
    return decoded;
  }

  // 測試環境使用隨機密鑰
  if (process.env.NODE_ENV === 'test') {
    return crypto.randomBytes(32);
  }

  throw new Error('ENC_KEY environment variable is required.');
})();
```

### 驗證收
- [ ] 加密/解密功能正常（單元測試）
- [ ] JWT token 類型驗證正確
- [ ] 無境變量 `ENC_KEY` 配置正確
- [ ] 加密前後的數據一致性驗證
- [ ] 錖錯測時不會洩漏密鑰

### 合併檢查清單
- [ ] 加密後的環境變量可成功解密
- [ ] JWT token 無式錯誤時正確拒絕
- [ ] 側用開發密鑰不會影響生產環境
- [ ] 加密操作不會導致數據丟失

---

## PR 3: ✅ 輸入驗證模組與錯誤處理改進

**目標**: 創建統一的輸入驗證模組，改進錯誤中間件，增強請求數據驗證

### 範圍
- 驗證工具模組（validation.ts）
- 驗證測試（validation.test.ts）
- BaseController 增強（添加 handleBadRequest）
- 錯誤處理中間件改進

### 文件列表
```
api-server/
├── src/
│   ├── utils/
│   │   └── validation.ts                 # 新增：完整驗證模組
│   ├── __tests__/
│   │   └── utils/
│   │       └── validation.test.ts       # 新增：驗證測試
│   ├── controllers/
│   │   └── BaseController.ts               # 修改：新增 handleBadRequest
│   └── middleware/
│       └── errorHandler.ts               # 修改：headersSent 檢查
├── src/routes/
│   ├── authRoutes.ts                      # 修改：輸入驗證調用
│   ├── configRoutes.ts                    # 修改：新建資料驗證
│   └── userRoutes.ts                      # 修改：請求參數處理
```

**估計文件數**: 8-10 個文件

### 技術細節
- ✅ Email 格式驗證（建議改進 RFC 5321）
- ✅ 密碼強度檢查（8+ 字符，大小寫數字+特殊字符）
- ✅ 環境變數 key 格式驗證（`^[A-Z_][A-Z0-9_]*$`）
- ✅ 型別安全的驗證錯誤返回
- ✅ `handleBadRequest` 統一錯誤响应

### 改進計劃
```typescript
// 問題：Email 正則過於寬鬆
// api-server/src/utils/validation.ts:7

// 修復：使用標準 RFC 5321 正則
export function isValidEmail(email: string): boolean {
  if (!email || email.length > 254) return false; // RFC 5321 limit
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}
```

### 驗證收
- [ ] 所有驗證函數邏輯正確
- [ ] 錖錯測試覆蓋所有場景
- [ ] 錯誤消息清晰實用（包含具體的錯誤原因）
- [ ] 型別安全的錯誤處理不導致運行時錯誤

### 合併檢查清單
- [ ] 驗證規則符合預期（密碼強度、Email 格式等）
- [ ] 無意請求返回明確的錯誤消息
- [ ] 通過測試用例驗證所有規則
- [ ] 無處理中間件不導致響應體異常

---

## PR 4: 🐋 Docker 服務改進

**目標**: 修復 Docker 容器日誌解析問題，改進容器狀態映射和資源統計

### 範圍
- Docker 日誌服務（dockerService.ts）
- Dashboard 服務（dashboardService.ts）
- Service 類型改進（service.ts）

### 文件列表
```
api-server/
├── src/
│   ├── services/
│   │   ├── dockerService.ts               # 修改：修復日誌解析
│   │   └── dashboardService.ts           # 修改：重啟計數、CPU 安全檢查
│   └── types/
│       └── service.ts                  # 修改：狀態映射函數
```

**估計文件數**: 3-4 個文件

### 技術細節
- 🎉 正確處理 TTY/non-TTY 容器日誌
- ✅ 手動解析 Docker multiplexed buffer 格式
- ✅ 容器狀態映射函數（`mapContainerStateToLabel`）
- ✅ CPU 計算安全的數學運算（防止除以零錯誤）
- ✅ 修復 restart 從的日誌模式匹配問題

### 修復計劃
```typescript
// 問題：Docker log size 無上限
// api-server/src/services/dockerService.ts:133

// 修復：添加 size 上限驗證
const MAX_LOG_ENTRY_SIZE = 1024 * 1024; // 1MB per log entry

const size = Math.min(
  logsBuffer.readUInt32BE(offset + 4),
  MAX_LOG_ENTRY_SIZE
);
```

### 驗證收
- [ ] TTY 容器日誌正常返回
- [ ] 非 TTY 容器日誌正確解析 multiplexed 格式
- [ ] 超大日誌不會導致內存溢出
- [ ] 容器狀態映射函數正確返回用戶友好標籤
- [ ] CPU 計算不會因為除零而拋出異常

### 合併檢查清單
- [ ] 所有容器類型的日誌都能正確解析
- [ ] 大量日誌（數千行）處理正常
- [ ] 容器狀態顯示準確（running -> "running", exited -> "stopped"）
- [ ] 重啟計數邏輯正確處理重啟事件

---

## PR 5: 👤 用戶管理與配置服務增強

**目標**: 增強用戶管理安全性，優化配置服務，實現敏感數據保護的掩碼機制

### 範圍
- 用戶更新路由改進（userRoutes.ts）
- 錆誤處理中間件增強（errorHandler.ts, BaseController.ts）
- 配置服務增強（configService.ts：加密集成、掩碼）
- 安全邏輯：自我帳號刪除保護、敏感值掩碼

### 文件列表
```
api-server/
├── src/
│   ├── routes/
│   │   └── userRoutes.ts                 # 修改：自我刪除保護、路由重組
│   ├── repositories/
│   │   ├── AuditRepository.ts              # 修改：查詢限制優化
│   │   └── UserRepository.ts               # 修改：用戶服務增強
│   ├── services/
│   │   ├── userService.ts                # 修改：查詢限制、重複檢查
│   │   ├── auditService.ts              # 修改：查詢限制優化
│   │   └── configService.ts            # 修改：加密集成、掩碼
│   ├── middleware/
│   │   └── errorHandler.ts               # 修改：headersSent 檢查
│   └── controllers/
│       └── BaseController.ts           # 修改：新增 handleBadRequest
```

**估計文件數**: 8-10 個文件

### 技術細節
- 🎉 防止用戶刪除自己的帳號
- ✅ 密文加密存儲環境變量（應用層加密/解密）
- ✅ 敏感值掩碼顯示（前4 + 後4 字符 + 郌點）
- ✅ 分頁查詢限制（MAX_LIMIT）
- ✅ 數據性查詢優化
- ✅ 錯誤處理改進（headersSent 檢查）

### 驗證收
- [ ] 用戶不能刪除自己的帳號
- [ ] 加密的環境變量在列表中正確掩碼顯示
- [ ] 分頁查詢參數驗證（負數、過大值）
- [ ] 敏擬性查詢範圍限制有效
- [ ] 錯誤中間件正確處理已發送的響應

### 合併檢查清單
- [ ] 自我帳號刪除請求被正確拒絕並記錄
- [ ] 敏感值在日誌中不會明文顯示
- [ ] 分頁返回正確的數據和元數（total、totalPages）
- [ ] 大量查詢被限制在合理範圍內
- [ ] 錯誤中間件不會導致重複響應

---

## PR 6: 🎨 前端路由與 UI 改進

**目標**: 新增前端路由頁面（Agent Console、Monitor、配置管理），優化 UI 組件和樣式

### 範圍
- 新增路由組件（agent.tsx, monitor.tsx, config.models.tsx, config.keys.tsx, agent.sessions.tsx）
- UI 組件優化（service card, data table, overview cards 等）
- 路由樹更新（routeTree.gen.ts, __root.tsx）
- 配置更新（package.json, components.json）

### 文件列表
```
control-panel/
├── src/
│   ├── routes/
│   │   ├── agent.tsx                         # 新增：Agent Console
│   │   ├── agent.sessions.tsx                 # 新增：Agent 會話管理
│   │   ├── monitor.tsx                       # 新增：監控儀表板
│   │   ├── config.models.tsx                  # 新增：模型管理
│   │   └── config.keys.tsx                   # 新增：API 金鑰管理
│   ├── routeTree.gen.ts                     # 修改：擴展路由樹
│   ├── components/
│   │   ├── data-table.tsx                     # 修改：新增 keyExtractor
│   │   ├── service-card.tsx                   # 修改：修復 port 問題
│   │   └── ... (其他 UI 組件優化)
│   ├── package.json                              # 修改：新增依賴
│   └── components.json                           # 修改：樣式配置
```

**估計文件數**: 7-8 個文件

### 技術細節
- 🎉 新增 5 個主要路由頁面
- ✅ Agent Console：WebSocket 支持即時通訊
- ✅ Agent Sessions：兩頁式 UI 管理
- ✅ Monitor：系統健康監控
- ✅ Models：模型狀態管理
- ✅ API Keys：金鑰增刪改、刪除、顯示/隱藏
- ✅ UI 組件優化：accessibility 改進（ARIA 標籤）、new-york 主題
- ✅ TypeScript 路徑別名：`@/` 指向 `src/`

### 驗證收
- [ ] 所有新路由頁面可正常訪問
- [ ] Agent Console WebSocket 連接功能正常
- [ ] Monitor 頁面顯示正確的系統狀態
- [ ] Models 頁面可成功啟用/停用模型
- [ ] API Keys 頁面可正常創建、旋轉、刪除
- [ ] UI 組件符合 accessibility 標準（keyboard navigation, screen readers）
- [ ] 焀式切換至 new-york 主題無視覺問題

### 合併檢查清單
- [ ] 新增路由頁面可以在左側導航訪問
- [ ] Agent Console 可以發送和接收消息
- [ ] API Keys 可以成功創建、切換顯示/隱藏
- [ ] 敏感操作（刪除 API Key）有確認提示
- [ ] 新增頁面在不同瀏覽器中顯示正常
- [ ] 無式主題下所有組件樣式一致

---

## 實施順序與依賴關係

```
PR 1 (基礎設施)
    ↓
PR 2 (安全加密 - 依賴 PR 1)
    ↓
PR 3 (輸入驗證 - 依賴 PR 2)
PR 4 (Docker 改進 - 獨立)
    ↓
PR 5 (配置服務 - 依賴 PR 3)
    ↓
PR 6 (前端改進 - 依賴 PR 2, 5)
```

### 依賴說明
1. **PR 1 是前置依賴** - 數據庫 schema、環境變量配置必須先就位
2. **PR 2 是安全依賴** - 加密工具和 JWT 驗證是多個模塊的基礎
3. **PR 3 依賴 PR 2** - 輸入驗證需要安全的加密和 JWT
4. **PR 4 相對獨立** - Docker 服務改進不依賴其他模塊
5. **PR 5 依賴 PR 3** - 配置服務需要輸入驗證
6. **PR 6 依賴 PR 2 和 PR 5** - 前端需要後端 API（JWT + 配置）支持

---

## 拆分後的預期結果

### ✅ 優點
1. **審查效率提升** - 每個 PR 文件數量少，評審時間從 75 分鐘降至 20-30 分鐘
2. **測試覆蓋率提升** - 每個 PR 都有對應的測試，更易驗證
3. **降低合併風險** - 小型 PR 減少合併衝突，更容易 resolve 衝突
4. **回滾更容易** - 如果發現問題，更容易回滾特定功能的更改
5. **持續集成部署（CI/CD）** - 小型 PR 可以更快通過 CI/CD

### 📊 PR 對比

| 項目 | 原始 PR | 拆分後 | 改善 |
|------|--------|--------|------|
| 文件數 | 77 個 | 6-7 個/PR ✅ | 減少 90% |
| 行數變更 | +4974/-1666 | ~+700/-200/PR | 減少變更規模 |
| 審審時間 | ~75 分鐘 | ~20-30 分鐘 | 增加 60%+ 效率 |
| 測試覆蓋率 | 部分 | 每個 PR 完整 | 減少技術債 |
| 合併複雜度 | 高 | 低 | 減少 80%+ |

---

## 下一步行動

### 立即執行
1. ✅ 創建完整的拆分計劃文檔（本文檔） - **進行中**
2. 🔍 創建詳細的 PR 清單（每個 PR 的具體文件列表）
3. 📋 創建拆分支並開始執行拆分

### 執行建議
1. **先合併 PR 1** - 基礎設施必須先到位
2. **按順序創建分支** - PR2 → PR3 → PR6
3. **每個 PR 獨立審查** - 不要在評審 PR2 時同時審查 PR3
4. **每個 PR 都包含測試** - 這是關鍵的質量保證
5. **更新本計劃** - 在每個 PR 完成後更新狀態和記錄移動

---

## 時間估算（估算）

| PR | 項估執行時間 | 遷移準備時間 | 測試時間 | 總計 |
|----|------------|--------------|--------|------|
| PR 1 | 1-2 小時 | 0.5 小時 | 1 小時 | **2.5-3.5h** |
| PR 2 | 1.5-2 小時 | 0.5 小時 | 1.5 小時 | **3.5-4h** |
| PR 3 | 2-2.5 小時 | 0.5 小時 | 1.5 小時 | **4-4.5h** |
| PR 4 | 1 小時 | 0 小時 | 0.5 小時 | **1.5-1.5h** |
| PR 5 | 1.5-2 小時 | 0.5 小時 | 1 小時 | **3-3.5h** |
| PR 6 | 3-3.5 小時 | 0.5 小時 | 2 小時 | **5.5-6h** |
| **總計** | **10-19.5 小時** | **2.5 小時** | **7.5 小時** | **20-29.5h** |

---

## 風險與注意事項

### ⚠️ 關鍵注意

1. **數據庫遷移風險** - PR 1 包含數據庫結構修改，務必確保：
   - 在執行前備份現有數據庫
   - 測試環境驗證遷移腳本
   - 準備回滾方案

2. **加密密鑰管理** - 拆分 PR 後確保：
   - ENC_KEY 需要在部署後配置
   - 開發環境密鑰問題會在 PR 2 中修復
   - 生產環境必須使用強密鑰

3. **部署順序** - 嚴格按照 PR 編號從小到大順序部署
4. **測試環境** - 每個 PR 都應該在測試環境中充分測試
5. **Code Review** - 每個拆分的 PR 都應進行獨立的 code review

### 🔄 回滾策略

如果拆分後某個 PR 需要回滾：
1. 立即在目標分支上 revert 相應的 commits
2. 通知團隊成員回滾的原因
3. 更新拆分計劃，標記該 PR 已取消

---

## 聯繫人員責任

| PR | 建議審查者 | 關注領域 |
|----|--------------|----------|
| PR 1 | 全體架構師，資深後端工程師 | Prisma 配置、環境變量、數據庫遷移 |
| PR 2 | 安全工程師，後端工程師 | AES 實碼實現、JWT token 驗證、密鑰管理 |
| PR 3 | 後端工程師，QA 工程師 | 輸入驗證規則、錯誤處理、測試覆蓋 |
| PR 4 | DevOps 工程師，後端工程師 | Docker 服務、日誌解析、容器狀態 |
| PR 5 | 後端工程師，後端工程師 | 用戶管理、配置服務、權限控制 |
| PR 6 | 前端工程師，UX 工程師 | React 路由、UI 組件、accessibility |

---

## 附錄：原始 PR 審閱註清單

### 已審查的關鍵問題（優先修復）
1. 🔴 **P0 - 開發環境密鑰硬編碼** (`encryption.ts:26`)
2. 🔴 **P0 - Docker log size 無上限缺失** (`dockerService.ts:133`)
3. 🟡 **P1 - 生產環境 DATABASE_URL fallback** (`unifiedConfig.ts:40`)
4. 🟢 **P2 - Email 正則過於寬鬆** (`validation.ts:7`)
5. 🟢 **P2 - 密文長度驗證不準確** (`encryption.ts:139`)
6. 🟡 **P1 - EnvVar 更新 N+1 查詢** (`configService.ts:284`)

### 待審查區域（後續進行）
- 安全性邊界檢查
- 性能優化檢查
- 可訪問性改進
- 測試覆蓋完整性

---

```mermaid
graph BT
    A[PR 1: 基礎設施] -->|數據庫初始化完成|
    A --> B[PR 2: 安全加密] -->|加密 JWT 實現完成|
    B --> C[PR 3: 輸入驗證] -->|驗證模組完成|
    A --> D[PR 4: Docker 改進] -->|Docker 優化完成|
    C --> E[PR 5: 配置增強] -->|配置服務優化完成|
    B --> F[PR 6: 前端改進] -->|前端路由新增完成|
```

---

**計劃文檔版本**: v1.0
**創建時間**: 2026-02-21
**最後更新**: 2026-02-21
**狀態**: 📝 草草中

---

*此拆分計劃將在實施過程中持續更新和優化。*
