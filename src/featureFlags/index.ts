import Constants from 'expo-constants';
let inMemoryOverrides: Record<string, boolean> = {};

export function setFlag(name: string, value: boolean) {
  inMemoryOverrides[name] = value;
}

export function getFlag(name: string): boolean {
  if (name in inMemoryOverrides) return inMemoryOverrides[name];
  const envVal = (process.env[`EXPO_PUBLIC_${name.toUpperCase()}`] || '').toLowerCase();
  if (envVal === 'true' || envVal === '1' || envVal === 'yes') return true;
  const extra = (Constants?.expoConfig as any)?.extra || {};
  const fromExtra = (extra[name] ?? extra[name.toUpperCase()] ?? extra[name.toLowerCase()] ?? extra[camelCase(name)] ?? '').toString().toLowerCase();
  if (fromExtra === 'true' || fromExtra === '1' || fromExtra === 'yes') return true;
  return false;
}

function camelCase(s: string) {
  return s.replace(/[_-](\w)/g, (_, c) => c.toUpperCase());
}

// Convenience helpers for commonly used flags
export const Flags = {
  GIE_MODE: 'gie_mode',
  GIE_EXPORTS: 'gie_exports',
  GIE_MEMBER_TRACKING: 'gie_member_tracking',
  GIE_MEETING_FAST_PAY: 'gie_meeting_fast_pay',
  GAME_MODE_V1: 'game_mode_v1',
} as const;
