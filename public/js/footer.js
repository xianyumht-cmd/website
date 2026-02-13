(function() {
    // 获取当前脚本的路径，用于判断层级（虽然 public 里的 js 通常用绝对路径 /js/footer.js 引用，但为了保险起见）
    // 为了简单起见，我们假设所有页面都通过 /js/footer.js 引用，或者页面里自己处理了 base 路径
    // 这里我们直接输出绝对路径的 HTML，因为资源都在根目录下

    var footerHTML = `
    <footer style="width: 100%; text-align: center; color: #999; font-size: 12px; padding: 20px 0; background: transparent; margin-top: auto;">
        <div style="margin-bottom: 5px;">
            <p style="margin: 0; font-size: 12px; display: inline-block; color: #999; transform: scale(0.9);">
                &copy; 2026 脚本.top | 
                <a href="https://blog.xn--8pv109c.top/" target="_blank" style="color: #999; text-decoration: none;">博客文章</a> | 
                <a href="/down/nav/" target="_blank" style="color: #999; text-decoration: none;">网址导航</a> | 
                <a href="/about.html" target="_blank" style="color: #999; text-decoration: none;">关于我们</a> | 
                <a href="/privacy.html" target="_blank" style="color: #999; text-decoration: none;">隐私政策</a> | 
                <a href="/sitemap.xml" target="_blank" style="color: #999; text-decoration: none;">XML 地图</a> |
                <a href="/down/tdr/index.html" target="_blank" style="color: #999; text-decoration: none;">吃豆人</a>
            </p>
        </div>
        <div style="margin-bottom: 5px; font-size: 12px; color: #999; transform: scale(0.9);">
            友情链接：
            <a href="https://www.baidu.com" target="_blank" rel="nofollow" style="color: #999; text-decoration: none; margin: 0 5px;">百度搜索</a>
            <a href="https://www.so.com" target="_blank" rel="nofollow" style="color: #999; text-decoration: none; margin: 0 5px;">360搜索</a>
            <a href="https://www.sogou.com" target="_blank" rel="nofollow" style="color: #999; text-decoration: none; margin: 0 5px;">搜狗搜索</a>
        </div>
        <p style="margin: 0; font-size: 12px; opacity: 0.8; transform: scale(0.8); color: #999;">
            富强、民主、文明、和谐，自由、平等、公正、法治，爱国、敬业、诚信、友善
        </p>
        <div style="margin-top: 10px;">
            <a href="https://beian.miit.gov.cn/" target="_blank" style="color: #999; text-decoration: none; font-size: 12px; transform: scale(0.9); display: inline-block;">鄂ICP备2024055850号-4</a>
        </div>
        <div style="margin-top: 10px;">
            <a href="https://myssl.com/xn--8pv109c.top?from=mysslid" target="_blank">
                <img src="https://static.myssl.com/res/images/myssl-id1.png" alt="MySSL 安全认证" style="max-height:50px; display:block; margin:0 auto;">
            </a>
        </div>
    </footer>
    `;

    // 检查页面上是否已经有 footer 标签，如果有则替换，如果没有则追加到 body
    // 策略：我们直接在脚本执行的位置插入 HTML
    document.write(footerHTML);
})();
