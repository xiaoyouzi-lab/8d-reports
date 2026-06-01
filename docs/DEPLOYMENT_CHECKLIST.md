# 8D Reports — 部署配置完整清单

> **文档版本**: 2026-05-20  
> **适用版本**: v1.1.0  
> **最后校验**: 与 `.env` 文件 + `DEPLOYMENT_GUIDE.md` + `PRD_Phase2_Complete.md` 交叉核对  
> ⚠️ **机密提醒**: 本文档中所有密钥均用占位符替换。真实值存放在 `.env` 文件中（已在 `.gitignore` 中排除）。

---

## 一、部署状态总览

### 已部署到 Vercel（commit `8c6f7fa` — 安全修复版）

- ✅ Open Redirect 修复、速率限制、安全响应头、密码策略后端强化
- ✅ 报告数据 PostgreSQL 持久化、配额服务端化、分享功能服务端化
- ✅ Cookie 安全属性显式配置

### 本地已构建未推送（commits `aa3808f` → `583b37c` — v1.1.0 功能版）

⚠️ 等网络恢复后 `git push origin main` 即可部署：
- i18n 语言切换、附件上传、DOCX 导出、ZIP 打包、Logo 上传

---

## 二、所有外部服务清单（7 个站点需要配置）

### 1. Vercel — 部署平台

