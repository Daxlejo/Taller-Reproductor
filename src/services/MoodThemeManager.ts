export interface MoodTheme {
  name: string;
  emoji: string;
  label: string;
  colors: {
    bgPrimary: string;
    bgSecondary: string;
    accent: string;
    accentGlow: string;
    textPrimary: string;
    textSecondary: string;
    cardBg: string;
    cardBorder: string;
    gradient: string;
    bassGlow: string;
  };
  visualizerStyle: 'sharp' | 'rounded' | 'dots' | 'bars' | 'wave';
  animationSpeed: 'fast' | 'normal' | 'slow';
}

/**
 * MoodThemeManager — Gestión dinámica de temas por estado de ánimo.
 * Usa CSS Custom Properties (Strategy Pattern) para cambiar
 * toda la UI sin re-renderizar.
 */
export class MoodThemeManager {
  private currentMood: string = 'chill';

  static readonly THEMES: Record<string, MoodTheme> = {
    energetic: {
      name: 'energetic', emoji: '🔥', label: 'Energético',
      colors: {
        bgPrimary: '#0d0d0d', bgSecondary: '#1a0a0a',
        accent: '#ff4d4d', accentGlow: '#ff4d4d88',
        textPrimary: '#ffffff', textSecondary: '#ff9999',
        cardBg: 'rgba(255, 50, 50, 0.08)', cardBorder: 'rgba(255, 77, 77, 0.2)',
        gradient: 'linear-gradient(135deg, #ff4d4d, #ff8c00)', bassGlow: '#ff4d4d',
      },
      visualizerStyle: 'sharp', animationSpeed: 'fast',
    },
    chill: {
      name: 'chill', emoji: '🧊', label: 'Chill',
      colors: {
        bgPrimary: '#0a0e1a', bgSecondary: '#0d1525',
        accent: '#4dc9f6', accentGlow: '#4dc9f688',
        textPrimary: '#e0f0ff', textSecondary: '#7eb8d4',
        cardBg: 'rgba(77, 201, 246, 0.06)', cardBorder: 'rgba(77, 201, 246, 0.15)',
        gradient: 'linear-gradient(135deg, #4dc9f6, #7b68ee)', bassGlow: '#4dc9f6',
      },
      visualizerStyle: 'rounded', animationSpeed: 'slow',
    },
    melancholic: {
      name: 'melancholic', emoji: '🌧️', label: 'Melancólico',
      colors: {
        bgPrimary: '#0d0a14', bgSecondary: '#13101c',
        accent: '#9b7abf', accentGlow: '#9b7abf66',
        textPrimary: '#d4c5e6', textSecondary: '#7a6899',
        cardBg: 'rgba(155, 122, 191, 0.06)', cardBorder: 'rgba(155, 122, 191, 0.15)',
        gradient: 'linear-gradient(135deg, #9b7abf, #555577)', bassGlow: '#9b7abf',
      },
      visualizerStyle: 'wave', animationSpeed: 'slow',
    },
    party: {
      name: 'party', emoji: '🎉', label: 'Fiesta',
      colors: {
        bgPrimary: '#0a0a0f', bgSecondary: '#12101a',
        accent: '#f542e6', accentGlow: '#f542e688',
        textPrimary: '#ffffff', textSecondary: '#e088d6',
        cardBg: 'rgba(245, 66, 230, 0.08)', cardBorder: 'rgba(245, 66, 230, 0.25)',
        gradient: 'linear-gradient(135deg, #f542e6, #ffd700, #00ff88)', bassGlow: '#f542e6',
      },
      visualizerStyle: 'bars', animationSpeed: 'fast',
    },
    lofi: {
      name: 'lofi', emoji: '📻', label: 'Lo-fi',
      colors: {
        bgPrimary: '#1a1610', bgSecondary: '#221e16',
        accent: '#d4a574', accentGlow: '#d4a57466',
        textPrimary: '#e8dcc8', textSecondary: '#a89478',
        cardBg: 'rgba(212, 165, 116, 0.07)', cardBorder: 'rgba(212, 165, 116, 0.18)',
        gradient: 'linear-gradient(135deg, #d4a574, #8a7050)', bassGlow: '#d4a574',
      },
      visualizerStyle: 'dots', animationSpeed: 'normal',
    },
  };

  public onMoodChanged: ((theme: MoodTheme) => void) | null = null;

  constructor() {
    const saved = localStorage.getItem('selected-mood');
    if (saved && MoodThemeManager.THEMES[saved]) this.currentMood = saved;
  }

  setMood(moodName: string): void {
    const theme = MoodThemeManager.THEMES[moodName];
    if (!theme) return;

    this.currentMood = moodName;
    localStorage.setItem('selected-mood', moodName);

    const root = document.documentElement;
    root.style.setProperty('--bg-primary', theme.colors.bgPrimary);
    root.style.setProperty('--bg-secondary', theme.colors.bgSecondary);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--accent-glow', theme.colors.accentGlow);
    root.style.setProperty('--text-primary', theme.colors.textPrimary);
    root.style.setProperty('--text-secondary', theme.colors.textSecondary);
    root.style.setProperty('--card-bg', theme.colors.cardBg);
    root.style.setProperty('--card-border', theme.colors.cardBorder);
    root.style.setProperty('--gradient', theme.colors.gradient);
    root.style.setProperty('--bass-glow', theme.colors.bassGlow);

    const speeds = { fast: '0.15s', normal: '0.3s', slow: '0.5s' };
    root.style.setProperty('--animation-speed', speeds[theme.animationSpeed]);
    document.body.setAttribute('data-mood', moodName);
    this.onMoodChanged?.(theme);
  }

  get currentTheme(): MoodTheme { return MoodThemeManager.THEMES[this.currentMood]; }
  get allThemes(): MoodTheme[] { return Object.values(MoodThemeManager.THEMES); }

  init(): void { this.setMood(this.currentMood); }
}
