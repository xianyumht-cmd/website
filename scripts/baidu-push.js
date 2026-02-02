/**
 * 百度主动推送脚本 (Baidu SEO Push)
 * 使用方法: 
 * 1. 在终端运行: node scripts/baidu-push.js
 * 2. 建议集成到 CI/CD 流程中，每次部署后自动运行
 */

const https = require('https');

// 配置信息
const SITE_URL = 'https://xn--8pv109c.top';
const TOKEN = 'YOUR_BAIDU_TOKEN'; // 请替换为您在百度站长平台获取的 Token

// 需要推送的链接列表
const urls = [
    `${SITE_URL}/`,
    `${SITE_URL}/down/nav/`,
    `${SITE_URL}/down/tdr/`,
    `${SITE_URL}/about.html`,
    `${SITE_URL}/privacy.html`
];

const postData = urls.join('\n');

const options = {
    hostname: 'data.zz.baidu.com',
    port: 443,
    path: `/urls?site=${SITE_URL}&token=${TOKEN}`,
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain',
        'Content-Length': Buffer.byteLength(postData)
    }
};

console.log('正在向百度推送以下链接:');
console.log(postData);

const req = https.request(options, (res) => {
    console.log(`\n状态码: ${res.statusCode}`);
    
    res.setEncoding('utf8');
    res.on('data', (chunk) => {
        console.log(`响应主体: ${chunk}`);
        const result = JSON.parse(chunk);
        if (result.success) {
            console.log(`✅ 推送成功！剩余配额: ${result.remain}`);
        } else {
            console.error(`❌ 推送失败: ${result.message}`);
        }
    });
});

req.on('error', (e) => {
    console.error(`❌ 请求错误: ${e.message}`);
});

req.write(postData);
req.end();
