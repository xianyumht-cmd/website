(function() {
    // 智能打开链接函数：电脑端弹窗，移动端新标签
    window.openSmartLink = function(url) {
        // 检测是否为移动端
        var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // 如果是电脑端，且是http链接，则使用小窗打开
        if (!isMobile && url.startsWith('http')) {
            var width = 420;
            var height = 640;
            var left = screen.width - width - 50; // 显示在右侧
            var top = (screen.height - height) / 2;
            
            window.open(url, '_blank', 'width=' + width + ',height=' + height + ',top=' + top + ',left=' + left + ',status=no,toolbar=no,menubar=no,location=no');
        } else {
            // 移动端保持原样，在新标签打开
            window.open(url, '_blank');
        }
    };

    var footerHTML = `
    <footer style="width: 100%; text-align: center; color: #999; font-size: 12px; padding: 20px 0; background: transparent; margin-top: auto;">
        <div style="margin-bottom: 5px;">
            <p style="margin: 0; font-size: 12px; display: inline-block; color: #999; transform: scale(0.9);">
                &copy; 2026 脚本.top | 
                <a href="/" target="_blank" style="color: #999; text-decoration: none;">首页</a> | 
                <a href="javascript:void(0)" onclick="openSmartLink('https://an.207qk.cn/s/')" style="color: #999; text-decoration: none; cursor: pointer;">超凡发卡</a> |
                <a href="javascript:void(0)" onclick="openSmartLink('https://an.24vv.cn/s/')" style="color: #999; text-decoration: none; cursor: pointer;">备用发卡</a> |
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

    document.write(footerHTML);
})();
