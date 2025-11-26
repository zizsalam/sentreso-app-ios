import { TransactionInput, GameState } from './types';

const API_BASE = process.env.EXPO_PUBLIC_API_BASE || '';

async function authHeader() {
  // If app already uses Supabase client, we could pull the access token here if needed
  return {} as Record<string, string>;
}

export async function createTransaction(input: TransactionInput) {
  if (!API_BASE) throw new Error('API base not configured');
  const res = await fetch(`${API_BASE}/v1/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(await authHeader()),
    },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(`createTransaction failed: ${res.status}`);
  return await res.json();
}

export async function getGameState(): Promise<GameState> {
  if (!API_BASE) throw new Error('API base not configured');
  const res = await fetch(`${API_BASE}/v1/game-state`, {
    headers: {
      ...(await authHeader()),
    },
  });
  if (!res.ok) throw new Error(`getGameState failed: ${res.status}`);
  return await res.json();
}
