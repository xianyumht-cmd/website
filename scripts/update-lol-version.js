
const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../public/data/lol-version.json');
const API_URL = 'http://api.cc1990.cc/api/hotlist/game?apiKey=c033062b21c8949eb35ff623a03b7df5&type=lol';

// Helper to calculate next update date (+14 days)
function getNextUpdate(dateStr) {
    const date = new Date(dateStr);
    date.setDate(date.getDate() + 14);
    return date.toISOString().split('T')[0];
}

async function fetchVersion() {
    try {
        console.log('Fetching API...');
        const response = await axios.get(API_URL);
        const data = response.data;

        if (!data || !data.data || !Array.isArray(data.data)) {
            console.error('Invalid API response format');
            return;
        }

        let foundVersion = null;
        let foundDate = null;

        // Keywords to look for
        const keywords = ['版本更新公告', '版本更新', '版本公告'];
        const versionRegex = /(\d+\.\d+)/; // e.g., 14.5, 16.1

        for (const item of data.data) {
            const title = item.title;
            // Check if title contains keywords
            const isMatch = keywords.some(k => title.includes(k));

            if (isMatch) {
                console.log(`Checking candidate: ${title}`);
                
                // 1. Try to extract version from title
                const versionMatch = title.match(versionRegex);
                if (versionMatch) {
                    foundVersion = versionMatch[1];
                    console.log(`Found version in title: ${foundVersion}`);
                } else {
                    // 2. If not in title, fetch detail page
                    if (item.url) {
                        console.log(`Fetching detail page: ${item.url}`);
                        try {
                            const detailRes = await axios.get(item.url);
                            const $ = cheerio.load(detailRes.data);
                            
                            // Strategies to find version in content
                            // a. Check <title>
                            const pageTitle = $('title').text();
                            const vMatchTitle = pageTitle.match(versionRegex);
                            
                            // b. Check <h1>
                            const h1 = $('h1').text();
                            const vMatchH1 = h1.match(versionRegex);
                            
                            // c. Check content (first 500 chars)
                            const content = $('body').text().substring(0, 500);
                            const vMatchContent = content.match(versionRegex);

                            if (vMatchTitle) {
                                foundVersion = vMatchTitle[1];
                            } else if (vMatchH1) {
                                foundVersion = vMatchH1[1];
                            } else if (vMatchContent) {
                                foundVersion = vMatchContent[1];
                            }
                            
                            if (foundVersion) {
                                console.log(`Found version in content: ${foundVersion}`);
                            }
                        } catch (err) {
                            console.error(`Error fetching detail page: ${err.message}`);
                        }
                    }
                }

                // 3. Extract Date
                // Try to extract date from title (e.g., "3月5日")
                const dateMatch = title.match(/(\d+)月(\d+)日/);
                let year = new Date().getFullYear();
                if (item.time) {
                    year = new Date(item.time).getFullYear();
                }

                if (dateMatch) {
                    const month = dateMatch[1].padStart(2, '0');
                    const day = dateMatch[2].padStart(2, '0');
                    foundDate = `${year}-${month}-${day}`;
                    console.log(`Extracted date from title: ${foundDate}`);
                } else if (item.time) {
                    foundDate = item.time.split(' ')[0];
                    console.log(`Using API time: ${foundDate}`);
                }

                // If we found both version and date, we are done
                if (foundVersion && foundDate) {
                    break; 
                }
            }
        }

        if (foundVersion && foundDate) {
            const nextUpdate = getNextUpdate(foundDate);
            const newData = {
                version: foundVersion,
                update: foundDate,
                next: nextUpdate
            };

            console.log('Final Data:', newData);

            // Ensure directory exists
            const dir = path.dirname(DATA_FILE);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }

            fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2));
            console.log(`Updated ${DATA_FILE}`);
        } else {
            console.log('No valid version info found.');
        }

    } catch (error) {
        console.error('Script Error:', error.message);
        process.exit(1);
    }
}

fetchVersion();
