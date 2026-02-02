# Windows 环境变量与工具链配置（down 目录审计/修复用）

本项目的 `down/` 为静态网页资源；但要实现“控制台零报错 + Lighthouse ≥ 90 + 标准校验 + 自动化测试”，建议在 Windows 上准备以下工具链与环境变量。

## 1) 必需环境变量（最小集）

### PATH（必需）
- **作用**：让系统能找到 `node/npm/npx`、`git`、`java` 等命令。
- **典型需要包含**（按你的安装路径为准）：
  - `C:\Program Files\nodejs\`
  - `C:\Program Files\Git\cmd\`
  - `%JAVA_HOME%\bin`

### JAVA_HOME（必需：用于 HTML 标准校验 vnu）
- **作用**：让 Java 工具稳定找到 JDK。
- **示例**：`C:\Program Files\Eclipse Adoptium\jdk-17`

### CHROME_PATH（建议：用于 Lighthouse/Playwright 精确指定 Chrome）
- **作用**：避免 Lighthouse/Playwright 找错或找不到浏览器。
- **示例**：`C:\Program Files\Google\Chrome\Application\chrome.exe`

## 2) 可选环境变量（按需启用）

### PLAYWRIGHT_BROWSERS_PATH
- **作用**：指定 Playwright 浏览器下载缓存目录，便于离线/复用。
- **示例**：`D:\playwright-browsers`

### npm_config_cache
- **作用**：指定 npm 缓存目录，避免系统盘占满。
- **示例**：`D:\npm-cache`

### NODE_OPTIONS
- **作用**：给 Node 进程设置内存等参数（大体量审计时可用）。
- **示例**：`--max-old-space-size=4096`

## 3) Windows 环境变量配置步骤（系统属性 → 高级 → 环境变量）

1. 右键 **此电脑** → **属性** → **高级系统设置**
2. 选择 **高级** → 点击 **环境变量(N)...**
3. **系统变量**（对所有用户生效）：
   - `Path` → **编辑** → **新建** → 加入需要的目录（注意是目录，不是 exe）
   - **新建**：`JAVA_HOME`（指向 JDK 根目录）
   - （可选）**新建**：`CHROME_PATH`、`PLAYWRIGHT_BROWSERS_PATH`、`npm_config_cache`、`NODE_OPTIONS`
4. **用户变量**（仅当前用户生效）：同样可以设置以上变量（优先级高于系统变量）
5. 关闭并重新打开 PowerShell / CMD，使变量立即生效

## 4) 需要安装的软件（官方/可信源）、版本建议与下载链接

> 建议优先使用本仓库提供的自动化脚本 `scripts\bootstrap-windows.ps1`（会调用 winget 并生成日志与回滚脚本）。

### Node.js（必需）
- **建议**：使用最新 LTS
- **下载**：https://nodejs.org/en/download/

### Git for Windows（建议）
- **下载**：https://git-scm.com/install/windows

### Java（必需：用于 vnu HTML 校验）
- **建议**：Temurin JDK 17（LTS）
- **下载**：https://adoptium.net/temurin/releases/?version=17

### Google Chrome（建议）
- **下载**：https://www.google.com/chrome/

## 5) 验证方法（逐项验证）

在 **新打开的 PowerShell** 里执行：

```powershell
where node
where npm
where git
where java
```

```powershell
node -v
npm -v
git --version
java -version
```

```powershell
echo $env:JAVA_HOME
echo $env:CHROME_PATH
Test-Path $env:CHROME_PATH
```

## 6) 本仓库提供的一键脚本

- `scripts\bootstrap-windows.ps1`：自动检测并安装必需组件；配置用户级/系统级环境变量；生成日志与回滚脚本
- `scripts\verify-env.ps1`：验证组件版本与环境变量取值（用于 CI 门禁与本地排查）

## 7) 常见错误排查

### node/npm 找不到
- 排查：`where node` 是否为空
- 解决：确认 Node 安装成功，并把 `C:\Program Files\nodejs\` 加入 `Path`；重开终端

### JAVA_HOME 指向错误
- 排查：`echo $env:JAVA_HOME` 与 `where java`
- 解决：`JAVA_HOME` 指向 JDK 根目录（不要指向 `bin`），并把 `%JAVA_HOME%\bin` 加入 `Path`

### Lighthouse/Playwright 找不到 Chrome
- 解决：设置 `CHROME_PATH` 为 `chrome.exe` 完整路径

