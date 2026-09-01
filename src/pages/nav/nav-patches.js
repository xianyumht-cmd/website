// Runtime patches for navigation data that is rendered by nav-core.js.
// Keep this file explicit so link/date hotfixes and resource-list updates do not require rewriting the large nav-data file.

const urlPatches = new Map([
    ["gitee.com/xiazai888/xiazai/raw/master/xiazai", "https://gitee.com/xiazai888/xiazai/raw/master/xiazai"],
    ["https://xn--8pv109c.top/blog/", "https://blog.xn--8pv109c.top/"]
]);

function makeItem(title, description, url, avatar, tooltip) {
    return {
        title,
        description,
        avatar: avatar || String(title).slice(0, 1),
        url,
        tooltip: tooltip || title
    };
}

function cloneSections(sections) {
    return JSON.parse(JSON.stringify(sections || []));
}

function findSection(sections, idOrTitle) {
    return sections.find(section => section.id === idOrTitle || section.title === idOrTitle);
}

function upsertSection(sections, id, title, icon, items) {
    let section = findSection(sections, id) || findSection(sections, title);
    if (!section) {
        section = { id, title, icon, items: [] };
        sections.push(section);
    }
    section.id = id;
    section.title = title;
    section.icon = icon;
    section.items = items;
    return section;
}

function patchUrlsInSections(sections) {
    if (!Array.isArray(sections)) return;
    sections.forEach(section => {
        if (!Array.isArray(section.items)) return;
        section.items.forEach(item => {
            if (item && urlPatches.has(item.url)) {
                item.url = urlPatches.get(item.url);
            }
        });
    });
}

function upsertHideAndSeekSection(sections, title, items) {
    let section =
        findSection(sections, "躲猫猫专区") ||
        findSection(sections, "变色龙躲猫猫专区") ||
        findSection(sections, "Meccha Chameleon 变色龙躲猫猫(变色龙躲猫猫)") ||
        findSection(sections, "Hide-and-Seek Zone");

    if (!section) {
        section = { id: "躲猫猫专区", title, icon: "fa fa-puzzle-piece", items: [] };
        sections.push(section);
    }

    section.id = "躲猫猫专区";
    section.title = title;
    section.icon = "fa fa-puzzle-piece";
    section.items = items;
    return section;
}

