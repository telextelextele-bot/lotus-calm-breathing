
export type AppState = 'setup' | 'ppg-setup' | 'exercise' | 'finale' | 'well-done';

export interface UserData {
  firstName: string;
  lastSessionDate: string | null;
  dailyGoalMetOnDate: string | null;
  consecutiveDaysCompleted: number;
  maxConsecutiveDaysAchieved: number;
  plantGrowthStreakLevel: number;
  lastRewardClaimedForStreakCount: number;
  totalSessionsCompleted: number;
  currentBackgroundKey: keyof typeof import('./constants').BACKGROUND_OPTIONS;
  currentPatternKey: BreathingPatternKey;
}

export type BreathingPatternKey = 'restore' | 'box' | 'coherentBreathing' | 'sleepOnset';

export interface BreathingPattern {
  name: string;
  inhale: number;
  hold1: number;
  exhale: number;
  hold2: number;
  statusTexts: {
    inhale: string;
    exhale: string;
    hold1?: string;
    hold2?: string;
  };
}

export interface BackgroundOption {
  name: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl: string;
}

export type MusicKey = 'none' | 'arabicFluteMusic' | 'ancientIndiaMusic' | 'armenianDudukMusic' | 'magicOfRaagMusic' | 'varanasiMusic' | 'peachBlossomMusic' | 'pureAwarenessMusic';

export interface PpgData {
  bpm: number | null;
  hrv: number | null;
  coherence: number | null;
  status: string;
  isReady: boolean;
}
