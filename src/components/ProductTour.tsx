import { useState, useEffect } from 'react';
import { TourTooltip } from './TourTooltip';

interface TourStep {
  target: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    target: 'hero-section',
    title: 'Welcome to Authenticity & Purpose',
    description: 'Your personal sanctuary for achieving goals, tracking progress, and celebrating YOUR journey - without comparing to others.',
    position: 'bottom'
  },

  {
    target: 'goals-section',
    title: 'Set Goals–Vision Board on Your Timeline',
    description: 'Create 30, 60, 90 day goals, 1 year goals, and even 5-year visions. Track progress on a simple 0-10 scale.',
    position: 'bottom'
  },

  {
    target: 'gratitude-section',
    title: 'Practice Gratitude',
    description: 'Record what you appreciate each day. Appreciation is an instant connection with feeling good.',
    position: 'bottom'
  },
  {
    target: 'journal-section',
    title: 'Document Your Journey',
    description: 'A life worth living is worth recording. Add journal entries with photos to capture your memories and growth.',
    position: 'bottom'
  },
  {
    target: 'rewards-section',
    title: 'Earn Rewards',
    description: 'Get points for completing goals, tasks, and journal entries. Celebrate your progress and stay motivated!',
    position: 'top'
  }
];


interface ProductTourProps {
  isActive: boolean;
  onComplete: () => void;
}

export function ProductTour({ isActive, onComplete }: ProductTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!isActive) return;

    const updatePosition = () => {
      const step = tourSteps[currentStep];
      const element = document.getElementById(step.target);
      
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        const rect = element.getBoundingClientRect();
        setTooltipPosition({ top: rect.top, left: rect.left + rect.width / 2 });
        
        element.classList.add('tour-highlight');
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      const step = tourSteps[currentStep];
      const element = document.getElementById(step.target);
      if (element) element.classList.remove('tour-highlight');
    };
  }, [currentStep, isActive]);

  if (!isActive) return null;

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentTourStep = tourSteps[currentStep];

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onComplete} />
      <div
        className="fixed z-50"
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
          transform: 'translateX(-50%)'
        }}
      >
        <TourTooltip
          title={currentTourStep.title}
          description={currentTourStep.description}
          currentStep={currentStep}
          totalSteps={tourSteps.length}
          onNext={handleNext}
          onPrevious={handlePrevious}
          onClose={onComplete}
          position={currentTourStep.position}
        />
      </div>
    </>
  );
}
