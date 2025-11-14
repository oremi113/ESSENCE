import { useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper, Sparkles, Trophy } from "lucide-react";

interface MilestoneData {
  emoji: string;
  icon: typeof PartyPopper;
  title: string;
  message: string;
  progress: number;
}

interface MilestoneCelebrationProps {
  stage: number;
  open: boolean;
  onClose: () => void;
}

const MILESTONES: Record<number, MilestoneData> = {
  1: {
    emoji: "🎉",
    icon: PartyPopper,
    title: "Great Start!",
    message: "You've completed Stage 1! Your voice is starting to take shape.",
    progress: 20
  },
  2: {
    emoji: "⭐",
    icon: Sparkles,
    title: "Excellent Work!",
    message: "You're capturing so much emotion! Your voice is really taking shape now.",
    progress: 68
  },
  3: {
    emoji: "🏆",
    icon: Trophy,
    title: "Congratulations!",
    message: "You did it! Your voice is fully trained and ready to create unlimited personalized messages.",
    progress: 100
  }
};

export default function MilestoneCelebration({ stage, open, onClose }: MilestoneCelebrationProps) {
  const milestone = MILESTONES[stage];
  const Icon = milestone?.icon;

  useEffect(() => {
    if (open && stage === 3) {
      // Confetti effect for final stage
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        
        // Simple confetti simulation using DOM elements
        const confetti = document.createElement('div');
        confetti.style.position = 'fixed';
        confetti.style.left = randomInRange(0, window.innerWidth) + 'px';
        confetti.style.top = '0px';
        confetti.style.width = '10px';
        confetti.style.height = '10px';
        confetti.style.backgroundColor = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff'][Math.floor(Math.random() * 5)];
        confetti.style.opacity = '0.8';
        confetti.style.borderRadius = '50%';
        confetti.style.pointerEvents = 'none';
        confetti.style.zIndex = '9999';
        confetti.style.transition = 'all 1s ease-out';
        
        document.body.appendChild(confetti);
        
        setTimeout(() => {
          confetti.style.top = window.innerHeight + 'px';
          confetti.style.opacity = '0';
        }, 10);
        
        setTimeout(() => {
          confetti.remove();
        }, 1000);
      }, 250);

      return () => clearInterval(interval);
    }
  }, [open, stage]);

  if (!milestone) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent 
        className="sm:max-w-md text-center p-8"
        data-testid={`milestone-modal-stage-${stage}`}
      >
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Icon */}
          <div className="flex justify-center">
            {Icon && (
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center animate-in zoom-in duration-700">
                <Icon className="w-12 h-12 text-primary" />
              </div>
            )}
          </div>

          {/* Title */}
          <DialogTitle className="text-3xl font-bold" data-testid={`milestone-title-stage-${stage}`}>
            {milestone.title}
          </DialogTitle>

          {/* Message */}
          <DialogDescription className="text-lg text-muted-foreground" data-testid={`milestone-message-stage-${stage}`}>
            {milestone.message}
          </DialogDescription>

          {/* Progress Circle */}
          <div className="flex justify-center py-4">
            <div className="relative w-32 h-32">
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 120 120">
                {/* Background circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="10"
                  strokeDasharray={`${milestone.progress * 3.14} 314`}
                  strokeLinecap="round"
                  className="text-primary transition-all duration-1000 ease-out"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-3xl font-bold" data-testid={`milestone-progress-${stage}`}>
                  {milestone.progress}%
                </span>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <Button
            onClick={onClose}
            size="lg"
            className="w-full"
            data-testid={`button-continue-stage-${stage}`}
          >
            {stage === 3 ? 'Create Your First Message' : `Continue to Stage ${stage + 1}`}
          </Button>

          {stage < 3 && (
            <Button
              onClick={onClose}
              variant="ghost"
              className="w-full"
              data-testid={`button-save-later-stage-${stage}`}
            >
              Save & Finish Later
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
