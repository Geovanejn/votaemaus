import puppeteer, { Browser, Page } from 'puppeteer';

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

async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

function getBaseUrl(): string {
  const port = process.env.PORT || 5000;
  return process.env.REPLIT_DEV_DOMAIN 
    ? `https://${process.env.REPLIT_DEV_DOMAIN}`
    : `http://localhost:${port}`;
}

export async function generateVerseShareImage(): Promise<Buffer> {
  console.log('[Puppeteer] Generating verse share image (same as WhatsApp button)...');
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/versiculo-do-dia`;
    
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector('[data-testid="button-share-verse"]', { timeout: 10000 });
    
    await page.click('[data-testid="button-share-verse"]');
    
    await page.waitForSelector('[data-testid="dialog-share-verse"]', { timeout: 5000 });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const imageDataUrl = await page.evaluate(async () => {
      const whatsappButton = document.querySelector('[data-testid="button-share-whatsapp"]') as HTMLButtonElement;
      if (!whatsappButton) {
        throw new Error('WhatsApp button not found');
      }
      
      return new Promise<string>((resolve, reject) => {
        const originalNavigator = navigator.share;
        let capturedDataUrl: string | null = null;
        
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
          const canvas = this;
          capturedDataUrl = canvas.toDataURL('image/png', 1.0);
          originalToBlob.call(this, callback, type, quality);
        };
        
        const checkInterval = setInterval(() => {
          if (capturedDataUrl) {
            clearInterval(checkInterval);
            HTMLCanvasElement.prototype.toBlob = originalToBlob;
            resolve(capturedDataUrl);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          HTMLCanvasElement.prototype.toBlob = originalToBlob;
          reject(new Error('Timeout waiting for image generation'));
        }, 15000);
        
        whatsappButton.click();
      });
    });
    
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`[Puppeteer] Verse PNG image generated: ${buffer.length} bytes (2160x3840)`);
    return buffer;
    
  } finally {
    await page.close();
  }
}

export async function generateReflectionShareImage(): Promise<Buffer> {
  console.log('[Puppeteer] Generating reflection share image (same as WhatsApp button)...');
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/versiculo-do-dia`;
    
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector('[data-testid="button-share-reflection"]', { timeout: 10000 });
    
    await page.click('[data-testid="button-share-reflection"]');
    
    await page.waitForSelector('[data-testid="dialog-share-reflection"]', { timeout: 5000 });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const imageDataUrl = await page.evaluate(async () => {
      const whatsappButton = document.querySelector('[data-testid="button-share-reflection-whatsapp"]') as HTMLButtonElement;
      if (!whatsappButton) {
        throw new Error('WhatsApp button not found');
      }
      
      return new Promise<string>((resolve, reject) => {
        let capturedDataUrl: string | null = null;
        
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
          const canvas = this;
          capturedDataUrl = canvas.toDataURL('image/png', 1.0);
          originalToBlob.call(this, callback, type, quality);
        };
        
        const checkInterval = setInterval(() => {
          if (capturedDataUrl) {
            clearInterval(checkInterval);
            HTMLCanvasElement.prototype.toBlob = originalToBlob;
            resolve(capturedDataUrl);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          HTMLCanvasElement.prototype.toBlob = originalToBlob;
          reject(new Error('Timeout waiting for image generation'));
        }, 15000);
        
        whatsappButton.click();
      });
    });
    
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`[Puppeteer] Reflection PNG image generated: ${buffer.length} bytes (2160x3840)`);
    return buffer;
    
  } finally {
    await page.close();
  }
}

export async function generateBirthdayShareImage(memberId: number): Promise<Buffer> {
  console.log(`[Puppeteer] Generating birthday share image for member ${memberId} (same as WhatsApp button)...`);
  
  const browser = await getBrowser();
  const page = await browser.newPage();
  
  try {
    await page.setViewport({ width: 1920, height: 1080 });
    
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}/admin/marketing/aniversarios?capture=${memberId}`;
    
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector(`[data-testid="button-share-birthday-${memberId}"]`, { timeout: 10000 });
    
    await page.click(`[data-testid="button-share-birthday-${memberId}"]`);
    
    await page.waitForSelector('[data-testid="dialog-share-birthday"]', { timeout: 5000 });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const imageDataUrl = await page.evaluate(async () => {
      const whatsappButton = document.querySelector('[data-testid="button-share-whatsapp"]') as HTMLButtonElement;
      if (!whatsappButton) {
        throw new Error('WhatsApp button not found');
      }
      
      return new Promise<string>((resolve, reject) => {
        let capturedDataUrl: string | null = null;
        
        const originalToBlob = HTMLCanvasElement.prototype.toBlob;
        HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
          const canvas = this;
          capturedDataUrl = canvas.toDataURL('image/png', 1.0);
          originalToBlob.call(this, callback, type, quality);
        };
        
        const checkInterval = setInterval(() => {
          if (capturedDataUrl) {
            clearInterval(checkInterval);
            HTMLCanvasElement.prototype.toBlob = originalToBlob;
            resolve(capturedDataUrl);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkInterval);
          HTMLCanvasElement.prototype.toBlob = originalToBlob;
          reject(new Error('Timeout waiting for image generation'));
        }, 15000);
        
        whatsappButton.click();
      });
    });
    
    const base64Data = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`[Puppeteer] Birthday PNG image generated: ${buffer.length} bytes (2160x3840)`);
    return buffer;
    
  } finally {
    await page.close();
  }
}

export { closeBrowser };
