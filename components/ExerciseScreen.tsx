import React, { useState, useEffect, useRef } from 'react';
import type { BreathingPatternKey, PpgData } from '../types';
import { BREATHING_PATTERNS } from '../constants';
import { BreathingGuide } from './BreathingGuide';

const TOTAL_EXERCISE_SECONDS = 180;

interface ExerciseScreenProps {
  patternKey: BreathingPatternKey;
  ppgData: PpgData | null;
  onComplete: () => void;
}

const LotusFlower: React.FC<{ breathCount: number; totalBreaths: number; phase: 'inhale' | 'exhale' | 'hold' | 'idle'; coherenceBoost: boolean; duration: number }> = ({ breathCount, totalBreaths, phase, coherenceBoost, duration }) => {
    const breathsPerPetal = Math.max(1, Math.ceil(totalBreaths / 6));
    const activePetals = Math.min(6, Math.floor(Math.max(0, breathCount) / breathsPerPetal));
    
    const phaseClasses: {[key: string]: string} = {
        inhale: 'scale-125 brightness-105',
        exhale: 'scale-100 brightness-95',
        hold: '',
        idle: ''
    };
    const coherenceClass = coherenceBoost && phase === 'inhale' ? '!scale-135 !brightness-110' : '';

    return (
        <div 
          className={`relative h-[clamp(200px,55vw,280px)] w-[clamp(200px,55vw,280px)] transition-transform ${coherenceClass} ${phaseClasses[phase]}`}
          style={{ transitionDuration: `${duration}s`, transitionTimingFunction: 'ease-in-out' }}
        >
            <div className="relative h-full w-full">
                {[...Array(6)].map((_, i) => (
                    <div
                        key={i}
                        className={`absolute left-1/2 top-1/2 h-[70%] w-[52%] origin-[center_85%] rounded-[70%_70%_40%_40%_/_90%_90%_60%_60%] shadow-inner transition-all duration-500`}
                        style={{
                            transform: `translate(-50%, -50%) rotate(${i * 60}deg) translateY(-28%)`,
                            background: i < activePetals ? 'linear-gradient(180deg, #FFAFCC 0%, #FF8AB4 50%, #E75480 100%)' : '#e0e0e0',
                            borderColor: i < activePetals ? '#C74360' : '#c0c0c0',
                            borderWidth: '1px'
                        }}
                    />
                ))}
                <div className="absolute left-1/2 top-1/2 h-1/2 w-1/2 -translate-x-1/2 -translate-y-[20%] bg-[url('https://cdn.shopify.com/s/files/1/0645/5030/5960/files/123_f25ded29-0707-4652-bf16-9156077ef973.png?v=1746546721')] bg-contain bg-center bg-no-repeat"/>
            </div>
        </div>
    );
};

export const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ patternKey, ppgData, onComplete }) => {
    const [remainingSeconds, setRemainingSeconds] = useState(TOTAL_EXERCISE_SECONDS);
    const [breathCount, setBreathCount] = useState(0);
    const [phase, setPhase] = useState<'inhale' | 'hold' | 'exhale' | 'idle'>('idle');
    const [statusText, setStatusText] = useState('');
    const [currentPhaseDuration, setCurrentPhaseDuration] = useState(0);
    // FIX: `useRef` requires an initial value when a generic type is provided. Initialized with null.
    const cycleTimeoutRef = useRef<number | null>(null);

    const pattern = BREATHING_PATTERNS[patternKey];
    
    const [durations, setDurations] = useState({
        inhale: pattern.inhale,
        hold1: pattern.hold1,
        exhale: pattern.exhale,
        hold2: pattern.hold2
    });
    
    const cycleDuration = durations.inhale + durations.hold1 + durations.exhale + durations.hold2;
    const totalBreaths = cycleDuration > 0 ? Math.floor(TOTAL_EXERCISE_SECONDS / cycleDuration) : 18;

    useEffect(() => {
      if (patternKey === 'coherentBreathing' && ppgData?.bpm) {
          const targetBreathsPerMinute = Math.max(4, Math.min(10, ppgData.bpm / 12));
          const newCycleDuration = 60 / targetBreathsPerMinute;
          const newInhale = newCycleDuration / 2;
          setDurations({ inhale: newInhale, exhale: newInhale, hold1: 0, hold2: 0 });
      }
    }, [ppgData?.bpm, patternKey]);
    
    // Main timer
    useEffect(() => {
        if (remainingSeconds <= 0) {
            onComplete();
            return;
        }
        const timerId = setTimeout(() => {
            setRemainingSeconds(s => s - 1);
        }, 1000);
        return () => clearTimeout(timerId);
    }, [remainingSeconds, onComplete]);

    // Breathing cycle logic
    useEffect(() => {
        let isCancelled = false;
        let timeoutId: number;

        const performCycle = () => {
            if (isCancelled) return;
            setBreathCount(c => c + 1);

            const sequence = [
                { phase: 'inhale', text: pattern.statusTexts.inhale, duration: durations.inhale },
                { phase: 'hold', text: pattern.statusTexts.hold1, duration: durations.hold1 },
                { phase: 'exhale', text: pattern.statusTexts.exhale, duration: durations.exhale },
                { phase: 'hold', text: pattern.statusTexts.hold2, duration: durations.hold2 }
            ].filter(step => step.duration > 0);

            let stepIndex = -1;

            const runNextStep = () => {
                if (isCancelled) return;
                stepIndex++;
                if (stepIndex >= sequence.length) {
                    performCycle(); // Loop for the next breath cycle
                    return;
                }
                
                const step = sequence[stepIndex];
                setPhase(step.phase as 'inhale' | 'hold' | 'exhale');
                setStatusText(step.text || 'Hold');
                setCurrentPhaseDuration(step.duration);
                
                timeoutId = window.setTimeout(runNextStep, step.duration * 1000);
                cycleTimeoutRef.current = timeoutId;
            };

            runNextStep();
        };
        
        const startTimeout = setTimeout(performCycle, 1500);

        return () => {
            isCancelled = true;
            clearTimeout(startTimeout);
            if (cycleTimeoutRef.current) {
                clearTimeout(cycleTimeoutRef.current);
            }
        };
    }, [durations, pattern.statusTexts]);

    const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
    
    return (
        <div className="flex h-full w-full flex-col items-center justify-center p-4 text-white text-shadow-md">
            {/* Top Info */}
            <div className="absolute top-8 flex w-full max-w-xs justify-between text-lg">
                <span>{formatTime(remainingSeconds)}</span>
                <span>Breath: {breathCount} / {totalBreaths}</span>
            </div>
            
            {/* Main Visuals Area */}
            <div className="relative flex flex-col items-center justify-center">
                <LotusFlower breathCount={breathCount} totalBreaths={totalBreaths} phase={phase} coherenceBoost={breathCount % 3 === 0} duration={currentPhaseDuration} />
                <BreathingGuide phase={phase} duration={currentPhaseDuration} />
            </div>
            
            {/* Status Text */}
            <h2 className={`absolute bottom-[10%] text-[clamp(2.5em,11vw,4.5em)] font-bold transition-colors duration-500 
                ${phase === 'inhale' && 'text-yellow-300'} 
                ${phase === 'exhale' && 'text-blue-300'}
                ${phase === 'hold' && 'text-gray-300'}
            `}>
                {statusText}
            </h2>
        </div>
    );
};
