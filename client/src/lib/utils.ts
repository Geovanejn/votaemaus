import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function parseTipTapContent(content: string | undefined | null): string {
  if (!content) return '';
  
  if (!content.trim().startsWith('{')) {
    return content;
  }
  
  try {
    const parsed = JSON.parse(content);
    
    if (parsed.type === 'doc' && Array.isArray(parsed.content)) {
      return extractTextFromTipTap(parsed.content);
    }
    
    return content;
  } catch {
    return content;
  }
}

function extractTextFromTipTap(nodes: any[]): string {
  const texts: string[] = [];
  
  for (const node of nodes) {
    if (node.type === 'text' && node.text) {
      texts.push(node.text);
    } else if (node.type === 'paragraph' && Array.isArray(node.content)) {
      const paragraphText = extractTextFromTipTap(node.content);
      if (paragraphText) texts.push(paragraphText);
    } else if (node.type === 'heading' && Array.isArray(node.content)) {
      const headingText = extractTextFromTipTap(node.content);
      if (headingText) texts.push(headingText);
    } else if (Array.isArray(node.content)) {
      const nestedText = extractTextFromTipTap(node.content);
      if (nestedText) texts.push(nestedText);
    }
  }
  
  return texts.join('\n\n');
}
