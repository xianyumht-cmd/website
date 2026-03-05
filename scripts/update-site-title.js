
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG_FILE = path.join(__dirname, '../public/data/site-config.json');
const API_KEY = process.env.YIYAN_API_KEY || '014f07c51dc640ae4b9755a1c0714411'; // Fallback to provided key for local dev
const API_URL = `http://api.cc1990.cc/api/yiyan?apiKey=${API_KEY}`;

async function updateSiteTitle() {
    try {
        console.log('Fetching random Yiyan...');
        const response = await axios.get(API_URL);
        
        // API response structure check
        // Assuming response.data is the text or has a property for text.
        // Based on common "yiyan" APIs, it might return a JSON with { text: "..." } or just string.
        // Let's inspect the response in log first if needed, but for now assume standard structure.
        // The user provided prompt implies it returns "random yiyan".
        // Let's assume it returns JSON: { "code": 200, "msg": "success", "data": "..." } or just the text directly?
        // Let's handle generic JSON response.
        
        const data = response.data;
        // console.log('API Response:', JSON.stringify(data)); // Removed full log to avoid clutter

        let yiyanText = '';
        if (typeof data === 'string') {
            yiyanText = data;
        } else if (data.text) {
            yiyanText = data.text;
        } else if (data.hitokoto) {
            yiyanText = data.hitokoto;
        } else if (data.data) {
             // Some APIs wrap in data
             // Check if data is array of objects with title/text? Or simple string
             // API doc says "每次调用获取一个随机一言"
             if (Array.isArray(data.data) && data.data.length > 0) {
                 yiyanText = data.data[0].text || data.data[0].title || JSON.stringify(data.data[0]);
             } else {
                 yiyanText = typeof data.data === 'string' ? data.data : JSON.stringify(data.data);
             }
        } else {
             // Fallback if structure is unknown
             yiyanText = JSON.stringify(data);
        }

        // Clean up quotes if stringified JSON
        if (yiyanText.startsWith('"') && yiyanText.endsWith('"')) {
            yiyanText = yiyanText.slice(1, -1);
        }

        if (!yiyanText || yiyanText === '{}' || yiyanText === '[]') {
            console.error('Failed to extract valid text from API response');
            console.log('Raw Data:', JSON.stringify(data));
            return;
        }
        
        console.log(`New Title Candidate: ${yiyanText}`);

        // Read existing config
        if (!fs.existsSync(CONFIG_FILE)) {
            console.error(`Config file not found: ${CONFIG_FILE}`);
            process.exit(1);
        }

        const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));

        // Update title
        config.site_title.zh = yiyanText;
        // config.site_title.en = yiyanText; // Optional: set EN same as ZH for now

        // Write back
        fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
        console.log(`Updated site-config.json with new title: "${yiyanText}"`);

    } catch (error) {
        console.error('Error updating site title:', error.message);
        process.exit(1);
    }
}

updateSiteTitle();
