import { ArrowLeft, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeartsDisplay } from "./HeartsDisplay";
import { ProgressBar } from "./ProgressBar";
import { cn } from "@/lib/utils";

interface StudyHeaderProps {
  currentStep: number;
  totalSteps: number;
  hearts: number;
  maxHearts: number;
  onClose?: () => void;
  onBack?: () => void;
  showProgress?: boolean;
  className?: string;
}

export function StudyHeader({
  currentStep,
  totalSteps,
  hearts,
  maxHearts,
  onClose,
  onBack,
  showProgress = true,
  className
}: StudyHeaderProps) {
  return (
    <header className={cn("sticky top-0 z-50 bg-background border-b", className)}>
      <div className="flex items-center gap-3 p-3">
        {onBack ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            data-testid="button-back"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        ) : onClose ? (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            data-testid="button-close"
          >
            <X className="h-5 w-5" />
          </Button>
        ) : null}

        {showProgress && (
          <div className="flex-1">
            <ProgressBar
              current={currentStep}
              total={totalSteps}
              height="md"
              color={currentStep === totalSteps ? "success" : "default"}
            />
          </div>
        )}

        <HeartsDisplay
          current={hearts}
          max={maxHearts}
          size="md"
        />
      </div>
    </header>
  );
}
