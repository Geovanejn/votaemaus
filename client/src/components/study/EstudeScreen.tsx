import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, BookOpen, Settings, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface StudySection {
  type: "verse" | "topic" | "conclusion";
  title?: string;
  content: string;
}

interface EstudeScreenProps {
  lessonTitle: string;
  sections: StudySection[];
  onComplete: () => void;
  onClose: () => void;
  initialIndex?: number;
}

export function EstudeScreen({
  sections,
  onComplete,
  onClose,
  initialIndex = 0
}: EstudeScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const totalSlides = sections.length;
  const currentSection = sections[currentIndex];

  const goNext = () => currentIndex < totalSlides - 1 ? setCurrentIndex(prev => prev + 1) : onComplete();
  const goPrev = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);

  if (!currentSection) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC] dark:bg-zinc-950">
      <div className="relative px-6 pt-10 pb-12 rounded-b-[32px] overflow-hidden shadow-sm"
           style={{ background: 'linear-gradient(135deg, #2563eb 0%, #60a5fa 100%)' }}>
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-6">
            <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"><ArrowLeft className="h-5 w-5" /></button>
            <div className="text-center">
              <p className="text-white/80 text-[10px] font-bold uppercase tracking-wider mb-1">Seção</p>
              <p className="text-white text-2xl font-black">{currentIndex + 1} / {totalSlides}</p>
            </div>
            <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white"><Settings className="h-5 w-5" /></button>
          </div>
          <div className="w-full h-2.5 bg-white/20 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }} className="h-full bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-5 -mt-6 flex-1 flex flex-col">
        <Card className="border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[24px] bg-white dark:bg-zinc-900 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-white"><BookOpen className="h-4 w-4" /></div>
            <span className="text-[#2563eb] text-[10px] font-black uppercase tracking-widest">Estude</span>
          </div>
          <h3 className="text-[19px] font-bold text-[#2D3142] dark:text-zinc-100 mb-4">{currentSection.title || "Tópico de Estudo"}</h3>
          <div className="prose prose-zinc dark:prose-invert max-w-none text-[#4B5563] text-[15px] leading-relaxed"
               dangerouslySetInnerHTML={{ __html: currentSection.content }} />
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 flex gap-3 max-w-md mx-auto">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="w-16 h-[60px] rounded-[20px] bg-white border-0 shadow-sm"><ChevronLeft className="h-6 w-6 text-[#2D3142]" /></Button>
        <Button onClick={goNext} className="flex-1 h-[60px] rounded-[20px] bg-[#2563eb] text-white text-lg font-bold shadow-lg shadow-blue-500/20 border-0">
          {currentIndex === totalSlides - 1 ? "Finalizar" : "Continuar"}
          <ChevronRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </div>
  );
}
