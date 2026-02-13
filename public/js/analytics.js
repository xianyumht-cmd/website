(function() {
    // 51.LA 统计代码
    var analyticsHTML = `
    <script>
        window.LA = window.LA || { init: function(){ console.warn('LA Analytics blocked or failed to load'); } };
    </script>
    <script charset="UTF-8" id="LA_COLLECT" src="//sdk.51.la/js-sdk-pro.min.js"></script>
    <script>
        if (typeof LA !== 'undefined' && LA.init) {
            LA.init({id:"3OsinsCksDM34iaJ",ck:"3OsinsCksDM34iaJ",autoTrack:true});
        }
    </script>
    `;
    
    // 由于 document.write 插入 script 可能会有执行顺序问题，这里推荐使用 DOM 操作追加到 head 或 body
    // 但为了最简单的兼容，且 51.la 官方通常也支持 document.write 方式（如果是在 body 中）
    // 不过，为了稳妥，我们用 createElement
    
    var script1 = document.createElement('script');
    script1.charset = "UTF-8";
    script1.id = "LA_COLLECT";
    script1.src = "//sdk.51.la/js-sdk-pro.min.js";
    
    var script2 = document.createElement('script');
    script2.innerHTML = `
        window.LA = window.LA || { init: function(){ console.warn('LA Analytics blocked or failed to load'); } };
        if (typeof LA !== 'undefined' && LA.init) {
            LA.init({id:"3OsinsCksDM34iaJ",ck:"3OsinsCksDM34iaJ",autoTrack:true});
        }
    `;

    // 等 SDK 加载完再执行 init
    script1.onload = function() {
        if (typeof LA !== 'undefined' && LA.init) {
            LA.init({id:"3OsinsCksDM34iaJ",ck:"3OsinsCksDM34iaJ",autoTrack:true});
        }
    };

    document.head.appendChild(script1);
    // script2 其实不需要了，因为我们在 script1.onload 里执行了初始化
    // 但为了保险（万一 SDK 异步加载策略变了），保留最简初始化逻辑
})();
