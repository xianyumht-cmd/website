# 响应式适配审查与改造交付

## 1. 项目文件扫描清单（源码侧）

### HTML
- [index.html](file:///d:/project2/website-main/index.html)
- [nav/index.html](file:///d:/project2/website-main/down/nav/index.html)
- [tdr/index.html](file:///d:/project2/website-main/down/tdr/index.html)

### CSS
- 首页样式
  - [index.css](file:///d:/project2/website-main/static/css/index.css)
  - [translation.css](file:///d:/project2/website-main/static/css/translation.css)
- 导航页样式
  - [bootstrap.min.css](file:///d:/project2/website-main/down/css/bootstrap.min.css)
  - [style.min.css](file:///d:/project2/website-main/down/css/style.min.css)
  - [dark.min.css](file:///d:/project2/website-main/down/css/dark.min.css)
  - [animation.min.css](file:///d:/project2/website-main/down/css/animation.min.css)
  - [mobile.min.css](file:///d:/project2/website-main/down/css/mobile.min.css)
  - [overrides.css](file:///d:/project2/website-main/down/css/overrides.css)
- 游戏页样式
  - [tdr/static/style/index.css](file:///d:/project2/website-main/down/tdr/static/style/index.css)
- 新增全局样式
  - [shared/responsive.css](file:///d:/project2/website-main/shared/responsive.css)

### JS
- 首页脚本
  - [location.js](file:///d:/project2/website-main/static/js/location.js)
  - [main.js](file:///d:/project2/website-main/static/js/main.js)
  - [translation.js](file:///d:/project2/website-main/static/js/translation.js)
- 导航页脚本（包含页面内联脚本 + 下列文件）
  - [nav-data.min.js](file:///d:/project2/website-main/down/nav/nav-data.min.js)
  - [error-guard.js](file:///d:/project2/website-main/down/js/error-guard.js)
  - [theme-mode.min.js](file:///d:/project2/website-main/down/js/theme-mode.min.js)
  - [language-switcher.min.js](file:///d:/project2/website-main/down/js/language-switcher.min.js)
  - [enhanced-translation.min.js](file:///d:/project2/website-main/down/js/enhanced-translation.min.js)
- 游戏页脚本
  - [tdr/static/script/game.js](file:///d:/project2/website-main/down/tdr/static/script/game.js)
  - [tdr/static/script/index.js](file:///d:/project2/website-main/down/tdr/static/script/index.js)
- 新增全局脚本
  - [shared/responsive-base.js](file:///d:/project2/website-main/shared/responsive-base.js)

### Vue / React 组件
- 未发现 `.vue / .jsx / .tsx` 业务组件（项目为静态 HTML + CSS + JS）。

### Less / Sass / Stylus
- 未发现 `.less / .scss / .sass / .styl` 源码文件（样式以 CSS 为主，且部分为压缩版）。

## 2. 现有响应式方案评估（复用优先）

已存在的响应式手段：
- 所有页面均存在 `meta viewport`（移动端基础自适配 OK）
- 导航页使用 Bootstrap 栅格（`col-sm-3`）并配套 [mobile.min.css](file:///d:/project2/website-main/down/css/mobile.min.css) 做断点宽度覆盖（1200/768/580）
- 首页样式 [index.css](file:///d:/project2/website-main/static/css/index.css) 自带 `@media (max-width: 768px)` 适配

缺失或覆盖不全点（已补齐）：
- 没有统一的全局断点变量与基础 token（字号/间距/容器边距）
- 没有统一的 rem 基准/设备 DPR 信息（无法做一致的缩放策略与 1px 物理像素边框工具）
- 游戏页 `.wrapper` 固定宽 960px，移动端会溢出

## 3. 新增/复用的全局适配文件（统一引用）

### 新增
- [shared/responsive-base.js](file:///d:/project2/website-main/shared/responsive-base.js)
  - 自动补全 viewport（补 `viewport-fit=cover`，保留 `initial-scale=1`，不改变缩放以避免破坏现有布局）
  - 写入 `--dpr`、`--hairline-scale`、`--rem`（rem 在 14~18px 范围内随屏宽微调）
- [shared/responsive.css](file:///d:/project2/website-main/shared/responsive.css)
  - 提供全局断点与 token（容器边距、间距、圆角等）
  - 提供 `hairline` 工具类（用 `transform: scale(1/dpr)` 实现 1px 物理像素边框）

### 全局引用位置
- [index.html](file:///d:/project2/website-main/index.html)
- [nav/index.html](file:///d:/project2/website-main/down/nav/index.html)
- [tdr/index.html](file:///d:/project2/website-main/down/tdr/index.html)

## 4. 断点变量表（移动优先）

| 断点名 | 范围/条件 | 说明 |
|---|---:|---|
| xxl | `width >= 1920px` | 超宽屏优化 |
| xl | `width >= 1200px` | PC 常规大屏 |
| md | `width >= 768px` | 平板/小屏笔记本 |
| sm | `width >= 480px` | 大手机 |
| xs | `width < 480px` | 小手机 |

对应 CSS 变量：
- `--bp-xxl: 1920px`
- `--bp-xl: 1200px`
- `--bp-md: 768px`
- `--bp-sm: 480px`

## 5. 组件/页面改造清单（关键项）

### 导航页（down/nav）
- 早期关键样式增加小屏兜底（`<=768` 时 sidebar 取消 fixed，主内容不再左偏移），减少首屏错位
- `#content-sections` 使用全局 token 限制最大宽与 padding，改善超宽屏可读性
- 搜索区与提示区改为 flex 流式布局，避免遮挡内容且在手机端自动换行

相关文件：
- [nav/index.html](file:///d:/project2/website-main/down/nav/index.html)
- [overrides.css](file:///d:/project2/website-main/down/css/overrides.css)

### 游戏页（down/tdr）
- `.wrapper` 从固定宽改为 `min(960px, 100%)` + 内边距
- `canvas` 改为 `width: 100%; height: auto;`，小屏不溢出

相关文件：
- [tdr/static/style/index.css](file:///d:/project2/website-main/down/tdr/static/style/index.css)

## 6. 高风险模块专项检查建议

本项目无图表库/地图/富文本编辑器/复杂表格组件；高风险点主要为：
- 固定定位侧边栏与主内容偏移（已做断点兜底）
- canvas 固定尺寸导致小屏溢出（已处理）
- 小屏触控热区（建议：卡片/按钮最小 44px 高度；后续如新增组件可按此规则验收）

## 7. 自动化测试：三视口视觉回归（0.2% 阈值）

### 已提供脚本
- 视觉回归用例：[visual.spec.ts](file:///d:/project2/website-main/tests/visual.spec.ts)
  - 视口：`375×667`、`768×1024`、`1920×1080`
  - 阈值：`maxDiffPixelRatio = 0.002`（0.2%）
  - 对导航页做了稳定化处理：记录并清理 `setInterval`，隐藏动态时间字段，避免随机差异

### 使用方式
1) 生成/更新基线快照：
- `npm run test:visual:update`

2) 执行对比并生成 diff：
- `npm run test:visual`

Playwright 会在失败时生成 diff 图片，并输出 `playwright-report` 报告目录（本地可直接打开查看）。

## 8. 后续维护规范（建议）

- 新增页面时必须引入：
  - `/shared/responsive-base.js`
  - `/shared/responsive.css`
- 断点写法统一使用媒体范围语法（例如 `@media (width < 768px)`），避免混用旧式 `max-width`/`min-width` 造成风格不一致
- 如新增“图表/表格/弹窗/抽屉”等模块：
  - 默认支持横向滚动（表格/代码块）
  - 触控热区不少于 44px
  - 在视觉回归用例中补充对应页面与视口截图

