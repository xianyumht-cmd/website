const fs = require('fs');
const path = require('path');
const https = require('http');

// 配置
const SITE_DOMAIN = 'https://xn--8pv109c.top';
const BAIDU_API = 'http://data.zz.baidu.com/urls?site=https://xn--8pv109c.top&token=OCFwmra3ihOcjGFA';

// 扫描目录获取 URL
function scanUrls(dir, urls = []) {
    const files = fs.readdirSync(dir);

    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);

        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                scanUrls(filePath, urls);
            }
        } else {
            if (file.endsWith('.html')) {
                // 转换为 URL
                let relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
                
                // 规则优化：
                // 1. index.html 结尾的，去掉 index.html，保留目录斜杠
                // 2. 其他 .html 结尾的，保留文件名
                let url = '';
                if (relativePath.endsWith('index.html')) {
                    const dirPath = path.dirname(relativePath);
                    url = dirPath === '.' ? SITE_DOMAIN + '/' : SITE_DOMAIN + '/' + dirPath + '/';
                } else {
                    url = SITE_DOMAIN + '/' + relativePath;
                }
                
                urls.push(url);
            }
        }
    });

    return urls;
}

// 执行推送
function pushToBaidu(urls) {
    console.log('准备推送以下 URL:');
    urls.forEach(u => console.log(`- ${u}`));

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain',
            'Content-Length': Buffer.byteLength(urls.join('\n'))
        }
    };

    const req = https.request(BAIDU_API, options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            console.log('\n百度 API 响应:');
            console.log(data);
            try {
                const result = JSON.parse(data);
                if (result.success) {
                    console.log(`\n✅ 成功推送 ${result.success} 条链接！今日剩余配额: ${result.remain}`);
                } else {
                    console.log('\n❌ 推送失败:', result.message);
                }
            } catch (e) {
                console.log('解析响应失败');
            }
        });
    });

    req.on('error', (e) => {
        console.error(`请求遇到问题: ${e.message}`);
    });

    req.write(urls.join('\n'));
    req.end();
}

// 主流程
try {
    const rootDir = process.cwd();
    const urls = scanUrls(rootDir);
    
    // 过滤掉不需要的页面（如 404.html 或测试页面）
    const validUrls = urls.filter(u => !u.includes('404.html'));

    if (validUrls.length > 0) {
        pushToBaidu(validUrls);
    } else {
        console.log('未找到需要推送的 HTML 文件');
    }
} catch (error) {
    console.error('执行出错:', error);
}
