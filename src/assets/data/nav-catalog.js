// Canonical NAV catalog.
// Resource sections and links live here only. Do not add runtime section-replacement patches.
const i = (title, description, url, avatar, options = {}) => ({
  title,
  description,
  avatar,
  url,
  tooltip: options.tooltip || title,
  ...(options.displayOnly ? { displayOnly: true } : {})
});

const s = (id, title, icon, items) => ({ id, title, icon, items });

const navDataTranslations = {
zh: {
    gameInfo: { version: '', updateDate: '', nextUpdateDate: '', feedbackEmail: 'xianyumht@gmail.com' },
    sections: [
    s("常用工具","常用工具","fa-solid fa-star",[
      i("问题反馈","新闻公告和问题反馈可以在此处查看与提交","https://blog.xn--8pv109c.top/","论坛",{"tooltip":"论坛"}),
      i("游戏资源","游戏工具、账号服务与官方支持入口","/down/games/","游"),
      i("4件套+DX修复+工具盒子","专业的纯C++语言编写的清理工具，与必备组件","https://avgorange.lanzoub.com/b0dppnjpg","清",{"tooltip":"清理"}),
      i("影子卫士","影子卫士 类似于网吧的重启自动还原，杜绝残留影响，但属于第三方软件","https://pan-su.lanzoum.com/ih8H00xoy2ze","影",{"tooltip":"影子"}),
      i("隐藏战机【查询】","账号mengxin1 密码mengxin ，xiaomengzi 密码 xiaomengzi，由凹凸曼租号友情赞助！点击后如果打不开请访问备用网站lolso1.com","https://so1.lol/","W",{"tooltip":"战绩"}),
      i("HanBot数据库","英雄合集每日胜率 版本胜率排行","https://badspacebar.github.io/sdk/index.html#/","堡"),
      i("EZ数据库","DS GS EZ资料库","https://champions.legendsen.se/","儿")
    ]),
    s("足本专区","足本专区","fa fa-toggle-on",[
      i("EZ","并不比bo强！ 密码123","https://wwme.lanzouq.com/b00oco2z0j","儿"),
      i("ezpro","一体 自带特权 密码123","https://wwme.lanzouq.com/s/ezpro","儿"),
      i("HE","一体(驱动更丝滑) 密码123","https://wwayq.lanzouq.com/s/he1","HE"),
      i("Kernel","K预判激活地址 需科学上网","https://kernel-front-end.vercel.app/","儿"),
      i("OS","足本专区资源","https://wwayq.lanzouq.com/s/outis","OS")
    ]),
    s("BGX专区","BGX专区","fa fa-xing-square",[]),
    s("天卡专区","天卡专区","fa fa-book",[
      i("Space","Space","https://wwayq.lanzouq.com/b00odtjzsf","S"),
      i("MD","天卡资源","https://wwbls.lanzouq.com/b0rbeyvra","MD"),
      i("LSC","天卡资源","https://wwbnl.lanzouw.com/b0mcskk9c","LSC"),
      i("KDA","天卡资源","http://49.235.141.222:1000","KDA"),
      i("acme","密码：8888","https://wwer.ysupan.com","A"),
      i("如意","如意","https://wwbuq.lanzouu.com/b00jf03wja","如"),
      i("DC","提取码：DC66","https://share.feijipan.com/s/xiark1VW?code=DC66","DC"),
      i("SPOT","密码：123","https://wwavz.lanzout.com/s/Spotyyds","SP"),
      i("SF","天卡资源","https://wwbuq.lanzouu.com/b00jfjslcb","SF")
    ]),
    s("周卡专区","周卡专区","fa fa-google-wallet",[
      i("LTY","密码：f4sv","https://wwauv.lanzout.com/b00yb1z1od","L"),
      i("TSL","密码：d5y7","https://wwauv.lanzn.com/b00ybc9xsj","TSL"),
      i("时光","密码：btqo","https://wwarw.lanzn.com/b00l2sy5gd","时"),
      i("TAB","密码：tab11","https://wwus.lanzouu.com/s/TAB1","TAB"),
      i("VK","提取码：1234","https://share.feijipan.com/s/TU6XC6Li?code=1234","VK"),
      i("SOL","下载地址","https://share.feijipan.com/s/CN55YlBQ","SOL"),
      i("TEST","密码：123","https://wwavz.lanzout.com/b00v08n3ah","TEST")
    ]),
    s("月卡专区","月卡专区","fa fa-delicious",[
      i("Noble","需要请联系微信客服，强烈推荐","https://install.noble.vin/","N",{"tooltip":"NS"}),
      i("spirit","无下载地址，版本联系上级代理获取","","S",{"displayOnly":true}),
      i("TOOL","TOOL","http://211.154.22.179:88/2","T"),
      i("LEI","LEI","http://211.154.22.179:88/3","L")
    ]),
    s("一体化区","一体化区","fa fa-y-combinator-square",[
      i("无心","无心一体走砍 密码：hhwn","https://wud.lanzoul.com/b00hq90ire","无"),
      i("NS","Noble 下载地址","https://download.noble.vin/","NS")
    ]),
    s("云顶专区","云顶专区","fa fa-trello",[
      i("鸡你太美","下棋助手，密码：888","https://wwaoj.lanzoul.com/s/ydjntm4","鸡"),
      i("神将","云顶资源","http://shenjiang.ysupan.com/login.aspx?d=shenjiang","神")
    ]),
    s("缓存专区","缓存专区","fa fa-viadeo-square",[
      i("US","US是适用于汉堡的 大锅菜 缝合怪 小助手，默认为你加载最人性化配置","https://gitee.com/xiazai888/xiazai/raw/master/xiazai","堡"),
      i("RS","RS是适用于EZ的 大锅菜 缝合怪 小助手，默认为你加载最人性化配置","https://gitee.com/xiazai888/xiazai/raw/master/xiazai","儿"),
      i("ST","提取码：1233","https://share.feijipan.com/s/o8aoNlnD?code=1233","ST"),
      i("无名","无名缓存","https://wwzd.lanzouu.com/b016kd079i","无"),
      i("无名VIP","无名VIP","https://wmsaves.top/","V"),
      i("FH","GG专用","https://funhouseteam.com/login/redeem.php","FH")
    ]),
    s("特权专区","特权专区","fa fa-yelp",[
      i("熊猫特权","使用后你在家也能享受网吧特权","https://wwv.lanzouh.com/b00mone1bc","熊")
    ]),
    s("过机器码专区","过机器码专区","fa fa-windows",[]),
    s("过炫舞专区","过炫舞专区","fa fa-music",[
      i("过炫舞","过炫舞教程/资源","https://www.yuque.com/u64769050/mi2tlv/ylsvoeyxy4gz7abn","炫")
    ]),
    s("小工具专区","小工具专区","fa fa-toolbox",[
      i("亨特","小工具","https://a.hoisen.com/d9YgFh","亨"),
      i("键盘侠","免费工具，一键输入账号密码","https://mybb.lanzn.com/illyB3p72wgb","键")
    ]),
    s("三角洲专区","三角洲专区","fa fa-crosshairs",[
      i("正版无双","正版无双最新下载地址，密码：6666","https://wwazv.lanzout.com/b0he1s4te","无"),
      i("战神","下载地址","https://yituoshi.lanzouw.com/b023nn2x3g","战"),
    ]),
    s("PUBG专区","PUBG专区","fa fa-gamepad",[
      i("绝影","PUBG资源","https://wwas.lanzouj.com/b00xq0uaf","绝"),
      i("轮回","PUBG资源","https://wwas.lanzouj.com/b00xziv7a","轮")
    ]),
    s("瓦洛兰特专区","瓦洛兰特专区","fa fa-bolt",[
      i("RK大瓦国","密码：0000","https://wwaly.lanzouq.com/b011m5h4gd","RK"),
      i("opus","官网下载地址，密码：6666","http://www.opus666.top/","O")
    ]),
    s("穿越火线专区","穿越火线专区","fa fa-bullseye",[
      i("谪仙红名生化","密码：6666","https://daguo6.lanzouw.com/b0mbewswf","谪"),
      i("天命","密码：6666","https://daguo6.lanzouw.com/b0mbewtqf","天"),
      i("北帝","密码：6666","https://daguo6.lanzouw.com/b0mbewu8d","北"),
      i("JZ","密码：6666","https://daguo6.lanzouw.com/b0mbewvlc","JZ"),
      i("BX","密码：6666","https://daguo6.lanzouw.com/b0mbewvta","BX"),
      i("BB","密码：6666","https://daguo6.lanzouw.com/b0mbewuwh","BB"),
      i("凤溪","密码：6666","https://daguo6.lanzouw.com/b0mcn84vg","凤")
    ]),
    s("躲猫猫专区","躲猫猫专区","fa fa-puzzle-piece",[
      i("MC","密码：123","https://wwbjv.lanzout.com/b00yb6nuwd","MC"),
      i("涂鸦躲猫猫","密码：6666","https://wwbhv.lanzoum.com/b01d713yof","涂"),
      i("达芬奇","密码：6666","https://wwbhv.lanzoum.com/b01d71e9kh","达")
    ]),
    s("上号专区","上号专区","fa fa-sign-in",[
      i("奥特曼租号","上号器下载地址，密码：6666","https://wwyq.lanzoui.com/b0zjywmud","奥"),
      i("方寸租号","上号器下载地址","https://wwi.lanzoue.com/b0a6jcuyh","方"),
      i("东鹏","密码：6666","https://wwwj.lanzouw.com/b00ro37qdc","东"),
      i("小天","WeGame 上号相关","https://jbh.lanzouu.com/s/WeGame","天")
    ])
    ]
  },
  en: {
    gameInfo: { version: '', updateDate: '', nextUpdateDate: '', feedbackEmail: 'xianyumht@gmail.com' },
    sections: [
    s("常用工具","Common Tools","fa-solid fa-star",[
      i("News & Announcements","News & Announcements","https://blog.xn--8pv109c.top/","News"),
      i("Game Resources","Game tools, account services, and official support","/down/games/","Game"),
      i("Raylink","Raylink - Ultra-smooth remote control software!","https://www.raylink.live/download.html","Remote",{"tooltip":"raylink"}),
      i("ToDesk","ToDesk remote assistance - Fast and convenient file transfer with speed limit","https://www.todesk.com/download.html","Remote",{"tooltip":"todesk"}),
      i("Runtime Components","Four-piece runtime components - Solve most runtime issues","https://pan-su.lanzoum.com/iRF2K0xbyv7c","Runtime"),
      i("DirectX Repair","DirectX repair - Solve most runtime issues","https://pan-su.lanzoum.com/iuec80xbywwd","DX",{"tooltip":"DirectX"}),
      i("Tool Box","Professional, targeted, self-developed cleaning tool with entertainment features","https://avgorange.lanzoub.com/b0dppnjpg","Clean",{"tooltip":"Cleaning Tool"}),
      i("Shadow Defender","Shadow Defender - Similar to internet cafe auto-restore on restart, eliminates residual effects, third-party software","https://pan-su.lanzoum.com/ih8H00xoy2ze","Shadow"),
      i("HanBot Database","Champion collection daily win rates and version win rate rankings","https://badspacebar.github.io/sdk/index.html#/","HanBot"),
      i("EZ Database","DS GS EZ resource library","https://champions.legendsen.se/","EZ"),
      i("Frank [Free & Open Source]","Free League of Legends assistant - Can replace WeGame, supports match history query","https://www.yuque.com/java-s/frank/introduction","Frank")
    ]),
    s("GS专区","GS Zone","fa fa-toggle-on",[
      i("EZ","Single-board EZ - Not stronger than bot! Password: 123","https://wwme.lanzouq.com/b00oco2z0j","EZ"),
      i("EZPro","EZ+FF integrated with built-in privileges - Password: 123","https://wwme.lanzouq.com/s/ezpro","EZ",{"tooltip":"ezpro"}),
      i("HE","EZ+FF integrated (smoother driver) - Password: 123","https://wwayq.lanzouq.com/s/he1","HE"),
      i("Kernel","K prediction activation address - Requires VPN","https://kernel-front-end.vercel.app/","Kernel")
    ]),
    s("BGX专区","BGX Zone","fa fa-xing-square",[]),
    s("天卡专区","Daily Card Zone","fa fa-book",[
      i("Space","Space","https://wwayq.lanzouq.com/b00odtjzsf","S"),
      i("MD","Daily-card resource","https://wwbls.lanzouq.com/b0rbeyvra","MD"),
      i("LSC","Daily-card resource","https://wwbnl.lanzouw.com/b0mcskk9c","LSC"),
      i("KDA","Daily-card resource","http://49.235.141.222:1000","KDA"),
      i("acme","Password: 8888","https://wwer.ysupan.com","A"),
      i("Ruyi","Ruyi","https://wwbuq.lanzouu.com/b00jf03wja","R"),
      i("DC","Code: DC66","https://share.feijipan.com/s/xiark1VW?code=DC66","DC"),
      i("SPOT","Password: 123","https://wwavz.lanzout.com/s/Spotyyds","SP"),
      i("SF","Daily-card resource","https://wwbuq.lanzouu.com/b00jfjslcb","SF")
    ]),
    s("周卡专区","Weekly Card Zone","fa fa-google-wallet",[
      i("LTY","Password: f4sv","https://wwauv.lanzout.com/b00yb1z1od","L"),
      i("Time","Password: btqo","https://wwarw.lanzn.com/b00l2sy5gd","T"),
      i("TAB","Password: tab11","https://wwus.lanzouu.com/s/TAB1","TAB"),
    ]),
    s("月卡专区","Monthly Card Zone","fa fa-delicious",[
      i("KS","KS with built-in hamburger, supports BGX - Registration open during holidays - Password: 112233","https://wwer.lanzouw.com/b00y9snm5i","K"),
      i("LEI","LEI integrated with ZPX - Registration open during holidays - Password: 112233","https://wwer.lanzouw.com/b00y9snmha","L")
    ]),
    s("一体化区","Integrated Zone","fa fa-y-combinator-square",[
      i("Wuxin","Wuxin integrated kiting - Password: hhwn","https://wud.lanzoul.com/b00hq90ire","Wuxin"),
      i("TE","TE foreign integrated","https://wwjv.lanzouv.com/b02z1mtkzg","T"),
      i("NB","Integrated NB - NB is just the name, not that it's awesome - Password: 123","https://wwsi.lanzouq.com/b00pzt0cng","N")
    ]),
    s("云顶专区","TFT Zone","fa fa-trello",[
      i("Ji Ni Tai Mei","TFT helper, password: 888","https://wwaoj.lanzoul.com/s/ydjntm4","J"),
      i("Shenjiang","TFT resource","http://shenjiang.ysupan.com/login.aspx?d=shenjiang","S")
    ]),
    s("缓存专区","Cache Zone","fa fa-viadeo-square",[
      i("US","HanBot helper preset","https://gitee.com/xiazai888/xiazai/raw/master/xiazai","H"),
      i("RS","EZ helper preset","https://gitee.com/xiazai888/xiazai/raw/master/xiazai","E"),
      i("ST","Code: 1233","https://share.feijipan.com/s/o8aoNlnD?code=1233","ST"),
      i("Wuming","Cache resource","https://wwzd.lanzouu.com/b016kd079i","W"),
      i("Wuming VIP","VIP cache resource","https://wmsaves.top/","V"),
      i("FH","For GG","https://funhouseteam.com/login/redeem.php","FH")
    ]),
    s("特权专区","Privilege Zone","fa fa-yelp",[
      i("Panda Privilege","Panda Privilege is an accelerator for machines without internet cafe privileges","https://wwv.lanzouh.com/b00mone1bc","Panda")
    ]),
    s("过机器码专区","HWID Bypass Zone","fa fa-windows",[]),
    s("小工具专区","Utilities","fa fa-toolbox",[
      i("Hunter","Utility","https://a.hoisen.com/d9YgFh","H"),
      i("Keyboard Warrior","Free tool for entering account credentials with one click","https://mybb.lanzn.com/illyB3p72wgb","K")
    ]),
    s("三角洲专区","Delta Force Zone","fa fa-crosshairs",[
      i("正版无双","Latest download, password: 6666","https://wwazv.lanzout.com/b0he1s4te","无"),
      i("战神","Download","https://yituoshi.lanzouw.com/b023nn2x3g","战"),
    ]),
    s("瓦洛兰特专区","VALORANT Zone","fa fa-bolt",[
      i("RK","Password: 0000","https://wwaly.lanzouq.com/b011m5h4gd","RK"),
      i("opus","Official download, password: 6666","http://www.opus666.top/","O")
    ]),
    s("穿越火线专区","CrossFire Zone","fa fa-bullseye",[
      i("Zhexian","Password: 6666","https://daguo6.lanzouw.com/b0mbewswf","Z"),
      i("Tianming","Password: 6666","https://daguo6.lanzouw.com/b0mbewtqf","T"),
      i("Beidi","Password: 6666","https://daguo6.lanzouw.com/b0mbewu8d","B"),
      i("JZ","Password: 6666","https://daguo6.lanzouw.com/b0mbewvlc","JZ"),
      i("BX","Password: 6666","https://daguo6.lanzouw.com/b0mbewvta","BX"),
      i("BB","Password: 6666","https://daguo6.lanzouw.com/b0mbewuwh","BB"),
      i("Fengxi","Password: 6666","https://daguo6.lanzouw.com/b0mcn84vg","F")
    ]),
    s("躲猫猫专区","Hide-and-Seek Zone","fa fa-puzzle-piece",[
      i("MC","Password: 123","https://wwbjv.lanzout.com/b00yb6nuwd","MC"),
      i("Graffiti Hide-and-Seek","Password: 6666","https://wwbhv.lanzoum.com/b01d713yof","G"),
      i("Da Vinci","Password: 6666","https://wwbhv.lanzoum.com/b01d71e9kh","D")
    ])
    ]
  }
};

export default navDataTranslations;
