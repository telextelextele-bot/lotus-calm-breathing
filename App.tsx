
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SetupScreen } from './components/SetupScreen';
import { PpgSetupScreen } from './components/PpgSetupScreen';
import { ExerciseScreen } from './components/ExerciseScreen';
import { usePpg } from './hooks/usePpg';
import type { AppState, UserData, BreathingPatternKey, MusicKey } from './types';
import { USER_DATA_KEY, BACKGROUND_OPTIONS, MUSIC_SOURCES, QUOTES } from './constants';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('setup');
  const [userData, setUserData] = useState<UserData | null>(null);
  const [currentBackground, setCurrentBackground] = useState(BACKGROUND_OPTIONS.mountainLake);
  const [activePattern, setActivePattern] = useState<BreathingPatternKey>('restore');
  const [activeMusic, setActiveMusic] = useState<MusicKey>('none');
  const { ppgData, ppgRefs, startPpg, stopPpg, rrIntervals } = usePpg();

  const audioRefs = useRef<{[key in MusicKey]?: HTMLAudioElement}>({});
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [finaleQuote, setFinaleQuote] = useState('');
  const [showReward, setShowReward] = useState(false);

  // --- User Data Hook Logic (Integrated) ---
  const loadUserData = useCallback(() => {
    try {
      const storedData = localStorage.getItem(USER_DATA_KEY);
      if (storedData) {
        const parsed = JSON.parse(storedData);
        setUserData(parsed);
        setCurrentBackground(BACKGROUND_OPTIONS[parsed.currentBackgroundKey] || BACKGROUND_OPTIONS.mountainLake);
      } else {
        const defaultData: UserData = {
          firstName: "Friend", lastSessionDate: null, dailyGoalMetOnDate: null, consecutiveDaysCompleted: 0,
          maxConsecutiveDaysAchieved: 0, plantGrowthStreakLevel: 0, lastRewardClaimedForStreakCount: 0,
          totalSessionsCompleted: 0, currentBackgroundKey: "mountainLake", currentPatternKey: "restore"
        };
        setUserData(defaultData);
        localStorage.setItem(USER_DATA_KEY, JSON.stringify(defaultData));
      }
    } catch (e) { console.error("Failed to load user data", e); }
  }, []);
  
  useEffect(() => {
      loadUserData();
  }, [loadUserData]);

  const updateUserData = useCallback((data: Partial<UserData>) => {
    setUserData(prev => {
      if (!prev) return null;
      const newData = { ...prev, ...data };
      if (data.currentBackgroundKey && BACKGROUND_OPTIONS[data.currentBackgroundKey]) {
        setCurrentBackground(BACKGROUND_OPTIONS[data.currentBackgroundKey]);
      }
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(newData));
      return newData;
    });
  }, []);

  const completeSession = useCallback(() => {
      if(!userData) return;
      const today = new Date().toISOString().split('T')[0];
      
      const newTotalSessions = userData.totalSessionsCompleted + 1;
      let update: Partial<UserData> = { totalSessionsCompleted: newTotalSessions, lastSessionDate: today };

      if (userData.dailyGoalMetOnDate !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        const newConsecutive = userData.dailyGoalMetOnDate === yesterdayStr ? userData.consecutiveDaysCompleted + 1 : 1;
        
        if (newConsecutive >= 3 && newConsecutive % 3 === 0 && newConsecutive > userData.lastRewardClaimedForStreakCount) {
            setShowReward(true);
            update.lastRewardClaimedForStreakCount = newConsecutive;
        }

        update = {
          ...update,
          dailyGoalMetOnDate: today,
          consecutiveDaysCompleted: newConsecutive,
          plantGrowthStreakLevel: newConsecutive,
          maxConsecutiveDaysAchieved: Math.max(userData.maxConsecutiveDaysAchieved, newConsecutive),
        };
      }
      updateUserData(update);
  }, [userData, updateUserData]);

  // --- State Transitions ---
  const handleStartExercise = (pattern: BreathingPatternKey, music: MusicKey) => {
    setActivePattern(pattern);
    setActiveMusic(music);
    setAppState('exercise');
  };

  const handleStartPpg = () => {
    setAppState('ppg-setup');
    startPpg();
  };

  const handlePpgCancel = () => {
    stopPpg();
    setAppState('setup');
  };
  
  const handleBeginCoherence = () => {
    // Don't stop PPG, it continues into the exercise
    handleStartExercise('coherentBreathing', activeMusic);
  };
  
  const handleExerciseComplete = useCallback(() => {
    stopPpg(); // Ensure PPG stops after exercise
    completeSession();
    setAppState('well-done');
    setTimeout(() => {
        setIsFadingOut(true);
        setTimeout(() => {
            setAppState('finale');
            setFinaleQuote(QUOTES[Math.floor(Math.random() * QUOTES.length)]);
            setTimeout(() => {
                setAppState('setup');
                setIsFadingOut(false);
                setShowReward(false);
            }, 8000);
        }, 1000)
    }, 3000);
  }, [completeSession, stopPpg]);

  // --- Audio Management ---
  useEffect(() => {
      if (appState === 'exercise' && activeMusic !== 'none') {
          const audio = audioRefs.current[activeMusic];
          if (audio) {
              audio.volume = 0.3;
              audio.currentTime = 0;
              audio.play().catch(e => console.warn("Audio play failed", e));
          }
      } else {
          Object.values(audioRefs.current).forEach(audio => audio?.pause());
      }
  }, [appState, activeMusic]);

  return (
    <main className="fixed inset-0 h-full w-full overflow-hidden bg-gray-800 font-sans text-white">
        {/* Background */}
        {currentBackground.type === 'image' ? (
            <div className="absolute inset-0 bg-cover bg-center z-0" style={{ backgroundImage: `url(${currentBackground.url})` }} />
        ) : (
            <video
                src={currentBackground.url}
                poster={currentBackground.thumbnailUrl}
                autoPlay loop muted playsInline
                className="absolute inset-0 h-full w-full object-cover z-0"
            />
        )}
        <div className="absolute inset-0 bg-black/30 z-10" />
        
        {/* Screens */}
        <div className={`absolute inset-0 z-20 transition-opacity duration-700 ${appState === 'setup' || appState === 'ppg-setup' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {appState === 'setup' && <SetupScreen userData={userData} onStartExercise={handleStartExercise} onStartPpg={handleStartPpg} onUpdateUserData={updateUserData} />}
          {appState === 'ppg-setup' && <PpgSetupScreen ppgData={ppgData} onStart={handleBeginCoherence} onCancel={handlePpgCancel} rrIntervals={rrIntervals} />}
        </div>
        <div className={`absolute inset-0 z-20 transition-opacity duration-700 ${appState === 'exercise' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          {appState === 'exercise' && <ExerciseScreen patternKey={activePattern} onComplete={handleExerciseComplete} ppgData={ppgData}/>}
        </div>

        {/* Well Done Screen */}
        <div className={`absolute inset-0 z-30 flex flex-col items-center justify-center text-white transition-opacity duration-700 ${appState === 'well-done' ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
             {!isFadingOut && <h1 className="text-5xl font-bold text-shadow-lg animate-pulse">Well Done!</h1>}
        </div>
        {showReward && <div className="fixed bottom-10 z-40 rounded-xl bg-yellow-400/90 px-6 py-3 font-bold text-gray-800 shadow-lg animate-bounce">Streak Reward! 🎉</div>}

        {/* Finale Effects */}
        <div className={`pointer-events-none fixed inset-0 z-50 origin-center bg-[radial-gradient(circle_at_center,rgba(255,255,240,1)_0%,rgba(255,230,180,0.8)_20%,rgba(255,245,200,0.3)_50%,rgba(255,250,220,0)_70%)] transition-all duration-1000 ease-in-out ${appState === 'finale' ? 'scale-150 opacity-100' : 'scale-0 opacity-0'}`}/>
        <div className={`fixed inset-0 z-50 flex items-center justify-center p-8 transition-opacity duration-1000 ${appState === 'finale' ? 'opacity-100 delay-1000' : 'opacity-0 pointer-events-none'}`}>
            <p className="text-center text-2xl italic text-shadow-xl">{finaleQuote}</p>
        </div>


        {/* Hidden Elements */}
        <div className="hidden">
            <video ref={ppgRefs.videoRef} playsInline muted autoPlay />
            <canvas ref={ppgRefs.canvasRef} />
            {Object.entries(MUSIC_SOURCES).map(([key, music]) =>
                music.src && <audio key={key} src={music.src} loop ref={el => { if(el) audioRefs.current[key as MusicKey] = el }} />
            )}
        </div>
    </main>
  );
};

export default App;