function patchZhSections(sections) {
    if (!Array.isArray(sections)) return sections;

    const gsSection = findSection(sections, "GS专区") || findSection(sections, "GS Zone") || findSection(sections, "足本专区");
    if (gsSection) {
        gsSection.id = "足本专区";
        gsSection.title = "足本专区";
        gsSection.icon = "fa fa-toggle-on";
        gsSection.items = Array.isArray(gsSection.items) ? gsSection.items : [];
        if (!gsSection.items.some(item => item.title === "OS")) {
            gsSection.items.push(makeItem("OS", "足本专区资源", "https://wwayq.lanzouq.com/s/outis", "OS"));
        }
    }

    upsertSection(sections, "天卡专区", "天卡专区", "fa fa-book", [
        makeItem("Space", "Space", "https://wwayq.lanzouq.com/b00odtjzsf", "S"),
        makeItem("蓝鲸", "蓝鲸", "https://wwbpx.lanzoum.com/b00mqcafbi", "蓝"),
        makeItem("FY", "FY", "https://wwbls.lanzouq.com/b0rb4uivc", "FY"),
        makeItem("acme", "密码：8888", "https://wwer.ysupan.com", "A"),
        makeItem("如意", "如意", "https://wwbpx.lanzoum.com/b00mqcagdg", "如"),
        makeItem("sgpro", "sgpro", "http://b-bu.cn/s/porobaobao", "S"),
        makeItem("Strat", "蓝奏下载", "https://www.lanwp.com/b019vxf7mf", "S"),
        makeItem("DJ", "密码：123", "https://wwaym.lanzoub.com/s/DJYYDS", "DJ"),
        makeItem("FE", "密码：bp03", "https://wwarw.lanzn.com/b00l2sy5re", "FE"),
        makeItem("DC", "提取码：DC66", "https://share.feijipan.com/s/xiark1VW?code=DC66", "DC"),
        makeItem("鲨鱼", "鲨鱼", "https://wwbuq.lanzouu.com/b00jezzfej", "鲨"),
        makeItem("传奇", "密码：efbk", "https://wwamk.lanzouu.com/b01d70ikvc", "传"),
        makeItem("yun", "密码：yun", "https://wwus.lanzouu.com/s/yunnb", "云")
    ]);

    const weeklySection = upsertSection(sections, "周卡专区", "周卡专区", "fa fa-google-wallet", [
        makeItem("GUF", "不三年，强烈推荐", "https://wwme.lanzoui.com/b00od4rd1e", "G"),
        makeItem("LTY", "密码：f4sv", "https://wwauv.lanzout.com/b00yb1z1od", "L"),
        makeItem("LO", "密码：123", "https://wwash.lanzouw.com/b019vvm2ve", "LO"),
        makeItem("万艾可", "密码：123", "https://wwbku.lanzoub.com/b0pndjqmj", "万"),
        makeItem("黎明", "下载地址", "https://wwbpx.lanzoum.com/b00mqeda6d", "黎"),
        makeItem("时光", "密码：btqo", "https://wwarw.lanzn.com/b00l2sy5gd", "时"),
        makeItem("海豹", "海豹", "https://wwbuq.lanzouu.com/b00jezzfoj", "海"),
        makeItem("FJ", "密码：123", "https://wwaym.lanzoub.com/s/QiHang", "FJ"),
        makeItem("樱桃", "密码：123", "https://wwbgz.lanzouu.com/b019vx8h5g", "樱"),
        makeItem("灵影", "密码：0ying", "https://wwus.lanzouu.com/b0zkvz7la", "灵"),
        makeItem("TAB", "密码：tab11", "https://wwus.lanzouu.com/s/TAB1", "TAB"),
        makeItem("ADS", "飞鸡盘下载", "https://share.feijipan.com/s/jBdy32yE", "ADS"),
        makeItem("星辰", "密码：123", "https://wwbgz.lanzouu.com/b019w076jg", "星")
    ]);
    weeklySection.items = weeklySection.items.filter(Boolean);

    upsertSection(sections, "月卡专区", "月卡专区", "fa fa-delicious", [
        makeItem("Noble", "需要请联系微信客服，强烈推荐", "https://install.noble.vin/", "N", "NS"),
        makeItem("spirit", "无下载地址，版本联系上级代理获取", "#月卡专区", "S"),
        makeItem("TOOL", "TOOL", "http://211.154.22.179:88/2", "T"),
        makeItem("LEI", "LEI", "http://211.154.22.179:88/3", "L")
    ]);

    upsertSection(sections, "一体化区", "一体化区", "fa fa-y-combinator-square", [
        makeItem("无心", "无心一体走砍 密码：hhwn", "https://wud.lanzoul.com/b00hq90ire", "无"),
        makeItem("NS", "Noble 下载地址", "https://download.noble.vin/", "NS")
    ]);

    upsertSection(sections, "云顶专区", "云顶专区", "fa fa-trello", [
        makeItem("鸡你太美", "下棋助手，密码：888", "https://wwaoj.lanzoul.com/s/ydjntm4", "鸡"),
        makeItem("神将", "云顶资源", "http://shenjiang.ysupan.com/login.aspx?d=shenjiang", "神")
    ]);

    upsertSection(sections, "缓存专区", "缓存专区", "fa fa-viadeo-square", [
        makeItem("US", "US是适用于汉堡的 大锅菜 缝合怪 小助手，默认为你加载最人性化配置", "https://gitee.com/xiazai888/xiazai/raw/master/xiazai", "堡"),
        makeItem("RS", "RS是适用于EZ的 大锅菜 缝合怪 小助手，默认为你加载最人性化配置", "https://gitee.com/xiazai888/xiazai/raw/master/xiazai", "儿"),
        makeItem("ST", "提取码：1233", "https://share.feijipan.com/s/o8aoNlnD?code=1233", "ST"),
        makeItem("无名", "无名缓存", "https://wwzd.lanzouu.com/b016kd079i", "无"),
        makeItem("无名VIP", "无名VIP", "https://wmsaves.top/", "V"),
        makeItem("FH", "GG专用", "https://funhouseteam.com/login/redeem.php", "FH")
    ]);

    upsertSection(sections, "过炫舞专区", "过炫舞专区", "fa fa-music", [
        makeItem("过炫舞", "过炫舞教程/资源", "https://www.yuque.com/u64769050/mi2tlv/ylsvoeyxy4gz7abn", "炫")
    ]);

    upsertSection(sections, "小工具专区", "小工具专区", "fa fa-toolbox", [
        makeItem("亨特", "小工具", "https://a.hoisen.com/d9YgFh", "亨"),
        makeItem("键盘侠", "免费工具，一键输入账号密码", "https://mybb.lanzn.com/illyB3p72wgb", "键")
    ]);

    upsertSection(sections, "三角洲专区", "三角洲专区", "fa fa-crosshairs", [
        makeItem("GTA", "密码：666", "https://wud.lanzoul.com/b00hrkm3pg", "G"),
        makeItem("KT", "无双/KT最新下载地址，密码：6666", "https://wwazv.lanzout.com/b0he1s4te", "KT"),
        makeItem("寒冰", "寒冰官网下载地址", "https://www.hb111.top/", "寒"),
        makeItem("opus", "官网下载地址", "http://www.opus666.top/", "O"),
        makeItem("战神", "下载地址", "https://yituoshi.lanzouw.com/b023nn2x3g", "战")
    ]);

    upsertSection(sections, "PUBG专区", "PUBG专区", "fa fa-gamepad", [
        makeItem("绝影", "PUBG资源", "https://wwas.lanzouj.com/b00xq0uaf", "绝"),
        makeItem("轮回", "PUBG资源", "https://wwas.lanzouj.com/b00xziv7a", "轮")
    ]);

    upsertSection(sections, "瓦洛兰特专区", "瓦洛兰特专区", "fa fa-bolt", [
        makeItem("RK大瓦国", "密码：0000", "https://wwaly.lanzouq.com/b011m5h4gd", "RK"),
        makeItem("opus", "官网下载地址，密码：6666", "http://www.opus666.top/", "O")
    ]);

    upsertSection(sections, "穿越火线专区", "穿越火线专区", "fa fa-bullseye", [
        makeItem("谪仙红名生化", "密码：6666", "https://daguo6.lanzouw.com/b0mbewswf", "谪"),
        makeItem("天命", "密码：6666", "https://daguo6.lanzouw.com/b0mbewtqf", "天"),
        makeItem("北帝", "密码：6666", "https://daguo6.lanzouw.com/b0mbewu8d", "北"),
        makeItem("JZ", "密码：6666", "https://daguo6.lanzouw.com/b0mbewvlc", "JZ"),
        makeItem("BX", "密码：6666", "https://daguo6.lanzouw.com/b0mbewvta", "BX"),
        makeItem("BB", "密码：6666", "https://daguo6.lanzouw.com/b0mbewuwh", "BB"),
        makeItem("凤溪", "密码：6666", "https://daguo6.lanzouw.com/b0mcn84vg", "凤")
    ]);

    upsertHideAndSeekSection(sections, "躲猫猫专区", [
        makeItem("MC", "密码：123", "https://wwbjv.lanzout.com/b00yb6nuwd", "MC"),
        makeItem("涂鸦躲猫猫", "密码：6666", "https://wwbhv.lanzoum.com/b01d713yof", "涂"),
        makeItem("达芬奇", "密码：6666", "https://wwbhv.lanzoum.com/b01d71e9kh", "达")
    ]);

    upsertSection(sections, "上号专区", "上号专区", "fa fa-sign-in", [
        makeItem("奥特曼租号", "上号器下载地址，密码：6666", "https://wwyq.lanzoui.com/b0zjywmud", "奥"),
        makeItem("方寸租号", "上号器下载地址", "https://wwi.lanzoue.com/b0a6jcuyh", "方"),
        makeItem("东鹏", "密码：6666", "https://wwwj.lanzouw.com/b00ro37qdc", "东"),
        makeItem("小天", "WeGame 上号相关", "https://jbh.lanzouu.com/s/WeGame", "天")
    ]);

    patchUrlsInSections(sections);
    return sections;
}

