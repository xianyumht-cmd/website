import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const distDir = path.resolve(__dirname, '../dist');
const srcPagesDir = path.join(distDir, 'src/pages');
const targetDownDir = path.join(distDir, 'down');

async function organizeDist() {
  if (!fs.existsSync(srcPagesDir)) {
    console.log('No src/pages directory found in dist. Skipping organization.');
    return;
  }

  // Create target down directory if it doesn't exist
  if (!fs.existsSync(targetDownDir)) {
    fs.mkdirSync(targetDownDir, { recursive: true });
  }

  // Move all directories from src/pages to down
  const pages = fs.readdirSync(srcPagesDir);
  for (const page of pages) {
    const srcPath = path.join(srcPagesDir, page);
    const destPath = path.join(targetDownDir, page);
    
    // If destination exists, remove it first (or merge, but remove is safer for clean build)
    if (fs.existsSync(destPath)) {
      fs.rmSync(destPath, { recursive: true, force: true });
    }
    
    fs.renameSync(srcPath, destPath);
    console.log(`Moved ${page} to down/${page}`);
  }

  // Cleanup src directory
  // We can try to remove dist/src/pages, dist/src if empty
  try {
    fs.rmdirSync(srcPagesDir);
    const srcDir = path.join(distDir, 'src');
    if (fs.readdirSync(srcDir).length === 0) {
      fs.rmdirSync(srcDir);
    }
  } catch (e) {
    console.log('Cleanup minor error (ignored):', e.message);
  }

  console.log('Dist organization complete.');
  
  // Copy anti-debug.js
  const antiDebugSrc = path.join(__dirname, '../shared/anti-debug.js');
  const antiDebugDest = path.join(distDir, 'anti-debug.js');
  if (fs.existsSync(antiDebugSrc)) {
    fs.copyFileSync(antiDebugSrc, antiDebugDest);
    console.log('Copied anti-debug.js to dist');
  } else {
    console.warn('Warning: shared/anti-debug.js not found');
  }
}

organizeDist().catch(err => {
  console.error('Error organizing dist:', err);
  process.exit(1);
});
