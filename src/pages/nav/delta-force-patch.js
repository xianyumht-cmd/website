// Keep the Delta Force navigation section aligned with the current resource list.
(function patchDeltaForceSection() {
    function makeItem(title, description, url, avatar) {
        return {
            title,
            description,
            avatar: avatar || String(title).slice(0, 1),
            url,
            tooltip: title
        };
    }

    const zhItems = [
        makeItem("正版无双", "正版无双最新下载地址，密码：6666", "https://wwazv.lanzout.com/b0he1s4te", "无"),
        makeItem("战神", "下载地址", "https://yituoshi.lanzouw.com/b023nn2x3g", "战"),
        makeItem("BACK", "密码：6666", "https://wwbgw.lanzouv.com/s/back66", "BACK"),
        makeItem("救世主", "密码：6688", "https://wwbox.lanzn.com/b00v06922h", "救"),
        makeItem("KKB", "KKB卡密下载地址", "http://45.125.46.238:16001/user", "KKB"),
        makeItem("AA", "AA卡密验证地址", "https://www.aawg.one/", "AA"),
        makeItem("GS", "密码：6666", "http://vc-rom.uupan.net/", "GS"),
        makeItem("金色传说", "密码：6666", "https://wwbfa.lanzoub.com/b014xfvrkd", "金"),
        makeItem("NN", "下载地址", "https://link.3ceng.cn/view/48763698", "NN"),
        makeItem("VX", "需要下载最新版微信，登录成功后微信窗口不要关闭。", "http://www.vxsjz.cc/", "VX"),
        makeItem("HN", "密码：6666", "https://wwbls.lanzn.com/b014xgdecf", "HN")
    ];

    const enItems = [
        makeItem("正版无双", "Latest download, password: 6666", "https://wwazv.lanzout.com/b0he1s4te", "无"),
        makeItem("战神", "Download", "https://yituoshi.lanzouw.com/b023nn2x3g", "战"),
        makeItem("BACK", "Password: 6666", "https://wwbgw.lanzouv.com/s/back66", "BACK"),
        makeItem("救世主", "Password: 6688", "https://wwbox.lanzn.com/b00v06922h", "救"),
        makeItem("KKB", "KKB license download", "http://45.125.46.238:16001/user", "KKB"),
        makeItem("AA", "AA license verification", "https://www.aawg.one/", "AA"),
        makeItem("GS", "Password: 6666", "http://vc-rom.uupan.net/", "GS"),
        makeItem("金色传说", "Password: 6666", "https://wwbfa.lanzoub.com/b014xfvrkd", "金"),
        makeItem("NN", "Download", "https://link.3ceng.cn/view/48763698", "NN"),
        makeItem("VX", "Install the latest WeChat and keep its window open after signing in.", "http://www.vxsjz.cc/", "VX"),
        makeItem("HN", "Password: 6666", "https://wwbls.lanzn.com/b014xgdecf", "HN")
    ];

    function replaceItems(sections, items) {
        if (!Array.isArray(sections)) return;

        const section = sections.find(candidate => candidate && (
            candidate.id === "三角洲专区" ||
            candidate.title === "三角洲专区" ||
            candidate.title === "Delta Force Zone"
        ));

        if (!section) return;
        section.items = items.map(item => ({ ...item }));
    }

    const translations = window.navDataTranslations;
    if (translations && translations.zh) {
        replaceItems(translations.zh.sections, zhItems);
    }
    if (translations && translations.en) {
        replaceItems(translations.en.sections, enItems);
    }

    if (window.navData) {
        const currentItems = window.currentNavLanguage === "en" ? enItems : zhItems;
        replaceItems(window.navData.sections, currentItems);
    }
})();
