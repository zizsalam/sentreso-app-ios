import AsyncStorage from '@react-native-async-storage/async-storage';
import { startOfDakarDay, nowDakar } from '../lib/time';
import { track } from '../analytics/posthog';

const KEY = 'game:state:v1';

export type LocalGameState = {
  xp_total: number;
  streak_days: number;
  last_active_date: string | null; // YYYY-MM-DD (Dakar)
  badges: string[];
  bronze_eligible: boolean;
  bronze_eligibility_reason?: string | null;
  day_log: Record<string, { txCount: number; hasIncome: boolean; hasExpense: boolean; xpToday: number }>; // by Dakar date
  total_txn: number;
};

export async function loadLocal(): Promise<LocalGameState> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  return {
    xp_total: 0,
    streak_days: 0,
    last_active_date: null,
    badges: [],
    bronze_eligible: false,
    bronze_eligibility_reason: null,
    day_log: {},
    total_txn: 0,
  };
}

export async function saveLocal(state: LocalGameState) {
  await AsyncStorage.setItem(KEY, JSON.stringify(state));
}

export async function getLocalGameState() {
  return await loadLocal();
}

type Txn = { type?: 'income' | 'expense'; kind?: 'sale' | 'expense'; amount?: number };

export async function awardOnTxnConfirmed(txn: Txn) {
  const s = await loadLocal();
  const today = startOfDakarDay(nowDakar().toDate()).format('YYYY-MM-DD');

  if (!s.day_log[today]) s.day_log[today] = { txCount: 0, hasIncome: false, hasExpense: false, xpToday: 0 };
  const log = s.day_log[today];

  // Update per-day flags
  const isIncome = txn.type === 'income' || txn.kind === 'sale';
  const isExpense = txn.type === 'expense' || txn.kind === 'expense';
  const preHasIncome = log.hasIncome;
  const preHasExpense = log.hasExpense;
  if (isIncome) log.hasIncome = true;
  if (isExpense) log.hasExpense = true;

  log.txCount += 1;
  s.total_txn += 1;

  // XP rules: +1 per txn; +2 bonus if both sale & expense same day; cap 100/day
  let xpGain = 1;
  // Bonus the first time a day reaches both income and expense types
  const bothBefore = preHasIncome && preHasExpense;
  const bothAfter = log.hasIncome && log.hasExpense;
  if (!bothBefore && bothAfter) {
    xpGain += 2;
  }
  const remainingToday = Math.max(0, 100 - log.xpToday);
  const applied = Math.min(remainingToday, xpGain);
  if (applied > 0) {
    s.xp_total += applied;
    log.xpToday += applied;
    track('xp_awarded', { amount: applied });
  }

  // Streak: increment if first txn of the day
  if (log.txCount === 1) {
    const last = s.last_active_date;
    const d1 = startOfDakarDay(nowDakar().subtract(1, 'day').toDate()).format('YYYY-MM-DD');
    if (last === d1) {
      s.streak_days += 1;
      track('streak_incremented', { streak: s.streak_days });
    } else if (last === today) {
      // same day, no change
    } else if (last == null) {
      s.streak_days = 1; // first streak day
    } else {
      track('streak_broken', { previous: s.streak_days });
      s.streak_days = 1; // reset streak
    }
    s.last_active_date = today;
  } else {
    s.last_active_date = today;
  }

  // Badges
  if (s.total_txn === 1 && !s.badges.includes('first_txn')) {
    s.badges.push('first_txn');
    track('badge_awarded', { badge: 'first_txn' });
  }
  if (s.streak_days >= 7 && !s.badges.includes('7_day_streak')) {
    s.badges.push('7_day_streak');
    track('badge_awarded', { badge: '7_day_streak' });
  }
  if (s.total_txn >= 100 && !s.badges.includes('100_txn')) {
    s.badges.push('100_txn');
    track('badge_awarded', { badge: '100_txn' });
  }
  // balanced_bookkeeper: both types present 7 of last 14 days
  const last14 = getLastNDays(14);
  const balancedDays = last14.filter((d) => (s.day_log[d]?.hasIncome && s.day_log[d]?.hasExpense)).length;
  if (balancedDays >= 7 && !s.badges.includes('balanced_bookkeeper')) {
    s.badges.push('balanced_bookkeeper');
    track('badge_awarded', { badge: 'balanced_bookkeeper' });
  }

  // Bronze eligibility recompute
  const streakOk = s.streak_days >= 7;
  const tx14 = last14.reduce((sum, d) => sum + (s.day_log[d]?.txCount || 0), 0);
  const txOk = tx14 >= 50;
  const counts = last14.map((d) => s.day_log[d]?.txCount || 0);
  const variance = computeVariance(counts);
  const varianceOk = variance <= 25; // simple threshold
  const eligible = streakOk && txOk && varianceOk;
  if (eligible !== s.bronze_eligible) {
    s.bronze_eligible = eligible;
    s.bronze_eligibility_reason = eligible ? null : `streak:${streakOk},tx14:${txOk},var:${variance.toFixed(2)}`;
    track('credit_eligibility_changed', { tier: 'bronze', eligible, reason: s.bronze_eligibility_reason });
  }

  await saveLocal(s);
  return s;
}

function getLastNDays(n: number) {
  const arr: string[] = [];
  for (let i = 0; i < n; i++) {
    arr.push(startOfDakarDay(nowDakar().subtract(i, 'day').toDate()).format('YYYY-MM-DD'));
  }
  return arr;
}

function computeVariance(values: number[]) {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const v = values.reduce((acc, x) => acc + Math.pow(x - mean, 2), 0) / values.length;
  return v;
}
