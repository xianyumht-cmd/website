# website / 脚本.top

`website` 是 **脚本.top** 的网站源码仓库，当前默认开发分支为 `source`。项目以 Vite 为构建工具，主要维护首页、资源/下载导航、小游戏页面、关于与隐私页面，以及对应的响应式、构建、测试和部署流程。

## 主要内容

- 网站首页与公共页面：`index.html`、`about.html`、`privacy.html`、`404.html`
- 资源导航：`src/pages/nav/`
- 导航数据源：`src/assets/data/nav-data.json`
- 游戏页面：`src/pages/games/`、`src/pages/tdr/`
- 前端资源：`src/assets/`
- 公共静态文件：`public/`
- 构建与维护脚本：`scripts/`
- 自动化测试：`tests/`
- 详细开发说明：`DEVELOPER_GUIDE.md`

## 技术栈

- Vite 7
- HTML5 / CSS / JavaScript
- Jest
- Playwright
- Lighthouse
- Cloudflare Pages

## 本地开发

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

默认开发端口为 `3000`。

## 常用命令

```bash
# HTML + CSS 检查
npm run lint

# 单元测试
npm run test:unit

# E2E / 冒烟测试
npm run test:e2e

# 性能测试
npm run test:perf

# 完整测试
npm test

# 生产构建
npm run build

# 本地预览生产构建
npm run preview
```

生产构建输出到 `dist/`。

## 修改资源导航

导航页面位于：

```text
src/pages/nav/
```

主要导航数据位于：

```text
src/assets/data/nav-data.json
```

`src/pages/nav/data.js` 会读取该 JSON 并初始化导航数据。当前目录下还存在针对具体专区和历史兼容逻辑的补丁脚本，修改导航内容前应先确认对应条目是否同时受补丁文件影响。

## 构建与部署

项目使用 Vite 多入口构建，当前包含首页、资源导航、游戏页、吃豆人页、关于、隐私和 404 页面。生产环境由 Cloudflare Pages 承担部署，构建命令为：

```bash
npm run build
```

输出目录：

```text
dist
```

## 开发文档

需要了解目录结构、维护方式和历史约定时，优先查看：

- `DEVELOPER_GUIDE.md`
- `AGENTS.md`
- `CODEX.md`
- `SECURITY.md`
- `RESPONSIVE_AUDIT.md`

## 维护原则

- 不提交 `node_modules/`、`dist/` 等本地产物。
- 导航数据修改后至少执行对应 lint / 测试。
- 页面结构调整后建议执行 Playwright 冒烟测试和视觉检查。
- 涉及缓存、静态资源路径或构建产物结构时，同时检查 `public/` 与构建脚本。
