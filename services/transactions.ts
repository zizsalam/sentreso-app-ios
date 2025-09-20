// services/transactions.ts
import { supabase } from './supabaseClient';

export type Tx = {
  id: string;
  user_id: string;
  amount: number;
  type: 'income' | 'expense';
  category: string | null;
  description: string | null;
  created_at: string;
};

export async function fetchMyTransactions(max = 200): Promise<Tx[]> {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData?.user ?? null;

  let query = supabase
    .from('transactions')
    .select('id,user_id,amount,type,category,description,created_at')
    .lte('created_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .range(0, Math.max(0, max - 1));

  // If we know the user, add explicit filter (RLS will enforce anyway)
  if (user) {
    query = query.eq('user_id', user.id);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Tx[];
}

export async function createTransaction(
  tx: Omit<Tx, 'id' | 'user_id' | 'created_at'>
): Promise<Tx> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData?.user) {
    throw new Error('Utilisateur non connecté');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{ ...tx }])
    .select('id,user_id,amount,type,category,description,created_at')
    .single();

  if (error) throw error;
  return data as Tx;
}

export function subscribeMyTransactions(onChange: (newTx: Tx) => void) {
  const channel = supabase
    .channel('tx-stream')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'transactions' },
      (payload) => {
        const row = payload.new as Tx;
        onChange(row);
      }
    )
    .subscribe();
  return () => supabase.removeChannel(channel);
}
