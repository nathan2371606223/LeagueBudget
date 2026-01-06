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
3) 修改预算、拖拽交换、导入转会，确认访客端（10 分钟轮询，或手动刷新按钮）能看到更新。

## 5. 日常运维
- 更新代码：`git pull` 后重新 `npm run build`，推送即可。
- 更改密码：登录编辑端 → “修改密码”。
- 查看日志：Railway 控制台 Logs。
- 清空历史：编辑端“清空历史”按钮。

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

完成以上步骤后，两个前端站点与 Railway 后端即完成部署。遇到问题，优先查看日志与网络请求，再按故障排查步骤处理。祝使用顺利！

