const fs = require('fs');
const path = require('path');

// 配置
const SITE_DOMAIN = 'https://xn--8pv109c.top';
const OUTPUT_FILE = path.join(__dirname, '../public/sitemap.xml');
const IGNORE_DIRS = ['node_modules', '.git', 'dist', 'scripts', 'public', 'src-wasm', 'tests', 'test-results', '.github'];
const IGNORE_FILES = ['404.html', 'social-media-card.html'];

// 优先级配置
const PRIORITY_MAP = {
    'index.html': '1.0',
    'down/nav/index.html': '0.9',
    'down/shop/index.html': '0.9',
    'down/rent/index.html': '0.9',
    'down/tdr/index.html': '0.8',
    'default': '0.6'
};

const FREQ_MAP = {
    'index.html': 'daily',
    'down/nav/index.html': 'daily',
    'down/shop/index.html': 'daily',
    'default': 'weekly'
};

function getFileDate(filePath) {
    const stats = fs.statSync(filePath);
    return stats.mtime.toISOString().split('T')[0];
}

function scanHtmlFiles(dir, fileList = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (!IGNORE_DIRS.includes(file)) {
                scanHtmlFiles(filePath, fileList);
            }
        } else {
            if (file.endsWith('.html') && !IGNORE_FILES.includes(file)) {
                fileList.push(filePath);
            }
        }
    });

    return fileList;
}

function generateSitemap() {
    console.log('开始生成 Sitemap...');
    const rootDir = path.resolve(__dirname, '..');
    const htmlFiles = scanHtmlFiles(rootDir);
    
    let sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    sitemapContent += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    htmlFiles.forEach(filePath => {
        // 计算相对路径
        let relativePath = path.relative(rootDir, filePath).replace(/\\/g, '/');
        
        // 转换为 URL
        let urlPath = relativePath;
        if (urlPath.endsWith('index.html')) {
            // 如果是 index.html，通常只保留目录名 (例如 down/nav/index.html -> down/nav/)
            // 根目录 index.html -> /
            const dir = path.dirname(urlPath);
            urlPath = dir === '.' ? '' : dir + '/';
        }

        const fullUrl = `${SITE_DOMAIN}/${urlPath}`;
        const lastMod = getFileDate(filePath);
        
        // 确定优先级和更新频率
        // 优先使用精确匹配，否则使用默认值
        const relativeKey = relativePath; // e.g., down/nav/index.html
        const priority = PRIORITY_MAP[relativeKey] || PRIORITY_MAP['default'];
        const freq = FREQ_MAP[relativeKey] || FREQ_MAP['default'];

        sitemapContent += `  <url>\n`;
        sitemapContent += `    <loc>${fullUrl}</loc>\n`;
        sitemapContent += `    <lastmod>${lastMod}</lastmod>\n`;
        sitemapContent += `    <changefreq>${freq}</changefreq>\n`;
        sitemapContent += `    <priority>${priority}</priority>\n`;
        sitemapContent += `  </url>\n`;
    });

    sitemapContent += `</urlset>`;

    fs.writeFileSync(OUTPUT_FILE, sitemapContent);
    console.log(`✅ Sitemap 已生成: ${OUTPUT_FILE}`);
    console.log(`共包含 ${htmlFiles.length} 个链接`);
}

generateSitemap();
