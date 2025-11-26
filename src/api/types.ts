export type TransactionInput = {
  kind: 'sale' | 'expense' | 'income' | 'expense';
  amount_cfa?: number;
  amount?: number;
  category?: string | null;
  description?: string | null;
  occurred_at?: string; // ISO
  source?: string; // 'voice' | 'manual'
};

export type GameState = {
  user_id: string;
  xp_total: number;
  streak_days: number;
  last_active_date: string | null;
  badges: any[];
  bronze_eligible: boolean;
  bronze_eligibility_reason: string | null;
};

export type LeaderboardRow = {
  market: string;
  user_id: string;
  score: number;
  rank: number;
  snapshot_date: string; // date
  display_name?: string;
};