function patchEnSections(sections) {
    if (!Array.isArray(sections)) return sections;

    upsertSection(sections, "天卡专区", "Daily Card Zone", "fa fa-book", [
        makeItem("Space", "Space", "https://wwayq.lanzouq.com/b00odtjzsf", "S"),
        makeItem("Blue Whale", "Blue Whale", "https://wwbpx.lanzoum.com/b00mqcafbi", "B"),
        makeItem("FY", "FY", "https://wwbls.lanzouq.com/b0rb4uivc", "FY"),
        makeItem("acme", "Password: 8888", "https://wwer.ysupan.com", "A"),
        makeItem("Ruyi", "Ruyi", "https://wwbpx.lanzoum.com/b00mqcagdg", "R"),
        makeItem("sgpro", "sgpro", "http://b-bu.cn/s/porobaobao", "S"),
        makeItem("Strat", "Lanzou download", "https://www.lanwp.com/b019vxf7mf", "S"),
        makeItem("DJ", "Password: 123", "https://wwaym.lanzoub.com/s/DJYYDS", "DJ"),
        makeItem("FE", "Password: bp03", "https://wwarw.lanzn.com/b00l2sy5re", "FE"),
        makeItem("DC", "Code: DC66", "https://share.feijipan.com/s/xiark1VW?code=DC66", "DC"),
        makeItem("Shark", "Shark", "https://wwbuq.lanzouu.com/b00jezzfej", "S"),
        makeItem("Legend", "Password: efbk", "https://wwamk.lanzouu.com/b01d70ikvc", "L"),
        makeItem("yun", "Password: yun", "https://wwus.lanzouu.com/s/yunnb", "Y")
    ]);

    upsertSection(sections, "周卡专区", "Weekly Card Zone", "fa fa-google-wallet", [
        makeItem("GUF", "Recommended", "https://wwme.lanzoui.com/b00od4rd1e", "G"),
        makeItem("LTY", "Password: f4sv", "https://wwauv.lanzout.com/b00yb1z1od", "L"),
        makeItem("LO", "Password: 123", "https://wwash.lanzouw.com/b019vvm2ve", "LO"),
        makeItem("Viega", "Password: 123", "https://wwbku.lanzoub.com/b0pndjqmj", "V"),
        makeItem("Dawn", "Download", "https://wwbpx.lanzoum.com/b00mqeda6d", "D"),
        makeItem("Time", "Password: btqo", "https://wwarw.lanzn.com/b00l2sy5gd", "T"),
        makeItem("Seal", "Seal", "https://wwbuq.lanzouu.com/b00jezzfoj", "S"),
        makeItem("FJ", "Password: 123", "https://wwaym.lanzoub.com/s/QiHang", "FJ"),
        makeItem("Cherry", "Password: 123", "https://wwbgz.lanzouu.com/b019vx8h5g", "C"),
        makeItem("Lingying", "Password: 0ying", "https://wwus.lanzouu.com/b0zkvz7la", "L"),
        makeItem("TAB", "Password: tab11", "https://wwus.lanzouu.com/s/TAB1", "TAB"),
        makeItem("ADS", "Feijipan download", "https://share.feijipan.com/s/jBdy32yE", "ADS"),
        makeItem("Xingchen", "Password: 123", "https://wwbgz.lanzouu.com/b019w076jg", "X")
    ]);

    upsertSection(sections, "云顶专区", "TFT Zone", "fa fa-trello", [
        makeItem("Ji Ni Tai Mei", "TFT helper, password: 888", "https://wwaoj.lanzoul.com/s/ydjntm4", "J"),
        makeItem("Shenjiang", "TFT resource", "http://shenjiang.ysupan.com/login.aspx?d=shenjiang", "S")
    ]);

    upsertSection(sections, "缓存专区", "Cache Zone", "fa fa-viadeo-square", [
        makeItem("US", "HanBot helper preset", "https://gitee.com/xiazai888/xiazai/raw/master/xiazai", "H"),
        makeItem("RS", "EZ helper preset", "https://gitee.com/xiazai888/xiazai/raw/master/xiazai", "E"),
        makeItem("ST", "Code: 1233", "https://share.feijipan.com/s/o8aoNlnD?code=1233", "ST"),
        makeItem("Wuming", "Cache resource", "https://wwzd.lanzouu.com/b016kd079i", "W"),
        makeItem("Wuming VIP", "VIP cache resource", "https://wmsaves.top/", "V"),
        makeItem("FH", "For GG", "https://funhouseteam.com/login/redeem.php", "FH")
    ]);

    upsertSection(sections, "小工具专区", "Utilities", "fa fa-toolbox", [
        makeItem("Hunter", "Utility", "https://a.hoisen.com/d9YgFh", "H"),
        makeItem("Keyboard Warrior", "Free tool for entering account credentials with one click", "https://mybb.lanzn.com/illyB3p72wgb", "K")
    ]);

    upsertSection(sections, "三角洲专区", "Delta Force Zone", "fa fa-crosshairs", [
        makeItem("GTA", "Password: 666", "https://wud.lanzoul.com/b00hrkm3pg", "G"),
        makeItem("KT", "Latest download, password: 6666", "https://wwazv.lanzout.com/b0he1s4te", "KT"),
        makeItem("Hanbing", "Official download", "https://www.hb111.top/", "H"),
        makeItem("opus", "Official download", "http://www.opus666.top/", "O"),
        makeItem("Zhanshen", "Download", "https://yituoshi.lanzouw.com/b023nn2x3g", "Z")
    ]);

    upsertSection(sections, "瓦洛兰特专区", "VALORANT Zone", "fa fa-bolt", [
        makeItem("RK", "Password: 0000", "https://wwaly.lanzouq.com/b011m5h4gd", "RK"),
        makeItem("opus", "Official download, password: 6666", "http://www.opus666.top/", "O")
    ]);

    upsertSection(sections, "穿越火线专区", "CrossFire Zone", "fa fa-bullseye", [
        makeItem("Zhexian", "Password: 6666", "https://daguo6.lanzouw.com/b0mbewswf", "Z"),
        makeItem("Tianming", "Password: 6666", "https://daguo6.lanzouw.com/b0mbewtqf", "T"),
        makeItem("Beidi", "Password: 6666", "https://daguo6.lanzouw.com/b0mbewu8d", "B"),
        makeItem("JZ", "Password: 6666", "https://daguo6.lanzouw.com/b0mbewvlc", "JZ"),
        makeItem("BX", "Password: 6666", "https://daguo6.lanzouw.com/b0mbewvta", "BX"),
        makeItem("BB", "Password: 6666", "https://daguo6.lanzouw.com/b0mbewuwh", "BB"),
        makeItem("Fengxi", "Password: 6666", "https://daguo6.lanzouw.com/b0mcn84vg", "F")
    ]);

    upsertHideAndSeekSection(sections, "Hide-and-Seek Zone", [
        makeItem("MC", "Password: 123", "https://wwbjv.lanzout.com/b00yb6nuwd", "MC"),
        makeItem("Graffiti Hide-and-Seek", "Password: 6666", "https://wwbhv.lanzoum.com/b01d713yof", "G"),
        makeItem("Da Vinci", "Password: 6666", "https://wwbhv.lanzoum.com/b01d71e9kh", "D")
    ]);

    patchUrlsInSections(sections);
    return sections;
}

function patchNavData() {
    const translations = window.navDataTranslations;
    if (!translations) return;

    if (translations.zh && Array.isArray(translations.zh.sections)) {
        translations.zh.sections = patchZhSections(translations.zh.sections);
    }

    if (translations.en && Array.isArray(translations.en.sections)) {
        translations.en.sections = patchEnSections(translations.en.sections);
    }

    Object.values(translations).forEach(data => {
        patchUrlsInSections(data && data.sections);
    });

    const currentLanguage = window.currentNavLanguage || "zh";
    const currentData = translations[currentLanguage] || translations.zh;
    if (window.navData && currentData) {
        window.navData.sections = currentData.sections;
    }
}

patchNavData();
