import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronRight, ChevronLeft, Heart, Settings, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

interface MeditationSection {
  type: "reflection" | "meditation";
  title: string;
  content: string;
}

interface MediteScreenProps {
  lessonTitle: string;
  sections: MeditationSection[];
  onComplete: () => void;
  onClose: () => void;
  initialIndex?: number;
}

export function MediteScreen({
  sections,
  onComplete,
  onClose,
  initialIndex = 0
}: MediteScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const totalSlides = sections.length;
  const currentSection = sections[currentIndex];

  const goNext = () => currentIndex < totalSlides - 1 ? setCurrentIndex(prev => prev + 1) : onComplete();
  const goPrev = () => currentIndex > 0 && setCurrentIndex(prev => prev - 1);

  if (!currentSection) return null;

  return (
    <div className="flex flex-col min-h-screen bg-[#F8F9FC] dark:bg-zinc-950">
      <div className="relative px-6 pt-6 pb-8 rounded-b-[24px] overflow-hidden shadow-sm"
           style={{ background: 'linear-gradient(135deg, #db2777 0%, #f472b6 100%)' }}>
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="w-full flex justify-between items-center mb-4">
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><ArrowLeft className="h-4 w-4" /></button>
            <div className="text-center">
              <p className="text-white/80 text-[9px] font-bold uppercase tracking-wider">Reflexão</p>
              <p className="text-white text-xl font-black">{currentIndex + 1} / {totalSlides}</p>
            </div>
            <button className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white"><Settings className="h-4 w-4" /></button>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <motion.div animate={{ width: `${((currentIndex + 1) / totalSlides) * 100}%` }} className="h-full bg-white rounded-full" />
          </div>
        </div>
      </div>

      <div className="max-w-md mx-auto w-full px-4 -mt-4 flex-1 flex flex-col">
        <Card className="border-0 shadow-sm rounded-[20px] bg-white dark:bg-zinc-900 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-600 to-rose-400 flex items-center justify-center text-white"><Heart className="h-4 w-4" /></div>
            <span className="text-[#db2777] text-[9px] font-black uppercase tracking-widest">Medite</span>
          </div>
          <h3 className="text-[17px] font-bold text-[#2D3142] dark:text-zinc-100 mb-3 italic">{currentSection.title}</h3>
          <div className="prose prose-zinc dark:prose-invert max-w-none text-[#4B5563] text-[14px] leading-relaxed italic"
               dangerouslySetInnerHTML={{ __html: currentSection.content }} />
        </Card>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 flex gap-2 max-w-md mx-auto">
        <Button variant="outline" onClick={goPrev} disabled={currentIndex === 0} className="w-14 h-[52px] rounded-[16px] bg-white border-0 shadow-sm"><ChevronLeft className="h-5 w-5 text-[#2D3142]" /></Button>
        <Button onClick={goNext} className="flex-1 h-[52px] rounded-[16px] bg-[#db2777] text-white text-base font-bold shadow-md border-0">
          {currentIndex === totalSlides - 1 ? "Finalizar" : "Continuar"}
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
