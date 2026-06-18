const translations = {
  "脚本.top": "Scripts.top",
  "超凡发卡": "Card Shop",
  "租号陪玩": "Account Rental",
  "下载导航": "Download Hub",
  "商务合作": "Business",
  "问题反馈": "Feedback",
  "立即发卡": "Buy Now",
  "自动模式": "Auto Mode",
  "发卡、租号": "Cards and Rentals",
  "一页直达": "One Page Access",
  "游戏资源与常用工具入口，提供自动发卡、租号陪玩、下载导航、问题反馈和商务合作。页面保持清楚、轻量，方便客户快速进入购买、下载和反馈。": "A clear entry point for game resources and common tools, including automatic card delivery, account rental, download navigation, feedback, and business cooperation.",
  "自动发卡下单入口": "Automatic card order entry",
  "资源导航入口": "Resource navigation entries",
  "核心业务入口保留": "Core business entries kept",
  "首页第一主入口，24 小时自动发货，老客户能直接进入购买路径。": "The primary homepage entry, with 24-hour automatic delivery and a direct purchase path for returning users.",
  "进入发卡 →": "Enter shop ->",
  "全区租号、陪玩开黑、低价体验入口，作为第二核心业务展示。": "Rental, play-with-me, and low-cost experience entry for the second core service.",
  "脚本、工具、修复包、专区资源集中入口，承接资源导航页。": "A focused entry for scripts, tools, repair packages, and resource areas.",
  "链接失效、资源更新、页面问题都能快速反馈。": "Broken links, resource updates, and page issues can be reported quickly.",
  "网站、机器人、AI 代办和项目维护咨询入口。": "Consulting entry for websites, bots, AI assistance, and project maintenance.",
  "备用发卡": "Backup Shop",
  "兜底入口": "Fallback entry",
  "自动发货": "Auto Delivery",
  "快速下单": "Fast order",
  "资源修复": "Resource Fix",
  "失效反馈": "Broken link feedback",
  "隐私政策": "Privacy Policy",
  "基础说明": "Basic notice",
  "备案信息": "Filing Info",
  "合规入口": "Compliance entry",
  "常用入口与服务说明": "Common Entries and Service Notes",
  "首页优先解决客户“去哪买、去哪租、去哪下载、去哪反馈、去哪合作”的问题。": "The homepage answers where to buy, rent, download, report issues, and discuss cooperation.",
  "入口清楚": "Clear Entries",
  "发卡、租号、导航分得明白，核心动作放在首屏可见位置。": "Card shop, rental, and navigation are clearly separated, with core actions visible above the fold.",
  "售后明确": "Clear Support",
  "链接失效、资源更新、页面问题可以通过邮箱快速反馈处理。": "Broken links, resource updates, and page issues can be reported by email.",
  "机器人、网站、AI 代办和小型项目维护可通过关于页面咨询。": "Bots, websites, AI assistance, and small project maintenance can be discussed from the about page.",
  "热门搜索：陪玩｜租号｜自动发卡网｜30级小号｜租号网站｜1元陪玩体验。": "Hot searches: play-with-me | account rental | automatic card shop | level 30 accounts | rental sites | 1-yuan trial.",
  "新闻公告": "News",
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
  "下载导航入口": "Download hub entry",
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
