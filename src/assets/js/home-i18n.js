const translations = {
  "脚本.top": "Scripts.top",
  "超凡发卡": "Card Shop",
  "租号陪玩": "Account Rental",
  "下载导航": "Download Hub",
  "资源导航": "Resource Hub",
  "商务合作": "Business",
  "问题反馈": "Feedback",
  "立即发卡": "Buy Now",
  "自动模式": "Auto Mode",
  "24 小时自助服务": "24/7 Self-service",
  "服务目录": "Service Directory",
  "购买与自动发货": "Purchase and automatic delivery",
  "全区租号与陪玩入口": "Account rental and team-play access",
  "脚本、工具与修复资源": "Scripts, tools, and repair resources",
  "进入服务 →": "Open service ->",
  "服务支持 / Support": "Service Support",
  "备用发卡": "Backup Shop",
  "备用租号": "Backup Rental",
  "24 小时自助服务 · 资源持续更新": "24/7 self-service · Resources kept up to date",
  "发卡、租号": "Cards and Rentals",
  "工具资源": "Tools and Resources",
  "直接进入": "Direct Access",
  "选择需要的服务即可进入。购买、租号、资源下载和问题反馈，都能从这里快速找到。": "Choose what you need and continue. Purchases, rentals, downloads, and support are all directly available here.",
  "24 小时自动处理，进入后即可选择需要的项目。": "Automated 24/7. Open the entry and select what you need.",
  "进入发卡 →": "Enter shop ->",
  "全区租号、陪玩开黑与低价体验入口。": "Account rentals, team play, and low-cost trial access.",
  "主通道繁忙时，可从备用通道继续访问。": "Use the backup channel when the primary route is busy.",
  "脚本、工具、修复包与专区资源的统一索引。": "A unified index for scripts, tools, repair packages, and resource areas.",
  "链接失效、资源更新、页面问题都能快速反馈。": "Broken links, resource updates, and page issues can be reported quickly.",
  "备用通道": "Backup Channel",
  "随时切换": "Always available",
  "即时交付": "Instant Delivery",
  "快速处理": "Fast processing",
  "问题追踪": "Issue Tracking",
  "失效反馈": "Broken link feedback",
  "隐私政策": "Privacy Policy",
  "隐私说明": "Privacy",
  "数据边界": "Data boundaries",
  "可信备案": "Verified Filing",
  "公开验证": "Public verification",
  "网址导航": "Site Navigation",
  "首页": "Home",
  "富强、民主、文明、和谐，自由、平等、公正、法治，爱国、敬业、诚信、友善": "Prosperity, civic values, harmony, freedom, equality, justice, rule of law, patriotism, dedication, integrity, friendship",
  "鄂ICP备2024055850号-4": "ICP filing: E ICP No. 2024055850-4"
};

const attributeTranslations = {
  "主要入口": "Main entries",
  "页面工具": "Page tools",
  "切换主题模式": "Switch theme mode",
  "切换语言": "Switch language",
  "业务入口": "Business entries",
  "超凡发卡入口": "Card shop entry",
  "租号陪玩入口": "Account rental entry",
  "资源导航入口": "Resource hub entry",
  "MySSL 安全认证": "MySSL security certification"
};

const originalText = new WeakMap();
const originalAttrs = new WeakMap();

function translateTextNode(node, lang) {
  if (!originalText.has(node)) originalText.set(node, node.nodeValue);
  const source = originalText.get(node);
  const trimmed = source.trim();
  if (!trimmed) return;
  const leading = source.match(/^\s*/)[0];
  const trailing = source.match(/\s*$/)[0];
  node.nodeValue = lang === "en" && translations[trimmed]
    ? `${leading}${translations[trimmed]}${trailing}`
    : source;
}

function translateAttributes(element, lang) {
  ["aria-label", "title", "alt"].forEach((name) => {
    if (!element.hasAttribute(name)) return;
    if (!originalAttrs.has(element)) originalAttrs.set(element, {});
    const store = originalAttrs.get(element);
    if (!store[name]) store[name] = element.getAttribute(name);
    const source = store[name];
    element.setAttribute(name, lang === "en" && attributeTranslations[source] ? attributeTranslations[source] : source);
  });
}

function applyHomeLanguage(lang) {
  const root = document.querySelector(".main-wrapper");
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach((node) => translateTextNode(node, lang));
  root.querySelectorAll("[aria-label], [title], [alt]").forEach((element) => translateAttributes(element, lang));
}

function hookLanguageSwitcher() {
  if (!window.languageSwitcher || window.languageSwitcher.__homeI18nHooked) return false;
  const originalApplyLanguage = window.languageSwitcher.applyLanguage.bind(window.languageSwitcher);
  window.languageSwitcher.applyLanguage = function applyLanguageWithHome(lang) {
    originalApplyLanguage(lang);
    applyHomeLanguage(lang);
  };
  window.languageSwitcher.__homeI18nHooked = true;
  applyHomeLanguage(window.languageSwitcher.currentLanguage || "zh");
  return true;
}

function initHomeI18n() {
  if (hookLanguageSwitcher()) return;
  let attempts = 0;
  const timer = window.setInterval(() => {
    attempts += 1;
    if (hookLanguageSwitcher() || attempts > 25) window.clearInterval(timer);
  }, 120);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initHomeI18n);
} else {
  initHomeI18n();
}
