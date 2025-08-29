
import React, { useState, useEffect, useRef } from 'react';
import type { UserData, BreathingPatternKey, MusicKey } from '../types';
import { BREATHING_PATTERNS, BACKGROUND_OPTIONS, MUSIC_SOURCES, PLANT_IMAGE_STAGES, PLANT_STAGE_THRESHOLDS } from '../constants';

interface SetupScreenProps {
  userData: UserData | null;
  onStartExercise: (pattern: BreathingPatternKey, music: MusicKey) => void;
  onStartPpg: () => void;
  onUpdateUserData: (data: Partial<UserData>) => void;
}

const StyledSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { children: React.ReactNode }> = ({ children, ...props }) => (
    <div className="relative w-[70%] max-w-[250px] min-w-[180px]">
        <select
            {...props}
            className="w-full appearance-none cursor-pointer rounded-lg border border-white/25 bg-black/40 px-3 py-2 text-[clamp(0.85em,3.5vw,1em)] text-stone-100 shadow-sm backdrop-blur-sm focus:border-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
        >
            {children}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-300">
            <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" /></svg>
        </div>
    </div>
);


const BackgroundSelector: React.FC<{ current: string, onSelect: (key: string) => void }> = ({ current, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div ref={dropdownRef} className="absolute top-3 right-4 z-20">
            <button onClick={() => setIsOpen(!isOpen)} className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/30 bg-black/20 p-2 backdrop-blur-sm">
                <span className="text-2xl">⛰️</span>
            </button>
            {isOpen && (
                <div className="absolute top-12 right-0 w-48 rounded-lg border border-white/20 bg-black/70 p-2 backdrop-blur-md">
                    {Object.entries(BACKGROUND_OPTIONS).map(([key, option]) => (
                        <button key={key} onClick={() => { onSelect(key); setIsOpen(false); }} className="flex w-full items-center gap-3 rounded-md p-2 text-left text-sm text-stone-100 hover:bg-white/10">
                            <img src={option.thumbnailUrl} alt={option.name} className="h-8 w-12 rounded-sm border border-white/20 object-cover" />
                            <span>{option.name}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export const SetupScreen: React.FC<SetupScreenProps> = ({ userData, onStartExercise, onStartPpg, onUpdateUserData }) => {
    const [selectedPattern, setSelectedPattern] = useState<BreathingPatternKey>(userData?.currentPatternKey || 'restore');
    const [selectedMusic, setSelectedMusic] = useState<MusicKey>('none');
    const [isWatering, setIsWatering] = useState(false);

    useEffect(() => {
        if (userData?.currentPatternKey) {
            setSelectedPattern(userData.currentPatternKey);
        }
    }, [userData?.currentPatternKey]);

    const handleStart = () => {
        if (selectedPattern === 'coherentBreathing') {
            onStartPpg();
        } else {
            onStartExercise(selectedPattern, selectedMusic);
        }
    };
    
    const handlePatternChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newPattern = e.target.value as BreathingPatternKey;
        setSelectedPattern(newPattern);
        onUpdateUserData({ currentPatternKey: newPattern });
    };

    const totalBreaths = BREATHING_PATTERNS[selectedPattern]
        ? Math.floor(180 / (BREATHING_PATTERNS[selectedPattern].inhale + BREATHING_PATTERNS[selectedPattern].hold1 + BREATHING_PATTERNS[selectedPattern].exhale + BREATHING_PATTERNS[selectedPattern].hold2))
        : 18;

    const plantImageSrc = (() => {
        const growthDays = userData?.plantGrowthStreakLevel || 0;
        let imageIndex = -1;
        for (let i = PLANT_STAGE_THRESHOLDS.length - 1; i >= 0; i--) {
            if (growthDays >= PLANT_STAGE_THRESHOLDS[i]) {
                imageIndex = i;
                break;
            }
        }
        return imageIndex !== -1 ? PLANT_IMAGE_STAGES[imageIndex] : "";
    })();
    
    return (
        <div className="relative flex h-full w-full items-center justify-center">
            <div className="w-full max-w-md rounded-2xl bg-black/25 p-6 pt-12 text-center text-stone-100 shadow-2xl backdrop-blur-md">
                <BackgroundSelector current={userData?.currentBackgroundKey || 'mountainLake'} onSelect={(key) => onUpdateUserData({ currentBackgroundKey: key as keyof typeof BACKGROUND_OPTIONS })} />

                <h1 className="text-[clamp(2em,7vw,2.5em)] font-bold text-shadow">Lotus Calm Breathing</h1>
                
                <div className="my-2 text-sm leading-snug text-shadow-sm">
                    {userData && (
                        <>
                            <p>Hello, {userData.firstName}!</p>
                            <p>Streak: {userData.consecutiveDaysCompleted} days</p>
                            <p>Daily Goal Met: {userData.dailyGoalMetOnDate === new Date().toISOString().split('T')[0] ? 'Yes!' : 'Not yet'}</p>
                            <p>Total Sessions: {userData.totalSessionsCompleted}</p>
                        </>
                    )}
                </div>

                <div className="relative mx-auto my-3 h-[150px] w-[150px]">
                    <div className={`absolute left-1/2 top-0 h-[18px] w-[12px] -translate-x-1/2 rounded-[50%_50%_50%_50%_/_60%_60%_40%_40%] bg-[#63ABE6] transition-all duration-1000 ${isWatering ? 'opacity-100 top-[75px]' : 'opacity-0 top-0'}`} />
                    {plantImageSrc && <img src={plantImageSrc} alt="Growing Lotus" className="absolute bottom-2 left-1/2 max-h-24 max-w-32 -translate-x-1/2 object-contain" />}
                </div>

                <p className="mb-4 text-[clamp(0.9em,4vw,1.1em)] text-shadow-sm">Use standard patterns or your camera for cardiac coherent breathing.</p>
                
                <div className="mb-4 flex flex-col items-center gap-4">
                    <button onClick={onStartPpg} className="w-full max-w-xs rounded-lg border border-white/30 bg-green-600/80 px-5 py-3 text-lg font-bold shadow-lg transition hover:bg-green-500/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                        Use Camera for Coherence
                    </button>

                    <div className="flex w-full flex-col items-center gap-2">
                        <p>Or Choose Breathing Pattern:</p>
                        <StyledSelect value={selectedPattern} onChange={handlePatternChange}>
                            {Object.entries(BREATHING_PATTERNS).map(([key, pattern]) => (
                                <option key={key} value={key}>{pattern.name}</option>
                            ))}
                        </StyledSelect>
                    </div>

                    <div className="flex w-full flex-col items-center gap-2">
                        <p>Choose Music:</p>
                        <StyledSelect value={selectedMusic} onChange={(e) => setSelectedMusic(e.target.value as MusicKey)}>
                             {Object.entries(MUSIC_SOURCES).map(([key, music]) => (
                                <option key={key} value={key}>{music.name}</option>
                            ))}
                        </StyledSelect>
                    </div>
                </div>

                <button onClick={handleStart} className="w-full max-w-xs rounded-lg border border-white/30 bg-pink-600/80 px-5 py-3 text-lg font-bold shadow-lg transition hover:bg-pink-500/90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50">
                    Start Exercise (3 minutes)
                </button>
                <div className="mt-2 text-[clamp(0.9em,4vw,1.2em)] text-shadow-sm">
                    Only {totalBreaths} Breaths
                </div>
            </div>
        </div>
    );
};
