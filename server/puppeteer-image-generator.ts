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
  console.log('[Puppeteer] Generating verse share image...');
  
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
    
    const imageBuffer = await page.evaluate(async () => {
      const shareCardElement = document.querySelector('[data-share-card="verse"]') as HTMLElement;
      if (!shareCardElement) {
        throw new Error('Share card element not found');
      }
      
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
        throw new Error('html2canvas not available');
      }
      
      const cardWidth = 1080;
      const cardHeight = 1920;
      
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.cssText = `
        position: fixed;
        left: -10000px;
        top: 0;
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        background: transparent;
        padding: 0;
        margin: 0;
        overflow: hidden;
      `;
      document.body.appendChild(offscreenContainer);
      
      const clonedCard = shareCardElement.cloneNode(true) as HTMLElement;
      clonedCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        overflow: hidden;
        background: transparent;
        margin: 0;
        padding: 0;
      `;
      
      offscreenContainer.appendChild(clonedCard);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(clonedCard, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        width: cardWidth,
        height: cardHeight,
      });
      
      document.body.removeChild(offscreenContainer);
      
      return canvas.toDataURL('image/jpeg', 0.95);
    });
    
    const base64Data = imageBuffer.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`[Puppeteer] Verse image generated: ${buffer.length} bytes`);
    return buffer;
    
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
    
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector('[data-testid="button-share-reflection"]', { timeout: 10000 });
    
    await page.click('[data-testid="button-share-reflection"]');
    
    await page.waitForSelector('[data-testid="dialog-share-reflection"]', { timeout: 5000 });
    
    const imageBuffer = await page.evaluate(async () => {
      const shareCardElement = document.querySelector('[data-share-card="reflection"]') as HTMLElement;
      if (!shareCardElement) {
        throw new Error('Share card element not found');
      }
      
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
        throw new Error('html2canvas not available');
      }
      
      const cardWidth = 1080;
      const cardHeight = 1920;
      
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.cssText = `
        position: fixed;
        left: -10000px;
        top: 0;
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        background: transparent;
        padding: 0;
        margin: 0;
        overflow: hidden;
      `;
      document.body.appendChild(offscreenContainer);
      
      const clonedCard = shareCardElement.cloneNode(true) as HTMLElement;
      clonedCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        overflow: hidden;
        background: transparent;
        margin: 0;
        padding: 0;
      `;
      
      offscreenContainer.appendChild(clonedCard);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(clonedCard, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        width: cardWidth,
        height: cardHeight,
      });
      
      document.body.removeChild(offscreenContainer);
      
      return canvas.toDataURL('image/jpeg', 0.95);
    });
    
    const base64Data = imageBuffer.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`[Puppeteer] Reflection image generated: ${buffer.length} bytes`);
    return buffer;
    
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
    const url = `${baseUrl}/admin/marketing/aniversarios?capture=${memberId}`;
    
    console.log(`[Puppeteer] Navigating to ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    await page.waitForSelector(`[data-testid="button-share-birthday-${memberId}"]`, { timeout: 10000 });
    
    await page.click(`[data-testid="button-share-birthday-${memberId}"]`);
    
    await page.waitForSelector('[data-testid="dialog-share-birthday"]', { timeout: 5000 });
    
    const imageBuffer = await page.evaluate(async () => {
      const shareCardElement = document.querySelector('[data-share-card="birthday"]') as HTMLElement;
      if (!shareCardElement) {
        throw new Error('Share card element not found');
      }
      
      const html2canvas = (window as any).html2canvas;
      if (!html2canvas) {
        throw new Error('html2canvas not available');
      }
      
      const cardWidth = 2160;
      const cardHeight = 3840;
      
      const offscreenContainer = document.createElement('div');
      offscreenContainer.style.cssText = `
        position: fixed;
        left: -10000px;
        top: 0;
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        background: transparent;
        padding: 0;
        margin: 0;
        overflow: hidden;
      `;
      document.body.appendChild(offscreenContainer);
      
      const clonedCard = shareCardElement.cloneNode(true) as HTMLElement;
      clonedCard.style.cssText = `
        width: ${cardWidth}px;
        height: ${cardHeight}px;
        overflow: hidden;
        background: transparent;
        margin: 0;
        padding: 0;
      `;
      
      const scaleFactor = 8;
      const textElements = clonedCard.querySelectorAll('p, span');
      textElements.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const currentSize = parseFloat(htmlEl.style.fontSize);
        if (!isNaN(currentSize) && currentSize > 0) {
          const pxSize = Math.round(currentSize * 16 * scaleFactor);
          htmlEl.style.fontSize = `${pxSize}px`;
        }
      });

      const memberPhoto = clonedCard.querySelector('img[data-member-photo]') as HTMLImageElement;
      if (memberPhoto) {
        memberPhoto.style.width = '1404px';
        memberPhoto.style.height = '1404px';
      }
      
      const placeholderDiv = clonedCard.querySelector('div[style*="backgroundColor"]') as HTMLElement;
      if (placeholderDiv) {
        placeholderDiv.style.width = '1404px';
        placeholderDiv.style.height = '1404px';
      }
      
      const nameElement = clonedCard.querySelector('p') as HTMLElement;
      if (nameElement) {
        nameElement.style.bottom = '29.3%';
      }
      
      offscreenContainer.appendChild(clonedCard);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(clonedCard, {
        scale: 1,
        useCORS: true,
        allowTaint: false,
        backgroundColor: null,
        logging: false,
        width: cardWidth,
        height: cardHeight,
      });
      
      document.body.removeChild(offscreenContainer);
      
      return canvas.toDataURL('image/jpeg', 0.95);
    });
    
    const base64Data = imageBuffer.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    console.log(`[Puppeteer] Birthday image generated: ${buffer.length} bytes`);
    return buffer;
    
  } finally {
    await page.close();
  }
}

export { closeBrowser };
