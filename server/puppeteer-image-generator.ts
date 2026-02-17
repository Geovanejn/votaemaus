import puppeteer, { Browser, Page } from 'puppeteer';
import sharp from 'sharp'; // Importação necessária para o fix das bordas

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.connected) {
    console.log('[Puppeteer] Launching browser...');
    const executablePath = process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
    
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-web-security',
        '--allow-file-access-from-files',
        '--single-process',
      ],
    });
  }
  return browserInstance;
}

async function processImageBuffer(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .flatten({ background: '#000000' })
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function generateVerseShareImage(): Promise<Buffer> {
  console.log('[Puppeteer] Generating verse share image...');
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/versiculo-do-dia`;
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForSelector('[data-testid="button-share-verse"]', { timeout: 30000 });
    await page.click('[data-testid="button-share-verse"]');
    await page.waitForSelector('[data-testid="dialog-share-verse"]', { timeout: 30000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const imageDataUrl = await page.evaluate(async () => {
      const whatsappButton = document.querySelector('[data-testid="button-share-whatsapp"]') as HTMLButtonElement;
      return new Promise<string>((resolve, reject) => {
        let capturedDataUrl: string | null = null;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
          capturedDataUrl = this.toDataURL('image/png', 1.0);
          originalToBlob.call(this, callback, type, quality);
        };
        const checkInterval = setInterval(() => {
          if (capturedDataUrl) {
            clearInterval(checkInterval);
            HTMLCanvasElement.prototype.toBlob = originalToBlob;
            resolve(capturedDataUrl);
          }
        }, 100);
        setTimeout(() => { clearInterval(checkInterval); reject(new Error('Timeout')); }, 20000);
        whatsappButton.click();
      });
    });
    
    const rawBuffer = Buffer.from(imageDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    return await processImageBuffer(rawBuffer);
    
  } finally {
    await page.close();
  }
}

export async function generateReflectionShareImage(): Promise<Buffer> {
  console.log('[Puppeteer] Generating reflection share image...');
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/versiculo-do-dia`;
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForSelector('[data-testid="button-share-reflection"]', { timeout: 30000 });
    await page.click('[data-testid="button-share-reflection"]');
    await page.waitForSelector('[data-testid="dialog-share-reflection"]', { timeout: 30000 });
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const imageDataUrl = await page.evaluate(async () => {
      const whatsappButton = document.querySelector('[data-testid="button-share-reflection-whatsapp"]') as HTMLButtonElement;
      return new Promise<string>((resolve, reject) => {
        let capturedDataUrl: string | null = null;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
          capturedDataUrl = this.toDataURL('image/png', 1.0);
          originalToBlob.call(this, callback, type, quality);
        };
        const checkInterval = setInterval(() => {
          if (capturedDataUrl) {
            clearInterval(checkInterval);
            HTMLCanvasElement.prototype.toBlob = originalToBlob;
            resolve(capturedDataUrl);
          }
        }, 100);
        setTimeout(() => { clearInterval(checkInterval); reject(new Error('Timeout')); }, 20000);
        whatsappButton.click();
      });
    });
    
    const rawBuffer = Buffer.from(imageDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    return await processImageBuffer(rawBuffer);
    
  } finally {
    await page.close();
  }
}

export async function generateBirthdayShareImage(memberId: number): Promise<Buffer> {
  console.log(`[Puppeteer] Generating birthday share image for member ${memberId}...`);
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/aniversario/${memberId}`;
    
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    await page.waitForSelector('[data-testid="dialog-share-birthday"]', { timeout: 30000 });
    
    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        const images = document.querySelectorAll('[data-testid="dialog-share-birthday"] img');
        if (images.length === 0) { resolve(); return; }
        let loaded = 0;
        const total = images.length;
        const checkDone = () => { if (++loaded >= total) resolve(); };
        images.forEach(img => {
          const imgEl = img as HTMLImageElement;
          if (imgEl.complete && imgEl.naturalWidth > 0) { checkDone(); }
          else {
            imgEl.addEventListener('load', checkDone, { once: true });
            imgEl.addEventListener('error', checkDone, { once: true });
          }
        });
        setTimeout(resolve, 10000);
      });
    });
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const imageDataUrl = await page.evaluate(async () => {
      const whatsappButton = document.querySelector('[data-testid="button-share-whatsapp"]') as HTMLButtonElement;
      return new Promise<string>((resolve, reject) => {
        let capturedDataUrl: string | null = null;
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
          capturedDataUrl = this.toDataURL('image/png', 1.0);
          originalToBlob.call(this, callback, type, quality);
        };
        const checkInterval = setInterval(() => {
          if (capturedDataUrl) {
            clearInterval(checkInterval);
            HTMLCanvasElement.prototype.toBlob = originalToBlob;
            resolve(capturedDataUrl);
          }
        }, 100);
        setTimeout(() => { clearInterval(checkInterval); reject(new Error('Timeout')); }, 20000);
        whatsappButton.click();
      });
    });
    
    const rawBuffer = Buffer.from(imageDataUrl.replace(/^data:image\/\w+;base64,/, ''), 'base64');
    return await processImageBuffer(rawBuffer);
    
  } finally {
    await page.close();
  }
}

function getBaseUrl(): string {
  const port = process.env.PORT || 5000;
  return process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : `http://localhost:${port}`;
}

export { closeBrowser };
