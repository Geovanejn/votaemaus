const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.join(__dirname, '../client/public');

const LARGE_IMAGES = [
  'logo-animated.webp',
  'CARD_ÉPICO_1766929050040.png',
  'CARD_LENDÁRIO_1766929050060.png',
  'CARD_RARO_1766929049996.png',
  'CARD_COMUM_1766929049960.png',
];

const MAX_WIDTH = 1200;
const QUALITY = 80;

async function optimizeImage(filename) {
  const filepath = path.join(PUBLIC_DIR, filename);
  
  if (!fs.existsSync(filepath)) {
    console.log(`[SKIP] ${filename} - not found`);
    return;
  }
  
  const stats = fs.statSync(filepath);
  const originalSize = stats.size;
  const originalSizeKB = (originalSize / 1024).toFixed(1);
  
  try {
    const image = sharp(filepath);
    const metadata = await image.metadata();
    
    console.log(`[PROCESSING] ${filename}`);
    console.log(`  Original: ${originalSizeKB} KB, ${metadata.width}x${metadata.height}`);
    
    const ext = path.extname(filename).toLowerCase();
    const tempPath = filepath + '.tmp';
    
    let pipeline = image;
    
    if (metadata.width > MAX_WIDTH) {
      pipeline = pipeline.resize(MAX_WIDTH, null, { withoutEnlargement: true });
    }
    
    if (ext === '.webp') {
      await pipeline.webp({ quality: QUALITY }).toFile(tempPath);
    } else if (ext === '.png') {
      await pipeline.png({ quality: QUALITY, compressionLevel: 9 }).toFile(tempPath);
    } else if (ext === '.jpg' || ext === '.jpeg') {
      await pipeline.jpeg({ quality: QUALITY }).toFile(tempPath);
    }
    
    fs.renameSync(tempPath, filepath);
    
    const newStats = fs.statSync(filepath);
    const newSizeKB = (newStats.size / 1024).toFixed(1);
    const reduction = ((1 - newStats.size / originalSize) * 100).toFixed(1);
    
    console.log(`  Optimized: ${newSizeKB} KB (-${reduction}%)`);
    
  } catch (err) {
    console.error(`[ERROR] ${filename}: ${err.message}`);
  }
}

async function main() {
  console.log('=== Image Optimization Script ===\n');
  
  for (const filename of LARGE_IMAGES) {
    await optimizeImage(filename);
    console.log('');
  }
  
  console.log('=== Optimization Complete ===');
}

main().catch(console.error);