| 项目 | 值 |
|------|-----|
| 地址 | [vercel.com](https://vercel.com) |
| 部署域名 | `https://8d-reports.com` |
| 框架 | Next.js (Turbopack) |
| 构建命令 | `npm run build` |
| **⚠️ 环境变量** | 见下方第四节 |
| **⚠️ 关键操作** | 每次域名变更后，必须去所有 OAuth 服务更新 Redirect URI |

---

### 2. Neon — 数据库

| 项目 | 值 |
|------|-----|
| 地址 | [console.neon.tech](https://console.neon.tech) |
| 项目名 | neondb |
| Region | `ap-southeast-1` (新加坡) |
| Branch | main |
| 连接方式 | Pooler 连接（支持 serverless） |
| **⚠️ 环境变量** | `DATABASE_URL`（格式：`postgresql://user:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require`） |
| **⚠️ 校验** | `npx drizzle-kit push` 必须成功执行 |

---

### 3. Cloudflare R2 — 文件存储

| 项目 | 值 |
|------|-----|
| 地址 | [dash.cloudflare.com](https://dash.cloudflare.com) |
| Bucket 名 | `8d-reports` |
| **⚠️ CORS 配置** | 必须在 R2 Console > Settings > CORS 中允许 `*`（否则浏览器上传被拦截） |
| **⚠️ API Token 权限** | Object Read & Write |
| **⚠️ 环境变量** | `R2_ACCOUNT_ID` / `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` / `R2_BUCKET_NAME` |
| **⚠️ CSP 已配置** | `next.config.ts` 中 `connect-src` 已包含 `https://*.r2.cloudflarestorage.com` |
| **验证方式** | 去 R2 后台创建 API Token，填入 4 个环境变量 |

---

### 4. Google Cloud Console — Google OAuth

| 项目 | 值 |
|------|-----|
| 地址 | [console.cloud.google.com](https://console.cloud.google.com) |
| App 类型 | Web application |
| **⚠️ Authorized JavaScript Origins** | `https://www.8d-reports.com` + `https://8d-reports.com` + `http://localhost:3001` |
| **⚠️ Authorized Redirect URIs** | `https://www.8d-reports.com/api/auth/callback/google` + `https://8d-reports.com/api/auth/callback/google` + `http://localhost:3001/api/auth/callback/google` |
| **⚠️ OAuth Consent Screen** | User type 必须为 `External`，Publishing status 建议为 `In production`；如果仍是 `Testing`，必须把测试账号加入 Test users，否则会出现 Google 禁止登录 / access blocked |
| **⚠️ Authorized Domains** | `8d-reports.com` |
| Scopes | `.../auth/userinfo.email`, `.../auth/userinfo.profile` |
| **⚠️ 环境变量** | `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` |
| **⚠️ 验证** | 用 Google 账户登录 → 成功则配置正确 |

---

### 5. GitHub Developer Settings — GitHub OAuth

| 项目 | 值 |
|------|-----|
| 地址 | [github.com/settings/developers](https://github.com/settings/developers) |
| Homepage URL | `https://www.8d-reports.com` |
| **⚠️ Authorization Callback URL** | `https://www.8d-reports.com/api/auth/callback/github` |
| 开发 Callback URL | GitHub OAuth App 通常只支持一个 callback。如需本地开发，另建一个 Development OAuth App，填 `http://localhost:3001/api/auth/callback/github` |
| **⚠️ 环境变量** | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` |
| **⚠️ 验证** | 用 GitHub 账户登录 → 成功则配置正确 |

---

### 6. Creem — 支付

| 项目 | 值 |
|------|-----|
| 地址 | [creem.io](https://www.creem.io) |
| **⚠️ Product IDs** | 需要创建 Pro Monthly ($9.99) + Pro Yearly ($79) 两个产品，记录各自 Product ID |
| **⚠️ Webhook URL** | `https://8d-reports.com/api/webhooks/creem` |
| Webhook Events | `subscription.created`, `subscription.updated`, `subscription.cancelled` |
| 模式 | sandbox 测试模式 |
| **⚠️ 环境变量** | `CREEM_API_KEY` / `CREEM_WEBHOOK_SECRET` |
| **🔴 关键** | Webhook Secret 当前为空！必须去 Creem 后台生成并填写 |

---

### 7. GitHub — 代码仓库

| 项目 | 值 |
|------|-----|
| 地址 | [github.com/xiaoyouzi-lab/8d-reports](https://github.com/xiaoyouzi-lab/8d-reports) |
| CI/CD | Vercel auto-deploy on push to main |
| **⚠️ 当前状态** | 5 个 commits 本地待推送 |

---

## 三、完整环境变量清单（17 个变量）

### ⚠️ 以下变量必须全部在 Vercel Settings > Environment Variables 中填写

| # | 变量名 | 来源 | 验证方式 |
|---|--------|------|---------|
| 1 | `DATABASE_URL` | Neon 后台复制 | `npm run build` 成功 |
| 2 | `BETTER_AUTH_SECRET` | `openssl rand -base64 32` 生成 | 注册/登录成功 |
| 3 | `BETTER_AUTH_URL` | `https://www.8d-reports.com` | 必须等于 Vercel 实际域名 |
| 4 | `GOOGLE_CLIENT_ID` | Google Cloud Console | Google 登录成功 |
| 5 | `GOOGLE_CLIENT_SECRET` | Google Cloud Console | Google 登录成功 |
| 6 | `GITHUB_CLIENT_ID` | GitHub Developer Settings | GitHub 登录成功 |
| 7 | `GITHUB_CLIENT_SECRET` | GitHub Developer Settings | GitHub 登录成功 |
| 8 | `R2_ACCOUNT_ID` | Cloudflare R2 后台 | 上传附件成功 |
| 9 | `R2_ACCESS_KEY_ID` | Cloudflare R2 API Token | 上传附件成功 |
| 10 | `R2_SECRET_ACCESS_KEY` | Cloudflare R2 API Token | 上传附件成功 |
| 11 | `R2_BUCKET_NAME` | 固定值 `8d-reports` | 上传附件成功 |
| 12 | `CREEM_API_KEY` | Creem 后台 | 支付功能正常 |
| 13 | `CREEM_WEBHOOK_SECRET` | 🔴 当前为空 | 必须去 Creem 后台生成 |
| 14 | `CREEM_PRODUCT_MONTHLY` | 🔴 当前为空 | Creem 后台 Pro Monthly 产品的 ID |
| 15 | `CREEM_PRODUCT_YEARLY` | 🔴 当前为空 | Creem 后台 Pro Yearly 产品的 ID |
| 16 | `RESEND_API_KEY` | 🔴 当前为空 | 注册 Resend → API Keys → 创建 新 Key |
| 17 | `DEEPSEEK_API_KEY` | 🔴 当前为空 | 注册 platform.deepseek.com → API Keys → 创建新 Key |

> **实际值参考 `.env` 文件**（不在本文档中复制，避免 git push protection 拦截）

---

## 四、OAuth Redirect URI 完整对照表

### Google OAuth

| 名称 | 值 |
|------|-----|
| Authorized JavaScript Origin (生产) | `https://www.8d-reports.com` + `https://8d-reports.com` |
| Authorized JavaScript Origin (开发) | `http://localhost:3001` |
| Authorized Redirect URI (生产) | `https://www.8d-reports.com/api/auth/callback/google` + `https://8d-reports.com/api/auth/callback/google` |
| Authorized Redirect URI (开发) | `http://localhost:3001/api/auth/callback/google` |
| 禁止登录排查 | OAuth consent screen 必须是 External；如果状态是 Testing，测试 Gmail 必须加入 Test users；Authorized domains 必须包含 `8d-reports.com` |

### GitHub OAuth

| 名称 | 值 |
|------|-----|
| Homepage URL | `https://www.8d-reports.com` |
| Callback URL (生产) | `https://www.8d-reports.com/api/auth/callback/github` |
| Callback URL (开发) | 建议使用单独的 Development OAuth App：`http://localhost:3001/api/auth/callback/github` |

### ⚠️ 高危提醒

```
如果 Vercel 域名变更，必须同步更新以上所有 Redirect URI，否则 OAuth 登录全部失败。
Creem Webhook URL 同样需要同步更新。
```

---

## 五、PRD 遗漏项核查

### 当前已修复 ✅

| # | 功能 | 状态 |
|---|------|:--:|
| C1 | Open Redirect | ✅ |
| C2 | 配额服务端化 | ✅ |
| C3 | 速率限制 | ✅ |
| C4 | 报告数据 PostgreSQL | ✅ |
| H1 | 安全响应头 | ✅ |
| H3 | 密码策略 | ✅ |
| H4 | Cookie 安全 | ✅ |
| M3 | 分享 URL 动态域名 | ✅ |

### Phase 1 遗留（PRD 提到但未实现）

| # | 功能 | 优先级 | 备注 |
|---|------|:-----:|------|
| — | **密码重置** | 🟡 P2 | 需 SMTP 配置 |
| — | **邮箱验证** | 🟡 P2 | 需 SMTP 配置 |
| — | **隐私政策 / Terms 页面** | 🟡 P2 | 页脚链接现为 `#` |
| — | **CREEM_WEBHOOK_SECRET** | 🔴 P0 | 空值，支付回调不可用 |

### Phase 2 功能（43 项，未来版本）

> SCAR 管理、索赔管理、Kanban 视图、离线 PWA、团队协作、自定义模板、Excel 导出、审批流、SPC 图表等。详见 `docs/PRD_Phase2_Complete.md`。

---

## 六、v1.1.0 部署步骤

```
1. 网络恢复 → git push origin main
2. 等待 90 秒 Vercel 自动部署
3. 浏览器验证：
   - https://8d-reports.com → 首页正常
   - 右上角点击 "中文" → 全站语言切换
   - D2 步骤上传照片/文件 → 附件区域正常
   - 导出菜单 → PDF + Word 两个选项
4. 命令行快速验证：
   curl -sI https://8d-reports.com | grep -i "x-frame\|content-security\|strict-transport"
```

---

*文档生成: 2026-05-20*  
*基于 .env + PRD + DEPLOYMENT_GUIDE 交叉核对*  
*所有密钥已替换为占位符，真实值见项目根目录 `.env`*
