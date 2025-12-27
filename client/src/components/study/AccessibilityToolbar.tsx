import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Type, Volume2, VolumeX, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface AccessibilityToolbarProps {
  textContent: string;
  className?: string;
}

const FONT_SIZE_KEY = "deo_glory_font_size";
const DEFAULT_FONT_SIZE = 16;
const MIN_FONT_SIZE = 12;
const MAX_FONT_SIZE = 24;
const FONT_SIZE_STEP = 2;

const isBrowser = typeof window !== "undefined";
const hasSpeechSynthesis = isBrowser && "speechSynthesis" in window;

function getStoredFontSize(): number {
  if (!isBrowser) return DEFAULT_FONT_SIZE;
  try {
    const stored = localStorage.getItem(FONT_SIZE_KEY);
    if (stored) {
      const size = parseInt(stored, 10);
      if (size >= MIN_FONT_SIZE && size <= MAX_FONT_SIZE) {
        return size;
      }
    }
  } catch (e) {
    console.error("Error reading font size:", e);
  }
  return DEFAULT_FONT_SIZE;
}

function storeFontSize(size: number): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(FONT_SIZE_KEY, size.toString());
  } catch (e) {
    console.error("Error storing font size:", e);
  }
}

function normalizeTextForSpeech(text: string): string {
  return text
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "e")
    .replace(/&lt;/g, "menor que")
    .replace(/&gt;/g, "maior que")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

export function AccessibilityToolbar({ textContent, className }: AccessibilityToolbarProps) {
  const [fontSize, setFontSize] = useState(getStoredFontSize);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showFontControls, setShowFontControls] = useState(false);

  useEffect(() => {
    if (isBrowser) {
      document.documentElement.style.setProperty("--study-font-size", `${fontSize}px`);
      storeFontSize(fontSize);
    }
  }, [fontSize]);

  useEffect(() => {
    if (!hasSpeechSynthesis) return;
    
    const handleEnd = () => setIsSpeaking(false);
    window.speechSynthesis.addEventListener?.("end", handleEnd);
    return () => {
      window.speechSynthesis.removeEventListener?.("end", handleEnd);
      window.speechSynthesis.cancel();
    };
  }, []);

  const increaseFontSize = useCallback(() => {
    setFontSize(prev => Math.min(prev + FONT_SIZE_STEP, MAX_FONT_SIZE));
  }, []);

  const decreaseFontSize = useCallback(() => {
    setFontSize(prev => Math.max(prev - FONT_SIZE_STEP, MIN_FONT_SIZE));
  }, []);

  const toggleSpeech = useCallback(() => {
    if (!hasSpeechSynthesis) return;
    
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    } else {
      const normalizedText = normalizeTextForSpeech(textContent);
      if (normalizedText) {
        const utterance = new SpeechSynthesisUtterance(normalizedText);
        utterance.lang = "pt-BR";
        utterance.rate = 0.9;
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  }, [textContent, isSpeaking]);

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <div className="relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setShowFontControls(!showFontControls)}
          className="h-8 w-8"
          data-testid="button-font-size"
          title="Ajustar tamanho do texto"
        >
          <Type className="h-4 w-4" />
        </Button>
        
        {showFontControls && (
          <div className="absolute top-full right-0 mt-1 bg-card border rounded-lg shadow-lg p-2 flex items-center gap-1 z-50">
            <Button
              variant="ghost"
              size="icon"
              onClick={decreaseFontSize}
              disabled={fontSize <= MIN_FONT_SIZE}
              className="h-7 w-7"
              data-testid="button-font-decrease"
              title="Diminuir texto"
            >
              <Minus className="h-3 w-3" />
            </Button>
            <span className="text-xs w-8 text-center font-medium">{fontSize}</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={increaseFontSize}
              disabled={fontSize >= MAX_FONT_SIZE}
              className="h-7 w-7"
              data-testid="button-font-increase"
              title="Aumentar texto"
            >
              <Plus className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {hasSpeechSynthesis && (
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSpeech}
          className={cn("h-8 w-8", isSpeaking && "text-primary")}
          data-testid="button-text-to-speech"
          title={isSpeaking ? "Parar leitura" : "Ler em voz alta"}
        >
          {isSpeaking ? (
            <VolumeX className="h-4 w-4" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}

export function useStudyFontSize() {
  const [fontSize, setFontSize] = useState(getStoredFontSize);

  useEffect(() => {
    if (!isBrowser) return;
    
    const handleStorageChange = () => {
      setFontSize(getStoredFontSize());
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return fontSize;
}
