const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.log('[DEBUG]', ...args);
    }
  },
  
  info: (...args: unknown[]) => {
    console.log('[INFO]', ...args);
  },
  
  warn: (...args: unknown[]) => {
    console.warn('[WARN]', ...args);
  },
  
  error: (...args: unknown[]) => {
    console.error('[ERROR]', ...args);
  },
  
  log: (...args: unknown[]) => {
    console.log(...args);
  }
};

export default logger;
