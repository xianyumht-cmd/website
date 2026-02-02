# 脚本.top 开发者指南 (Developer Guide)

本文档旨在为开发人员提供项目的详细结构说明、文件用途解析及开发维护指南。

## 1. 项目概览

**脚本.top** 是一个集成了资源导航、发卡服务跳转、工具下载及互动游戏（吃豆人）的综合性静态网站。项目基于现代前端技术栈构建，支持响应式设计、多语言切换及高性能加载。

- **构建工具**: Vite
- **部署平台**: Cloudflare Pages
- **核心技术**: HTML5, CSS3, ES6 JavaScript, Rust (WASM)

## 2. 目录结构详解

### 根目录 (`/`)

| 文件/目录 | 用途说明 |
| :--- | :--- |
| `index.html` | **网站首页**。包含核心导航入口（QQ群/频道跳转）、多语言支持及页脚信息。 |
| `about.html` | **关于我们页面**。展示平台简介、优势及联系方式。 |
| `privacy.html` | **隐私政策页面**。详述数据收集与使用规则，符合合规要求。 |
| `404.html` | **404 错误页面**。自定义的未找到页面，引导用户返回首页。 |
| `vite.config.js` | **Vite 构建配置**。定义了多入口打包、代码混淆插件、输出目录等核心构建逻辑。 |
| `package.json` | **项目依赖管理**。包含 `scripts`（启动/打包命令）及 `devDependencies`（开发依赖）。 |
| `.gitignore` | **Git 忽略规则**。指定不应上传到版本控制的文件（如 `node_modules`, `dist`）。 |
| `_redirects` | **重定向规则**。用于本地测试或某些静态托管服务的路由重定向配置。 |

### 核心子系统

#### 1. 资源导航系统 (`down/nav/`)
这是网站的核心功能区，提供各类游戏辅助与工具的下载导航。

| 文件 | 用途 |
| :--- | :--- |
| `index.html` | **导航页入口**。包含侧边栏、内容卡片网格及搜索功能。 |
| `nav-data.min.js` | **数据源文件**。存储所有导航条目（标题、链接、图标、描述）。**修改导航内容请编辑此文件**。 |
| `nav-core.js` | **核心逻辑**。负责读取数据源并动态渲染页面、处理搜索、公告滚动及时间显示。 |
| `help.md` | 导航系统的帮助文档（开发用）。 |

#### 2. 吃豆人游戏 (`down/tdr/`)
一个移植的经典 Pac-Man 游戏，作为网站的互动彩蛋。

| 文件 | 用途 |
| :--- | :--- |
| `index.html` | **游戏页入口**。包含 Canvas 画布及游戏控制 UI。 |
| `static/script/` | 包含 `game.js` (游戏引擎) 和 `index.js` (页面交互逻辑)。 |
| `static/style/` | 游戏页面的样式表。 |

### 资源目录

#### 公共资源 (`public/`)
存放不经过构建处理的静态文件，部署时会原样复制到根目录。

| 文件 | 用途 |
| :--- | :--- |
| `_headers` | **Cloudflare 缓存配置**。定义浏览器和 CDN 的缓存策略（重要）。 |
| `robots.txt` | **爬虫协议**。指导搜索引擎如何抓取网站。 |
| `sitemap.xml` | **站点地图**。帮助搜索引擎索引所有页面。 |
| `favicon.ico` | 网站图标。 |

#### 静态资源 (`static/`)
主要用于首页 (`index.html`) 的样式和脚本。

| 文件 | 用途 |
| :--- | :--- |
| `css/index.css` | 首页的主样式表。 |
| `js/main.js` | 首页的交互逻辑。 |
| `js/location.js` | 处理首页卡片的点击跳转逻辑（QQ跳转等）。 |
| `picture/*.svg` | 首页使用的 SVG 图标资源。 |

#### 共享资源 (`shared/`)
全站通用的功能模块。

| 文件 | 用途 |
| :--- | :--- |
| `responsive-base.js` | 响应式基座脚本，处理移动端适配。 |
| `responsive.css` | 全局响应式样式。 |
| `anti-debug.js` | 防调试脚本（安全防护）。 |

#### 第三方库 (`down/`)
历史遗留的静态资源库，包含 jQuery, Bootstrap, FontAwesome 等。
*注意：新开发建议使用现代 ESM 模块，逐步减少对这些旧库的依赖。*

### WebAssembly (`src-wasm/`)
使用 Rust 编写的高性能模块（目前主要用于验证或许可证检查逻辑）。

| 文件 | 用途 |
| :--- | :--- |
| `src/lib.rs` | Rust 源代码。 |
| `Cargo.toml` | Rust 项目配置。 |

---

## 3. 开发与维护指南

### 常用命令
在项目根目录下运行：

- **安装依赖**: `npm install`
- **启动本地服务器**: `npm run dev` (访问 http://localhost:3000)
- **构建生产版本**: `npm run build` (生成 `dist` 目录)
- **预览生产构建**: `npm run preview`

### 如何修改导航内容？
1. 打开 `down/nav/nav-data.min.js`。
2. 找到 `navDataTranslations.zh.sections` 数组。
3. 在对应的分类 (`items`) 中添加或修改对象：
   ```javascript
   {
       title: "新资源名称",
       description: "资源描述",
       avatar: "图标文字", // 或 imgUrl: "图片路径"
       url: "跳转链接",
       tooltip: "悬停提示"
   }
   ```
4. 保存后刷新页面即可生效。

### 如何更新统计代码？
目前使用了百度统计。如需更换：
1. 打开 `index.html`, `down/nav/index.html`, `down/tdr/index.html`。
2. 搜索 `百度统计` 或 `hm.baidu.com`。
3. 替换 `<script>` 标签内的代码 ID。

### 部署注意事项
- 本项目配置了 Cloudflare Pages 自动部署。
- 每次 `git push` 后，Cloudflare 会自动拉取代码并执行 `npm run build`。
- 确保 `public/_headers` 文件存在，否则可能导致缓存问题（旧页面加载新资源失败）。

---

## 4. 常见问题 (FAQ)

**Q: 为什么修改了文件但网站没变化？**
A: Cloudflare 可能有缓存。请检查 `public/_headers` 配置，或在 Cloudflare 后台手动清除缓存。开发时请禁用浏览器缓存。

**Q: `dist` 目录需要上传吗？**
A: 不需要。`dist` 是构建产物，应该被 `.gitignore` 忽略。Cloudflare 会在服务器端构建生成它。

**Q: 如何添加新页面？**
1. 在根目录创建 `.html` 文件。
2. 在 `vite.config.js` 的 `build.rollupOptions.input` 中添加该文件的入口配置。
