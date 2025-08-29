
import type { BreathingPattern, BreathingPatternKey, BackgroundOption, MusicKey } from './types';

export const USER_DATA_KEY = "lotusBreathingUserData_v3";

export const BACKGROUND_OPTIONS: Record<string, BackgroundOption> = {
  mountainLake: { name: "Mountain Lake", type: "video", url: "https://cdn.shopify.com/videos/c/o/v/7057997b455f46e0bf3236f011c1f534.mp4", thumbnailUrl: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/MountainLake.jpg?v=1746882475" },
  desertSunset: { name: "Desert Sunset", type: "image", url: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Desert-Sunset.jpg?v=1746761977", thumbnailUrl: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Desert-Sunset.jpg?v=1746761977" },
  varanasi: { name: "Varanasi", type: "video", url: "https://cdn.shopify.com/videos/c/o/v/67f7129f29eb4aef960523ee75dc843a.mp4", thumbnailUrl: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Varanasi_1f4ab82e-9760-4853-9fbc-45cbbe3fe58f.jpg?v=1746837103" },
  forestRiver: { name: "Forest River", type: "video", url: "https://cdn.shopify.com/videos/c/o/v/507d925f104a45158da8c87cabceefc3.mp4", thumbnailUrl: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/ForestRiver.jpg?v=1746885137" },
  sailingBoats: { name: "Sailing Boats", type: "video", url: "https://cdn.shopify.com/videos/c/o/v/56629bb8f10643ebbbea20ffc136b496.mp4", thumbnailUrl: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Sailing-Boats.jpg?v=1746885138" }
};

export const BREATHING_PATTERNS: Record<BreathingPatternKey, BreathingPattern> = {
  restore: { name: "Restore Pattern", inhale: 4, hold1: 0, exhale: 6, hold2: 0, statusTexts: { inhale: "Inhale", exhale: "Exhale" } },
  box: { name: "Box Pattern", inhale: 4, hold1: 4, exhale: 4, hold2: 4, statusTexts: { inhale: "Inhale", hold1: "Hold", exhale: "Exhale", hold2: "Hold" } },
  coherentBreathing: { name: "Coherent Breathing", inhale: 5.5, hold1: 0, exhale: 5.5, hold2: 0, statusTexts: { inhale: "Inhale", exhale: "Exhale" } },
  sleepOnset: { name: "Sleep Onset", inhale: 4, hold1: 7, exhale: 8, hold2: 0, statusTexts: { inhale: "Inhale", hold1: "Hold", exhale: "Exhale" } }
};

export const MUSIC_SOURCES: Record<MusicKey, { name: string, src?: string }> = {
  none: { name: "None" },
  arabicFluteMusic: { name: "Arabic Desert Flute", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Flute-medi.mp3?v=1746557270" },
  ancientIndiaMusic: { name: "Ancient India", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/indian.mp3?v=1746560239" },
  armenianDudukMusic: { name: "Armenian Duduk", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Armenien_Duduk.mp3?v=1746587760" },
  magicOfRaagMusic: { name: "Magic of Raag", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Magic_of_Raag.mp3?v=1746755003" },
  varanasiMusic: { name: "Varanasi", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Varanasi.mp3?v=1746768257" },
  peachBlossomMusic: { name: "Peach Blossom Spring", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Chinese_Peach_Blossom_Spring.mp3?v=1746842799" },
  pureAwarenessMusic: { name: "Pure Awareness", src: "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Pure_Awareness.mp3?v=1746843595" },
};

export const PLANT_IMAGE_STAGES = [
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage1.png?v=1746607387",
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage2.png?v=1746607402",
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage3.png?v=1746607414",
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage4.png?v=1746607426",
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage5.png?v=1746607438",
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage6.png?v=1746607450",
  "https://cdn.shopify.com/s/files/1/0645/5030/5960/files/Stage7.png?v=1746607960"
];
export const PLANT_STAGE_THRESHOLDS = [1, 3, 6, 9, 12, 15, 18];

export const QUOTES = [
  "Peace comes from within. Do not seek it without. - Buddha",
  "The quieter you become, the more you can hear. - Ram Dass",
  "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor. - Thich Nhat Hanh",
  "Within you, there is a stillness and a sanctuary to which you can retreat at any time and be yourself. - Hermann Hesse",
  "Calmness is the cradle of power. - Josiah Gilbert Holland",
  "The greatest weapon against stress is our ability to choose one thought over another. - William James",
  "Breathe. Let go. And remind yourself that this very moment is the only one you know you have for sure. - Oprah Winfrey",
  "You give but little when you give of your possessions. It is when you give of yourself that you truly give. - Mikhail Naimy"
];
