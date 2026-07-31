// Design Tokens for Billionaire (ビリオネア)
// Concept: 「静かな信頼(조용한 신뢰)」 - High legibility, restrained contrast, Japanese business aesthetic

export const color = {
  ink: '#141A21',        // Main text (not pure black for better kanji legibility)
  inkMuted: '#5B6672',   // Secondary text
  inkFaint: '#8B95A1',   // Captions, furigana, placeholders
  line: '#E5E8EB',       // Subtle borders
  surface: '#FFFFFF',    // Card / surface background
  canvas: '#F7F8FA',     // App background
  primary: '#0A0A0A',    // Premium obsidian - Main theme color
  primarySoft: '#F3F3F3',// Subtle gray highlight
  accent: '#C9483B',     // Vermilion (朱色 - Shu-iro) - Stamp/Inkan signature accent
  success: '#1F8A5B',    // Verification & success green
  warning: '#B8860B',    // Confidence warning
  danger: '#C0392B',     // Delete / Report
} as const;

export const radius = {
  sm: '4px',
  md: '8px',
  lg: '12px',
  card: '10px',
  full: '9999px',
} as const;

export const space = {
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
} as const;

export const font = {
  ja: '"Noto Sans JP", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  jaDisplay: '"Zen Kaku Gothic New", "Noto Sans JP", sans-serif',
  num: 'Inter, -apple-system, sans-serif',
} as const;
