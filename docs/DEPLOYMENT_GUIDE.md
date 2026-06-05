# 8D Reports — 部署与测试指南

**文档版本**: v1.0  
**日期**: 2025年5月16日  
**受众**: 产品测试专员 / DevOps  
**目标**: 将 Phase 1 MVP 部署上线并进行完整测试

---

## 目录

1. [前置依赖一览](#1-前置依赖一览)
2. [外部服务配置清单](#2-外部服务配置清单)
3. [环境变量完整配置](#3-环境变量完整配置)
4. [数据库部署步骤](#4-数据库部署步骤)
5. [Vercel 部署步骤](#5-vercel-部署步骤)
6. [首次运行检查清单](#6-首次运行检查清单)
7. [功能测试清单](#7-功能测试清单)
8. [常见问题排查](#8-常见问题排查)

---

## 1. 前置依赖一览

| 服务 | 用途 | 费用 |
|------|------|------|
| **GitHub** | 代码仓库 + CI/CD | 免费 |
| **Vercel** | 前端部署 + 边缘网络 | Hobby 免费 (Pro $20/月) |
| **Neon** | Serverless PostgreSQL 数据库 | 免费 0.5GB |
| **Cloudflare R2** | 文件/附件存储 (S3 兼容) | 免费 10GB/月 |
| **Creem** | 支付处理 | 免费接入 (抽成 2.5%) |
| **Google Cloud Console** | Google OAuth 登录 | 免费 |
| **GitHub Developer Settings** | GitHub OAuth 登录 | 免费 |

**💡 总计**: 起步阶段全部免费，月付 0 美元即可上线。

---

## 2. 外部服务配置清单

### 2.1 GitHub 仓库

**操作步骤**:
```bash
# 在项目根目录
git remote add origin git@github.com:YOUR_USERNAME/8d-reports.git
git push -u origin main
```

**验证**: 浏览器打开 `https://github.com/YOUR_USERNAME/8d-reports` 确认代码已推送。

---

### 2.2 Neon 数据库

**操作步骤**:

1. 访问 [https://neon.tech](https://neon.tech)，注册/登录
2. 点击 **"Create project"**
   - Project name: `8d-reports`
   - Region: 选择离目标用户最近的区域（建议 `US East` 或 `Asia Pacific`）
   - PostgreSQL version: 16
3. 创建完成后，进入项目 Dashboard → **Connection Details**
4. 复制 **"Connection string"** (格式: `postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/8d-reports?sslmode=require`)

**⚠️ 注意**: 这个连接字符串是**唯一的敏感凭证**，请安全保存。

**验证**: 用数据库客户端 (DBeaver/TablePlus/psql) 连接测试。

---

### 2.3 Cloudflare R2 存储

**操作步骤**:

1. 访问 [https://dash.cloudflare.com](https://dash.cloudflare.com)，注册/登录
2. 左侧菜单 → **R2** → **"Create bucket"**
   - Bucket name: `8d-reports`
   - Location: 选择 `Automatic` 或离用户最近的区域
3. 创建完成后，进入 **R2 → Manage R2 API Tokens**
4. 点击 **"Create API token"**
   - Token name: `8d-reports-upload`
   - Permissions: **Object Read & Write**
   - 选择 bucket: `8d-reports`
5. 保存生成的值:
   - **Access Key ID**
   - **Secret Access Key**
6. R2 Account ID 在 R2 页面右侧 **"Account Details"** 中找到

**验证**: 用 aws-cli 或 rclone 测试上传文件。

---

### 2.4 Google OAuth (暂不开放)

当前生产登录/注册页暂不显示 Google 快捷登录。保留以下配置步骤仅用于未来恢复前检查。

**操作步骤**:

1. 访问 [https://console.cloud.google.com](https://console.cloud.google.com)
2. 创建新项目 → 项目名: `8d-reports`
3. 左侧菜单 → **APIs & Services** → **Credentials**
4. 点击 **"Create Credentials"** → **"OAuth client ID"**
5. 如果提示配置 OAuth consent screen:
   - User Type: **External**
   - App name: `8D Reports`
   - User support email: 你的邮箱
   - Developer contact email: 你的邮箱
   - Scopes: 选择 `.../auth/userinfo.email` 和 `.../auth/userinfo.profile`
6. 返回创建 OAuth client ID:
   - Application type: **Web application**
   - Name: `8D Reports Web`
   - Authorized JavaScript origins: 添加 `http://localhost:3001` 和 `https://你的域名.vercel.app`
   - Authorized redirect URIs: 添加 `http://localhost:3001/api/auth/callback/google` 和 `https://你的域名.vercel.app/api/auth/callback/google`
7. 保存 **Client ID** 和 **Client Secret**

**验证**: 恢复按钮前必须完成端到端测试：点击 Google → 授权 → 回调 → 站内登录状态写入 → 返回 dashboard 或原 callbackUrl。

---

### 2.5 GitHub OAuth (暂不开放)

当前生产登录/注册页暂不显示 GitHub 快捷登录。保留以下配置步骤仅用于未来恢复前检查。

**操作步骤**:

1. 访问 [https://github.com/settings/developers](https://github.com/settings/developers)
2. **OAuth Apps** → **"New OAuth App"**
   - Application name: `8D Reports`
   - Homepage URL: `https://你的域名.vercel.app`
   - Authorization callback URL: `http://localhost:3001/api/auth/callback/github`
     (部署后再添加 `https://你的域名.vercel.app/api/auth/callback/github`)
3. 保存 **Client ID**
4. 点击 **"Generate a new client secret"** → 保存 **Client Secret**

**验证**: 恢复按钮前必须完成端到端测试：点击 GitHub → 授权 → 回调 → 站内登录状态写入 → 返回 dashboard 或原 callbackUrl。

---

### 2.6 Creem 支付

**操作步骤**:

1. 访问 [https://www.creem.io](https://www.creem.io)，注册/登录
2. 进入 Dashboard → **API Keys**
3. 创建 API Key → 保存 **Secret Key**
4. 进入 **Products** → 创建三个产品:
   - **Pro Monthly**: $19.00 USD, recurring monthly
   - **Team Monthly**: $99.00 USD, recurring monthly
   - **Single Report Export**: $4.99 USD, one-time
5. 记录每个产品的 **Product ID**
6. Webhooks: 进入 **Developers** → **Webhooks**
   - URL: `https://你的域名.vercel.app/api/webhooks/creem`
   - Events: `subscription.created`, `subscription.updated`, `subscription.cancelled`
   - 保存 **Webhook Secret**

**💡 提示**: Creem 支持测试模式 (sandbox)，先用测试模式验证支付流程。

---

## 3. 环境变量完整配置

### 3.1 完整变量列表

在 Vercel 项目设置 → **Environment Variables** 中添加以下**全部**变量：

```env
# ========== 数据库 ==========
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/8d-reports?sslmode=require

# ========== Better Auth (认证) ==========
BETTER_AUTH_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx  # 生成方式见下方
BETTER_AUTH_URL=https://你的域名.vercel.app  # 部署后改为实际域名

# ========== OAuth 提供商 ==========
GOOGLE_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-xxxxxxxxxxxx
GITHUB_CLIENT_ID=Iv1.xxxxxxxxxxxx
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ========== Cloudflare R2 (文件存储) ==========
R2_ACCOUNT_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_ACCESS_KEY_ID=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
R2_BUCKET_NAME=8d-reports

# ========== Creem (支付) ==========
CREEM_API_KEY=creem_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
CREEM_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 3.2 生成 BETTER_AUTH_SECRET

```bash
# 在终端执行以下命令生成随机密钥
openssl rand -base64 32
# 或
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**⚠️ 重要**: 这个密钥用于加密会话 token，**绝对不能泄露**。

### 3.3 本地开发 .env 文件

本地开发用 `.env` 文件（不需要 `BETTER_AUTH_URL` 指向线上）：

```env
DATABASE_URL=postgresql://...你的 neon 连接串
BETTER_AUTH_SECRET=dev-secret-xxxxxxxxxxxxxxxxxxxx
BETTER_AUTH_URL=http://localhost:3001
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
R2_BUCKET_NAME=8d-reports
CREEM_API_KEY=...
CREEM_WEBHOOK_SECRET=...
```

---

## 4. 数据库部署步骤

### 4.1 创建数据库表结构

```bash
# 1. 确保 .env 中 DATABASE_URL 已配置为 Neon 连接串

# 2. 生成 Drizzle 迁移文件
cd "/Users/xiaoyouzi/Trae project/8D"
npx drizzle-kit generate

# 3. 执行迁移（应用表结构到 Neon 数据库）
npx drizzle-kit push
```

### 4.2 验证数据库

连接 Neon 数据库，确认以下 16 张表已创建：

| 表名 | 用途 |
|------|------|
| `users` | 用户 |
| `sessions` | 登录会话 |
| `accounts` | OAuth 关联账户 |
| `verifications` | 邮箱验证 |
| `plans` | 套餐定义 |
| `subscriptions` | 用户订阅 |
| `templates` | 8D 模板 |
| `reports` | 8D 报告 |
| `attachments` | 文件附件 |
| `report_shares` | 分享链接 |
| `user_quotas` | 免费配额 |
| `report_edit_history` | 报告编辑追踪 |
| `registration_rate_limits` | 注册频率限制 |
| `blocked_email_domains` | 屏蔽邮箱域名 |

### 4.3 初始化种子数据

```sql
-- 插入默认套餐
INSERT INTO plans (creem_product_id, name, price_monthly, price_yearly, reports_per_month, max_team_members, features)
VALUES 
  ('plan_free', 'Free', 0, 0, 5, 1, '["basic_templates","photo_upload","pdf_export","sharing"]'),
  ('plan_pro_monthly', 'Pro Monthly', 9.99, NULL, -1, 1, '["all_templates","unlimited_photos","pdf_export_no_watermark","priority_support"]'),
  ('plan_pro_yearly', 'Pro Yearly', NULL, 79.00, -1, 1, '["all_templates","unlimited_photos","pdf_export_no_watermark","priority_support"]');

-- 插入默认8D模板（通用版）
INSERT INTO templates (name, type, category, is_default, is_public, structure)
VALUES ('General 8D Report', 'general', 'quality', true, true, '{
  "version": "3.0",
  "steps": [
    {"id":"d0","title":"D0: Preparation","description":"Assess and initiate 8D","fields":[{"id":"report_number","type":"generated_text","label":"Report Number","required":true},{"id":"report_type","type":"select","label":"Report Type","options":["Customer 8D","Internal 8D"],"required":true}]},
    {"id":"d1","title":"D1: Team","description":"Assemble cross-functional team","fields":[{"id":"team_leader","type":"text","label":"Team Leader","required":true},{"id":"team_members","type":"textarea","label":"Team Members","required":true}]},
    {"id":"d2","title":"D2: Problem Description","description":"Describe the problem in measurable terms","fields":[{"id":"problem_description","type":"textarea","label":"Problem Description","required":true},{"id":"product_name","type":"text","label":"Product Name","required":true},{"id":"problem_quantity","type":"number","label":"Defect Quantity","required":true}]},
    {"id":"d3","title":"D3: Containment","description":"Immediate actions to protect customer","fields":[{"id":"ica_description","type":"textarea","label":"Containment Description","required":true},{"id":"ica_responsible","type":"text","label":"Responsible Person","required":true}]},
    {"id":"d4","title":"D4: Root Cause","description":"Identify and verify root cause","fields":[{"id":"occurrence_cause","type":"textarea","label":"Occurrence Cause","required":true},{"id":"confirmed_root_cause","type":"textarea","label":"Confirmed Root Cause","required":true}]},
    {"id":"d5","title":"D5: Corrective Actions","description":"Permanent corrective actions","fields":[{"id":"pca_selected","type":"textarea","label":"Selected Corrective Action","required":true}]},
    {"id":"d6","title":"D6: Implementation","description":"Implement and validate","fields":[{"id":"implementation_plan","type":"textarea","label":"Implementation Plan","required":true}]},
    {"id":"d7","title":"D7: Prevention","description":"Prevent recurrence","fields":[{"id":"system_changes","type":"textarea","label":"System Changes","required":true}]},
    {"id":"d8","title":"D8: Closure","description":"Close and recognize team","fields":[{"id":"closure_date","type":"date","label":"Closure Date","required":true}]}
  ]
}');

-- 插入屏蔽的临时邮箱域名
INSERT INTO blocked_email_domains (domain, reason) VALUES
('mailinator.com', 'Disposable email'),
('guerrillamail.com', 'Disposable email'),
('tempmail.com', 'Disposable email'),
('10minutemail.com', 'Disposable email');
```

---

## 5. Vercel 部署步骤

### 5.1 连接 GitHub 仓库

1. 访问 [https://vercel.com](https://vercel.com)，用 GitHub 登录
2. 点击 **"Add New..."** → **"Project"**
3. 选择仓库 `YOUR_USERNAME/8d-reports`
4. 点击 **"Import"**

### 5.2 配置构建设置

| 配置项 | 值 |
|--------|-----|
| Framework Preset | **Next.js** |
| Root Directory | `./` (默认) |
| Build Command | `npm run build` (默认) |
| Output Directory | `.next` (默认) |
| Install Command | `npm install` (默认) |

### 5.3 添加环境变量

在 Vercel 项目 → **Settings** → **Environment Variables**，将[第 3 节](#3-环境变量完整配置)中的所有变量逐一添加。

**每个变量选择环境**: Production + Preview + Development（全部勾选）。

### 5.4 部署

1. 点击 **"Deploy"**
2. 等待构建完成（约 2-3 分钟）
3. Vercel 会自动分配域名: `https://8d-reports-xxx.vercel.app`
4. 如果需要自定义域名: Settings → Domains → 添加你的域名

### 5.5 部署后验证

```bash
# 部署成功后，访问这些 URL 确认各页面可访问:
https://你的域名.vercel.app/                  # 落地页
https://你的域名.vercel.app/login              # 登录页
https://你的域名.vercel.app/signup             # 注册页
https://你的域名.vercel.app/dashboard          # 仪表盘 (会重定向到登录)
https://你的域名.vercel.app/api/auth/[...all]  # Auth API (返回 200)
```

### 5.6 更新 OAuth redirect URIs

部署获得域名后，回到 Google Cloud Console 和 GitHub Developer Settings，在 redirect URIs 中**添加线上地址**：
- Google: `https://你的域名.vercel.app/api/auth/callback/google`
- GitHub: `https://你的域名.vercel.app/api/auth/callback/github`

同样更新 Creem webhook URL 为线上地址。

---

## 6. 首次运行检查清单

按顺序执行以下检查，每项通过后打 ✅：

### 6.1 基础设施检查

| # | 检查项 | 验证方法 | 结果 |
|---|--------|---------|------|
| 1 | GitHub 仓库可访问 | 浏览器打开仓库 URL | |
| 2 | Vercel 项目已创建 | Vercel Dashboard 看到项目 | |
| 3 | Neon 数据库可连接 | DBeaver/psql 连接成功 | |
| 4 | 数据库表已创建 | `SELECT count(*) FROM users;` 不报错 | |
| 5 | 种子数据已插入 | `SELECT * FROM plans;` 返回 3 行 | |
| 6 | R2 bucket 可访问 | R2 Dashboard 看到 bucket | |
| 7 | 所有环境变量已配置 | Vercel Settings 逐项核对 12 个变量 | |

### 6.2 部署检查

| # | 检查项 | 预期结果 | 结果 |
|---|--------|---------|------|
| 8 | `npm run build` 成功 | `✓ Compiled successfully` | |
| 9 | Vercel 部署成功 | Vercel Dashboard 显示绿色 ✓ Ready | |
| 10 | 落地页可访问 | 看到 Hero + 定价等完整内容 | |
| 11 | 登录页可访问 | 看到登录表单 | |
| 12 | 注册页可访问 | 看到注册表单 | |

### 6.3 认证检查

| # | 检查项 | 操作 | 预期结果 | 结果 |
|---|--------|------|---------|------|
| 13 | 邮箱注册 | 在注册页填写信息并提交 | 自动登录，跳转仪表盘 | |
| 14 | 邮箱登录 | 退出后重新登录 | 成功登录 | |
| 15 | Google 快捷登录 | 当前不显示按钮 | 恢复前完成端到端验证 | |
| 16 | GitHub 快捷登录 | 当前不显示按钮 | 恢复前完成端到端验证 | |
| 17 | 未登录保护 | 直接访问 `/dashboard` | 自动重定向到 `/login` | |
| 18 | 登录后回调 | 从登录页登录后 | 跳回之前的页面 | |

---

## 7. 功能测试清单

### 7.1 仪表盘

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 19 | 仪表盘加载 | 登录后访问 `/dashboard` | 显示 4 个统计卡片 + 报告表格 | |
| 20 | 统计卡片 | 查看卡片数值 | Total/In Progress/Completed/Quota 正常 | |
| 21 | 配额显示 | 免费用户查看配额 | 显示 "X/3 lifetime reports used" + 进度条 | |
| 22 | 升级横幅 | 免费用户查看 | 显示升级提示横幅 | |
| 23 | 搜索功能 | 输入关键字搜索 | 报告列表过滤 | |
| 24 | 新建报告按钮 | 点击 "New Report" | 跳转 `/reports/new` | |

### 7.2 报告创建

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 25 | 新建报告表单 | 访问 `/reports/new` | 显示类型和优先级选择 | |
| 26 | 创建报告 | 选择 Customer 8D + 点 "Start Report" | 生成报告 ID，跳转编辑器 | |
| 27 | 报告 ID 格式 | 查看新建报告的 ID | 格式为 `QR-2025-XXXX` | |

### 7.3 报告编辑器

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 28 | 步骤导航 | 桌面端查看左侧导航 | 显示 D0-D8 步骤列表 + 进度条 | |
| 29 | 步骤切换 | 点击不同步骤 | 右侧内容区切换对应表单 | |
| 30 | D0 表单 | 选择 D0 | 显示报告编号(自动生成)+类型+来源字段 | |
| 31 | D1 表单 | 选择 D1 | 显示组长+团队成员字段 | |
| 32 | D2 表单 | 选择 D2 | 显示问题描述+产品名+照片上传区 | |
| 33 | D3 表单 | 选择 D3 | 显示遏制措施描述+负责人+日期 | |
| 34 | D4 表单 | 选择 D4 | 显示根本原因分析+5-Why表格 | |
| 35 | D5 表单 | 选择 D5 | 显示纠正措施+成本估算 | |
| 36 | D6 表单 | 选择 D6 | 显示实施计划+验证方法 | |
| 37 | D7 表单 | 选择 D7 | 显示系统变更+横向展开 | |
| 38 | D8 表单 | 选择 D8 | 显示结案日期+经验教训+审批人 | |
| 39 | 必填字段标记 | 查看表单 | 必填字段旁有红色星号 | |
| 40 | 表单输入 | 在各字段输入内容 | 内容正确保存 | |
| 41 | 自动保存 | 编辑后等 10 秒 | 数据持久化到 localStorage | |
| 42 | 上一步/下一步 | 点击 Previous/Next | 正确切换步骤 | |
| 43 | 保存草稿 | 点击 "Save Draft" | 数据保存 | |
| 44 | 移动端导航 | 浏览器缩小到手机宽度 | 左侧导航变为水平 chip 滚动 | |
| 45 | 移动端表单 | 手机宽度下填写表单 | 字段正常显示，可操作 | |

### 7.4 PDF 导出

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 46 | 导出按钮 | 编辑器中点击 "Export PDF" | 显示 loading 状态 | |
| 47 | PDF 生成 | 等待导出完成 | 弹出 toast "PDF exported successfully" | |
| 48 | PDF 文件下载 | 查看下载的文件 | 文件名包含报告 ID，可打开 | |
| 49 | PDF 封面 | 打开 PDF | 第一页显示 "8D REPORT" + 报告 ID | |
| 50 | PDF 内容 | 翻看 PDF | 每个 D 步骤有独立页面 | |
| 51 | PDF 水印(免费) | 免费用户导出 | PDF 每页有斜向 "SAMPLE" 水印 | |
| 52 | PDF 无水印(Pro) | Pro 用户导出 | PDF 无水印 | |

### 7.5 分享链接

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 53 | 打开分享对话框 | 点击 "Share" 按钮 | 弹出分享对话框 | |
| 54 | 创建分享链接 | 点击 "Create share link" | 显示分享 URL | |
| 55 | 复制链接 | 点击 "Copy link" | 显示 "✓" 反馈 + toast | |
| 56 | 访问分享页 | 新标签页打开分享链接 | 显示只读报告视图 | |
| 57 | 分享页步骤折叠 | 点击步骤标题 | 展开/折叠步骤内容 | |
| 58 | 删除分享链接 | 点击 "Delete link" | 链接失效 | |
| 59 | 无效链接 | 访问不存在的分享链接 | 显示友好 404 页面 | |

### 7.6 配额系统

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 60 | 初始配额 | 新注册用户 | 显示 0/5 已使用 | |
| 61 | 配额消耗 | 完成并导出一份报告 | 配额变为 1/5 | |
| 62 | 配额不重复扣 | 对同一报告再次导出 | 配额不增加 | |
| 63 | 配额耗尽提示 | 用完 5 份配额 | 显示红色提示 + 升级按钮 | |

### 7.7 边界情况

| # | 测试项 | 操作步骤 | 预期结果 | 结果 |
|---|--------|---------|---------|------|
| 64 | 空表单导出 | 所有字段留空导出 PDF | PDF 正常生成，不崩溃 | |
| 65 | 中文内容 | 字段填写中文 | PDF 中文正常显示 | |
| 66 | 长文本 | 字段输入 500+ 字符 | PDF 自动换行不溢出 | |
| 67 | 多设备同步 | 桌面+手机登录同一账户 | 数据一致 | |

---

## 8. 常见问题排查

### 8.1 构建失败

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| `Failed to fetch font` | 无法访问 Google Fonts | 已改为系统字体，应不再出现 |
| `DATABASE_URL is not set` | 环境变量缺失 | 检查 Vercel Environment Variables |
| TypeScript 错误 | 类型不匹配 | `npm run lint` 查看详细错误 |

### 8.2 登录失败

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| Google 登录报错 | redirect_uri 不匹配 | 在 Google Console 添加 Vercel 域名 |
| GitHub 登录报错 | redirect_uri 不匹配 | 在 GitHub OAuth App 添加域名 |
| 邮箱注册失败 | 数据库未连接 | 检查 `DATABASE_URL` 是否正确 |

### 8.3 数据库问题

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| 查询报错 "relation does not exist" | 表未创建 | 执行 `npx drizzle-kit push` |
| 连接超时 | IP 未在白名单 | Neon 支持所有 IP，通常不是此原因 |
| 连接数超限 | 免费版限制 | 升级 Neon 或优化连接池 |

### 8.4 文件上传问题

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| 上传失败 | R2 凭证错误 | 检查 `R2_*` 四个环境变量 |
| CORS 错误 | R2 CORS 未配置 | Cloudflare R2 → Settings → CORS → 允许 `*` |

### 8.5 支付问题

| 现象 | 可能原因 | 解决方法 |
|------|---------|---------|
| 支付页面打不开 | Creem API Key 错误 | 检查 `CREEM_API_KEY` |
| Webhook 不触发 | URL 不可达 | 在 Creem Dashboard 测试 webhook |

---

## 附录 A: 快捷命令参考

```bash
# 本地开发
cd "/Users/xiaoyouzi/Trae project/8D"
npm run dev          # 启动开发服务器 (默认 3000 端口)

# 数据库
npx drizzle-kit generate   # 生成迁移文件
npx drizzle-kit push       # 应用迁移到数据库
npx drizzle-kit studio     # 打开 Drizzle Studio 查看数据

# 构建
npm run build         # 生产构建
npm run lint          # 代码检查
npm run start         # 启动生产服务器
```

## 附录 B: 文件树速查

```
8D/
├── src/
│   ├── app/
│   │   ├── (marketing)/     # 落地页 / 定价
│   │   ├── (auth)/          # 登录 / 注册
│   │   ├── (app)/           # 仪表盘 / 报告
│   │   ├── share/           # 分享查看页
│   │   └── api/auth/        # Better Auth API
│   ├── components/
│   │   ├── ui/              # shadcn/ui 组件库
│   │   └── report/          # 报告业务组件
│   └── lib/
│       ├── db/              # 数据库 Schema + 连接
│       ├── auth.ts          # 认证服务端配置
│       ├── report-steps.ts  # D0-D8 字段定义
│       └── pdf-export.ts    # PDF 导出
├── docs/                    # 文档 (PRD, 定价分析, 部署指南)
├── .env                     # 环境变量 (不提交 git)
├── drizzle.config.ts        # Drizzle ORM 配置
├── package.json             # 依赖列表
└── tsconfig.json            # TypeScript 配置
```

---

*文档终稿时间: 2025年5月16日*
*对应代码版本: Phase 1 MVP*
