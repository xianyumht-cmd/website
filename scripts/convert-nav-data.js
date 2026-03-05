
const fs = require('fs');
const path = require('path');

const inputFile = path.join(__dirname, '../src/pages/nav/nav-data.min.js');
const outputFile = path.join(__dirname, '../public/data/nav-data.json');

try {
    let content = fs.readFileSync(inputFile, 'utf8');
    
    // Find the JSON object part
    const startIndex = content.indexOf('const navDataTranslations = {');
    if (startIndex === -1) throw new Error('Could not find navDataTranslations definition');
    
    // Extract the object part by matching braces (simple approach)
    // Since the file structure is known, we can look for the closing brace before the next variable
    // or just try to parse the block
    
    let objectStr = content.substring(startIndex + 'const navDataTranslations = '.length);
    // Find the end of the object declaration. It ends before 'const navData ='
    const endIndex = objectStr.indexOf('const navData =');
    if (endIndex !== -1) {
        objectStr = objectStr.substring(0, endIndex);
        // Trim back from the last semicolon
        objectStr = objectStr.trim();
        if (objectStr.endsWith(';')) objectStr = objectStr.slice(0, -1);
    }
    
    // The content is a JS object, not valid JSON (keys not quoted).
    // We need to evaluate it safely or use a regex replacer.
    // Given we trust the source file (local), eval is acceptable for build script.
    
    const data = eval('(' + objectStr + ')');
    
    // Extract 'zh' part and add sidebar_footer
    const jsonData = data.zh;
    
    // Add sidebar_footer configuration
    jsonData.sidebar_footer = [
        {
            "id": "game_resources",
            "title": "游戏资源",
            "icon": "fa-solid fa-gamepad",
            "url": "/down/games/index.html",
            "tooltip": "游戏资源"
        },
        {
            "id": "about_us",
            "title": "关于本站",
            "icon": "fa-solid fa-circle-info",
            "url": "/about.html",
            "tooltip": "关于本站",
            "separator": true
        }
    ];

    fs.writeFileSync(outputFile, JSON.stringify(jsonData, null, 2));
    console.log('Successfully converted nav-data.min.js to public/data/nav-data.json');
    
} catch (err) {
    console.error('Error converting nav data:', err);
}
