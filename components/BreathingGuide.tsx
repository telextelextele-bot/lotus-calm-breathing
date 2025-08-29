import React, { useEffect, useRef } from 'react';

interface BreathingGuideProps {
  phase: 'inhale' | 'exhale' | 'hold' | 'idle';
  duration: number;
}

export const BreathingGuide: React.FC<BreathingGuideProps> = ({ phase, duration }) => {
  const particleRef = useRef<HTMLDivElement>(null);

  // This effect synchronizes the particle's movement with the breathing phase.
  useEffect(() => {
    const particle = particleRef.current;
    if (!particle) return;

    // Reset transition for instant positioning
    particle.style.transition = 'none';
    
    // Determine start/end positions for the animation
    const isStartingExhale = phase === 'exhale';
    const startPosition = isStartingExhale ? '100%' : '0%';
    const endPosition = isStartingExhale ? '0%' : '100%';

    // Instantly move particle to its starting position
    particle.style.offsetDistance = startPosition;

    // Force the browser to apply the above style change immediately.
    void particle.offsetWidth;
    
    // Apply the new transition with the correct duration.
    particle.style.transition = `offset-distance ${duration}s linear, background-color 0.5s ease-in-out, box-shadow 0.5s ease-in-out`;
    
    // Trigger the animation to the end position (only for active inhale/exhale phases)
    if (phase === 'inhale' || phase === 'exhale') {
        particle.style.offsetDistance = endPosition;
    }
    
  }, [phase, duration]);

  const phaseStyles = {
    inhale: 'bg-yellow-300 shadow-[0_0_15px_12px_rgba(252,211,77,0.5),0_0_30px_24px_rgba(252,211,77,0.3)]',
    exhale: 'bg-blue-300 shadow-[0_0_15px_8px_rgba(147,197,253,0.5),0_0_30px_16px_rgba(147,197,253,0.3)]',
    hold: 'bg-gray-300 shadow-[0_0_15px_10px_rgba(209,213,219,0.5),0_0_30px_20px_rgba(209,213,219,0.3)]',
    idle: 'bg-blue-300 shadow-[0_0_15px_8px_rgba(147,197,253,0.5),0_0_30px_16px_rgba(147,197,253,0.3)]'
  };
  
  const pathPhaseStyles = {
      inhale: 'stroke-yellow-300/50',
      exhale: 'stroke-blue-300/50',
      hold: 'stroke-gray-300/50',
      idle: 'stroke-blue-300/50'
  };

  return (
    <div className="absolute top-[85px] pointer-events-none w-[320px] h-[80px]">
       <svg className="absolute top-0 left-0 h-full w-full overflow-visible" xmlns="http://www.w3.org/2000/svg">
          {/* This is the visible path */}
          <path d="M0,80 Q160,0 320,80" fill="none" className={`transition-all duration-500 ${pathPhaseStyles[phase]}`} strokeWidth="2"/>
       </svg>
       {/* Markers at the end of the path */}
       <div className="absolute top-[77px] -left-1 h-2 w-2 rounded-full bg-white/40 shadow-[0_0_6px_3px_rgba(255,255,255,0.3)]" />
       <div className="absolute top-[77px] -right-1 h-2 w-2 rounded-full bg-white/40 shadow-[0_0_6px_3px_rgba(255,255,255,0.3)]" />
       
       {/* The moving particle */}
       <div
        ref={particleRef}
        className={`absolute top-0 left-0 h-[22px] w-[22px] rounded-full transition-opacity duration-500 ${phaseStyles[phase]}`}
        style={{
          offsetPath: 'path("M0,80 Q160,0 320,80")',
          offsetAnchor: 'center',
          opacity: phase === 'idle' ? 0 : 0.95,
        }}
       />
    </div>
  );
};
