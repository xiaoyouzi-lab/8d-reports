import Link from "next/link"

export default function DocsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
      <div className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          8D Reports — 产品使用说明 (WI)
        </h1>
        <p className="mt-3 text-muted-foreground">
          版本 1.0 · 适用于所有用户 · 最后更新 2026-05
        </p>
      </div>

      <div className="prose prose-slate max-w-none space-y-12">
        {/* 1. 产品概述 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">1. 产品概述</h2>
          <p>
            8D Reports 是一款基于云端的 8D (Eight Disciplines) 问题解决报告管理平台，专为制造业质量工程师、
            供应商质量管理人员和体系审核人员设计。它替代了传统的 Excel 模板，提供结构化的 D0–D8 工作流、
            实时团队协作、一键 PDF/Word 导出和完整的审计追溯。
          </p>
          <h3 className="text-lg font-medium mt-4">1.1 适用场景</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>客户投诉 8D 报告 (Customer 8D)</li>
            <li>内部质量异常 8D 报告 (Internal 8D)</li>
            <li>供应商纠正措施要求 (SCAR)</li>
            <li>IATF 16949 / ISO 9001 / AS9100 审核准备</li>
          </ul>
          <h3 className="text-lg font-medium mt-4">1.2 系统要求</h3>
          <p>
            支持所有现代浏览器 (Chrome、Edge、Safari、Firefox)。建议使用 Chrome 最新版本以获得最佳体验。
            移动端浏览器支持基本操作，拍照上传功能需要设备配备摄像头。
          </p>
        </section>

        {/* 2. 快速入门 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">2. 快速入门</h2>

          <h3 className="text-lg font-medium mt-4">2.1 注册账号</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>访问 <Link href="/signup" className="text-indigo-600 hover:underline">注册页面</Link></li>
            <li>填写姓名、邮箱和密码（密码需 8 位以上，含大小写字母、数字和特殊字符）</li>
            <li>点击 "Create account" 完成注册</li>
            <li>系统将生成验证码（当前版本显示在服务器日志中），输入验证码完成邮箱验证</li>
            <li>验证通过后自动跳转至工作台 (Dashboard)</li>
          </ol>

          <h3 className="text-lg font-medium mt-4">2.2 创建第一份报告</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>登录后进入 Dashboard，点击右上角 <strong>"New Report"</strong> 按钮</li>
            <li>选择报告类型：Customer 8D（客户投诉）或 Internal 8D（内部异常）</li>
            <li>选择优先级：Low（低）/ Medium（中）/ High（高）</li>
            <li>点击 <strong>"Start Report"</strong>，系统自动生成报告编号（格式：YYYY-MM-DD-序号）</li>
          </ol>

          <h3 className="text-lg font-medium mt-4">2.3 报告类型说明</h3>
          <table className="w-full border-collapse border text-sm mt-2">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left">类型</th>
                <th className="border px-3 py-2 text-left">使用场景</th>
                <th className="border px-3 py-2 text-left">典型流程</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border px-3 py-2 font-medium">Customer 8D</td>
                <td className="border px-3 py-2">客户正式投诉，需要向客户提交 8D 报告</td>
                <td className="border px-3 py-2">D0 准备 → D1 团队 → D2 问题描述 → D3 围堵 → D4 根因 → D5 纠正 → D6 实施 → D7 预防 → D8 关闭</td>
              </tr>
              <tr>
                <td className="border px-3 py-2 font-medium">Internal 8D</td>
                <td className="border px-3 py-2">内部发现的质量异常，内部改进</td>
                <td className="border px-3 py-2">与 Customer 8D 相同流程</td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* 3. 报告编辑 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">3. 报告编辑操作</h2>

          <h3 className="text-lg font-medium mt-4">3.1 D0–D8 步骤导航</h3>
          <p>
            报告编辑页面左侧（桌面端）或顶部（移动端）显示 D0 至 D8 的步骤导航。点击任意步骤可切换编辑区域。
            已完成填写的步骤会以对勾标记。底部提供 "Previous" 和 "Next" 按钮逐步引导。
          </p>

          <h3 className="text-lg font-medium mt-4">3.2 各步骤填写说明</h3>
          <table className="w-full border-collapse border text-sm mt-2">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left w-20">步骤</th>
                <th className="border px-3 py-2 text-left">名称</th>
                <th className="border px-3 py-2 text-left">关键字段</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border px-3 py-2 font-medium">D0</td><td className="border px-3 py-2">Prepare（准备）</td><td className="border px-3 py-2">报告编号（自动生成可编辑）、报告类型、问题来源、客户名称</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D1</td><td className="border px-3 py-2">Team（团队）</td><td className="border px-3 py-2">团队成员姓名、角色</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D2</td><td className="border px-3 py-2">Describe（描述）</td><td className="border px-3 py-2">问题详细描述、发生日期、发现位置、照片附件</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D3</td><td className="border px-3 py-2">Contain（围堵）</td><td className="border px-3 py-2">围堵措施、责任人、完成日期、附件</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D4</td><td className="border px-3 py-2">Root Cause（根因）</td><td className="border px-3 py-2">5-Why 分析表、鱼骨图描述</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D5</td><td className="border px-3 py-2">Correct（纠正）</td><td className="border px-3 py-2">纠正措施、责任人、完成日期、附件</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D6</td><td className="border px-3 py-2">Implement（实施）</td><td className="border px-3 py-2">实施计划、验证方法、附件</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D7</td><td className="border px-3 py-2">Prevent（预防）</td><td className="border px-3 py-2">预防措施、标准化文件更新、附件</td></tr>
              <tr><td className="border px-3 py-2 font-medium">D8</td><td className="border px-3 py-2">Close（关闭）</td><td className="border px-3 py-2">团队确认、管理层签字、关闭日期</td></tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium mt-4">3.3 附件上传</h3>
          <p>
            在 D2、D3、D5、D6、D7 步骤中，可以通过以下三种方式上传附件：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>拍照上传</strong>：点击 "Take Photo" 按钮，使用设备摄像头直接拍摄</li>
            <li><strong>相册选择</strong>：点击 "Photo Library" 从设备相册选取图片</li>
            <li><strong>文件上传</strong>：点击 "Upload File" 上传 PDF、Excel、Word、CSV 等文档</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            限制：单个文件不超过 5MB，每个报告最多 10 个附件。支持格式：JPG、PNG、WebP、PDF、XLSX、DOCX、CSV、TXT、ZIP。
          </p>
          <h4 className="font-medium mt-2">附件预览</h4>
          <p>上传的图片会显示缩略图，点击可放大预览。非图片文件点击可在新标签页打开。</p>

          <h3 className="text-lg font-medium mt-4">3.4 保存操作</h3>
          <p>
            点击顶部 "Save" 按钮或使用快捷键保存当前步骤内容。系统会保留所有已填写的数据。
            报告状态会在顶部状态标签中显示：Draft（草稿）、In Progress（进行中）、Completed（已完成）。
          </p>
        </section>

        {/* 4. 导出与分享 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">4. 导出与分享</h2>

          <h3 className="text-lg font-medium mt-4">4.1 导出报告</h3>
          <p>在报告编辑页面顶部，点击 "导出" 按钮，选择导出格式：</p>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>PDF 导出</strong>：生成 A4 格式的专业排版 PDF，包含封面、各步骤内容、附件图片和页码</li>
            <li><strong>Word 导出</strong>：生成 .docx 格式文档，方便进一步编辑</li>
            <li><strong>包含附件</strong>：导出时有附件会自动打包为 ZIP 文件，内含报告文档和 attachments 文件夹</li>
          </ul>
          <p className="text-sm text-muted-foreground">
            Free 套餐导出的报告带有 "SAMPLE" 水印，Pro 套餐无水印。
          </p>

          <h3 className="text-lg font-medium mt-4">4.2 分享报告</h3>
          <ol className="list-decimal pl-5 space-y-1">
            <li>在报告编辑页面点击 "Share" 按钮</li>
            <li>选择权限模式：<strong>"View only"</strong>（仅查看）或 <strong>"Can edit"</strong>（可编辑）</li>
            <li>点击生成分享链接，复制链接发送给协作者</li>
            <li>"Can edit" 模式下，协作者打开链接后可以在线编辑报告内容</li>
            <li>可以随时删除分享链接以撤销访问权限</li>
          </ol>
        </section>

        {/* 5. AI 质量顾问 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">5. AI 质量顾问 (Quality Agent)</h2>
          <p>
            页面右下角的 AI 质量顾问悬浮按钮可以随时打开质量专家聊天窗口。您可以：
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>询问 8D 方法论相关问题</li>
            <li>获取 IATF 16949 / ISO 9001 标准解释</li>
            <li>请求根因分析建议</li>
            <li>了解质量工具 (FMEA、SPC、MSA) 的使用方法</li>
            <li>获取报告撰写建议和模板参考</li>
          </ul>
        </section>

        {/* 6. 账户与配额 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">6. 账户与配额</h2>

          <h3 className="text-lg font-medium mt-4">6.1 套餐对比</h3>
          <table className="w-full border-collapse border text-sm mt-2">
            <thead>
              <tr className="bg-muted">
                <th className="border px-3 py-2 text-left">功能</th>
                <th className="border px-3 py-2 text-center">Free</th>
                <th className="border px-3 py-2 text-center">Pro</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border px-3 py-2">报告数量</td><td className="border px-3 py-2 text-center">5 份（终身）</td><td className="border px-3 py-2 text-center">无限</td></tr>
              <tr><td className="border px-3 py-2">D0–D8 完整流程</td><td className="border px-3 py-2 text-center">✅</td><td className="border px-3 py-2 text-center">✅</td></tr>
              <tr><td className="border px-3 py-2">PDF 导出</td><td className="border px-3 py-2 text-center">✅（带水印）</td><td className="border px-3 py-2 text-center">✅（无水印）</td></tr>
              <tr><td className="border px-3 py-2">Word 导出</td><td className="border px-3 py-2 text-center">✅（带水印）</td><td className="border px-3 py-2 text-center">✅（无水印）</td></tr>
              <tr><td className="border px-3 py-2">附件上传</td><td className="border px-3 py-2 text-center">✅</td><td className="border px-3 py-2 text-center">✅</td></tr>
              <tr><td className="border px-3 py-2">AI 质量顾问</td><td className="border px-3 py-2 text-center">✅</td><td className="border px-3 py-2 text-center">✅</td></tr>
              <tr><td className="border px-3 py-2">审计追溯</td><td className="border px-3 py-2 text-center">—</td><td className="border px-3 py-2 text-center">✅</td></tr>
              <tr><td className="border px-3 py-2">优先支持</td><td className="border px-3 py-2 text-center">—</td><td className="border px-3 py-2 text-center">✅</td></tr>
            </tbody>
          </table>

          <h3 className="text-lg font-medium mt-4">6.2 升级到 Pro</h3>
          <p>
            在 <Link href="/pricing" className="text-indigo-600 hover:underline">定价页面</Link> 选择月付 ($9.99/月) 或年付 ($79/年 — 节省 34%)。
            点击支付按钮后跳转至 Creem 安全支付页面完成付款。升级后配额和功能即时生效。
          </p>
        </section>

        {/* 7. 常见问题 */}
        <section>
          <h2 className="text-xl font-semibold text-foreground">7. 常见问题 (FAQ)</h2>
          <dl className="space-y-4">
            <div>
              <dt className="font-medium">Q: 报告编号可以修改吗？</dt>
              <dd className="text-muted-foreground mt-1">可以。报告编号在 D0 步骤中自动生成（格式 YYYY-MM-DD-序号），但您可以随时编辑修改。</dd>
            </div>
            <div>
              <dt className="font-medium">Q: 如何切换界面语言？</dt>
              <dd className="text-muted-foreground mt-1">点击页面顶部的语言切换按钮（显示 "中文" 或 "EN"），页面将自动刷新并切换语言。</dd>
            </div>
            <div>
              <dt className="font-medium">Q: 报告中上传的图片会包含在导出文件中吗？</dt>
              <dd className="text-muted-foreground mt-1">是的。导出 PDF 和 Word 时，上传到各步骤的图片会显示在对应步骤位置。所有附件文件会打包在 ZIP 文件的 attachments 文件夹中。</dd>
            </div>
            <div>
              <dt className="font-medium">Q: 分享链接可以设置密码吗？</dt>
              <dd className="text-muted-foreground mt-1">当前版本通过生成的唯一 token 链接进行分享。链接可以随时删除以撤销访问。密码保护功能即将推出。</dd>
            </div>
            <div>
              <dt className="font-medium">Q: 数据安全性如何？</dt>
              <dd className="text-muted-foreground mt-1">数据使用加密传输 (HTTPS) 和加密存储。数据库采用 Neon Serverless Postgres，文件存储在 Cloudflare R2。您可以随时导出所有数据。</dd>
            </div>
          </dl>
        </section>

        <div className="mt-12 border-t pt-8 text-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md bg-indigo-600 px-6 py-3 text-sm font-medium text-white hover:bg-indigo-700"
          >
            开始使用 8D Reports — 免费注册
          </Link>
        </div>
      </div>
    </div>
  )
}
