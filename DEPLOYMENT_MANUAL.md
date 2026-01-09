# 部署手册（Windows 用户零基础版）

本手册覆盖从安装工具到部署上线的完整步骤。所有命令以 Windows PowerShell/CMD 形式展示。

## 0. 准备
- 操作系统：Windows 10/11
- 必备账号：GitHub、Railway（免费层可用）
- 安装软件：
  - Node.js LTS：https://nodejs.org （安装后重启 PowerShell）
  - Git for Windows：https://git-scm.com/download/win
- 验证安装：
  - `node --version`
  - `npm --version`
  - `git --version`

## 1. 获取代码
```powershell
# 选择保存目录，例如桌面
cd $env:USERPROFILE\Desktop
git clone https://github.com/your/repo.git
cd repo
```

## 2. 后端部署（Railway）
1) 进入后端目录并安装依赖：
```powershell
cd backend
npm install
```
2) 创建 Railway 项目并连接仓库（在 Railway 控制台操作）。
3) 环境变量（Railway 项目 Settings → Variables）：
   - `JWT_SECRET`：自定义安全随机字符串
   - `DEFAULT_PASSWORD`：`admin`（可改）
   - `PGSSLMODE`：`require`（Railway 默认即可）
4) 部署：Railway 会自动构建并启动。查看 Logs 确认 `Server listening`。
5) 获取后端地址（例如 `https://your-app.up.railway.app`），稍后前端要用。

本地调试：
```powershell
cd backend
npm run dev
```
默认端口 3000，健康检查 http://localhost:3000/health

## 3. 前端部署（GitHub Pages）
前端有两个独立站点：编辑端 `frontend-editor`，访客端 `frontend-visitor`。

公共步骤：
```powershell
# 以编辑端为例
cd frontend-editor
npm install
$env:VITE_API_BASE="https://your-app.up.railway.app/api"
npm run build
```
构建结果位于 `dist/`。

### 部署方式 A：GitHub Actions（推荐）
1) 在仓库创建 `/.github/workflows/gh-pages.yml`（示例适配 Vite）。
2) 在 GitHub 仓库 Settings → Pages，Source 选择 `gh-pages` 分支。
3) 提交后，Actions 会自动将 `dist` 部署到 `https://<username>.github.io/<repo>/`。
4) 访客端重复以上步骤（可同库不同子目录，或独立仓库）。

### 部署方式 B：手动推送 gh-pages
```powershell
npm run build
npx gh-pages -d dist
```
（若未安装 `gh-pages`，先 `npm install -g gh-pages`。）

### Vite base 路径
如 GitHub Pages 路径为 `/LeagueBudget/`，在两端的 `.env` 中设置：
```
VITE_BASE_PATH=/LeagueBudget/
VITE_API_BASE=https://your-app.up.railway.app/api
```

## 4. 配置与验证
1) 打开编辑端 URL，使用默认密码 `admin` 登录。
2) 首次访问自动初始化 60 支球队，预算为 0。
3) 测试基本功能：
   - **修改预算**：点击预算单元格，输入新值后按回车保存
   - **修改球队名称**：点击球队名称单元格，输入新名称后按回车保存
   - **修改级别名称**：点击级别名称（如"Level 1"），输入新名称后按回车保存（会影响所有显示该级别的地方）
   - **拖拽交换球队**：在同一级别内，拖拽一个球队到另一个球队的位置，两者会交换位置
   - **导入转会**：在转会导入区域粘贴格式化记录（格式：`转出球队,转入球队,价格,球员1[,球员2][,球员3][,球员4]`），点击处理
4) 确认访客端（10 分钟轮询，或手动刷新按钮）能看到更新。
5) 查看令牌提醒：编辑端底部会显示令牌提醒列表（如果有），用于监控异常提交。

## 5. 日常运维
- 更新代码：`git pull` 后重新 `npm run build`，推送即可。
- 更改密码：登录编辑端 → "修改密码"。
- 查看日志：Railway 控制台 Logs。
- 清空历史：编辑端"清空历史"按钮。
- 管理团队令牌：查看和管理团队令牌（见下方详细说明）。
- **管理球队**：
  - 修改预算：直接点击预算单元格编辑
  - 修改球队名称：直接点击球队名称编辑
  - 修改级别名称：点击级别名称编辑（会影响所有显示该级别的地方）
  - 交换球队位置：在同一级别内拖拽球队到目标位置
- **导入转会**：
  - 格式：`转出球队,转入球队,价格,球员1[,球员2][,球员3][,球员4]`
  - 每行一条记录，可以批量导入
  - 系统会自动更新相关球队的预算

## 6. 故障排查（Windows 常见）
- 命令找不到：确认 Node.js、npm、git 已加入 PATH，重启 PowerShell。
- 端口占用：本地 3000/5173/5174 被占用时，关闭占用程序或改端口。
- CORS 报错：确认前端使用的 `VITE_API_BASE` 与后端允许的域名一致（设置 `CORS_ORIGINS` 环境变量，逗号分隔）。
- 构建失败：`node --version`，删除 `node_modules` 重装。
- 权限错误：以管理员打开 PowerShell（右键 → 以管理员身份运行）。

## 7. 重要参数汇总
- 默认后台密码：`admin`（部署后请尽快修改）
- 环境变量：`JWT_SECRET`、`DATABASE_URL`（Railway 自动注入）、`CORS_ORIGINS`
- 前端环境变量：`VITE_API_BASE`、`VITE_BASE_PATH`

## 8. 团队令牌系统

**团队令牌系统**用于防止用户冒充他人提交请求。此系统应用于所有有提交功能的访客端（转会市场、拍卖出价等）。

### 8.1 令牌生成

- 每个球队（`lb_teams` 表中的记录）在首次部署时自动生成一个随机令牌
- 令牌存储在 `lb_team_tokens` 表中
- 令牌不会因代码更新而重置，保持稳定

### 8.2 令牌使用

- **访客端首次访问**：需要输入团队令牌才能访问网站
- **令牌存储**：令牌保存在浏览器本地存储中，下次访问自动使用
- **URL 参数**：也可以通过 URL 传递令牌：`?token=YOUR_TOKEN`
- **跨模块共享**：同一令牌在所有模块的访客端通用

### 8.3 令牌管理

#### 查看令牌
令牌存储在 `lb_team_tokens` 表中：
- `team_id`：球队 ID（关联 `lb_teams.id`）
- `token`：令牌字符串
- `active`：是否激活

#### 重置令牌
如果需要重置某个球队的令牌：
1. 直接访问数据库
2. 更新 `lb_team_tokens` 表中对应 `team_id` 的 `token` 字段
3. 设置新的随机字符串作为令牌
4. 旧令牌将立即失效

### 8.4 令牌提醒

在编辑端可以查看令牌提醒：
- **触发条件**：当提交的数据中不包含令牌对应的球队时
- **处理方式**：系统不会阻止提交，但会生成提醒供管理员审查
- **查看位置**：各模块编辑端的"令牌提醒"页面
- **管理操作**：可以标记已处理或删除提醒

### 8.5 相关数据库表

- `lb_team_tokens`：团队令牌表（每个球队一个令牌）
- `lb_token_alerts`：令牌提醒表（记录令牌与提交不匹配的情况）

完成以上步骤后，两个前端站点与 Railway 后端即完成部署。遇到问题，优先查看日志与网络请求，再按故障排查步骤处理。祝使用顺利！

