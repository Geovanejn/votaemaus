import { useState } from "react";

export function useAccessibility() {
  const [fontSize, setFontSize] = useState(16);

  const increaseFontSize = () => {
    setFontSize((prev) => (prev < 24 ? prev + 2 : prev));
  };

  const speak = (text: string) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      window.speechSynthesis.speak(utterance);
    }
  };

  return {
    fontSize,
    increaseFontSize,
    speak,
  };
}
