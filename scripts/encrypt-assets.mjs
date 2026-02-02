import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');
const TARGET_HTML = path.join(DIST_DIR, 'index.html');

// 1. Generate Key (32 bytes for AES-256)
const FULL_KEY = crypto.randomBytes(32);

// 2. Split Key into 3 parts (using XOR sharing or simple splitting)
// Simple splitting for demonstration: 10 + 11 + 11 bytes
// XOR sharing is better: K = A ^ B ^ C. A, B are random, C = K ^ A ^ B.
const PartA = crypto.randomBytes(32);
const PartB = crypto.randomBytes(32);
const PartC = Buffer.alloc(32);
for (let i = 0; i < 32; i++) {
    PartC[i] = FULL_KEY[i] ^ PartA[i] ^ PartB[i];
}

console.log('Keys generated.');

// 3. Encrypt HTML
if (fs.existsSync(TARGET_HTML)) {
    const htmlContent = fs.readFileSync(TARGET_HTML, 'utf8');
    const iv = crypto.randomBytes(12); // GCM standard IV size
    const cipher = crypto.createCipheriv('aes-256-gcm', FULL_KEY, iv);
    
    let encrypted = cipher.update(htmlContent, 'utf8', 'base64');
    encrypted += cipher.final('base64');
    const authTag = cipher.getAuthTag().toString('base64');
    
    // 4. Create Loader HTML
    const ivStr = iv.toString('base64');
    const loaderHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Loading...</title>
    <style>
        :root { --k-part-a: "${PartA.toString('base64')}"; }
        body { background: #000; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
    </style>
</head>
<body>
    <div id="loader">Initializing Secure Environment...</div>
    <img id="k-img" src="assets/key-carrier.png" style="display:none;" />
    <script>
        window.ENCRYPTED_DATA = "${encrypted}";
        window.AUTH_TAG = "${authTag}";
        window.IV = "${ivStr}";
    </script>
    <script src="assets/security-loader.js"></script>
</body>
</html>`;

    fs.writeFileSync(TARGET_HTML, loaderHTML);
    console.log('HTML Encrypted and replaced with Loader.');

    // 5. Inject Key Parts
    
    // Part A: Injected into CSS Variable in loaderHTML (Done above)
    
    // Part B: Append to Image
    // Ensure assets dir exists
    const assetsDir = path.join(DIST_DIR, 'assets');
    if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });
    
    // Create a dummy PNG (1x1 transparent pixel)
    const pngHeader = Buffer.from('89504E470D0A1A0A0000000D49484452000000010000000108060000001F15C4890000000A49444154789C63000100000500010D0A2D340000000049454E44AE426082', 'hex');
    const carrierImgPath = path.join(assetsDir, 'key-carrier.png');
    // Append PartB to the end
    const imgBuffer = Buffer.concat([pngHeader, PartB]);
    fs.writeFileSync(carrierImgPath, imgBuffer);
    console.log('Key Part B injected into image.');

    // Part C: Inject into Service Worker
    const swPath = path.join(DIST_DIR, 'sw.js');
    const swContent = `
const KEY_PART_C = "${PartC.toString('base64')}";
self.addEventListener('install', (event) => {
    self.skipWaiting();
});
self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'GET_KEY') {
        event.ports[0].postMessage({ key: KEY_PART_C });
    }
});
`;
    fs.writeFileSync(swPath, swContent);
    console.log('Key Part C injected into Service Worker.');

    // 6. Copy Security Loader (We need to create this source file first, but for build script, we assume it's copied or we write it here)
    // For simplicity, I'll write the security loader source here to a file in dist/assets
    const loaderScript = `
async function decrypt() {
    try {
        // 1. Get Part A (CSS)
        const partAStr = getComputedStyle(document.documentElement).getPropertyValue('--k-part-a').replace(/"/g, '').trim();
        
        // 2. Get Part B (Image)
        const img = document.getElementById('k-img');
        const imgBlob = await fetch(img.src).then(r => r.blob());
        const imgBuf = await imgBlob.arrayBuffer();
        // Assume last 32 bytes are the key (simple steganography)
        const partBBuf = imgBuf.slice(imgBuf.byteLength - 32);
        
        // 3. Get Part C (Service Worker)
        if ('serviceWorker' in navigator) {
            const reg = await navigator.serviceWorker.register('/sw.js');
            await navigator.serviceWorker.ready;
            
            const partCStr = await new Promise((resolve) => {
                const channel = new MessageChannel();
                channel.port1.onmessage = (event) => resolve(event.data.key);
                if (navigator.serviceWorker.controller) {
                    navigator.serviceWorker.controller.postMessage({ type: 'GET_KEY' }, [channel.port2]);
                } else {
                    // Fallback or wait for controller
                    // For demo, we might fail here if not controlled immediately
                     // Force claim in SW fixes this usually, but might need reload
                     resolve(null); 
                }
            });
            
            if (!partCStr) {
                // If SW not ready (first load), we might need to reload or handle it.
                // For this demo, we assume SW claims clients immediately.
                if (!navigator.serviceWorker.controller) {
                     window.location.reload();
                     return;
                }
            }

            // Combine Keys
            const toUint8 = (str) => Uint8Array.from(atob(str), c => c.charCodeAt(0));
            const partA = toUint8(partAStr);
            const partB = new Uint8Array(partBBuf);
            const partC = toUint8(partCStr);
            
            const fullKey = new Uint8Array(32);
            for(let i=0; i<32; i++) {
                fullKey[i] = partA[i] ^ partB[i] ^ partC[i];
            }
            
            // Decrypt
            const key = await window.crypto.subtle.importKey(
                "raw", fullKey, { name: "AES-GCM" }, false, ["decrypt"]
            );
            
            const encryptedData = toUint8(window.ENCRYPTED_DATA);
            const iv = toUint8(window.IV);
            // Auth tag is usually appended in some libs, but Node's crypto.createCipheriv handles it separately. 
            // Web Crypto expects tag appended to ciphertext.
            // Node's 'encrypted' variable in our script above was just update() + final().
            // We stored AUTH_TAG separately. We need to concat them for Web Crypto.
            const authTag = toUint8(window.AUTH_TAG);
            const combined = new Uint8Array(encryptedData.length + authTag.length);
            combined.set(encryptedData);
            combined.set(authTag, encryptedData.length);
            
            const decryptedBuf = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: iv },
                key,
                combined
            );
            
            const decoder = new TextDecoder();
            const html = decoder.decode(decryptedBuf);
            
            document.open();
            document.write(html);
            document.close();
        }
    } catch (e) {
        console.error('Decryption failed', e);
        document.body.innerHTML = 'Access Denied';
    }
}
decrypt();
`;
    fs.writeFileSync(path.join(assetsDir, 'security-loader.js'), loaderScript);
    console.log('Security Loader written.');

} else {
    console.error('Target HTML not found:', TARGET_HTML);
}
