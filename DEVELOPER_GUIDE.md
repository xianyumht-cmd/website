# Developer Guide

本文档描述当前仓库的实际开发、构建和维护方式。历史目录、已经退役的数据源和旧安全方案不要继续作为开发依据。

## 1. 项目概览

这是一个以静态页面为主的 Vite 多入口站点，生产部署目标为 Cloudflare Pages。

当前主要入口：

- `index.html`：首页。
- `about.html`、`privacy.html`、`404.html`：基础页面。
- `src/pages/nav/index.html`：资源导航页。
- `src/pages/games/index.html`：游戏资源页。
- `src/pages/tdr/index.html`：TDR 互动页面。

构建后，`scripts/organize-dist.mjs` 会把 `dist/src/pages/*` 重排为生产路径 `dist/down/*`，所以源码路径和线上路径不要混用。

## 2. 关键目录与所有权

### `src/pages/`

页面源码目录：

- `src/pages/nav/`：NAV 页面入口及页面级逻辑。
- `src/pages/games/`：Games 页面入口及页面级逻辑。
- `src/pages/tdr/`：TDR 页面及其历史脚本资源。
- `src/pages/common/`：页面共享片段或公共页面资源。

TDR 的 `src/pages/tdr/static/script/**` 属于历史脚本区域，目前仍是 JavaScript lint 的明确窄范围排除项。不要为了让 lint 变绿扩大这个排除范围。

### `src/assets/data/`

当前数据所有权：

- `nav-catalog.js`：NAV 资源分类、标题、描述、图标和链接的唯一目录数据源。
- `games-data.json`：Games 页面数据。
- `lol-version.json`：LOL 版本元数据。
- `site-config.json`：站点配置数据。

修改 NAV 资源时，应编辑 `src/assets/data/nav-catalog.js`。不要重新引入 `nav-data.json`、`nav-data.min.js` 或运行时 patch 文件作为第二套目录数据源。

### `src/assets/app/`

页面运行逻辑位于这里。资源页 sidebar/drawer 的当前运行时状态由 `resource-sidebar.js` 管理，正式开关状态是 `.page-container.resource-sidebar-closed`。

不要重新使用旧 `.sidebar-menu.collapsed` 或 `.mobile-is-visible` 作为当前资源页菜单状态。

### `src/assets/css/`

NAV/Games 仍有历史 CSS 叠层，但当前资源页最终视觉和 drawer 所有权由 `resource-pages.css` 持有。

清理旧 CSS 时必须按“最终 computed style + Playwright + Lighthouse”验证，不能只因为某个 selector 看起来没有 JavaScript 调用就直接删除。Phase 2 已经验证过：部分旧移动 CSS 虽然没有显式运行时入口，删除后仍可能造成 CLS 回归。

### `shared/`

全站共享代码：

- `responsive-base.js` / `responsive.css`：响应式基础能力。
- `page-guard.js`：共享页面保护逻辑；构建时会复制到 `dist/page-guard.js`。

### `public/`

Vite 会把这里的静态文件复制到构建产物根目录。

- `_headers`：Cloudflare Pages 的缓存与安全响应头配置。
- `groupguard/manual.html`：GroupGuard 客户使用手册。
- 其他不需要 Vite 转换的静态资源。

`npm run build` 最后会运行 `scripts/verify-dist-security.mjs`，如果 `dist/_headers` 丢失或关键安全头被移除，构建会失败。

## 3. 构建流程

正式构建命令：

```bash
npm run build
```

实际链路：

1. `vite build`
2. `scripts/organize-dist.mjs`
3. `scripts/postbuild-optimize.mjs`
4. `scripts/verify-dist-security.mjs`

Vite 当前使用多入口构建和 Terser 压缩。仓库没有 SECURITY.md 旧版本曾描述的 AES 前端加密、密钥拆分、图片隐写、Service Worker 密钥下发或 Rust/WASM 安全边界。

## 4. 常用命令

```bash
npm ci
npm run dev
npm run lint
npm run test:unit
npm run test:smoke
npm run build
npm run test:perf
npm run test
```

说明：

- CI 使用 Node 24。
- `package.json` 要求 Node `>=22.19`。
- `npm run test:perf` 对 NAV 和 TDR 各运行 3 次 Lighthouse，要求性能分中位数 `>= 0.90`，并要求任意一次 CLS 都不超过 `0.10`。
- 高危和严重 npm advisory 由 `npm audit --audit-level=high` 阻断质量门槛和发布路径。

## 5. 修改 NAV 数据

NAV 目录数据只改：

```text
src/assets/data/nav-catalog.js
```

修改后至少执行：

```bash
npm run lint
npm run test:smoke
npm run build
```

涉及布局、sidebar、异步渲染或首屏样式时，还必须执行：

```bash
npm run test:perf
```

不要用加载顺序 patch 或 MutationObserver 补丁重新维护第二份资源目录。

## 6. CSS / sidebar 维护规则

资源页当前约定：

- Desktop：sidebar 默认打开。
- `<= 820px`：drawer 默认收起，通过现有 toggle 打开。
- 正式运行时状态：`resource-sidebar-closed`。
- 最终资源页视觉层：`resource-pages.css`。

已有 Playwright 测试会检查 NAV/Games 移动 drawer 的纵向布局，以及 NAV desktop 的最终 sidebar/menu computed style。修改相关 CSS 时不要绕过这些测试。

## 7. 安全模型

这是公开静态前端。发送到浏览器的 HTML、CSS、JavaScript、JSON 和图片都应视为公开内容。

不要把 API secret、私钥、管理员凭据或长期 token 放进：

- `src/`
- `public/`
- Vite 客户端环境变量
- 任何最终进入 `dist/` 的文件

安全策略和漏洞报告方式以 `SECURITY.md` 为准。Cloudflare Pages 安全响应头以 `public/_headers` 为准，并由构建脚本验证最终产物。

## 8. 分支与发布

- 规范开发基线：`source`。
- 一个任务使用一个任务分支。
- 不要 force push、reset/clean 掉其他工作。
- 未经明确授权，不 merge 到生产分支，也不执行生产部署。
- Task/PR Quality Gate 必须保持阻断式：dependency audit、lint、unit、Playwright smoke、production build、Lighthouse 都不能靠 `continue-on-error` 绕过。

## 9. 添加新页面

1. 在合适的 `src/pages/<name>/` 下创建入口 HTML 和页面资源。
2. 在 `vite.config.js` 的 `optimizeDeps.entries` 和 `build.rollupOptions.input` 中注册入口。
3. 如果线上路径需要位于 `/down/<name>/`，确认 `scripts/organize-dist.mjs` 的重排逻辑覆盖该页面。
4. 添加最小 smoke 测试，至少保证无 console error、请求失败和 4xx/5xx。
5. 运行完整质量门槛后再进入 review。
